/**
 * Nike Commercial — Category shop renderer
 * Powers shop-men, shop-women, shop-kids, and shop-accessories pages.
 */
(function () {
  'use strict';

  const grid = document.getElementById('shop-grid');
  const filtersEl = document.getElementById('shop-filters');
  const resultCount = document.getElementById('shop-result-count');
  const emptyState = document.getElementById('shop-empty');

  if (!grid || !window.ProductsData) return;

  const SUBCATEGORY_LABELS = {
    shoes: 'Shoes',
    apparel: 'Apparel',
    gear: 'Gear',
  };

  const PRICE_RANGES = [
    { id: 'all', label: 'All Prices', min: 0, max: Infinity },
    { id: 'under-75', label: 'Under $75', min: 0, max: 74.99 },
    { id: '75-150', label: '$75 – $150', min: 75, max: 150 },
    { id: 'over-150', label: 'Over $150', min: 150.01, max: Infinity },
  ];

  const CATEGORY_COPY = {
    men: {
      title: "Men's",
      lead: 'Performance shoes and everyday essentials engineered for the way you move.',
    },
    women: {
      title: "Women's",
      lead: 'From heritage Air Max icons to studio-ready apparel — built for her pace.',
    },
    kids: {
      title: "Kids'",
      lead: 'Playground-proof shoes and easy layers sized for growing athletes.',
    },
    accessories: {
      title: 'Accessories',
      lead: 'Bags, caps, and training gear that finish every fit.',
    },
  };

  function detectCategory() {
    const fromAttr = document.body.dataset.shopCategory;
    if (fromAttr) return fromAttr;

    const file = window.location.pathname.split('/').pop() || '';
    const match = file.match(/^shop-([a-z]+)\.html$/);
    return match ? match[1] : 'men';
  }

  const category = detectCategory();
  const categoryMeta = CATEGORY_COPY[category] || CATEGORY_COPY.men;

  const allProducts = window.ProductsData.getProductsByCategory(category);

  const subcategories = [...new Set(allProducts.map((p) => p.subcategory))].sort();

  const state = {
    subcategories: new Set(subcategories),
    priceRange: 'all',
    sort: 'featured',
  };

  function formatPrice(price) {
    return `$${price}`;
  }

  function formatSubcategory(sub) {
    return SUBCATEGORY_LABELS[sub] || sub;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function applyFilters(products) {
    let list = products.filter((p) => state.subcategories.has(p.subcategory));

    const range = PRICE_RANGES.find((r) => r.id === state.priceRange) || PRICE_RANGES[0];
    list = list.filter((p) => p.price >= range.min && p.price <= range.max);

    if (state.sort === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (state.sort === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }

  function buildCard(product) {
    const primary = product.images[0] || '';
    const secondary = product.images[1] || primary;
    const subLabel = formatSubcategory(product.subcategory);

    return `
      <a
        href="product-detail.html?id=${encodeURIComponent(product.id)}"
        class="shop-card"
        role="listitem"
        aria-label="${escapeHtml(product.name)}, ${formatPrice(product.price)}"
        data-product-id="${escapeHtml(product.id)}"
      >
        <div class="shop-card__media shop-card__media--dual">
          <img
            class="shop-card__img shop-card__img--primary"
            src="${escapeHtml(primary)}"
            alt=""
            loading="lazy"
            decoding="async"
            width="600"
            height="750"
          >
          <img
            class="shop-card__img shop-card__img--hover"
            src="${escapeHtml(secondary)}"
            alt=""
            loading="lazy"
            decoding="async"
            width="600"
            height="750"
          >
        </div>
        <h2 class="shop-card__title">${escapeHtml(product.name.replace(/^Nike /, ''))}</h2>
        <div class="shop-card__meta">
          <span class="shop-card__price">${formatPrice(product.price)}</span>
          <span class="shop-card__tag">${escapeHtml(subLabel)}</span>
        </div>
      </a>
    `;
  }

  function renderGrid() {
    const products = applyFilters(allProducts);

    if (resultCount) {
      resultCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;
    }

    if (emptyState) {
      emptyState.hidden = products.length > 0;
    }

    grid.classList.add('is-updating');

    requestAnimationFrame(() => {
      grid.innerHTML = products.map(buildCard).join('');
      grid.classList.remove('is-updating');
    });
  }

  function buildFilters() {
    if (!filtersEl) return;

    const subcategoryMarkup = subcategories
      .map(
        (sub) => `
        <label class="shop-filters__option">
          <input
            type="checkbox"
            name="subcategory"
            value="${escapeHtml(sub)}"
            checked
            data-filter="subcategory"
          >
          ${escapeHtml(formatSubcategory(sub))}
        </label>
      `
      )
      .join('');

    const priceMarkup = PRICE_RANGES.map(
      (range, i) => `
        <label class="shop-filters__option">
          <input
            type="radio"
            name="price-range"
            value="${range.id}"
            ${i === 0 ? 'checked' : ''}
            data-filter="price"
          >
          ${escapeHtml(range.label)}
        </label>
      `
    ).join('');

    filtersEl.innerHTML = `
      <div class="shop-filters__group">
        <h2 class="shop-filters__group-title">Category</h2>
        <div class="shop-filters__options" id="filter-subcategory">
          ${subcategoryMarkup}
        </div>
      </div>

      <div class="shop-filters__group">
        <h2 class="shop-filters__group-title">Price</h2>
        <div class="shop-filters__options" id="filter-price">
          ${priceMarkup}
        </div>
      </div>

      <div class="shop-filters__group">
        <h2 class="shop-filters__group-title">Sort By</h2>
        <select class="shop-filters__select" id="shop-sort" data-filter="sort" aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    `;

    filtersEl.querySelectorAll('[data-filter="subcategory"]').forEach((input) => {
      input.addEventListener('change', () => {
        const checked = [...filtersEl.querySelectorAll('[data-filter="subcategory"]:checked')].map(
          (el) => el.value
        );

        if (checked.length === 0) {
          input.checked = true;
          return;
        }

        state.subcategories = new Set(checked);
        renderGrid();
      });
    });

    filtersEl.querySelectorAll('[data-filter="price"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) {
          state.priceRange = input.value;
          renderGrid();
        }
      });
    });

    const sortSelect = document.getElementById('shop-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        renderGrid();
      });
    }
  }

  function initCategoryNav() {
    const nav = document.getElementById('shop-category-nav');
    if (!nav) return;

    const links = [
      { id: 'men', href: 'shop-men.html', label: 'Men' },
      { id: 'women', href: 'shop-women.html', label: 'Women' },
      { id: 'kids', href: 'shop-kids.html', label: 'Kids' },
      { id: 'accessories', href: 'shop-accessories.html', label: 'Accessories' },
    ];

    nav.innerHTML = links
      .map(
        (link) => `
        <a
          href="${link.href}"
          class="shop-categories__btn${link.id === category ? ' is-active' : ''}"
          ${link.id === category ? 'aria-current="page"' : ''}
        >${link.label}</a>
      `
      )
      .join('');
  }

  function initHero() {
    const titleEl = document.getElementById('shop-hero-title');
    const leadEl = document.getElementById('shop-hero-lead');

    if (titleEl) {
      titleEl.textContent = `SHOP ${categoryMeta.title.toUpperCase()}`;
    }

    if (leadEl) {
      leadEl.textContent = categoryMeta.lead;
    }

    document.title = `Shop ${categoryMeta.title} — Nike`;
  }

  function resetFilters() {
    state.subcategories = new Set(subcategories);
    state.priceRange = 'all';
    state.sort = 'featured';

    if (!filtersEl) return;

    filtersEl.querySelectorAll('[data-filter="subcategory"]').forEach((input) => {
      input.checked = true;
    });

    filtersEl.querySelectorAll('[data-filter="price"]').forEach((input) => {
      input.checked = input.value === 'all';
    });

    const sortSelect = document.getElementById('shop-sort');
    if (sortSelect) sortSelect.value = 'featured';

    renderGrid();
  }

  const resetBtn = document.getElementById('shop-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  initHero();
  initCategoryNav();
  buildFilters();
  renderGrid();
})();
