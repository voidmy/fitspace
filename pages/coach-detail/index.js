const catalog = require("../../utils/catalog");
const seedData = require("../../utils/data");
const state = require("../../utils/state");

Page({
  data: {
    coach: {},
    liked: false,
    followed: false
  },

  onLoad(options) {
    this.coachId = options.id || "coach-1";
  },

  onShow() {
    this.loadCoach();
    catalog.refresh().then(() => this.loadCoach()).catch(() => {});
  },

  loadCoach() {
    const current = state.getState();
    const data = catalog.get();
    const coach = data.coaches.find((item) => item.id === this.coachId) || data.coaches[0] || seedData.coaches[0];
    wx.setNavigationBarTitle({ title: coach.name + " · 教练详情" });
    this.setData({
      coach,
      liked: current.likedCoachIds.indexOf(coach.id) > -1,
      followed: current.followedCoachIds.indexOf(coach.id) > -1
    });
  },

  toggleLike() {
    this.toggleList("likedCoachIds");
  },

  toggleFollow() {
    this.toggleList("followedCoachIds");
  },

  toggleList(key) {
    const current = state.getState();
    const index = current[key].indexOf(this.data.coach.id);
    if (index > -1) current[key].splice(index, 1);
    else current[key].push(this.data.coach.id);
    state.setState(current);
    this.onShow();
  },

  book() {
    wx.navigateTo({
      url: "/pages/feature/index?type=personal&coachId=" + this.data.coach.id
    });
  }
});
