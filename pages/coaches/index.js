const catalog = require("../../utils/catalog");
const state = require("../../utils/state");

Page({
  data: {
    coaches: [],
    filter: "全部",
    filters: ["全部", "增肌减脂", "体态塑形", "瑜伽普拉提"]
  },

  onShow() {
    this.applyFilter(this.data.filter);
    catalog.refresh().then(() => this.applyFilter(this.data.filter)).catch(() => {});
  },

  chooseFilter(event) {
    const filter = event.currentTarget.dataset.filter;
    this.setData({ filter });
    this.applyFilter(filter);
  },

  applyFilter(filter) {
    const current = state.getState();
    let coaches = catalog.get().coaches;
    if (filter === "增肌减脂") coaches = coaches.filter((item) => item.id === "coach-2");
    if (filter === "体态塑形") coaches = coaches.filter((item) => item.id === "coach-1");
    if (filter === "瑜伽普拉提") coaches = coaches.filter((item) => item.id === "coach-3");
    this.setData({
      coaches: coaches.map((coach) =>
        Object.assign({}, coach, {
          liked: current.likedCoachIds.indexOf(coach.id) > -1,
          followed: current.followedCoachIds.indexOf(coach.id) > -1
        })
      )
    });
  },

  openCoach(event) {
    wx.navigateTo({
      url: "/pages/coach-detail/index?id=" + event.currentTarget.dataset.id
    });
  },

  follow(event) {
    const id = event.currentTarget.dataset.id;
    const current = state.getState();
    const index = current.followedCoachIds.indexOf(id);
    if (index > -1) current.followedCoachIds.splice(index, 1);
    else current.followedCoachIds.push(id);
    state.setState(current);
    this.applyFilter(this.data.filter);
    wx.showToast({ title: index > -1 ? "已取消关注" : "关注成功", icon: "none" });
  }
});
