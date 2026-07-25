const seedData = require("../../utils/data");
const catalog = require("../../utils/catalog");
const state = require("../../utils/state");

function buildDays() {
  const labels = ["日", "一", "二", "三", "四", "五", "六"];
  const values = [];
  const today = new Date();
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    values.push({
      label: index === 0 ? "今" : labels[date.getDay()],
      day: date.getDate(),
      active: index === 0
    });
  }
  return values;
}

Page({
  data: {
    user: {},
    isDemoUser: true,
    stats: {},
    energy: 0,
    activeTab: "group",
    days: buildDays(),
    classes: seedData.classes.slice(0, 3),
    appointments: [],
    menuItems: [
      { icon: "闸", name: "进场预约", type: "entry", tone: "orange" },
      { icon: "单", name: "我的订单", type: "orders", tone: "purple" },
      { icon: "课", name: "课程预约", type: "classes", tone: "blue" },
      { icon: "教", name: "教练关注", type: "following", tone: "green" },
      { icon: "脸", name: "人脸录入", type: "face", tone: "pink" },
      { icon: "码", name: "智能密码", type: "door", tone: "yellow" },
      { icon: "客", name: "客服电话", type: "service", tone: "cyan" },
      { icon: "网", name: "场馆 WiFi", type: "wifi", tone: "gray" }
    ]
  },

  onShow() {
    this.loadMine();
    catalog.refresh().then(() => this.loadMine()).catch(() => {});
  },

  loadMine() {
    const current = state.getState();
    const data = catalog.get();
    const totalMinutes = current.checkins.length * 68;
    this.setData({
      user: current.user,
      isDemoUser: !current.user.avatarUrl,
      energy: current.energy,
      appointments: current.appointments.slice(0, 3),
      classes: this.data.activeTab === "group" ? data.classes.slice(0, 3) : this.data.classes,
      stats: {
        training: current.checkins.length,
        minutes: totalMinutes,
        courses: current.appointments.filter((item) => item.kind === "课程").length,
        likes: current.likedCoachIds.length
      }
    });
  },

  login() {
    if (!wx.getUserProfile) {
      wx.showToast({ title: "当前版本不支持", icon: "none" });
      return;
    }
    wx.getUserProfile({
      desc: "用于展示会员头像和昵称",
      success: (result) => {
        const current = state.getState();
        current.user = Object.assign({}, current.user, {
          nickname: result.userInfo.nickName,
          avatarUrl: result.userInfo.avatarUrl
        });
        state.setState(current);
        this.onShow();
      },
      fail: () => wx.showToast({ title: "已保留演示身份", icon: "none" })
    });
  },

  navigate(event) {
    const url = event.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  },

  openFeature(event) {
    wx.navigateTo({
      url: "/pages/feature/index?type=" + event.currentTarget.dataset.type
    });
  },

  selectTab(event) {
    const data = catalog.get();
    const activeTab = event.currentTarget.dataset.tab;
    const classes =
      activeTab === "group"
        ? data.classes.slice(0, 3)
        : activeTab === "private"
          ? data.coaches.map((coach) => ({
              id: coach.id,
              name: coach.name + " · " + coach.title,
              coach: coach.years + " 年经验",
              time: "今日可约",
              duration: "¥" + coach.price + "/小时",
              left: 1,
              level: "一对一"
            }))
          : this.data.appointments.map((item) => ({
              id: item.id,
              name: item.title,
              coach: item.storeName || "FitSpace",
              time: item.time,
              duration: item.kind,
              left: 0,
              level: item.status
            }));
    this.setData({ activeTab, classes });
  },

  signIn() {
    const current = state.getState();
    const today = state.dateTime().slice(0, 10);
    if (current.checkins.some((item) => item.date === today)) {
      wx.showToast({ title: "今天已签到", icon: "none" });
      return;
    }
    current.checkins.unshift({
      id: state.id("checkin"),
      date: today,
      time: state.dateTime().slice(11),
      storeName: "FitSpace 武侯店"
    });
    current.energy += 20;
    state.setState(current);
    wx.showToast({ title: "签到成功 +20", icon: "success" });
    this.onShow();
  }
});
