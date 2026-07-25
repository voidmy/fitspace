const state = require("../../utils/state");

Page({
  data: {
    code: "",
    source: "美团",
    sources: ["美团", "抖音", "大众点评"],
    result: null
  },

  selectSource(event) {
    this.setData({ source: event.currentTarget.dataset.source, result: null });
  },

  inputCode(event) {
    this.setData({ code: event.detail.value.trim(), result: null });
  },

  scan() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (result) => this.setData({ code: result.result }),
      fail: () => wx.showToast({ title: "可手动输入 FIT2026", icon: "none" })
    });
  },

  verify() {
    if (!this.data.code) {
      wx.showToast({ title: "请输入券码", icon: "none" });
      return;
    }
    const success = this.data.code.toUpperCase() === "FIT2026";
    const result = success
      ? {
          success: true,
          title: "核销成功",
          message: "双人体验套餐 · " + this.data.source,
          code: this.data.code
        }
      : {
          success: false,
          title: "未找到有效券码",
          message: "演示核销码为 FIT2026",
          code: this.data.code
        };
    if (success) {
      const current = state.getState();
      current.verifications.unshift({
        id: state.id("verify"),
        code: this.data.code,
        source: this.data.source,
        createdAt: state.dateTime()
      });
      state.setState(current);
    }
    this.setData({ result });
  }
});
