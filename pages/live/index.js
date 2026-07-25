const catalog = require("../../utils/catalog");
const state = require("../../utils/state");

Page({
  data: {
    store: {},
    cameras: [],
    updatedAt: "",
    notice: "演示画面 · 正式版接入合规监控直播流"
  },

  onShow() {
    this.refresh();
    catalog.refresh().then(() => this.refresh()).catch(() => {});
    this.timer = setInterval(() => this.refresh(true), 5000);
  },

  onHide() {
    clearInterval(this.timer);
  },

  onUnload() {
    clearInterval(this.timer);
  },

  refresh(simulate) {
    const current = state.getState();
    const data = catalog.get();
    const base = data.stores.find((item) => item.id === current.selectedStoreId) || data.stores[0];
    const offset = simulate ? Math.floor(Math.random() * 5) - 2 : 0;
    const people = Math.max(0, Math.min(base.capacity, base.people + offset));
    const store = Object.assign({}, base, {
      people,
      occupancy: Math.round((people / base.capacity) * 100)
    });
    const now = new Date();
    const updatedAt =
      (now.getHours() < 10 ? "0" : "") +
      now.getHours() +
      ":" +
      (now.getMinutes() < 10 ? "0" : "") +
      now.getMinutes() +
      ":" +
      (now.getSeconds() < 10 ? "0" : "") +
      now.getSeconds();
    this.setData({
      store,
      updatedAt,
      cameras: [
        { id: "cam-1", name: "力量训练区", people: Math.max(1, Math.round(people * 0.42)), tone: "green" },
        { id: "cam-2", name: "有氧训练区", people: Math.max(0, Math.round(people * 0.34)), tone: "blue" },
        { id: "cam-3", name: "自由训练区", people: Math.max(0, Math.round(people * 0.24)), tone: "orange" }
      ]
    });
  }
});
