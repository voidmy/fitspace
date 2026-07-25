const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");
const { JsonStore } = require("./lib/json-store.cjs");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_DATA_DIR = path.join(__dirname, "data");
const ADMIN_DIR = path.join(__dirname, "public", "admin");
const RESOURCE_NAMES = [
  "banners",
  "stores",
  "cards",
  "projects",
  "coaches",
  "equipment",
  "classes",
  "energyGoods"
];
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function textResponse(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType || "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function redirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function readJsonBody(request, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("请求内容过大"), { statusCode: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("请求 JSON 格式不正确"), { statusCode: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function validateCollection(resource, items) {
  if (!Array.isArray(items)) throw Object.assign(new Error("配置内容必须是数组"), { statusCode: 400 });
  if (items.length > 500) throw Object.assign(new Error("单类配置最多 500 条"), { statusCode: 400 });
  if (resource === "stores" && items.length === 0) {
    throw Object.assign(new Error("至少需要保留一家门店"), { statusCode: 400 });
  }
  const ids = new Set();
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw Object.assign(new Error("每条配置必须是对象"), { statusCode: 400 });
    }
    if (!item.id || typeof item.id !== "string") {
      throw Object.assign(new Error(`${resource} 中存在缺少 id 的记录`), { statusCode: 400 });
    }
    if (ids.has(item.id)) {
      throw Object.assign(new Error(`${resource} 中存在重复 id：${item.id}`), { statusCode: 400 });
    }
    ids.add(item.id);
  }
}

function summarizeClients(clients) {
  return Object.values(clients)
    .map((client) => {
      const state = client.state || {};
      return {
        deviceId: client.deviceId,
        lastSeenAt: client.lastSeenAt,
        user: state.user || {},
        selectedStoreId: state.selectedStoreId || "",
        energy: Number(state.energy || 0),
        cards: Array.isArray(state.boughtCards) ? state.boughtCards.length : 0,
        orders: Array.isArray(state.orders) ? state.orders.length : 0,
        appointments: Array.isArray(state.appointments) ? state.appointments.length : 0,
        checkins: Array.isArray(state.checkins) ? state.checkins.length : 0,
        visitPasses: Array.isArray(state.visitPasses) ? state.visitPasses.length : 0,
        raw: state
      };
    })
    .sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
}

function buildDashboard(clients) {
  const list = summarizeClients(clients);
  const orders = list.flatMap((client) =>
    (client.raw.orders || []).map((item) => Object.assign({ deviceId: client.deviceId }, item))
  );
  const appointments = list.flatMap((client) =>
    (client.raw.appointments || []).map((item) => Object.assign({ deviceId: client.deviceId }, item))
  );
  const checkins = list.flatMap((client) => client.raw.checkins || []);
  const verifications = list.flatMap((client) => client.raw.verifications || []);
  const visits = list.flatMap((client) => client.raw.visitPasses || []);
  const revenue = orders
    .filter((item) => item.status !== "退款成功")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const recent = [
    ...orders.map((item) => ({
      type: "订单",
      title: item.title || "会员消费",
      detail: item.status || "",
      time: item.createdAt || ""
    })),
    ...appointments.map((item) => ({
      type: item.kind || "预约",
      title: item.title || "训练预约",
      detail: item.status || "",
      time: item.time || ""
    })),
    ...checkins.map((item) => ({
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
      appointments: appointments.filter((item) => item.status !== "已取消").length,
      checkins: checkins.length,
      verifications: verifications.length,
      refundedVisits: visits.filter((item) => item.status === "已退款").length
    },
    recent,
    generatedAt: new Date().toISOString()
  };
}

function createFitSpaceServer(options = {}) {
  const dataDir = options.dataDir || DEFAULT_DATA_DIR;
  const catalogStore = new JsonStore(path.join(dataDir, "catalog.json"), {});
  const clientsStore = new JsonStore(path.join(dataDir, "clients.json"), {});
  const adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD || "fitspace123";
  const sessions = new Map();

  function createSession() {
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
    return token;
  }

  function isAuthorized(request) {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const expiresAt = sessions.get(token);
    if (!expiresAt) return false;
    if (expiresAt < Date.now()) {
      sessions.delete(token);
      return false;
    }
    sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
    return true;
  }

  async function serveAdminAsset(pathname, response) {
    const relative = pathname === "/admin" || pathname === "/admin/" ? "index.html" : pathname.slice("/admin/".length);
    const normalized = path.normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = path.join(ADMIN_DIR, normalized);
    if (!filePath.startsWith(ADMIN_DIR)) {
      textResponse(response, 403, "Forbidden");
      return;
    }
    try {
      const body = await fs.readFile(filePath);
      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      response.end(body);
    } catch (error) {
      if (error.code === "ENOENT") textResponse(response, 404, "Not Found");
      else throw error;
    }
  }

  const server = http.createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "SAMEORIGIN");
    response.setHeader("Referrer-Policy", "same-origin");

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);

    try {
      if (pathname === "/") {
        redirect(response, "/admin/");
        return;
      }

      if (pathname === "/api/health" && request.method === "GET") {
        jsonResponse(response, 200, {
          ok: true,
          service: "fitspace-api",
          version: "1.0.0",
          time: new Date().toISOString()
        });
        return;
      }

      if (pathname === "/api/public/bootstrap" && request.method === "GET") {
        const catalog = await catalogStore.read();
        jsonResponse(response, 200, {
          catalog,
          serverTime: new Date().toISOString()
        });
        return;
      }

      if (pathname === "/api/public/client-state" && request.method === "POST") {
        const body = await readJsonBody(request);
        if (!body.deviceId || typeof body.deviceId !== "string" || !body.state || typeof body.state !== "object") {
          throw Object.assign(new Error("deviceId 和 state 为必填项"), { statusCode: 400 });
        }
        const deviceId = body.deviceId.slice(0, 100);
        await clientsStore.update((clients) => {
          clients[deviceId] = {
            deviceId,
            lastSeenAt: new Date().toISOString(),
            state: body.state
          };
          return clients;
        });
        jsonResponse(response, 200, { ok: true });
        return;
      }

      if (pathname === "/api/admin/login" && request.method === "POST") {
        const body = await readJsonBody(request);
        if (!safeEqual(body.password || "", adminPassword)) {
          jsonResponse(response, 401, { error: "管理员密码不正确" });
          return;
        }
        jsonResponse(response, 200, {
          token: createSession(),
          expiresIn: 12 * 60 * 60
        });
        return;
      }

      if (pathname.startsWith("/api/admin/") && !isAuthorized(request)) {
        jsonResponse(response, 401, { error: "登录已失效，请重新登录" });
        return;
      }

      if (pathname === "/api/admin/dashboard" && request.method === "GET") {
        jsonResponse(response, 200, buildDashboard(await clientsStore.read()));
        return;
      }

      if (pathname === "/api/admin/clients" && request.method === "GET") {
        jsonResponse(response, 200, { clients: summarizeClients(await clientsStore.read()) });
        return;
      }

      if (pathname === "/api/admin/export" && request.method === "GET") {
        jsonResponse(response, 200, {
          exportedAt: new Date().toISOString(),
          catalog: await catalogStore.read(),
          clients: await clientsStore.read()
        });
        return;
      }

      const resourceMatch = pathname.match(/^\/api\/admin\/config\/([A-Za-z]+)$/);
      if (resourceMatch) {
        const resource = resourceMatch[1];
        if (!RESOURCE_NAMES.includes(resource)) {
          jsonResponse(response, 404, { error: "未知配置类型" });
          return;
        }
        if (request.method === "GET") {
          const catalog = await catalogStore.read();
          jsonResponse(response, 200, { resource, items: catalog[resource] || [] });
          return;
        }
        if (request.method === "PUT") {
          const body = await readJsonBody(request);
          const items = Array.isArray(body) ? body : body.items;
          validateCollection(resource, items);
          const catalog = await catalogStore.update((current) => {
            current[resource] = items;
            current.updatedAt = new Date().toISOString();
            return current;
          });
          jsonResponse(response, 200, {
            ok: true,
            resource,
            count: catalog[resource].length,
            updatedAt: catalog.updatedAt
          });
          return;
        }
      }

      if (pathname.startsWith("/admin")) {
        await serveAdminAsset(pathname, response);
        return;
      }

      jsonResponse(response, 404, { error: "接口不存在" });
    } catch (error) {
      console.error(`[${new Date().toISOString()}]`, request.method, pathname, error);
      jsonResponse(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : "服务器内部错误"
      });
    }
  });

  server.fitspace = {
    dataDir,
    catalogStore,
    clientsStore,
    resourceNames: RESOURCE_NAMES
  };
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3100);
  const host = process.env.HOST || "0.0.0.0";
  const server = createFitSpaceServer();
  server.listen(port, host, () => {
    console.log(`FitSpace API: http://127.0.0.1:${port}/api/health`);
    console.log(`FitSpace 管理后台: http://127.0.0.1:${port}/admin/`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log("本地默认管理员密码: fitspace123");
    }
    console.log(`项目目录: ${ROOT_DIR}`);
  });
}

module.exports = { createFitSpaceServer, buildDashboard, validateCollection };
