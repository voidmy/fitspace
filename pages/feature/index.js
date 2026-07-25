const seedData = require("../../utils/data");
const catalog = require("../../utils/catalog");
const api = require("../../utils/api");
const state = require("../../utils/state");

const titles = {
  project: ["训练项目", "找到适合你的训练方式"],
  equipment: ["门店器械", "实时了解器械与使用提示"],
  guide: ["到店指引", "轻松找到你的训练空间"],
  service: ["联系客服", "需要帮助，我们随时都在"],
  membership: ["我的会员卡", "查看权益与进场凭证"],
  entry: ["进场预约", "提前预约，错峰训练"],
  orders: ["我的订单", "消费与服务记录"],
  classes: ["课程预约", "精品小班，和伙伴一起练"],
  personal: ["预约私教", "一对一专属训练计划"],
  following: ["关注的教练", "快速找到心仪教练"],
  face: ["人脸录入", "用于无人场馆快捷通行"],
  door: ["智能门禁", "安全查看本次进场密码"],
  wifi: ["场馆 WiFi", "训练时保持在线"],
  checkin: ["每日签到", "每次坚持都有奖励"],
  energy: ["能量商城", "用训练收获兑换好物"],
  records: ["训练记录", "回看每一次坚持"],
  settings: ["设置", "服务器与本地数据"]
};

function qrCells() {
  return Array.from({ length: 81 }, (_, index) => {
    const x = index % 9;
    const y = Math.floor(index / 9);
    return {
      id: index,
      on:
        (x < 3 && y < 3) ||
        (x > 5 && y < 3) ||
        (x < 3 && y > 5) ||
        (x + y) % 3 === 0 ||
        (x * y) % 5 === 0
    };
  });
}

Page({
  data: {
    type: "",
    title: "",
    subtitle: "",
    store: {},
    projects: seedData.projects,
    equipment: seedData.equipment,
    classes: seedData.classes,
    coaches: seedData.coaches,
    followingCoaches: [],
    goods: seedData.energyGoods,
    user: {},
    energy: 0,
    orders: [],
    appointments: [],
    entryAppointments: [],
    checkins: [],
    cards: [],
    faceEnrolled: false,
    faceImagePath: "",
    qrCells: qrCells(),
    selectedDate: "",
    selectedTime: "19:00",
    minDate: "",
    timeOptions: ["07:00", "09:00", "12:00", "15:00", "18:00", "19:00", "20:00", "21:00"],
    timeIndex: 5,
    passwordVisible: false,
    doorPassword: "73 18 05",
    serverUrl: api.getBaseUrl(),
    serverStatus: "检测中"
  },

  onLoad(options) {
    this.pageType = options.type || "project";
    this.coachId = options.coachId || "";
    const meta = titles[this.pageType] || titles.project;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selectedDate = state.dateTime(tomorrow).slice(0, 10);
    this.setData({
      type: this.pageType,
      title: meta[0],
      subtitle: meta[1],
      selectedDate,
      minDate: state.dateTime().slice(0, 10)
    });
    wx.setNavigationBarTitle({ title: meta[0] });
  },

  onShow() {
    this.loadState();
    catalog.refresh().then(() => this.loadState()).catch(() => {});
    if (this.pageType === "settings") this.checkServer();
  },

  loadState() {
    const current = state.getState();
    const data = catalog.get();
    const store = data.stores.find((item) => item.id === current.selectedStoreId) || data.stores[0];
    let coaches = data.coaches;
    if (this.coachId) coaches = data.coaches.filter((item) => item.id === this.coachId);
    this.setData({
      store,
      projects: data.projects,
      equipment: data.equipment,
      classes: data.classes,
      goods: data.energyGoods,
      user: current.user,
      energy: current.energy,
      orders: current.orders,
      appointments: current.appointments,
      entryAppointments: current.appointments.filter((item) => item.kind === "进场"),
      checkins: current.checkins.map((item) =>
        Object.assign({}, item, {
          day: item.date.slice(8),
          month: item.date.slice(0, 7)
        })
      ),
      cards: current.boughtCards,
      faceEnrolled: current.faceEnrolled,
      faceImagePath: current.faceImagePath,
      coaches,
      followingCoaches: data.coaches.filter((coach) => current.followedCoachIds.indexOf(coach.id) > -1)
    });
  },

  callStore() {
    wx.makePhoneCall({ phoneNumber: this.data.store.phone });
  },

  copy(event) {
    const value = event.currentTarget.dataset.value;
    wx.setClipboardData({
      data: String(value),
      success: () => wx.showToast({ title: "已复制", icon: "success" })
    });
  },

  openMap() {
    const store = this.data.store;
    wx.openLocation({
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.name,
      address: store.address,
      scale: 16
    });
  },

  chooseDate(event) {
    this.setData({ selectedDate: event.detail.value });
  },

  chooseTime(event) {
    const index = Number(event.detail.value);
    this.setData({
      timeIndex: index,
      selectedTime: this.data.timeOptions[index]
    });
  },

  bookEntry() {
    const current = state.getState();
    const appointment = {
      id: state.id("appointment"),
      title: "自主训练进场",
      storeName: this.data.store.name,
      time: this.data.selectedDate + " " + this.data.selectedTime,
      kind: "进场",
      status: "已预约"
    };
    current.appointments.unshift(appointment);
    state.setState(current);
    wx.showToast({ title: "预约成功", icon: "success" });
    this.loadState();
  },

  bookClass(event) {
    const classInfo = this.data.classes.find((item) => item.id === event.currentTarget.dataset.id);
    const current = state.getState();
    if (current.appointments.some((item) => item.sourceId === classInfo.id && item.status === "已预约")) {
      wx.showToast({ title: "你已预约该课程", icon: "none" });
      return;
    }
    current.appointments.unshift({
      id: state.id("appointment"),
      sourceId: classInfo.id,
      title: classInfo.name,
      storeName: this.data.store.name,
      time: classInfo.time,
      kind: "课程",
      status: "已预约"
    });
    state.setState(current);
    wx.showToast({ title: "课程预约成功", icon: "success" });
    this.loadState();
  },

  bookCoach(event) {
    const coach = this.data.coaches.find((item) => item.id === event.currentTarget.dataset.id);
    wx.showModal({
      title: "预约 " + coach.name,
      content: this.data.selectedDate + " " + this.data.selectedTime + "，¥" + coach.price + "/小时（演示版暂不扣款）",
      confirmText: "确认预约",
      confirmColor: "#ff6b35",
      success: (result) => {
        if (!result.confirm) return;
        const current = state.getState();
        current.appointments.unshift({
          id: state.id("appointment"),
          sourceId: coach.id,
          title: coach.name + " 私教课",
          storeName: this.data.store.name,
          time: this.data.selectedDate + " " + this.data.selectedTime,
          kind: "私教",
          status: "待确认"
        });
        state.setState(current);
        state.addOrder(coach.name + " 私教预约", coach.price, "待确认");
        wx.showToast({ title: "预约已提交", icon: "success" });
        this.loadState();
      }
    });
  },

  cancelAppointment(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "取消预约",
      content: "确认取消这条预约吗？",
      success: (result) => {
        if (!result.confirm) return;
        const current = state.getState();
        current.appointments = current.appointments.map((item) =>
          item.id === id ? Object.assign({}, item, { status: "已取消" }) : item
        );
        state.setState(current);
        this.loadState();
      }
    });
  },

  openCoach(event) {
    wx.navigateTo({
      url: "/pages/coach-detail/index?id=" + event.currentTarget.dataset.id
    });
  },

  enrollFace() {
    if (!wx.chooseMedia) {
      wx.showToast({ title: "请在真机或新版工具中体验", icon: "none" });
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["camera", "album"],
      camera: "front",
      success: (result) => {
        const path = result.tempFiles[0].tempFilePath;
        if (wx.saveFile) {
          wx.saveFile({
            tempFilePath: path,
            success: (saved) => this.finishFaceEnrollment(saved.savedFilePath),
            fail: () => this.finishFaceEnrollment(path)
          });
        } else {
          this.finishFaceEnrollment(path);
        }
      }
    });
  },

  finishFaceEnrollment(path) {
    state.update({ faceEnrolled: true, faceImagePath: path });
    this.loadState();
    wx.showToast({ title: "录入成功", icon: "success" });
  },

  removeFace() {
    wx.showModal({
      title: "删除人脸信息",
      content: "确认删除本地演示记录吗？",
      confirmColor: "#d94838",
      success: (result) => {
        if (!result.confirm) return;
        state.update({ faceEnrolled: false, faceImagePath: "" });
        this.loadState();
      }
    });
  },

  togglePassword() {
    this.setData({ passwordVisible: !this.data.passwordVisible });
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
      storeName: this.data.store.name
    });
    current.energy += 20;
    state.setState(current);
    this.loadState();
    wx.showToast({ title: "签到成功 +20", icon: "success" });
  },

  redeem(event) {
    const item = this.data.goods.find((goods) => goods.id === event.currentTarget.dataset.id);
    if (this.data.energy < item.energy) {
      wx.showToast({ title: "能量不足", icon: "none" });
      return;
    }
    wx.showModal({
      title: "确认兑换",
      content: item.energy + " 能量兑换「" + item.name + "」",
      confirmText: "确认兑换",
      confirmColor: "#ff6b35",
      success: (result) => {
        if (!result.confirm) return;
        const current = state.getState();
        current.energy -= item.energy;
        current.orders.unshift({
          id: state.id("energy-order"),
          title: "能量兑换 · " + item.name,
          amount: 0,
          status: "待领取",
          createdAt: state.dateTime()
        });
        state.setState(current);
        this.loadState();
        wx.showToast({ title: "兑换成功", icon: "success" });
      }
    });
  },

  inputServerUrl(event) {
    this.setData({ serverUrl: event.detail.value, serverStatus: "待保存" });
  },

  saveServerUrl() {
    try {
      const serverUrl = api.setBaseUrl(this.data.serverUrl);
      catalog.clearCache();
      this.setData({ serverUrl });
      this.checkServer();
      catalog.refresh(true).then(() => this.loadState()).catch(() => {});
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  },

  checkServer() {
    this.setData({ serverStatus: "检测中" });
    api
      .health()
      .then(() => this.setData({ serverStatus: "连接正常" }))
      .catch(() => this.setData({ serverStatus: "无法连接" }));
  },

  resetDemo() {
    wx.showModal({
      title: "重置演示数据",
      content: "将清除本机上的预约、签到、订单和偏好，且无法撤销。",
      confirmText: "确认重置",
      confirmColor: "#d94838",
      success: (result) => {
        if (!result.confirm) return;
        const serverUrl = api.getBaseUrl();
        wx.clearStorageSync();
        api.setBaseUrl(serverUrl);
        catalog.clearCache();
        state.ensureState();
        state.sync().catch(() => {});
        this.loadState();
        wx.showToast({ title: "已重置", icon: "success" });
      }
    });
  }
});
