/**
 * Nike Commercial — Global sliding cart drawer
 */
(function () {
  'use strict';

  if (!window.CartEngine) return;

  let drawer;
  let backdrop;
  let panel;
  let itemsEl;
  let emptyEl;
  let footerEl;
  let totalEl;
  let isOpen = false;
  let lastFocus = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(amount) {
    return `$${amount}`;
  }

  function injectDrawer() {
    if (document.getElementById('cart-drawer')) return;

    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div class="cart-drawer" id="cart-drawer" aria-hidden="true">
        <div class="cart-drawer__backdrop" id="cart-drawer-backdrop"></div>
        <aside
          class="cart-drawer__panel"
          id="cart-drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping bag"
        >
          <header class="cart-drawer__header">
            <h2 class="cart-drawer__title">Bag</h2>
            <button type="button" class="cart-drawer__close" id="cart-drawer-close" aria-label="Close bag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </header>
          <div class="cart-drawer__body">
            <div class="cart-drawer__empty" id="cart-drawer-empty" hidden>
              <p>Your bag is empty.</p>
              <a href="shop.html" class="btn btn--pill btn--outline">Continue Shopping</a>
            </div>
            <ul class="cart-drawer__items" id="cart-drawer-items" aria-label="Bag items"></ul>
          </div>
          <footer class="cart-drawer__footer" id="cart-drawer-footer" hidden>
            <div class="cart-drawer__total">
              <span>Total</span>
              <span id="cart-drawer-total">$0</span>
            </div>
            <a href="cart.html" class="btn btn--pill cart-drawer__checkout">View Full Bag</a>
          </footer>
        </aside>
      </div>
    `
    );

    drawer = document.getElementById('cart-drawer');
    backdrop = document.getElementById('cart-drawer-backdrop');
    panel = document.getElementById('cart-drawer-panel');
    itemsEl = document.getElementById('cart-drawer-items');
    emptyEl = document.getElementById('cart-drawer-empty');
    footerEl = document.getElementById('cart-drawer-footer');
    totalEl = document.getElementById('cart-drawer-total');

    document.getElementById('cart-drawer-close')?.addEventListener('click', closeDrawer);
    backdrop?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    });
  }

  function renderDrawer(detail) {
    if (!itemsEl) return;

    const cart = detail?.cart || CartEngine.getCart();
    const count = detail?.count ?? CartEngine.getCartCount();
    const total = detail?.total ?? CartEngine.getCartTotal();

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
        const product = window.ProductsData?.getProductById(item.productId);
        const image = item.image || (product && product.images[0]) || '';
        const unitPrice = product ? product.price : item.price;
        const lineTotal = unitPrice * item.quantity;

        return `
          <li
            class="cart-drawer__item"
            data-product-id="${escapeHtml(item.productId)}"
            data-size="${escapeHtml(item.size)}"
            data-color="${escapeHtml(item.color)}"
          >
            <a href="product-detail.html?id=${encodeURIComponent(item.productId)}" class="cart-drawer__item-media">
              <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async" width="88" height="110">
            </a>
            <div class="cart-drawer__item-body">
              <a href="product-detail.html?id=${encodeURIComponent(item.productId)}" class="cart-drawer__item-name">${escapeHtml(item.name)}</a>
              <p class="cart-drawer__item-meta">${escapeHtml(item.color)} · Size ${escapeHtml(item.size)}</p>
              <div class="cart-drawer__item-row">
                <span class="cart-drawer__item-qty">Qty ${item.quantity}</span>
                <span class="cart-drawer__item-price">${formatPrice(lineTotal)}</span>
              </div>
              <button type="button" class="cart-drawer__item-remove" data-action="remove">Remove</button>
            </div>
          </li>
        `;
      })
      .join('');

    itemsEl.querySelectorAll('.cart-drawer__item').forEach((row) => {
      const productId = row.dataset.productId;
      const size = row.dataset.size;
      const color = row.dataset.color;

      row.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
        try {
          CartEngine.removeFromCart(productId, size, color);
        } catch (err) {
          console.error(err);
        }
      });
    });
  }

  function openDrawer() {
    if (!drawer || !panel) return;

    if (isOpen) {
      renderDrawer();
      return;
    }

    isOpen = true;
    lastFocus = document.activeElement;
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-cart-drawer-open');
    renderDrawer();

    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf([backdrop, panel]);
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(panel, { xPercent: 100 });
      gsap.to(backdrop, { opacity: 1, duration: 0.42, ease: 'power2.out' });
      gsap.to(panel, { xPercent: 0, duration: 0.58, ease: 'power3.out' });
    } else {
      drawer.classList.add('is-open');
    }

    panel.querySelector('#cart-drawer-close')?.focus();
  }

  function closeDrawer() {
    if (!drawer || !panel || !isOpen) return;

    const finish = () => {
      isOpen = false;
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-cart-drawer-open');
      drawer.classList.remove('is-open');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    };

    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf([backdrop, panel]);
      gsap.to(backdrop, { opacity: 0, duration: 0.32, ease: 'power2.in' });
      gsap.to(panel, {
        xPercent: 100,
        duration: 0.45,
        ease: 'power3.in',
        onComplete: finish,
      });
    } else {
      finish();
    }
  }

  function bindCartTrigger() {
    const trigger = document.getElementById('cart-badge');
    if (!trigger || trigger.dataset.drawerBound) return;

    trigger.dataset.drawerBound = 'true';
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  injectDrawer();
  bindCartTrigger();
  renderDrawer();

  window.openCartDrawer = openDrawer;
  window.closeCartDrawer = closeDrawer;

  window.addEventListener('nikeCartUpdated', (e) => {
    renderDrawer(e.detail);
  });
})();
