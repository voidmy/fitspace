const fallback = require("./data");
const api = require("./api");

const CACHE_KEY = "fitspace_catalog_v1";
let inflight = null;
let lastRefreshAt = 0;

function visible(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item.enabled !== false);
}

function normalize(source) {
  const value = Object.assign({}, fallback, source || {});
  return {
    banners: visible(value.banners).sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0)),
    stores: Array.isArray(value.stores) && value.stores.length ? value.stores : fallback.stores,
    cards: visible(value.cards),
    projects: Array.isArray(value.projects) ? value.projects : fallback.projects,
    coaches: visible(value.coaches),
    equipment: Array.isArray(value.equipment) ? value.equipment : fallback.equipment,
    classes: visible(value.classes),
    energyGoods: visible(value.energyGoods)
  };
}

function get() {
  if (typeof wx === "undefined") return normalize();
  return normalize(wx.getStorageSync(CACHE_KEY));
}

function refresh(force) {
  if (!force && Date.now() - lastRefreshAt < 5000) {
    return Promise.resolve(get());
  }
  if (inflight) return inflight;
  inflight = api.getBootstrap().then(
    (payload) => {
      const remote = payload && payload.catalog ? payload.catalog : payload;
      const next = normalize(remote);
      wx.setStorageSync(CACHE_KEY, next);
      lastRefreshAt = Date.now();
      inflight = null;
      return next;
    },
    (error) => {
      inflight = null;
      throw error;
    }
  );
  return inflight;
}

function clearCache() {
  if (typeof wx !== "undefined") wx.removeStorageSync(CACHE_KEY);
  lastRefreshAt = 0;
}

module.exports = {
  get,
  refresh,
  clearCache
};
