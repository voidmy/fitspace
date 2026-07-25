const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const SERVER_URL_KEY = "fitspace_server_url";

function getBaseUrl() {
  if (typeof wx === "undefined") return DEFAULT_BASE_URL;
  return wx.getStorageSync(SERVER_URL_KEY) || DEFAULT_BASE_URL;
}

function setBaseUrl(url) {
  const value = String(url || "").trim().replace(/\/+$/, "");
  if (!value) throw new Error("服务器地址不能为空");
  wx.setStorageSync(SERVER_URL_KEY, value);
  return value;
}

function request(path, options) {
  const config = options || {};
  return new Promise((resolve, reject) => {
    if (typeof wx === "undefined" || typeof wx.request !== "function") {
      reject(new Error("当前环境不支持网络请求"));
      return;
    }
    wx.request({
      url: getBaseUrl() + path,
      method: config.method || "GET",
      data: config.data,
      timeout: config.timeout || 3500,
      header: Object.assign(
        {
          "Content-Type": "application/json"
        },
        config.header || {}
      ),
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        reject(new Error((response.data && response.data.error) || "服务器请求失败"));
      },
      fail(error) {
        reject(new Error(error.errMsg || "无法连接服务器"));
      }
    });
  });
}

function getBootstrap() {
  return request("/api/public/bootstrap");
}

function syncClientState(current) {
  if (!current || !current.deviceId) return Promise.reject(new Error("缺少设备标识"));
  const state = Object.assign({}, current, {
    faceImagePath: current.faceImagePath ? "[本机已录入]" : ""
  });
  return request("/api/public/client-state", {
    method: "POST",
    data: {
      deviceId: current.deviceId,
      state
    }
  });
}

function health() {
  return request("/api/health", { timeout: 2000 });
}

module.exports = {
  DEFAULT_BASE_URL,
  getBaseUrl,
  setBaseUrl,
  request,
  getBootstrap,
  syncClientState,
  health
};
