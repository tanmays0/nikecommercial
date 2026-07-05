/**
 * ARCHIVE — Category shop renderer with filtering, sorting & URL state.
 * Powers shop-men, shop-women, shop-kids, and shop-accessories pages.
 * Filters combine with AND logic and are reflected in the URL (shareable).
 */
(function () {
  'use strict';

  const grid = document.getElementById('shop-grid');
  const filtersEl = document.getElementById('shop-filters');
  const resultCount = document.getElementById('shop-result-count');
  const emptyState = document.getElementById('shop-empty');

  if (!grid || !window.ProductsData || !window.ProductCard) return;

  const SUBCATEGORY_LABELS = { shoes: 'Shoes', apparel: 'Apparel', gear: 'Gear' };

  const PRICE_RANGES = [
    { id: 'all', label: 'All Prices', min: 0, max: Infinity },
    { id: 'under-75', label: 'Under $75', min: 0, max: 74.99 },
    { id: '75-150', label: '$75 – $150', min: 75, max: 150 },
    { id: 'over-150', label: 'Over $150', min: 150.01, max: Infinity },
  ];

  const SORTS = [
    { id: 'featured', label: 'Featured' },
    { id: 'newest', label: 'Newest' },
    { id: 'price-asc', label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' },
    { id: 'rating', label: 'Top Rated' },
    { id: 'best-selling', label: 'Best Selling' },
  ];

  const CATEGORY_COPY = {
    men: { title: "Men's", lead: 'Performance shoes and everyday essentials engineered for the way you move.' },
    women: { title: "Women's", lead: 'From heritage Air Max icons to studio-ready apparel — built for her pace.' },
    kids: { title: "Kids'", lead: 'Playground-proof shoes and easy layers sized for growing athletes.' },
    accessories: { title: 'Accessories', lead: 'Bags, caps, and training gear that finish every fit.' },
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
  const allProducts = ProductsData.getProductsByCategory(category).map((p) =>
    ProductsData.getRawProductById(p.id)
  );

  const subcategories = [...new Set(allProducts.map((p) => p.subcategory))].sort();
  const allSizes = [...new Set(allProducts.flatMap((p) => p.sizeValues))].sort(sizeSort);
  const allColors = [...new Set(allProducts.flatMap((p) => p.colorNames))].sort();

  function sizeSort(a, b) {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  }

  function colorHex(name) {
    for (const p of allProducts) {
      const c = p.colors.find((col) => col.name === name);
      if (c) return c.hex;
    }
    return '#ccc';
  }

  /* ---------- URL state ---------- */
  function readState() {
    const params = new URLSearchParams(window.location.search);
    const csv = (key) => (params.get(key) ? params.get(key).split(',').filter(Boolean) : []);
    return {
      subcategories: new Set(csv('sub').length ? csv('sub') : subcategories),
      sizes: new Set(csv('size')),
      colors: new Set(csv('color')),
      priceRange: params.get('price') || 'all',
      saleOnly: params.get('sale') === '1',
      inStockOnly: params.get('stock') === '1',
      sort: params.get('sort') || 'featured',
    };
  }

  function writeState() {
    const params = new URLSearchParams();
    if (state.subcategories.size && state.subcategories.size !== subcategories.length) {
      params.set('sub', [...state.subcategories].join(','));
    }
    if (state.sizes.size) params.set('size', [...state.sizes].join(','));
    if (state.colors.size) params.set('color', [...state.colors].join(','));
    if (state.priceRange !== 'all') params.set('price', state.priceRange);
    if (state.saleOnly) params.set('sale', '1');
    if (state.inStockOnly) params.set('stock', '1');
    if (state.sort !== 'featured') params.set('sort', state.sort);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, '', url);
  }

  const state = readState();

  /* ---------- filtering + sorting ---------- */
  function applyFilters(products) {
    let list = products.filter((p) => state.subcategories.has(p.subcategory));

    if (state.sizes.size) {
      list = list.filter((p) => p.sizeValues.some((s) => state.sizes.has(s)));
    }
    if (state.colors.size) {
      list = list.filter((p) => p.colorNames.some((c) => state.colors.has(c)));
    }
    const range = PRICE_RANGES.find((r) => r.id === state.priceRange) || PRICE_RANGES[0];
    list = list.filter((p) => p.price >= range.min && p.price <= range.max);

    if (state.saleOnly) list = list.filter((p) => ProductSchema.isOnSale(p));
    if (state.inStockOnly) list = list.filter((p) => p.inventoryStatus !== 'out_of_stock');

    return sortList(list);
  }

  function sortList(list) {
    const copy = [...list];
    switch (state.sort) {
      case 'price-asc':
        return copy.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return copy.sort((a, b) => b.price - a.price);
      case 'newest':
        return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'rating':
        return copy.sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count);
      case 'best-selling':
        return copy.sort(
          (a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.rating.count - a.rating.count
        );
      case 'featured':
      default:
        return copy.sort(
          (a, b) =>
            Number(b.isBestSeller) - Number(a.isBestSeller) ||
            Number(b.isNew) - Number(a.isNew) ||
            b.rating.average - a.rating.average
        );
    }
  }

  /* ---------- rendering ---------- */
  function renderGrid() {
    const products = applyFilters(allProducts);
    writeState();

    if (resultCount) {
      resultCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;
    }
    if (emptyState) emptyState.hidden = products.length > 0;

    if (products.length === 0) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = window.MockService ? MockService.loadingHtml('Loading products…', 6) : '';

    const fetcher = () =>
      window.MockService ? MockService.request(() => products, { min: 160, max: 420 }) : Promise.resolve(products);

    fetcher()
      .then((items) => {
        grid.innerHTML = items
          .map((p) => ProductCard.buildShopCard(p, { tag: SUBCATEGORY_LABELS[p.subcategory] || p.subcategory }))
          .join('');
        if (window.initShopCardHovers) initShopCardHovers();
      })
      .catch((err) => {
        grid.innerHTML = MockService.errorHtml(err.message);
        const retry = grid.querySelector('[data-mock-retry]');
        if (retry) retry.addEventListener('click', renderGrid);
      });
  }

  function checkboxGroup(title, name, options, selectedSet) {
    const opts = options
      .map(
        (o) => `
        <label class="shop-filters__option">
          <input type="checkbox" name="${name}" value="${escapeAttr(o.value)}" data-filter="${name}" ${
          selectedSet.has(o.value) ? 'checked' : ''
        }>
          ${o.swatch ? `<span class="filter-swatch" style="background:${o.swatch}"></span>` : ''}
          ${esc(o.label)}
        </label>`
      )
      .join('');
    return `
      <div class="shop-filters__group">
        <h2 class="shop-filters__group-title">${title}</h2>
        <div class="shop-filters__options">${opts}</div>
      </div>
    `;
  }

  function buildFilters() {
    if (!filtersEl) return;

    const priceMarkup = PRICE_RANGES.map(
      (range) => `
        <label class="shop-filters__option">
          <input type="radio" name="price-range" value="${range.id}" data-filter="price" ${
        state.priceRange === range.id ? 'checked' : ''
      }>
          ${esc(range.label)}
        </label>`
    ).join('');

    const sortMarkup = SORTS.map(
      (s) => `<option value="${s.id}" ${state.sort === s.id ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    filtersEl.innerHTML = `
      ${checkboxGroup(
        'Category',
        'subcategory',
        subcategories.map((s) => ({ value: s, label: SUBCATEGORY_LABELS[s] || s })),
        state.subcategories
      )}
      ${checkboxGroup('Size', 'size', allSizes.map((s) => ({ value: s, label: s })), state.sizes)}
      ${checkboxGroup(
        'Color',
        'color',
        allColors.map((c) => ({ value: c, label: c, swatch: colorHex(c) })),
        state.colors
      )}
      <div class="shop-filters__group">
        <h2 class="shop-filters__group-title">Price</h2>
        <div class="shop-filters__options">${priceMarkup}</div>
      </div>
      <div class="shop-filters__group">
        <h2 class="shop-filters__group-title">Availability</h2>
        <div class="shop-filters__options">
          <label class="shop-filters__option"><input type="checkbox" data-filter="sale" ${
            state.saleOnly ? 'checked' : ''
          }> On Sale</label>
          <label class="shop-filters__option"><input type="checkbox" data-filter="stock" ${
            state.inStockOnly ? 'checked' : ''
          }> In Stock Only</label>
        </div>
      </div>
      <div class="shop-filters__group">
        <h2 class="shop-filters__group-title">Sort By</h2>
        <select class="shop-filters__select" id="shop-sort" data-filter="sort" aria-label="Sort products">${sortMarkup}</select>
      </div>
      <button type="button" class="btn btn--pill btn--outline shop-filters__clear" id="shop-clear-all">Clear All</button>
    `;

    bindFilterEvents();
  }

  function bindFilterEvents() {
    filtersEl.querySelectorAll('[data-filter="subcategory"]').forEach((input) => {
      input.addEventListener('change', () => {
        const checked = [...filtersEl.querySelectorAll('[data-filter="subcategory"]:checked')].map((el) => el.value);
        if (checked.length === 0) {
          input.checked = true;
          return;
        }
        state.subcategories = new Set(checked);
        renderGrid();
      });
    });

    const multi = (name, target) => {
      filtersEl.querySelectorAll(`[data-filter="${name}"]`).forEach((input) => {
        input.addEventListener('change', () => {
          const checked = [...filtersEl.querySelectorAll(`[data-filter="${name}"]:checked`)].map((el) => el.value);
          state[target] = new Set(checked);
          renderGrid();
        });
      });
    };
    multi('size', 'sizes');
    multi('color', 'colors');

    filtersEl.querySelectorAll('[data-filter="price"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) {
          state.priceRange = input.value;
          renderGrid();
        }
      });
    });

    const saleInput = filtersEl.querySelector('[data-filter="sale"]');
    if (saleInput) saleInput.addEventListener('change', () => {
      state.saleOnly = saleInput.checked;
      renderGrid();
    });

    const stockInput = filtersEl.querySelector('[data-filter="stock"]');
    if (stockInput) stockInput.addEventListener('change', () => {
      state.inStockOnly = stockInput.checked;
      renderGrid();
    });

    const sortSelect = document.getElementById('shop-sort');
    if (sortSelect) sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      renderGrid();
    });

    const clearBtn = document.getElementById('shop-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', resetFilters);
  }

  function resetFilters() {
    state.subcategories = new Set(subcategories);
    state.sizes = new Set();
    state.colors = new Set();
    state.priceRange = 'all';
    state.saleOnly = false;
    state.inStockOnly = false;
    state.sort = 'featured';
    buildFilters();
    renderGrid();
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
        <a href="${link.href}" class="shop-categories__btn${link.id === category ? ' is-active' : ''}" ${
          link.id === category ? 'aria-current="page"' : ''
        }>${link.label}</a>`
      )
      .join('');
  }

  function initHero() {
    const titleEl = document.getElementById('shop-hero-title');
    const leadEl = document.getElementById('shop-hero-lead');
    if (titleEl) titleEl.textContent = `SHOP ${categoryMeta.title.toUpperCase()}`;
    if (leadEl) leadEl.textContent = categoryMeta.lead;
    document.title = `Shop ${categoryMeta.title} — ARCHIVE`;
    if (window.Seo) {
      Seo.setPageMeta({
        title: `Shop ${categoryMeta.title} — ARCHIVE`,
        description: categoryMeta.lead,
      });
    }
  }

  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));
  function escapeAttr(str) {
    return esc(str).replace(/"/g, '&quot;');
  }

  const resetBtn = document.getElementById('shop-reset-filters');
  if (resetBtn) resetBtn.addEventListener('click', resetFilters);

  const toggle = document.getElementById('shop-filter-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      filtersEl.classList.toggle('is-open', !open);
    });
  }

  initHero();
  initCategoryNav();
  buildFilters();
  renderGrid();
})();

