/**
 * ARCHIVE — Shared product card / price markup
 */
(function () {
  'use strict';

  if (!window.ProductSchema) return;

  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));

  function resolveRaw(product) {
    if (!product) return null;
    if (product.images?.[0] && typeof product.images[0] === 'object' && product.images[0].url) {
      return product;
    }
    return window.ProductsData?.getRawProductById(product.id) || product;
  }

  function formatPriceHtml(product) {
    const raw = resolveRaw(product);
    if (!raw) return '';
    const { price, compareAtPrice, currency } = raw;
    if (ProductSchema.isOnSale(raw)) {
      return `<span class="price-sale">${ProductSchema.formatPrice(price, currency)}</span> <span class="price-was">${ProductSchema.formatPrice(compareAtPrice, currency)}</span>`;
    }
    return ProductSchema.formatPrice(price, currency);
  }

  function inventoryBadgeHtml(product) {
    const raw = resolveRaw(product);
    if (!raw || raw.inventoryStatus === 'in_stock') return '';
    const label = ProductSchema.INVENTORY_LABEL[raw.inventoryStatus] || raw.inventoryStatus;
    const mod = raw.inventoryStatus.replace(/_/g, '-');
    return `<span class="ds-badge ds-badge--inventory ds-badge--${mod}">${esc(label)}</span>`;
  }

  function productBadgesHtml(product) {
    const raw = resolveRaw(product);
    if (!raw) return '';
    const badges = [];
    if (raw.authenticated) badges.push('<span class="ds-badge ds-badge--verified"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Authenticated</span>');
    if (raw.isNew) badges.push('<span class="ds-badge ds-badge--new">New In</span>');
    if (ProductSchema.isOnSale(raw)) badges.push('<span class="ds-badge ds-badge--sale">Sale</span>');
    if (raw.isBestSeller) badges.push('<span class="ds-badge ds-badge--bestseller">Most Wanted</span>');
    const inv = inventoryBadgeHtml(raw);
    if (inv) badges.push(inv);
    if (!badges.length) return '';
    return `<div class="shop-card__badges">${badges.join('')}</div>`;
  }

  function fallbackMedia(product) {
    const primary = product.images?.[0] || '';
    const secondary = product.images?.[1] || primary;
    const name = esc(product.name);
    return `
      <div class="shop-card__media shop-card__media--dual">
        <img class="shop-card__img shop-card__img--primary" src="${esc(primary)}" alt="${name}" loading="lazy" decoding="async" width="800" height="1000">
        <img class="shop-card__img shop-card__img--hover" src="${esc(secondary)}" alt="${name} — alternate view" loading="lazy" decoding="async" width="800" height="1000">
      </div>
    `;
  }

  /**
   * @param {import('./product-schema').Product} product
   * @param {{ tag?: string, className?: string, showBadges?: boolean }} [opts]
   */
  function buildShopCard(product, opts = {}) {
    const raw = resolveRaw(product);
    if (!raw) return '';

    const { tag = raw.subcategory || '', className = '', showBadges = true } = opts;
    const mediaHtml = window.ProductImages?.renderCardMedia(raw, {
      widths: ProductImages.CARD_WIDTHS,
    }) || fallbackMedia(product);

    const wished = window.WishlistEngine ? WishlistEngine.isWishlisted(raw.id) : false;
    const brand = raw.brand || '';
    const title = brand && raw.name.startsWith(brand + ' ') ? raw.name.slice(brand.length + 1) : raw.name;
    const metaBits = [];
    if (raw.condition) metaBits.push(esc(raw.condition));
    if (raw.era) metaBits.push(esc(raw.era));
    const conditionLine = metaBits.length ? `<span class="shop-card__condition">${metaBits.join(' \u00b7 ')}</span>` : '';

    return `
      <a
        href="product-detail.html?id=${encodeURIComponent(raw.id)}"
        class="shop-card ${className}"
        role="listitem"
        aria-label="${esc(raw.name)}, ${ProductSchema.formatPrice(raw.price, raw.currency)}"
        data-product-id="${esc(raw.id)}"
      >
        ${showBadges ? productBadgesHtml(raw) : ''}
        <button
          type="button"
          class="shop-card__wishlist${wished ? ' is-wishlisted' : ''}"
          data-wishlist-toggle="${esc(raw.id)}"
          aria-pressed="${wished ? 'true' : 'false'}"
          aria-label="${wished ? 'Remove from wishlist' : 'Add to wishlist'}"
          title="${wished ? 'Remove from wishlist' : 'Add to wishlist'}"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
        ${mediaHtml}
        ${brand ? `<p class="shop-card__brand">${esc(brand)}</p>` : ''}
        <h2 class="shop-card__title">${esc(title)}</h2>
        <div class="shop-card__meta">
          <span class="shop-card__price">${formatPriceHtml(raw)}</span>
          ${conditionLine}
        </div>
      </a>
    `;
  }

  function buildSearchResult(product) {
    const raw = resolveRaw(product);
    if (!raw) return '';

    const thumb = raw.images?.[0];
    const thumbHtml = thumb && window.ProductImages
      ? ProductImages.renderThumbnail(thumb)
      : `<img src="${esc(product.images?.[0] || '')}" alt="${esc(raw.name)}" loading="lazy" width="80" height="100">`;

    return `
      <a href="product-detail.html?id=${encodeURIComponent(raw.id)}" class="search-result">
        <div class="search-result__thumb">${thumbHtml}</div>
        <div class="search-result__body">
          <span class="search-result__name">${esc(raw.name)}</span>
          <span class="search-result__meta">${esc(raw.category)} · ${formatPriceHtml(raw)}</span>
        </div>
      </a>
    `;
  }

  window.ProductCard = Object.freeze({
    escapeHtml: esc,
    resolveRaw,
    formatPriceHtml,
    inventoryBadgeHtml,
    productBadgesHtml,
    buildShopCard,
    buildSearchResult,
  });

  // Global delegation for wishlist toggle buttons on any product card.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn || !window.WishlistEngine) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.getAttribute('data-wishlist-toggle');
    const list = WishlistEngine.toggleWishlist(id);
    const active = list.includes(id);
    btn.classList.toggle('is-wishlisted', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
    if (window.MotionFX) MotionFX.pop(btn);
    if (window.showCartToast) {
      showCartToast(active ? 'Saved to wishlist' : 'Removed from wishlist');
    }
  });
})();
