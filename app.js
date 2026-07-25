const state = require("./utils/state");
const catalog = require("./utils/catalog");

App({
  onLaunch() {
    const current = state.ensureState();
    state.sync(current).catch(() => {});
    catalog.refresh(true).catch(() => {});
  },
  globalData: {
    appName: "FitSpace"
  }
});
