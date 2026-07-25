const seedData = require("../../utils/data");
const catalog = require("../../utils/catalog");
const state = require("../../utils/state");

Page({
  data: {
    cards: seedData.cards,
    selected: null,
    store: {}
  },

  onShow() {
    this.loadCards();
    catalog.refresh().then(() => this.loadCards()).catch(() => {});
  },

  loadCards() {
    const current = state.getState();
    const data = catalog.get();
    this.setData({
      cards: data.cards,
      store: data.stores.find((item) => item.id === current.selectedStoreId) || data.stores[0]
    });
  },

  selectCard(event) {
    const selected = this.data.cards.find((item) => item.id === event.currentTarget.dataset.id);
    this.setData({ selected });
  },

  buy(event) {
    const card = this.data.cards.find((item) => item.id === event.currentTarget.dataset.id);
    wx.showModal({
      title: "确认购买 " + card.name,
      content: "应付 ¥" + card.price + "。演示版不会发起真实微信支付。",
      confirmText: "模拟支付",
      confirmColor: "#ff6b35",
      success: (result) => {
        if (!result.confirm) return;
        const current = state.getState();
        current.boughtCards.unshift({
          id: state.id("member-card"),
          productId: card.id,
          name: card.name,
          storeName: card.id === "card-year" ? "全城通用" : this.data.store.name,
          purchasedAt: state.dateTime(),
          status: "生效中"
        });
        state.setState(current);
        state.addOrder(card.name, card.price);
        wx.showToast({ title: "购买成功", icon: "success" });
      }
    });
  }
});
