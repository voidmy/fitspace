const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { createFitSpaceServer } = require("../index");

async function createFixture() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "fitspace-server-"));
  const seed = await fs.readFile(path.join(__dirname, "..", "data", "catalog.json"), "utf8");
  await fs.writeFile(path.join(dataDir, "catalog.json"), seed);
  await fs.writeFile(path.join(dataDir, "clients.json"), "{}\n");
  const server = createFitSpaceServer({
    dataDir,
    adminPassword: "test-password"
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    dataDir,
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

async function jsonRequest(url, options) {
  const response = await fetch(url, options);
  return {
    status: response.status,
    body: await response.json()
  };
}

test("健康检查和公开配置可读取", async (context) => {
  const fixture = await createFixture();
  context.after(async () => {
    await new Promise((resolve) => fixture.server.close(resolve));
    await fs.rm(fixture.dataDir, { recursive: true, force: true });
  });

  const health = await jsonRequest(`${fixture.baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const bootstrap = await jsonRequest(`${fixture.baseUrl}/api/public/bootstrap`);
  assert.equal(bootstrap.status, 200);
  assert.ok(bootstrap.body.catalog.stores.length >= 1);
  assert.ok(bootstrap.body.catalog.cards.length >= 1);
});

test("后台登录、配置写入和会员状态同步形成闭环", async (context) => {
  const fixture = await createFixture();
  context.after(async () => {
    await new Promise((resolve) => fixture.server.close(resolve));
    await fs.rm(fixture.dataDir, { recursive: true, force: true });
  });

  const unauthorized = await jsonRequest(`${fixture.baseUrl}/api/admin/dashboard`);
  assert.equal(unauthorized.status, 401);

  const login = await jsonRequest(`${fixture.baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "test-password" })
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  const auth = { Authorization: `Bearer ${login.body.token}`, "Content-Type": "application/json" };

  const banners = await jsonRequest(`${fixture.baseUrl}/api/admin/config/banners`, { headers: auth });
  const updatedBanners = banners.body.items.slice();
  updatedBanners[0].title = "后台修改已生效";
  const save = await jsonRequest(`${fixture.baseUrl}/api/admin/config/banners`, {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ items: updatedBanners })
  });
  assert.equal(save.status, 200);

  const bootstrap = await jsonRequest(`${fixture.baseUrl}/api/public/bootstrap`);
  assert.equal(bootstrap.body.catalog.banners[0].title, "后台修改已生效");

  const sync = await jsonRequest(`${fixture.baseUrl}/api/public/client-state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: "device-test",
      state: {
        user: { nickname: "测试会员", memberNo: "FS-TEST" },
        energy: 300,
        boughtCards: [{ id: "card-test" }],
        orders: [{ id: "order-test", title: "月卡", amount: 139, status: "已完成", createdAt: "2026-07-25 10:00" }],
        appointments: [],
        checkins: []
      }
    })
  });
  assert.equal(sync.status, 200);

  const dashboard = await jsonRequest(`${fixture.baseUrl}/api/admin/dashboard`, { headers: auth });
  assert.equal(dashboard.body.metrics.members, 1);
  assert.equal(dashboard.body.metrics.orders, 1);
  assert.equal(dashboard.body.metrics.revenue, 139);
});

test("管理后台静态页面可访问", async (context) => {
  const fixture = await createFixture();
  context.after(async () => {
    await new Promise((resolve) => fixture.server.close(resolve));
    await fs.rm(fixture.dataDir, { recursive: true, force: true });
  });

  const response = await fetch(`${fixture.baseUrl}/admin/`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /FitSpace 运营后台/);
  assert.match(html, /管理员密码/);
});
