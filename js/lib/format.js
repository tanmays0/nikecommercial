/**
 * Currency and price formatting — single source of truth.
 * Delegates to Pricing / ProductSchema when available.
 */
(function () {
  'use strict';

  function money(amount, currency) {
    if (window.Pricing) return Pricing.format(amount);
    if (window.ProductSchema) return ProductSchema.formatPrice(amount, currency);
    const n = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
    return `$${n.toFixed(2)}`;
  }

  function moneyHtml(product) {
    if (window.ProductCard) return ProductCard.formatPriceHtml(product);
    const price = money(product.price);
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      return `<span class="price price--sale">${price}</span> <s class="price price--compare">${money(product.compareAtPrice)}</s>`;
    }
    return `<span class="price">${price}</span>`;
  }

  window.Format = Object.freeze({ money, moneyHtml });
})();
