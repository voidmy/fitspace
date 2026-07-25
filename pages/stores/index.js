const catalog = require("../../utils/catalog");
const state = require("../../utils/state");

Page({
  data: {
    stores: [],
    selectedStoreId: ""
  },

  onShow() {
    this.loadStores();
    catalog.refresh().then(() => this.loadStores()).catch(() => {});
  },

  loadStores() {
    const current = state.getState();
    const data = catalog.get();
    this.setData({
      selectedStoreId: current.selectedStoreId,
      stores: data.stores.map((store) =>
        Object.assign({}, store, {
          occupancy: Math.round((store.people / store.capacity) * 100)
        })
      )
    });
  },

  selectStore(event) {
    const id = event.currentTarget.dataset.id;
    state.update({ selectedStoreId: id });
    wx.showToast({ title: "门店已切换", icon: "success" });
    setTimeout(() => wx.navigateBack(), 500);
  },

  openMap(event) {
    const store = this.data.stores.find((item) => item.id === event.currentTarget.dataset.id);
    wx.openLocation({
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.name,
      address: store.address,
      scale: 16
    });
  }
});
