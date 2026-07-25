Component({
  properties: {
    active: {
      type: String,
      value: "home"
    }
  },
  methods: {
    go(event) {
      const target = event.currentTarget.dataset.target;
      if (target === this.data.active) return;
      wx.redirectTo({
        url: target === "home" ? "/pages/home/index" : "/pages/mine/index"
      });
    }
  }
});
