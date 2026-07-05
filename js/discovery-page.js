/**
 * ARCHIVE — Wishlist, recently viewed, and compare page renderers
 * Uses the mock service layer for realistic loading/empty states.
 */
(function () {
  'use strict';

  if (!window.WishlistEngine || !window.ProductsData) return;

  const wishlistGrid = document.getElementById('wishlist-grid');
  const wishlistEmpty = document.getElementById('wishlist-empty');
  const recentGrid = document.getElementById('recent-grid');
  const recentEmpty = document.getElementById('recent-empty');
  const compareGrid = document.getElementById('compare-grid');
  const compareEmpty = document.getElementById('compare-empty');

  function fetchByIds(ids) {
    const producer = () => ids.map((id) => ProductsData.getRawProductById(id)).filter(Boolean);
    return window.MockService ? MockService.request(producer, { min: 200, max: 500 }) : Promise.resolve(producer());
  }

  function cardsHtml(products) {
    return products.map((p) => (window.ProductCard ? ProductCard.buildShopCard(p) : '')).join('');
  }

  function suggestionsHtml() {
    const picks = ProductsData.RAW_PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4);
    if (!picks.length) return '';
    return `
      <div class="discovery-suggestions">
        <h2 class="discovery-suggestions__title">You might like</h2>
        <div class="shop-grid" role="list">${cardsHtml(picks)}</div>
      </div>
    `;
  }

  function renderProductGrid(grid, ids, emptyEl, opts = {}) {
    if (!grid) return;
    grid.innerHTML = window.MockService ? MockService.loadingHtml('Loading…', 4) : '';

    fetchByIds(ids)
      .then((products) => {
        if (products.length === 0) {
          grid.innerHTML = '';
          if (emptyEl) {
            emptyEl.hidden = false;
            if (opts.withSuggestions && !emptyEl.dataset.enhanced) {
              emptyEl.dataset.enhanced = '1';
              emptyEl.insertAdjacentHTML('beforeend', suggestionsHtml());
            }
          }
          return;
        }
        if (emptyEl) emptyEl.hidden = true;
        grid.innerHTML = cardsHtml(products);
      })
      .catch((err) => {
        grid.innerHTML = window.MockService
          ? MockService.errorHtml(err.message)
          : '<p>Failed to load.</p>';
        const retry = grid.querySelector('[data-mock-retry]');
        if (retry) retry.addEventListener('click', () => renderProductGrid(grid, ids, emptyEl, opts));
      });
  }

  function renderCompare() {
    if (!compareGrid) return;

    const params = new URLSearchParams(window.location.search);
    const ids = (params.get('ids') || '').split(',').filter(Boolean).slice(0, 4);

    if (compareEmpty) compareEmpty.hidden = ids.length > 0;
    if (ids.length === 0) {
      compareGrid.innerHTML = '';
      return;
    }

    const products = ids.map((id) => ProductsData.getRawProductById(id)).filter(Boolean);
    const money = (n) => (window.Pricing ? Pricing.format(n) : `$${n}`);

    compareGrid.innerHTML = `
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">Feature</th>
            ${products.map((p) => `<th scope="col"><a href="product-detail.html?id=${p.id}">${p.name}</a></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr><th scope="row">Price</th>${products.map((p) => `<td>${money(p.price)}</td>`).join('')}</tr>
          <tr><th scope="row">Rating</th>${products.map((p) => `<td>${p.rating.average || '—'} (${p.rating.count})</td>`).join('')}</tr>
          <tr><th scope="row">Category</th>${products.map((p) => `<td>${p.category} · ${p.subcategory}</td>`).join('')}</tr>
          <tr><th scope="row">Sizes</th>${products.map((p) => `<td>${p.sizeValues.join(', ')}</td>`).join('')}</tr>
          <tr><th scope="row">Colors</th>${products.map((p) => `<td>${p.colorNames.join(', ')}</td>`).join('')}</tr>
          <tr><th scope="row">Availability</th>${products.map((p) => `<td>${ProductSchema.INVENTORY_LABEL[p.inventoryStatus]}</td>`).join('')}</tr>
        </tbody>
      </table>
    `;
  }

  if (wishlistGrid) {
    renderProductGrid(wishlistGrid, WishlistEngine.getWishlist(), wishlistEmpty, { withSuggestions: true });
    window.addEventListener(WishlistEngine.EVENT_WISHLIST, (e) => {
      renderProductGrid(wishlistGrid, e.detail.wishlist, wishlistEmpty, { withSuggestions: true });
    });
  }

  if (recentGrid) {
    renderProductGrid(recentGrid, WishlistEngine.getRecentlyViewed(), recentEmpty);
  }

  renderCompare();
})();
