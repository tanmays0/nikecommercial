/**
 * Nike Commercial — Shop page renderer (ProductsData → grid)
 */
(function () {
  'use strict';

  const grid = document.getElementById('shop-grid');
  const categoriesEl = document.getElementById('shop-categories');
  const resultCount = document.getElementById('shop-result-count');

  if (!grid || !window.ProductsData) return;

  const { PRODUCTS, CATEGORIES } = window.ProductsData;

  const params = new URLSearchParams(window.location.search);
  let activeCategory = params.get('category') || 'all';

  const CATEGORY_LABELS = {
    all: 'All',
    men: 'Men',
    women: 'Women',
    kids: 'Kids',
    accessories: 'Accessories',
  };

  function formatCategory(cat) {
    return CATEGORY_LABELS[cat] || cat;
  }

  function formatPrice(price) {
    return `$${price}`;
  }

  function getFilteredProducts() {
    if (activeCategory === 'all') return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === activeCategory);
  }

  function renderCategories() {
    if (!categoriesEl) return;

    const items = ['all', ...CATEGORIES];

    categoriesEl.innerHTML = items
      .map(
        (cat) => `
        <button
          type="button"
          class="shop-categories__btn${cat === activeCategory ? ' is-active' : ''}"
          data-category="${cat}"
        >${formatCategory(cat)}</button>
      `
      )
      .join('');

    categoriesEl.querySelectorAll('.shop-categories__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.category;
        const url = new URL(window.location.href);
        if (activeCategory === 'all') {
          url.searchParams.delete('category');
        } else {
          url.searchParams.set('category', activeCategory);
        }
        window.history.replaceState({}, '', url);
        renderCategories();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const products = getFilteredProducts();

    if (resultCount) {
      resultCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;
    }

    grid.innerHTML = products
      .map(
        (p) => `
      <a href="product-detail.html?id=${encodeURIComponent(p.id)}" class="shop-card" role="listitem" aria-label="${p.name}, ${formatPrice(p.price)}">
        <div class="shop-card__media">
          <img src="${p.images[0]}" alt="" loading="lazy" decoding="async" width="600" height="750">
        </div>
        <h2 class="shop-card__title">${p.name.replace(/^Nike /, '')}</h2>
        <div class="shop-card__meta">
          <span class="shop-card__price">${formatPrice(p.price)}</span>
          <span class="shop-card__tag">${formatCategory(p.category)}</span>
        </div>
      </a>
    `
      )
      .join('');

    if (window.initShopCardHovers) {
      window.initShopCardHovers();
    }
  }

  renderCategories();
  renderGrid();
})();
