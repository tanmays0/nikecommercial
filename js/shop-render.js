/**
 * ARCHIVE — Shop page renderer (ProductsData → grid)
 */
(function () {
  'use strict';

  const grid = document.getElementById('shop-grid');
  const categoriesEl = document.getElementById('shop-categories');
  const resultCount = document.getElementById('shop-result-count');

  if (!grid || !window.ProductsData || !window.ProductCard) return;

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

  function categoryMatches(product, cat) {
    if (cat === 'all') return true;
    return String(product.category).toLowerCase() === cat.toLowerCase();
  }

  function getFilteredProducts() {
    if (activeCategory === 'all') return PRODUCTS;
    return PRODUCTS.filter((p) => categoryMatches(p, activeCategory));
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
      .map((p) => ProductCard.buildShopCard(p, { tag: formatCategory(p.category) }))
      .join('');

    if (window.initShopCardHovers) {
      window.initShopCardHovers();
    }
  }

  renderCategories();
  renderGrid();
})();
