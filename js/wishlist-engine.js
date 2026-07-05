/**
 * ARCHIVE — Wishlist + recently viewed (localStorage)
 */
(function () {
  'use strict';

  const WISHLIST_KEY = 'nikecommercial_wishlist';
  const RECENT_KEY = 'nikecommercial_recent';
  const EVENT_WISHLIST = 'nikeWishlistUpdated';
  const EVENT_RECENT = 'nikeRecentUpdated';
  const MAX_RECENT = 8;

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getWishlist() {
    return read(WISHLIST_KEY);
  }

  function isWishlisted(productId) {
    return getWishlist().includes(productId);
  }

  function toggleWishlist(productId) {
    let list = getWishlist();
    if (list.includes(productId)) {
      list = list.filter((id) => id !== productId);
    } else {
      list = [productId, ...list];
    }
    write(WISHLIST_KEY, list);
    window.dispatchEvent(new CustomEvent(EVENT_WISHLIST, { detail: { wishlist: list } }));
    return list;
  }

  function addRecentlyViewed(productId) {
    let list = read(RECENT_KEY).filter((id) => id !== productId);
    list.unshift(productId);
    list = list.slice(0, MAX_RECENT);
    write(RECENT_KEY, list);
    window.dispatchEvent(new CustomEvent(EVENT_RECENT, { detail: { recent: list } }));
    return list;
  }

  function getRecentlyViewed() {
    return read(RECENT_KEY);
  }

  window.WishlistEngine = Object.freeze({
    EVENT_WISHLIST,
    EVENT_RECENT,
    getWishlist,
    isWishlisted,
    toggleWishlist,
    addRecentlyViewed,
    getRecentlyViewed,
  });
})();
