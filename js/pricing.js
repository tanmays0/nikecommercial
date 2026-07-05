/**
 * ARCHIVE — Shared pricing math (subtotal, shipping, tax, totals)
 */
(function () {
  'use strict';

  const CONFIG = Object.freeze({
    currency: 'USD',
    taxRate: 0.0825, // 8.25% mock sales tax
    freeShippingThreshold: 75,
    standardShipping: 7.5,
    expeditedShipping: 18,
  });

  function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function format(amount) {
    if (window.ProductSchema) return ProductSchema.formatPrice(amount, CONFIG.currency);
    return `$${round(amount).toFixed(2)}`;
  }

  function unitPrice(productId, fallback = 0) {
    const product = window.ProductsData?.getRawProductById(productId);
    return product ? product.price : fallback;
  }

  /**
   * @param {Array<{productId:string, price?:number, quantity:number}>} lines
   */
  function subtotal(lines) {
    return round(
      (lines || []).reduce((sum, line) => {
        const price = unitPrice(line.productId, line.price ?? 0);
        return sum + price * line.quantity;
      }, 0)
    );
  }

  function shippingCost(sub, method = 'standard') {
    if (sub <= 0) return 0;
    if (method === 'expedited') return CONFIG.expeditedShipping;
    if (sub >= CONFIG.freeShippingThreshold) return 0;
    return CONFIG.standardShipping;
  }

  function amountToFreeShipping(sub) {
    return round(Math.max(0, CONFIG.freeShippingThreshold - sub));
  }

  function tax(taxable) {
    return round(Math.max(0, taxable) * CONFIG.taxRate);
  }

  /**
   * Full order math.
   * @param {Array} lines
   * @param {{ method?:string, discount?:number }} [opts]
   */
  function summarize(lines, opts = {}) {
    const { method = 'standard', discount = 0 } = opts;
    const sub = subtotal(lines);
    const discountAmount = round(Math.min(discount, sub));
    const taxableBase = Math.max(0, sub - discountAmount);
    const shipping = shippingCost(sub, method);
    const taxAmount = tax(taxableBase);
    const total = round(taxableBase + shipping + taxAmount);

    return {
      currency: CONFIG.currency,
      subtotal: sub,
      discount: discountAmount,
      shipping,
      shippingMethod: method,
      freeShippingThreshold: CONFIG.freeShippingThreshold,
      amountToFreeShipping: amountToFreeShipping(sub),
      tax: taxAmount,
      taxRate: CONFIG.taxRate,
      total,
    };
  }

  window.Pricing = Object.freeze({
    CONFIG,
    round,
    format,
    subtotal,
    shippingCost,
    amountToFreeShipping,
    tax,
    summarize,
  });
})();
