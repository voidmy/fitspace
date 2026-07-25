import seedCatalog from "./data/catalog.json";

export interface FitSpaceEnv {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
}

const RESOURCE_NAMES = [
  "banners",
  "stores",
  "cards",
  "projects",
  "coaches",
  "equipment",
  "classes",
  "energyGoods"
] as const;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "same-origin"
};

type JsonObject = Record<string, any>;

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS
  });
}

async function readJson(request: Request): Promise<JsonObject> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("请求 JSON 格式不正确"), { statusCode: 400 });
  }
  return body as JsonObject;
}

async function ensureStore(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    )
    .run();

  await db
    .prepare(
      `INSERT OR IGNORE INTO app_state (key, value, updated_at)
       VALUES (?, ?, ?)`
    )
    .bind("catalog", JSON.stringify(seedCatalog), new Date().toISOString())
    .run();

  await db
    .prepare(
      `INSERT OR IGNORE INTO app_state (key, value, updated_at)
       VALUES (?, ?, ?)`
    )
    .bind("clients", "{}", new Date().toISOString())
    .run();
}

async function readState<T>(
  db: D1Database,
  key: "catalog" | "clients"
): Promise<T> {
  await ensureStore(db);
  const row = await db
    .prepare("SELECT value FROM app_state WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return JSON.parse(row?.value || "{}") as T;
}

async function writeState(
  db: D1Database,
  key: "catalog" | "clients",
  value: unknown
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`
    )
    .bind(key, JSON.stringify(value), new Date().toISOString())
    .run();
}

function validateCollection(
  resource: string,
  items: unknown
): asserts items is JsonObject[] {
  if (!Array.isArray(items)) {
    throw Object.assign(new Error("配置内容必须是数组"), { statusCode: 400 });
  }
  if (items.length > 500) {
    throw Object.assign(new Error("单类配置最多 500 条"), { statusCode: 400 });
  }
  if (resource === "stores" && items.length === 0) {
    throw Object.assign(new Error("至少需要保留一家门店"), { statusCode: 400 });
  }
  const ids = new Set<string>();
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw Object.assign(new Error("每条配置必须是对象"), { statusCode: 400 });
    }
    const record = item as JsonObject;
    if (!record.id || typeof record.id !== "string") {
      throw Object.assign(new Error(`${resource} 中存在缺少 id 的记录`), {
        statusCode: 400
      });
    }
    if (ids.has(record.id)) {
      throw Object.assign(new Error(`${resource} 中存在重复 id：${record.id}`), {
        statusCode: 400
      });
    }
    ids.add(record.id);
  }
}

function summarizeClients(clients: JsonObject) {
  return Object.values(clients)
    .map((client: any) => {
      const state = client.state || {};
      return {
        deviceId: client.deviceId,
        lastSeenAt: client.lastSeenAt,
        user: state.user || {},
        selectedStoreId: state.selectedStoreId || "",
        energy: Number(state.energy || 0),
        cards: Array.isArray(state.boughtCards) ? state.boughtCards.length : 0,
        orders: Array.isArray(state.orders) ? state.orders.length : 0,
        appointments: Array.isArray(state.appointments)
          ? state.appointments.length
          : 0,
        checkins: Array.isArray(state.checkins) ? state.checkins.length : 0,
        visitPasses: Array.isArray(state.visitPasses)
          ? state.visitPasses.length
          : 0,
        raw: state
      };
    })
    .sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
}

function buildDashboard(clients: JsonObject) {
  const list = summarizeClients(clients);
  const orders = list.flatMap((client) =>
    (client.raw.orders || []).map((item: any) => ({
      deviceId: client.deviceId,
      ...item
    }))
  );
  const appointments = list.flatMap((client) =>
    (client.raw.appointments || []).map((item: any) => ({
      deviceId: client.deviceId,
      ...item
    }))
  );
  const checkins = list.flatMap((client) => client.raw.checkins || []);
  const verifications = list.flatMap(
    (client) => client.raw.verifications || []
  );
  const visits = list.flatMap((client) => client.raw.visitPasses || []);
  const revenue = orders
    .filter((item: any) => item.status !== "退款成功")
    .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const recent = [
    ...orders.map((item: any) => ({
      type: "订单",
      title: item.title || "会员消费",
      detail: item.status || "",
      time: item.createdAt || ""
    })),
    ...appointments.map((item: any) => ({
      type: item.kind || "预约",
      title: item.title || "训练预约",
      detail: item.status || "",
      time: item.time || ""
    })),
    ...checkins.map((item: any) => ({
      type: "签到",
      title: item.storeName || "训练签到",
      detail: "训练完成",
      time: `${item.date || ""} ${item.time || ""}`.trim()
    }))
  ]
    .sort((a, b) => String(b.time).localeCompare(String(a.time)))
    .slice(0, 12);

  return {
    metrics: {
      members: list.length,
      activeCards: list.reduce((sum, item) => sum + item.cards, 0),
      orders: orders.length,
      revenue: Number(revenue.toFixed(2)),
      appointments: appointments.filter(
        (item: any) => item.status !== "已取消"
      ).length,
      checkins: checkins.length,
      verifications: verifications.length,
      refundedVisits: visits.filter((item: any) => item.status === "已退款")
        .length
    },
    recent,
    generatedAt: new Date().toISOString()
  };
}

async function signToken(secret: string, expiresAt: number): Promise<string> {
  const payload = String(expiresAt);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}.${hex}`;
}

async function isAuthorized(
  request: Request,
  password: string
): Promise<boolean> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [expiresAtText] = token.split(".");
  const expiresAt = Number(expiresAtText);
  if (!expiresAt || expiresAt < Date.now()) return false;
  return token === (await signToken(password, expiresAt));
}

export async function handleFitSpaceApi(
  request: Request,
  env: FitSpaceEnv
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  const password = env.ADMIN_PASSWORD || "FitSpace-Test-0725";

  try {
    if (pathname === "/api/health" && request.method === "GET") {
      return json(200, {
        ok: true,
        service: "fitspace-api",
        version: "1.1.0-edge",
        time: new Date().toISOString()
      });
    }

    if (pathname === "/api/public/bootstrap" && request.method === "GET") {
      const catalog = await readState<JsonObject>(env.DB, "catalog");
      return json(200, { catalog, serverTime: new Date().toISOString() });
    }

    if (
      pathname === "/api/public/client-state" &&
      request.method === "POST"
    ) {
      const body = await readJson(request);
      if (
        !body.deviceId ||
        typeof body.deviceId !== "string" ||
        !body.state ||
        typeof body.state !== "object"
      ) {
        throw Object.assign(new Error("deviceId 和 state 为必填项"), {
          statusCode: 400
        });
      }
      const clients = await readState<JsonObject>(env.DB, "clients");
      const deviceId = body.deviceId.slice(0, 100);
      clients[deviceId] = {
        deviceId,
        lastSeenAt: new Date().toISOString(),
        state: body.state
      };
      await writeState(env.DB, "clients", clients);
      return json(200, { ok: true });
    }

    if (pathname === "/api/admin/login" && request.method === "POST") {
      const body = await readJson(request);
      if (String(body.password || "") !== password) {
        return json(401, { error: "管理员密码不正确" });
      }
      const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
      return json(200, {
        token: await signToken(password, expiresAt),
        expiresIn: 12 * 60 * 60
      });
    }

    if (
      pathname.startsWith("/api/admin/") &&
      !(await isAuthorized(request, password))
    ) {
      return json(401, { error: "登录已失效，请重新登录" });
    }

    if (pathname === "/api/admin/dashboard" && request.method === "GET") {
      return json(
        200,
        buildDashboard(await readState<JsonObject>(env.DB, "clients"))
      );
    }

    if (pathname === "/api/admin/clients" && request.method === "GET") {
      return json(200, {
        clients: summarizeClients(
          await readState<JsonObject>(env.DB, "clients")
        )
      });
    }

    if (pathname === "/api/admin/export" && request.method === "GET") {
      return json(200, {
        exportedAt: new Date().toISOString(),
        catalog: await readState<JsonObject>(env.DB, "catalog"),
        clients: await readState<JsonObject>(env.DB, "clients")
      });
    }

    const match = pathname.match(/^\/api\/admin\/config\/([A-Za-z]+)$/);
    if (match) {
      const resource = match[1];
      if (
        !RESOURCE_NAMES.includes(
          resource as (typeof RESOURCE_NAMES)[number]
        )
      ) {
        return json(404, { error: "未知配置类型" });
      }
      if (request.method === "GET") {
        const catalog = await readState<JsonObject>(env.DB, "catalog");
        return json(200, { resource, items: catalog[resource] || [] });
      }
      if (request.method === "PUT") {
        const body = await readJson(request);
        const items = body.items;
        validateCollection(resource, items);
        const catalog = await readState<JsonObject>(env.DB, "catalog");
        catalog[resource] = items;
        catalog.updatedAt = new Date().toISOString();
        await writeState(env.DB, "catalog", catalog);
        return json(200, {
          ok: true,
          resource,
          count: items.length,
          updatedAt: catalog.updatedAt
        });
      }
    }

    return json(404, { error: "接口不存在" });
  } catch (error) {
    const known = error as Error & { statusCode?: number };
    return json(known.statusCode || 500, {
      error: known.statusCode ? known.message : "服务器内部错误"
    });
  }
}
