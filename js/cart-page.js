/**
 * ARCHIVE — Bag page renderer (line items + live order summary)
 */
(function () {
  'use strict';

  if (!window.CartEngine || !window.ProductsData) return;

  const itemsEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const layoutEl = document.getElementById('cart-layout');
  const totalEl = document.getElementById('cart-total');
  const summaryEl = document.getElementById('cart-summary');
  const rowsEl = document.getElementById('cart-summary-rows');
  const progressEl = document.getElementById('cart-shipping-progress');

  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));
  const money = (n) => (window.Format ? Format.money(n) : `$${n}`);
  const stockNote = (product) =>
    window.CartRender ? CartRender.stockNoteHtml(product) : '';

  function renderSummaryPanel() {
    const summary = CartEngine.getSummary();
    if (totalEl) totalEl.textContent = money(summary.total);

    if (rowsEl && window.CartRender) {
      rowsEl.innerHTML = CartRender.summaryRowsHtml(summary);
    } else if (rowsEl) {
      const rows = [
        `<div class="cart-summary-row"><dt>Subtotal</dt><dd>${money(summary.subtotal)}</dd></div>`,
      ];
      if (summary.discount > 0) {
        rows.push(
          `<div class="cart-summary-row cart-summary-row--discount"><dt>Discount</dt><dd>−${money(summary.discount)}</dd></div>`
        );
      }
      rows.push(
        `<div class="cart-summary-row"><dt>Shipping</dt><dd>${
          summary.shipping === 0 ? 'Free' : money(summary.shipping)
        }</dd></div>`
      );
      rows.push(
        `<div class="cart-summary-row"><dt>Estimated Tax</dt><dd>${money(summary.tax)}</dd></div>`
      );
      rowsEl.innerHTML = rows.join('');
    }

    if (progressEl && window.CartRender) {
      progressEl.textContent = CartRender.shippingProgressText(summary);
      progressEl.hidden = false;
    } else if (progressEl) {
      if (summary.amountToFreeShipping > 0) {
        progressEl.textContent = `Add ${money(summary.amountToFreeShipping)} more for free shipping.`;
        progressEl.hidden = false;
      } else {
        progressEl.textContent = 'You’ve unlocked free standard shipping.';
        progressEl.hidden = false;
      }
    }
  }

  function render() {
    const cart = CartEngine.getCart();
    const count = CartEngine.getCartCount();
    const total = CartEngine.getCartTotal();

    if (summaryEl) {
      summaryEl.textContent =
        count === 0
          ? 'Your bag is empty.'
          : `${count} item${count === 1 ? '' : 's'} · ${money(total)}`;
    }

    if (!itemsEl) return;

    if (count === 0) {
      itemsEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (layoutEl) layoutEl.hidden = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (layoutEl) layoutEl.hidden = false;

    itemsEl.innerHTML = cart
      .map((item) => {
        const product = ProductsData.getRawProductById(item.productId);
        const rawImage = item.image || (product && ProductSchema.getPrimaryImageUrl(product)) || '';
        const image = window.ProductImages ? ProductImages.resizeUrl(rawImage, 240) : rawImage;
        const unit = product ? product.price : item.price;
        const lineTotal = unit * item.quantity;

        return `
      <li class="cart-item" data-product-id="${esc(item.productId)}" data-size="${esc(item.size)}" data-color="${esc(item.color)}">
        <a href="product-detail.html?id=${encodeURIComponent(item.productId)}" class="cart-item__media">
          <img src="${esc(image)}" alt="${esc(item.name || product?.name || 'Cart item')}" loading="lazy" decoding="async" width="120" height="150">
        </a>
        <div class="cart-item__body">
          <a href="product-detail.html?id=${encodeURIComponent(item.productId)}" class="cart-item__name">${esc(item.name)}</a>
          <p class="cart-item__meta">${esc(item.color)} · Size ${esc(item.size)}</p>
          <p class="cart-item__unit">${money(unit)} each</p>
          ${stockNote(product)}
          <div class="cart-item__actions">
            <div class="cart-item__qty" role="group" aria-label="Quantity for ${esc(item.name)}">
              <button type="button" class="cart-item__qty-btn" data-action="decrease" aria-label="Decrease quantity">−</button>
              <span class="cart-item__qty-value">${item.quantity}</span>
              <button type="button" class="cart-item__qty-btn" data-action="increase" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-action="remove">Remove</button>
          </div>
        </div>
        <p class="cart-item__price">${money(lineTotal)}</p>
      </li>
    `;
      })
      .join('');

    itemsEl.querySelectorAll('.cart-item').forEach((row) => {
      const productId = row.dataset.productId;
      const size = row.dataset.size;
      const color = row.dataset.color;

      row.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          const current = CartEngine.getCart().find(
            (i) =>
              i.productId === productId &&
              String(i.size) === String(size) &&
              i.color === color
          );
          if (!current) return;

          try {
            if (action === 'remove') {
              CartEngine.removeFromCart(productId, size, color);
            } else if (action === 'increase') {
              CartEngine.updateQuantity(productId, size, color, current.quantity + 1);
            } else if (action === 'decrease') {
              CartEngine.updateQuantity(productId, size, color, current.quantity - 1);
            }
          } catch (_) {
            if (window.showCartToast) showCartToast('Could not update bag.');
          }
        });
      });
    });

    renderSummaryPanel();
  }

  render();

  const checkoutBtn = document.querySelector('.cart-footer__checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (CartEngine.getCartCount() === 0) return;
      window.location.href = 'checkout.html';
    });
  }

  window.addEventListener('nikeCartUpdated', render);
})();
