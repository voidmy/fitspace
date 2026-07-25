const resourceSchemas = {
  banners: {
    label: "广告轮播",
    eyebrow: "MINI PROGRAM · HERO",
    description: "配置首页轮播内容、跳转目标与展示顺序",
    idPrefix: "banner",
    columns: ["title", "eyebrow", "action", "tone", "enabled"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("eyebrow", "角标文案"),
      field("title", "主标题"),
      field("desc", "说明文案", "textarea", false, true),
      field("action", "按钮文案"),
      field("url", "小程序跳转路径"),
      selectField("tone", "配色", ["green", "orange", "purple"]),
      field("sort", "排序值", "number"),
      checkboxField("enabled", "启用展示")
    ]
  },
  stores: {
    label: "门店管理",
    eyebrow: "LOCATIONS",
    description: "配置连锁门店、联系方式、营业状态与实时人数",
    idPrefix: "store",
    columns: ["name", "address", "hours", "people", "status"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("name", "门店全称"),
      field("shortName", "门店简称"),
      field("address", "详细地址", "textarea", false, true),
      field("hours", "营业时间"),
      field("distance", "距离展示"),
      field("phone", "联系电话"),
      field("wechat", "客服微信"),
      field("latitude", "纬度", "number"),
      field("longitude", "经度", "number"),
      field("status", "营业状态"),
      field("people", "当前人数", "number"),
      field("capacity", "门店容量", "number")
    ]
  },
  cards: {
    label: "会员卡",
    eyebrow: "MEMBERSHIP PRODUCTS",
    description: "配置小程序售卖卡种、价格、权益和有效期",
    idPrefix: "card",
    columns: ["name", "price", "originalPrice", "badge", "enabled"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("name", "卡种名称"),
      field("price", "销售价", "number"),
      field("originalPrice", "原价", "number"),
      field("badge", "营销角标"),
      selectField("tone", "卡面配色", ["mint", "orange", "dark"]),
      field("desc", "权益说明", "textarea", false, true),
      field("validity", "有效期说明", "textarea", false, true),
      checkboxField("enabled", "允许售卖")
    ]
  },
  projects: {
    label: "训练项目",
    eyebrow: "TRAINING PROJECTS",
    description: "配置首页和项目介绍页的训练方向",
    idPrefix: "project",
    columns: ["name", "subtitle", "icon", "desc"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("name", "项目名称"),
      field("subtitle", "项目短标签"),
      field("icon", "图标文字"),
      field("desc", "项目介绍", "textarea", false, true)
    ]
  },
  coaches: {
    label: "教练团队",
    eyebrow: "COACH PROFILES",
    description: "配置教练资料、定价、学员成果和专业资质",
    idPrefix: "coach",
    columns: ["name", "title", "years", "price", "enabled"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("name", "教练姓名"),
      field("initials", "头像缩写"),
      field("title", "教练方向"),
      field("years", "执教年限", "number"),
      field("price", "课时价格", "number"),
      field("likes", "基础推荐数", "number"),
      field("color", "主题颜色", "color"),
      arrayField("tags", "擅长标签"),
      field("intro", "教练介绍", "textarea", false, true),
      field("result", "客户成果", "textarea", false, true),
      arrayField("achievements", "专业资质"),
      checkboxField("enabled", "展示教练")
    ]
  },
  equipment: {
    label: "门店器械",
    eyebrow: "EQUIPMENT STATUS",
    description: "配置器械数量、空闲状态和安全提示",
    idPrefix: "eq",
    columns: ["name", "count", "status", "icon", "tips"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("name", "器械名称"),
      field("count", "数量", "number"),
      field("status", "当前状态"),
      field("icon", "图标文字"),
      field("tips", "使用提示", "textarea", false, true)
    ]
  },
  classes: {
    label: "团课排期",
    eyebrow: "CLASS SCHEDULE",
    description: "配置团课名称、教练、时间和剩余名额",
    idPrefix: "class",
    columns: ["name", "coach", "time", "left", "enabled"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("name", "课程名称"),
      field("coach", "授课教练"),
      field("time", "上课时间"),
      field("duration", "课程时长"),
      field("left", "剩余名额", "number"),
      field("level", "难度级别"),
      checkboxField("enabled", "允许预约")
    ]
  },
  energyGoods: {
    label: "能量商品",
    eyebrow: "ENERGY REWARDS",
    description: "配置能量商城的兑换商品、库存和所需能量",
    idPrefix: "goods",
    columns: ["name", "energy", "stock", "icon", "enabled"],
    fields: [
      field("id", "唯一 ID", "text", true),
      field("name", "商品名称"),
      field("energy", "所需能量", "number"),
      field("stock", "库存", "number"),
      field("icon", "图标文字"),
      checkboxField("enabled", "允许兑换")
    ]
  }
};

function field(key, label, type = "text", readonly = false, full = false) {
  return { key, label, type, readonly, full };
}

function arrayField(key, label) {
  return { key, label, type: "array", full: true };
}

function checkboxField(key, label) {
  return { key, label, type: "checkbox" };
}

function selectField(key, label, options) {
  return { key, label, type: "select", options };
}

const appState = {
  token: sessionStorage.getItem("fitspace_admin_token") || "",
  view: "dashboard",
  resource: "",
  items: [],
  editingIndex: -1,
  editingItem: null,
  clients: []
};

const elements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  password: document.querySelector("#password"),
  togglePassword: document.querySelector("#togglePassword"),
  appShell: document.querySelector("#appShell"),
  content: document.querySelector("#content"),
  pageTitle: document.querySelector("#pageTitle"),
  pageEyebrow: document.querySelector("#pageEyebrow"),
  createButton: document.querySelector("#createButton"),
  refreshButton: document.querySelector("#refreshButton"),
  logoutButton: document.querySelector("#logoutButton"),
  todayLabel: document.querySelector("#todayLabel"),
  editDialog: document.querySelector("#editDialog"),
  editForm: document.querySelector("#editForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogEyebrow: document.querySelector("#dialogEyebrow"),
  formFields: document.querySelector("#formFields"),
  dialogClose: document.querySelector("#dialogClose"),
  dialogCancel: document.querySelector("#dialogCancel"),
  clientDialog: document.querySelector("#clientDialog"),
  clientDialogTitle: document.querySelector("#clientDialogTitle"),
  clientDialogClose: document.querySelector("#clientDialogClose"),
  clientDetail: document.querySelector("#clientDetail"),
  toast: document.querySelector("#toast")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  if (appState.token) headers.Authorization = `Bearer ${appState.token}`;
  const response = await fetch(path, Object.assign({}, options, { headers }));
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== "/api/admin/login") {
    logout(false);
    throw new Error(payload.error || "登录已失效");
  }
  if (!response.ok) throw new Error(payload.error || `请求失败 (${response.status})`);
  return payload;
}

function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type === "error" ? "error" : ""} show`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2400);
}

function setLoading() {
  elements.content.innerHTML = '<div class="loading">正在载入数据…</div>';
}

function setActiveNav(target) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    const isActive =
      (target === "dashboard" && button.dataset.view === "dashboard") ||
      (target === "clients" && button.dataset.view === "clients") ||
      button.dataset.resource === target;
    button.classList.toggle("active", isActive);
  });
}

function showApp() {
  elements.loginScreen.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.todayLabel.textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());
  loadDashboard();
}

function showLogin() {
  elements.appShell.classList.add("hidden");
  elements.loginScreen.classList.remove("hidden");
  elements.password.focus();
}

function logout(notify = true) {
  appState.token = "";
  sessionStorage.removeItem("fitspace_admin_token");
  showLogin();
  if (notify) showToast("已退出登录");
}

async function loadDashboard() {
  appState.view = "dashboard";
  appState.resource = "";
  setActiveNav("dashboard");
  elements.pageEyebrow.textContent = "OVERVIEW";
  elements.pageTitle.textContent = "经营仪表盘";
  elements.createButton.classList.add("hidden");
  setLoading();
  try {
    const data = await api("/api/admin/dashboard");
    renderDashboard(data);
  } catch (error) {
    renderError(error);
  }
}

function metric(label, value, icon, foot, dark = false) {
  return `
    <article class="metric-card ${dark ? "dark" : ""}">
      <div class="metric-head"><span>${escapeHtml(label)}</span><span class="metric-icon">${escapeHtml(icon)}</span></div>
      <div class="metric-value">${escapeHtml(value)}</div>
      <div class="metric-foot">${escapeHtml(foot)}</div>
    </article>`;
}

function renderDashboard(data) {
  const metrics = data.metrics || {};
  const recent = data.recent || [];
  elements.content.innerHTML = `
    <div class="metric-grid">
      ${metric("同步会员", metrics.members || 0, "人", "已连接小程序的设备会员", true)}
      ${metric("有效会员卡", metrics.activeCards || 0, "卡", "会员端已购卡记录")}
      ${metric("累计订单", metrics.orders || 0, "单", "含购卡、私教与兑换")}
      ${metric("模拟营收", `¥${Number(metrics.revenue || 0).toLocaleString("zh-CN")}`, "¥", "已排除退款成功订单")}
    </div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head"><h3>最近动态</h3><span>${escapeHtml(formatTime(data.generatedAt))} 更新</span></div>
        <div class="activity-list">
          ${
            recent.length
              ? recent.map((item) => `
                <div class="activity-item">
                  <span class="activity-type">${escapeHtml(item.type)}</span>
                  <div class="activity-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail || "已记录")}</small></div>
                  <span class="activity-time">${escapeHtml(item.time || "刚刚")}</span>
                </div>`).join("")
              : emptyInline("暂无会员动态", "打开小程序操作一次后，这里会显示同步记录")
          }
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h3>运营数据</h3><span>实时汇总</span></div>
        <div class="operations">
          ${operation(metrics.appointments || 0, "有效预约")}
          ${operation(metrics.checkins || 0, "训练签到")}
          ${operation(metrics.verifications || 0, "团购核销")}
          ${operation(metrics.refundedVisits || 0, "参观票退款")}
        </div>
      </section>
    </div>`;
}

function operation(value, label) {
  return `<div class="operation-tile"><strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}</small></div>`;
}

function emptyInline(title, desc) {
  return `<div class="empty-state"><div class="empty-mark">F</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p></div>`;
}

async function loadResource(resource) {
  const schema = resourceSchemas[resource];
  if (!schema) return;
  appState.view = "resource";
  appState.resource = resource;
  setActiveNav(resource);
  elements.pageEyebrow.textContent = schema.eyebrow;
  elements.pageTitle.textContent = schema.label;
  elements.createButton.classList.remove("hidden");
  elements.createButton.innerHTML = `<span>＋</span> 新增${schema.label}`;
  setLoading();
  try {
    const data = await api(`/api/admin/config/${resource}`);
    appState.items = data.items || [];
    renderResource();
  } catch (error) {
    renderError(error);
  }
}

function renderResource(query = "") {
  const schema = resourceSchemas[appState.resource];
  const needle = query.trim().toLowerCase();
  const items = appState.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !needle || JSON.stringify(item).toLowerCase().includes(needle));
  const headerCells = schema.columns.map((key) => `<th>${escapeHtml(fieldLabel(schema, key))}</th>`).join("");
  elements.content.innerHTML = `
    <div class="resource-toolbar">
      <div class="resource-summary">${escapeHtml(schema.description)} · 共 ${appState.items.length} 条</div>
      <label class="search-field"><input id="resourceSearch" placeholder="搜索当前配置…" value="${escapeHtml(query)}" /></label>
    </div>
    <div class="table-shell">
      ${
        items.length
          ? `<table class="data-table">
              <thead><tr>${headerCells}<th>操作</th></tr></thead>
              <tbody>${items.map(({ item, index }) => renderRow(schema, item, index)).join("")}</tbody>
            </table>`
          : emptyInline(query ? "没有匹配结果" : `还没有${schema.label}`, query ? "换一个关键词试试" : "点击右上角新增第一条配置")
      }
    </div>`;
  const search = document.querySelector("#resourceSearch");
  if (search) {
    search.addEventListener("input", (event) => {
      const cursor = event.target.selectionStart;
      renderResource(event.target.value);
      const next = document.querySelector("#resourceSearch");
      next.focus();
      next.setSelectionRange(cursor, cursor);
    });
  }
}

function renderRow(schema, item, index) {
  return `<tr>
    ${schema.columns.map((key, columnIndex) => `<td class="${columnIndex === 0 ? "primary-cell" : ""}">${displayValue(key, item[key])}</td>`).join("")}
    <td><div class="row-actions">
      <button class="row-button" data-edit="${index}">编辑</button>
      <button class="row-button danger" data-delete="${index}">删除</button>
    </div></td>
  </tr>`;
}

function displayValue(key, value) {
  if (typeof value === "boolean") {
    return `<span class="status-badge ${value ? "" : "off"}">${value ? "已启用" : "已停用"}</span>`;
  }
  if (Array.isArray(value)) return escapeHtml(value.join("、"));
  if (key === "color") return `<span class="color-dot" style="background:${escapeHtml(value)}"></span>${escapeHtml(value)}`;
  if (key === "price" || key === "originalPrice") return `¥${escapeHtml(value)}`;
  const text = String(value ?? "");
  return `<span title="${escapeHtml(text)}">${escapeHtml(text.length > 42 ? `${text.slice(0, 42)}…` : text)}</span>`;
}

function fieldLabel(schema, key) {
  return schema.fields.find((item) => item.key === key)?.label || key;
}

function openEditor(index = -1) {
  const schema = resourceSchemas[appState.resource];
  appState.editingIndex = index;
  appState.editingItem = index > -1 ? structuredClone(appState.items[index]) : {};
  if (index === -1) {
    appState.editingItem.id = `${schema.idPrefix}-${Date.now().toString(36)}`;
    schema.fields.filter((item) => item.type === "checkbox").forEach((item) => {
      appState.editingItem[item.key] = true;
    });
  }
  elements.dialogEyebrow.textContent = schema.eyebrow;
  elements.dialogTitle.textContent = `${index > -1 ? "编辑" : "新增"}${schema.label}`;
  elements.formFields.innerHTML = schema.fields.map((item) => renderField(item, appState.editingItem[item.key])).join("");
  elements.editDialog.showModal();
}

function renderField(config, value) {
  const className = `field ${config.full ? "full" : ""} ${config.type === "checkbox" ? "checkbox-field" : ""}`;
  if (config.type === "checkbox") {
    return `<label class="${className}"><input name="${config.key}" type="checkbox" ${value ? "checked" : ""} /><span>${escapeHtml(config.label)}</span></label>`;
  }
  if (config.type === "textarea" || config.type === "array") {
    const text = config.type === "array" && Array.isArray(value) ? value.join("\n") : value || "";
    return `<div class="${className}"><label for="field-${config.key}">${escapeHtml(config.label)}</label><textarea id="field-${config.key}" name="${config.key}" ${config.readonly ? "readonly" : ""}>${escapeHtml(text)}</textarea></div>`;
  }
  if (config.type === "select") {
    return `<div class="${className}"><label for="field-${config.key}">${escapeHtml(config.label)}</label><select id="field-${config.key}" name="${config.key}">${config.options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div>`;
  }
  return `<div class="${className}"><label for="field-${config.key}">${escapeHtml(config.label)}</label><input id="field-${config.key}" name="${config.key}" type="${config.type}" value="${escapeHtml(value ?? "")}" ${config.type === "number" ? 'step="any"' : ""} ${config.readonly ? "readonly" : ""} required /></div>`;
}

async function saveEditor(event) {
  event.preventDefault();
  const schema = resourceSchemas[appState.resource];
  const formData = new FormData(elements.editForm);
  const next = Object.assign({}, appState.editingItem);
  for (const config of schema.fields) {
    if (config.type === "checkbox") next[config.key] = formData.has(config.key);
    else if (config.type === "number") next[config.key] = Number(formData.get(config.key) || 0);
    else if (config.type === "array") next[config.key] = String(formData.get(config.key) || "").split(/[\n,，]/).map((item) => item.trim()).filter(Boolean);
    else next[config.key] = String(formData.get(config.key) || "").trim();
  }
  const items = appState.items.slice();
  if (appState.editingIndex > -1) items[appState.editingIndex] = next;
  else items.push(next);
  try {
    await api(`/api/admin/config/${appState.resource}`, {
      method: "PUT",
      body: JSON.stringify({ items })
    });
    appState.items = items;
    elements.editDialog.close();
    renderResource();
    showToast("配置已保存，小程序刷新后生效");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteItem(index) {
  const schema = resourceSchemas[appState.resource];
  const item = appState.items[index];
  if (!confirm(`确认删除「${item.name || item.title || item.id}」？`)) return;
  const items = appState.items.filter((_, itemIndex) => itemIndex !== index);
  try {
    await api(`/api/admin/config/${appState.resource}`, {
      method: "PUT",
      body: JSON.stringify({ items })
    });
    appState.items = items;
    renderResource();
    showToast(`${schema.label}配置已删除`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadClients() {
  appState.view = "clients";
  appState.resource = "";
  setActiveNav("clients");
  elements.pageEyebrow.textContent = "MEMBERS";
  elements.pageTitle.textContent = "会员数据";
  elements.createButton.classList.add("hidden");
  setLoading();
  try {
    const data = await api("/api/admin/clients");
    appState.clients = data.clients || [];
    renderClients();
  } catch (error) {
    renderError(error);
  }
}

function renderClients() {
  if (!appState.clients.length) {
    elements.content.innerHTML = `<div class="panel">${emptyInline("暂时没有同步会员", "运行小程序并进行一次操作，会员状态将自动同步到这里")}</div>`;
    return;
  }
  elements.content.innerHTML = `<div class="client-grid">${appState.clients.map((client, index) => {
    const user = client.user || {};
    return `
      <article class="client-card">
        <div class="client-head">
          <div class="client-avatar">${escapeHtml((user.nickname || "FS").slice(0, 2))}</div>
          <div><strong>${escapeHtml(user.nickname || "FitSpace 会员")}</strong><small>${escapeHtml(user.memberNo || client.deviceId)}</small></div>
        </div>
        <div class="client-stats">
          <div><strong>${client.cards}</strong><small>会员卡</small></div>
          <div><strong>${client.appointments}</strong><small>预约</small></div>
          <div><strong>${client.checkins}</strong><small>签到</small></div>
        </div>
        <button data-client="${index}">查看会员快照</button>
      </article>`;
  }).join("")}</div>`;
}

function openClient(index) {
  const client = appState.clients[index];
  const raw = client.raw || {};
  elements.clientDialogTitle.textContent = client.user?.nickname || "会员详情";
  elements.clientDetail.innerHTML = `
    <div class="client-summary">
      ${summaryCell(client.energy, "能量")}
      ${summaryCell(client.cards, "会员卡")}
      ${summaryCell(client.orders, "订单")}
      ${summaryCell(client.checkins, "签到")}
    </div>
    ${detailSection("预约记录", raw.appointments || [], (item) => [item.title, `${item.time || ""} · ${item.storeName || ""}`, item.status])}
    ${detailSection("订单记录", raw.orders || [], (item) => [item.title, item.createdAt, item.status])}
    ${detailSection("签到记录", raw.checkins || [], (item) => ["训练签到", `${item.date || ""} ${item.time || ""}`, item.storeName])}`;
  elements.clientDialog.showModal();
}

function summaryCell(value, label) {
  return `<div><strong>${escapeHtml(value || 0)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function detailSection(title, items, mapper) {
  return `<section class="detail-section"><h4>${escapeHtml(title)}</h4>${
    items.length
      ? items.slice(0, 8).map((item) => {
          const [name, meta, status] = mapper(item);
          return `<div class="detail-record"><div><strong>${escapeHtml(name || "-")}</strong><small>${escapeHtml(meta || "-")}</small></div><span>${escapeHtml(status || "已记录")}</span></div>`;
        }).join("")
      : '<div class="cell-muted">暂无记录</div>'
  }</section>`;
}

function renderError(error) {
  elements.content.innerHTML = `<div class="panel">${emptyInline("数据加载失败", error.message)}</div>`;
  showToast(error.message, "error");
}

function formatTime(value) {
  if (!value) return "刚刚";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = elements.loginForm.querySelector(".login-button");
  button.disabled = true;
  button.firstElementChild.textContent = "正在验证…";
  try {
    const result = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: elements.password.value })
    });
    appState.token = result.token;
    sessionStorage.setItem("fitspace_admin_token", result.token);
    elements.password.value = "";
    showApp();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button.disabled = false;
    button.firstElementChild.textContent = "进入运营后台";
  }
});

elements.togglePassword.addEventListener("click", () => {
  const show = elements.password.type === "password";
  elements.password.type = show ? "text" : "password";
  elements.togglePassword.textContent = show ? "隐藏" : "显示";
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "dashboard") loadDashboard();
    else if (button.dataset.view === "clients") loadClients();
    else if (button.dataset.resource) loadResource(button.dataset.resource);
  });
});

elements.content.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");
  const client = event.target.closest("[data-client]");
  if (edit) openEditor(Number(edit.dataset.edit));
  if (remove) deleteItem(Number(remove.dataset.delete));
  if (client) openClient(Number(client.dataset.client));
});

elements.createButton.addEventListener("click", () => openEditor());
elements.editForm.addEventListener("submit", saveEditor);
elements.dialogClose.addEventListener("click", () => elements.editDialog.close());
elements.dialogCancel.addEventListener("click", () => elements.editDialog.close());
elements.clientDialogClose.addEventListener("click", () => elements.clientDialog.close());
elements.logoutButton.addEventListener("click", () => logout());
elements.refreshButton.addEventListener("click", () => {
  if (appState.view === "dashboard") loadDashboard();
  else if (appState.view === "clients") loadClients();
  else loadResource(appState.resource);
});

if (appState.token) {
  api("/api/admin/dashboard")
    .then(() => showApp())
    .catch(() => showLogin());
} else {
  showLogin();
}
