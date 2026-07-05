/**
 * Shared cart line-item and summary HTML builders.
 */
(function () {
  'use strict';

  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));
  const fmt = (n) => (window.Format ? Format.money(n) : `$${n}`);

  function stockNoteHtml(product) {
    if (!product) return '';
    if (product.inventoryStatus === 'low_stock') {
      return '<p class="cart-item__stock cart-item__stock--low">Low stock — order soon</p>';
    }
    if (product.inventoryStatus === 'backorder') {
      return '<p class="cart-item__stock cart-item__stock--backorder">Backordered — ships in 2–3 weeks</p>';
    }
    if (product.inventoryStatus === 'out_of_stock') {
      return '<p class="cart-item__stock cart-item__stock--out">Out of stock — remove to checkout</p>';
    }
    return '';
  }

  function summaryRowsHtml(summary) {
    const rows = [
      `<div class="cart-summary-row"><dt>Subtotal</dt><dd>${fmt(summary.subtotal)}</dd></div>`,
    ];
    if (summary.discount > 0) {
      rows.push(
        `<div class="cart-summary-row cart-summary-row--discount"><dt>Discount</dt><dd>−${fmt(summary.discount)}</dd></div>`
      );
    }
    rows.push(
      `<div class="cart-summary-row"><dt>Shipping</dt><dd>${summary.shipping === 0 ? 'Free' : fmt(summary.shipping)}</dd></div>`
    );
    rows.push(
      `<div class="cart-summary-row"><dt>Estimated Tax</dt><dd>${fmt(summary.tax)}</dd></div>`
    );
    return rows.join('');
  }

  function shippingProgressText(summary) {
    if (summary.amountToFreeShipping > 0) {
      return `Add ${fmt(summary.amountToFreeShipping)} more for free shipping.`;
    }
    return 'You\u2019ve unlocked free standard shipping.';
  }

  window.CartRender = Object.freeze({
    stockNoteHtml,
    summaryRowsHtml,
    shippingProgressText,
  });
})();
