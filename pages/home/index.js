const seedData = require("../../utils/data");
const catalog = require("../../utils/catalog");
const state = require("../../utils/state");

Page({
  data: {
    store: {},
    cards: seedData.cards,
    projects: seedData.projects,
    coaches: [],
    occupancy: 0,
    banners: seedData.banners,
    quickActions: [
      { icon: "械", name: "门店器械", desc: "查看空闲", url: "/pages/feature/index?type=equipment" },
      { icon: "引", name: "到店指引", desc: "地图导航", url: "/pages/feature/index?type=guide" },
      { icon: "客", name: "在线客服", desc: "随时咨询", url: "/pages/feature/index?type=service" }
    ]
  },

  onShow() {
    this.loadHome();
    catalog.refresh().then(() => this.loadHome()).catch(() => {});
  },

  loadHome() {
    const current = state.getState();
    const data = catalog.get();
    const store = data.stores.find((item) => item.id === current.selectedStoreId) || data.stores[0];
    const coaches = data.coaches.map((coach) =>
      Object.assign({}, coach, {
        liked: current.likedCoachIds.indexOf(coach.id) > -1
      })
    );
    const occupancy = Math.round((store.people / store.capacity) * 100);
    this.setData({
      store,
      coaches,
      occupancy,
      banners: data.banners,
      cards: data.cards,
      projects: data.projects
    });
  },

  navigate(event) {
    const url = event.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  },

  callStore() {
    wx.makePhoneCall({ phoneNumber: this.data.store.phone });
  },

  copyWechat() {
    wx.setClipboardData({
      data: this.data.store.wechat,
      success: () => wx.showToast({ title: "微信号已复制", icon: "success" })
    });
  },

  likeCoach(event) {
    const coachId = event.currentTarget.dataset.id;
    const current = state.getState();
    const index = current.likedCoachIds.indexOf(coachId);
    if (index > -1) {
      current.likedCoachIds.splice(index, 1);
    } else {
      current.likedCoachIds.push(coachId);
      wx.showToast({ title: "已推荐教练", icon: "success" });
    }
    state.setState(current);
    this.onShow();
  }
});
