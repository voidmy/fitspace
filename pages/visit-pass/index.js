const catalog = require("../../utils/catalog");
const state = require("../../utils/state");

Page({
  data: {
    store: {},
    agreed: false,
    price: 25.8,
    visitPass: null
  },

  onShow() {
    this.loadPass();
    catalog.refresh().then(() => this.loadPass()).catch(() => {});
  },

  loadPass() {
    const current = state.getState();
    const data = catalog.get();
    this.setData({
      store: data.stores.find((item) => item.id === current.selectedStoreId) || data.stores[0],
      visitPass: current.visitPasses[0] || null
    });
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  buy() {
    if (this.data.visitPass) {
      wx.showToast({ title: "每位新客户限领一次", icon: "none" });
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({ title: "请先阅读并同意规则", icon: "none" });
      return;
    }
    wx.showModal({
      title: "模拟购买参观票",
      content: "将生成一张 ¥25.8 的参观票。15 分钟内离场的自动退款需正式后台配合门禁记录完成。",
      confirmText: "确认领取",
      confirmColor: "#ff6b35",
      success: (result) => {
        if (!result.confirm) return;
        const current = state.getState();
        current.visitPasses.unshift({
          id: state.id("visit"),
          storeName: this.data.store.name,
          amount: this.data.price,
          status: "待使用",
          createdAt: state.dateTime()
        });
        state.setState(current);
        state.addOrder("新客参观票", this.data.price, "待使用");
        wx.showToast({ title: "领取成功", icon: "success" });
        this.loadPass();
      }
    });
  },

  simulateEntry() {
    const current = state.getState();
    const target = current.visitPasses[0];
    if (!target || target.status !== "待使用") return;
    target.status = "体验中";
    target.entryAt = state.dateTime();
    state.setState(current);
    this.loadPass();
    wx.showToast({ title: "已模拟进场", icon: "success" });
  },

  simulateExit() {
    const current = state.getState();
    const target = current.visitPasses[0];
    if (!target || target.status !== "体验中") return;
    target.status = "已退款";
    target.exitAt = state.dateTime();
    target.refundAt = state.dateTime();
    const order = current.orders.find((item) => item.title === "新客参观票");
    if (order) order.status = "退款成功";
    state.setState(current);
    this.loadPass();
    wx.showModal({
      title: "自动退款成功",
      content: "本次体验未超过 15 分钟，¥25.8 已模拟原路退回。",
      showCancel: false,
      confirmColor: "#2b8c62"
    });
  }
});
