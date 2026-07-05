/**
 * ARCHIVE — Quick View modal for shop/catalog cards
 */
(function () {
  'use strict';

  if (!window.ProductsData || !window.CartEngine) return;

  let modalEl = null;
  let activeProduct = null;
  let selectedSize = '';
  let selectedColor = '';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureModal() {
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.className = 'quick-view';
    modalEl.id = 'quick-view';
    modalEl.hidden = true;
    modalEl.innerHTML = `
      <div class="quick-view__backdrop" data-quick-view-close tabindex="-1"></div>
      <div class="quick-view__dialog" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <button type="button" class="quick-view__close" data-quick-view-close aria-label="Close quick view">&times;</button>
        <div class="quick-view__media" id="quick-view-media"></div>
        <div class="quick-view__body">
          <p class="quick-view__category" id="quick-view-category"></p>
          <h2 class="quick-view__title" id="quick-view-title"></h2>
          <p class="quick-view__price" id="quick-view-price"></p>
          <p class="quick-view__desc" id="quick-view-desc"></p>
          <div class="size-selector">
            <span class="size-selector__label">Select Size</span>
            <div class="size-selector__grid" id="quick-view-sizes" role="group"></div>
          </div>
          <div class="quick-view__actions">
            <button type="button" class="btn btn--pill" id="quick-view-add">Add to Bag</button>
            <a class="btn btn--pill btn--outline" id="quick-view-pdp" href="#">View Details</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.querySelectorAll('[data-quick-view-close]').forEach((el) => {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl && !modalEl.hidden) close();
    });

    const addBtn = document.getElementById('quick-view-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!activeProduct) return;
        try {
          CartEngine.addToCart(activeProduct.id, selectedSize, selectedColor, 1);
          if (window.openCartDrawer) window.openCartDrawer();
          close();
        } catch (_) {
          if (window.showCartToast) showCartToast('Please select a valid size');
        }
      });
    }

    return modalEl;
  }

  function renderSizes(product) {
    const grid = document.getElementById('quick-view-sizes');
    if (!grid) return;

    const raw = ProductsData.getRawProductById(product.id) || product;
    const firstInStock = raw.sizes?.find((s) => s.inStock)?.value || raw.sizeValues?.[0] || raw.sizes?.[0]?.value;
    selectedSize = String(firstInStock || product.sizes[0] || '');
    selectedColor = raw.colors?.[0]?.name || product.colors[0] || '';

    const sizes = raw.sizes || product.sizes.map((v) => ({ value: String(v), inStock: true }));

    grid.innerHTML = sizes
      .map((size) => {
        const val = size.value ?? size;
        const unavailable = size.inStock === false && raw.inventoryStatus !== 'backorder';
        return `
        <button type="button" class="size-selector__btn${String(val) === selectedSize ? ' is-selected' : ''}${unavailable ? ' is-unavailable' : ''}" data-size="${escapeHtml(String(val))}" ${unavailable ? 'disabled' : ''}>${escapeHtml(String(val))}</button>
      `;
      })
      .join('');

    grid.querySelectorAll('.size-selector__btn:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.size-selector__btn').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selectedSize = btn.dataset.size;
      });
    });
  }

  function open(productId) {
    const product = ProductsData.getProductById(productId);
    const raw = ProductsData.getRawProductById(productId);
    if (!product || !raw) return;

    activeProduct = product;
    ensureModal();

    const media = document.getElementById('quick-view-media');
    const category = document.getElementById('quick-view-category');
    const title = document.getElementById('quick-view-title');
    const price = document.getElementById('quick-view-price');
    const desc = document.getElementById('quick-view-desc');
    const pdp = document.getElementById('quick-view-pdp');

    if (media) {
      const img = raw.images?.[0];
      media.innerHTML =
        img && window.ProductImages
          ? ProductImages.renderPicture(img, {
              widths: ProductImages.CARD_WIDTHS,
              eager: true,
              className: 'quick-view__picture',
            })
          : `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" width="800" height="1000">`;
    }
    if (category) category.textContent = `${product.category} · ${product.subcategory}`;
    if (title) title.textContent = product.name;
    if (price) {
      price.innerHTML = window.ProductCard ? ProductCard.formatPriceHtml(raw) : `$${product.price}`;
    }
    if (desc) desc.textContent = product.description;
    if (pdp) pdp.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;

    renderSizes(product);

    modalEl.hidden = false;
    document.body.classList.add('is-quick-view-open');
    modalEl.querySelector('.quick-view__close')?.focus();
  }

  function close() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.classList.remove('is-quick-view-open');
    activeProduct = null;
  }

  function enhanceCard(card) {
    if (card.dataset.quickViewBound) return;
    card.dataset.quickViewBound = 'true';

    const productId = card.dataset.productId;
    if (!productId) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shop-card__quick-view';
    btn.textContent = 'Quick View';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      open(productId);
    });

    card.addEventListener('click', (e) => {
      if (e.target.closest('.shop-card__quick-view')) {
        e.preventDefault();
      }
    });

    card.style.position = 'relative';
    card.appendChild(btn);
  }

  function bindGrid(grid) {
    if (!grid) return;
    grid.querySelectorAll('.shop-card[data-product-id]').forEach(enhanceCard);
    grid.querySelectorAll('.shop-card:not([data-product-id])').forEach((card) => {
      const href = card.getAttribute('href') || '';
      const match = href.match(/[?&]id=([^&]+)/);
      if (match) {
        card.dataset.productId = decodeURIComponent(match[1]);
        enhanceCard(card);
      }
    });
  }

  function init() {
    bindGrid(document.getElementById('shop-grid'));
    bindGrid(document.getElementById('catalog-grid'));
    bindGrid(document.getElementById('collection-grid'));

    const observer = new MutationObserver(() => {
      bindGrid(document.getElementById('shop-grid'));
      bindGrid(document.getElementById('catalog-grid'));
      bindGrid(document.getElementById('collection-grid'));
    });

    ['shop-grid', 'catalog-grid', 'collection-grid'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { childList: true });
    });
  }

  window.openQuickView = open;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
