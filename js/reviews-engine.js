/**
 * ARCHIVE — Reviews (seed from catalog + locally-added, persisted)
 */
(function () {
  'use strict';

  const KEY = 'archive_reviews';

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function writeAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getLocal(productId) {
    return readAll()[productId] || [];
  }

  /** Merge catalog reviews with locally-added ones (local first). */
  function getReviews(product) {
    const local = getLocal(product.id);
    const base = product.reviews || [];
    return [...local, ...base];
  }

  function addReview(productId, { author, rating, title, body }) {
    const review = {
      id: `local_${Date.now().toString(36)}`,
      author: author || 'Anonymous',
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      title: title || '',
      body: body || '',
      date: new Date().toISOString().slice(0, 10),
      verifiedPurchase: false,
    };
    const all = readAll();
    all[productId] = [review, ...(all[productId] || [])];
    writeAll(all);
    return review;
  }

  /** @returns {{average:number, count:number, distribution:Record<1|2|3|4|5, number>}} */
  function getStats(product) {
    const reviews = getReviews(product);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (reviews.length === 0) {
      // fall back to catalog aggregate rating
      return {
        average: product.rating?.average || 0,
        count: product.rating?.count || 0,
        distribution,
      };
    }
    let sum = 0;
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sum += r.rating;
    });
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
      distribution,
    };
  }

  window.ReviewsEngine = Object.freeze({
    getReviews,
    getLocal,
    addReview,
    getStats,
  });
})();
