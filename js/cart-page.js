/**
 * Nike Commercial — Bag page renderer
 */
(function () {
  'use strict';

  if (!window.CartEngine || !window.ProductsData) return;

  const itemsEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');
  const totalEl = document.getElementById('cart-total');
  const summaryEl = document.getElementById('cart-summary');

  function formatPrice(amount) {
    return `$${amount}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    const cart = CartEngine.getCart();
    const count = CartEngine.getCartCount();
    const total = CartEngine.getCartTotal();

    if (summaryEl) {
      summaryEl.textContent =
        count === 0
          ? 'Your bag is empty.'
          : `${count} item${count === 1 ? '' : 's'} · ${formatPrice(total)}`;
    }

    if (!itemsEl) return;

    if (count === 0) {
      itemsEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (footerEl) footerEl.hidden = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (footerEl) footerEl.hidden = false;
    if (totalEl) totalEl.textContent = formatPrice(total);

    itemsEl.innerHTML = cart
      .map((item) => {
        const product = ProductsData.getProductById(item.productId);
        const image = item.image || (product && product.images[0]) || '';
        const lineTotal = (product ? product.price : item.price) * item.quantity;

        return `
      <li class="cart-item" data-product-id="${escapeHtml(item.productId)}" data-size="${escapeHtml(item.size)}" data-color="${escapeHtml(item.color)}">
        <a href="product-detail.html?id=${encodeURIComponent(item.productId)}" class="cart-item__media">
          <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" width="120" height="150">
        </a>
        <div class="cart-item__body">
          <a href="product-detail.html?id=${encodeURIComponent(item.productId)}" class="cart-item__name">${escapeHtml(item.name)}</a>
          <p class="cart-item__meta">${escapeHtml(item.color)} · Size ${escapeHtml(item.size)}</p>
          <p class="cart-item__price">${formatPrice(lineTotal)}</p>
          <div class="cart-item__actions">
            <div class="cart-item__qty" role="group" aria-label="Quantity">
              <button type="button" class="cart-item__qty-btn" data-action="decrease" aria-label="Decrease quantity">−</button>
              <span class="cart-item__qty-value">${item.quantity}</span>
              <button type="button" class="cart-item__qty-btn" data-action="increase" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-action="remove">Remove</button>
          </div>
        </div>
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
          } catch (err) {
            console.error(err);
          }
        });
      });
    });
  }

  render();

  window.addEventListener('nikeCartUpdated', render);
})();
