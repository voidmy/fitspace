const STORAGE_KEY = "fitspace_state_v1";
const api = require("./api");

function defaultState() {
  return {
    deviceId: id("device"),
    selectedStoreId: "store-1",
    user: {
      nickname: "FitSpace 会员",
      avatarUrl: "",
      memberNo: "FS20260724",
      level: "活力会员"
    },
    likedCoachIds: [],
    followedCoachIds: ["coach-1"],
    orders: [
      {
        id: "order-demo-1",
        title: "单店月卡",
        amount: 139,
        status: "已完成",
        createdAt: "2026-07-20 18:26"
      }
    ],
    appointments: [],
    checkins: [],
    energy: 860,
    faceEnrolled: false,
    faceImagePath: "",
    boughtCards: [
      {
        id: "member-card-demo",
        productId: "card-month",
        name: "单店月卡",
        storeName: "FitSpace 武侯店",
        purchasedAt: "2026-07-20 18:26",
        status: "生效中"
      }
    ],
    visitPasses: [],
    verifications: []
  };
}

function ensureState() {
  const saved = wx.getStorageSync(STORAGE_KEY);
  const merged = Object.assign(defaultState(), saved || {});
  wx.setStorageSync(STORAGE_KEY, merged);
  return merged;
}

function getState() {
  return ensureState();
}

function setState(next) {
  wx.setStorageSync(STORAGE_KEY, next);
  api.syncClientState(next).catch(() => {});
  return next;
}

function sync(current) {
  return api.syncClientState(current || getState());
}

function update(patch) {
  return setState(Object.assign(getState(), patch));
}

function id(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

function pad(value) {
  return value < 10 ? "0" + value : String(value);
}

function dateTime(date) {
  const value = date || new Date();
  return (
    value.getFullYear() +
    "-" +
    pad(value.getMonth() + 1) +
    "-" +
    pad(value.getDate()) +
    " " +
    pad(value.getHours()) +
    ":" +
    pad(value.getMinutes())
  );
}

function addOrder(title, amount, status) {
  const current = getState();
  const order = {
    id: id("order"),
    title,
    amount,
    status: status || "已完成",
    createdAt: dateTime()
  };
  current.orders.unshift(order);
  setState(current);
  return order;
}

module.exports = {
  ensureState,
  getState,
  setState,
  update,
  sync,
  id,
  dateTime,
  addOrder
};
