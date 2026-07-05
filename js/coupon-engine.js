/**
 * ARCHIVE — Coupon / discount engine (mock)
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'archive_coupon';

  /** @type {Record<string, {type:'percent'|'fixed'|'shipping', value:number, minSubtotal?:number, expires?:string, label:string}>} */
  const COUPONS = {
    ARCHIVE10: { type: 'percent', value: 10, label: '10% off your order' },
    RUN20: { type: 'percent', value: 20, minSubtotal: 100, label: '20% off orders over $100' },
    FREESHIP: { type: 'shipping', value: 0, label: 'Free standard shipping' },
    SAVE15: { type: 'fixed', value: 15, minSubtotal: 60, label: '$15 off orders over $60' },
    EXPIRED5: { type: 'percent', value: 5, expires: '2024-01-01', label: 'Expired promo' },
  };

  function normalize(code) {
    return String(code || '').trim().toUpperCase();
  }

  /**
   * @returns {{ ok:boolean, status:'valid'|'invalid'|'expired'|'ineligible', code?:string, coupon?:object, discount?:number, message:string }}
   */
  function validate(code, subtotal) {
    const key = normalize(code);
    if (!key) return { ok: false, status: 'invalid', message: 'Enter a promo code.' };

    const coupon = COUPONS[key];
    if (!coupon) {
      return { ok: false, status: 'invalid', message: `“${key}” is not a valid code.` };
    }

    if (coupon.expires && new Date(coupon.expires) < new Date()) {
      return { ok: false, status: 'expired', message: `“${key}” has expired.` };
    }

    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return {
        ok: false,
        status: 'ineligible',
        message: `Spend ${formatMoney(coupon.minSubtotal)} to use “${key}”.`,
      };
    }

    const discount = computeDiscount(coupon, subtotal);
    return {
      ok: true,
      status: 'valid',
      code: key,
      coupon,
      discount,
      message: `Applied ${coupon.label}.`,
    };
  }

  function computeDiscount(coupon, subtotal) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return round(subtotal * (coupon.value / 100));
    if (coupon.type === 'fixed') return Math.min(coupon.value, subtotal);
    return 0; // shipping handled separately
  }

  function affectsShipping(coupon) {
    return coupon?.type === 'shipping';
  }

  function round(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function formatMoney(n) {
    return window.Format ? Format.money(n) : window.Pricing ? Pricing.format(n) : `$${n}`;
  }

  function getApplied() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function setApplied(code) {
    if (code) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code: normalize(code) }));
    else sessionStorage.removeItem(STORAGE_KEY);
  }

  function clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  window.CouponEngine = Object.freeze({
    COUPONS,
    validate,
    computeDiscount,
    affectsShipping,
    getApplied,
    setApplied,
    clear,
  });
})();
