/**
 * ARCHIVE — Product detail page (split-screen hydration)
 */
(function () {
  'use strict';

  if (!window.ProductsData || !window.CartEngine || !window.ProductSchema) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const product = productId ? ProductsData.getRawProductById(productId) : null;

  const notFoundEl = document.getElementById('product-not-found');
  const contentEl = document.getElementById('product-detail-content');
  const gallery = document.getElementById('product-gallery');
  const categoryEl = document.getElementById('product-category');
  const titleEl = document.getElementById('product-title');
  const priceEl = document.getElementById('product-price');
  const descEl = document.getElementById('product-desc');
  const inventoryEl = document.getElementById('product-inventory');
  const ratingEl = document.getElementById('product-rating');
  const featuresEl = document.getElementById('product-features');
  const sizeGrid = document.getElementById('size-grid');
  const colorGrid = document.getElementById('color-grid');
  const addBtn = document.getElementById('add-to-bag');
  const wishlistBtn = document.getElementById('wishlist-toggle');
  const compareLink = document.getElementById('compare-link');
  const recommendedSection = document.getElementById('product-recommended');
  const recommendedGrid = document.getElementById('recommended-grid');
  const shippingEl = document.getElementById('product-shipping');
  const returnsEl = document.getElementById('product-returns');
  const specsEl = document.getElementById('product-specs');
  const reviewsEl = document.getElementById('product-reviews');

  const categoryLabel = {
    Men: "Men's",
    Women: "Women's",
    Kids: "Kids'",
    Accessories: 'Accessories',
  };

  const subLabel = {
    shoes: 'Shoes',
    apparel: 'Apparel',
    gear: 'Gear',
  };

  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));

  function showNotFound() {
    if (notFoundEl) notFoundEl.hidden = false;
    if (contentEl) contentEl.hidden = true;
    if (recommendedSection) recommendedSection.hidden = true;
    if (window.Seo) {
      Seo.setPageMeta({
        title: 'Product Not Found — ARCHIVE',
        description: 'The product you requested could not be found.',
      });
    } else {
      document.title = 'Product Not Found — ARCHIVE';
    }
  }

  if (!product) {
    showNotFound();
    return;
  }

  if (notFoundEl) notFoundEl.hidden = true;
  if (contentEl) contentEl.hidden = false;

  document.title = `${product.name} — ARCHIVE`;

  if (window.Seo) {
    Seo.setPageMeta({
      title: `${product.name} — ARCHIVE`,
      description: product.description?.slice(0, 160) || `Shop ${product.name} at ARCHIVE.`,
      image: window.ProductSchema?.getPrimaryImageUrl(product),
      type: 'product',
    });
    Seo.setProductJsonLd(product);
  }

  if (window.WishlistEngine) {
    WishlistEngine.addRecentlyViewed(product.id);
  }

  if (categoryEl) {
    const bits = [];
    if (product.brand) bits.push(product.brand);
    bits.push(categoryLabel[product.category] || product.category);
    bits.push(subLabel[product.subcategory] || product.subcategory);
    if (product.era) bits.push(product.era);
    categoryEl.textContent = bits.join(' · ');
  }

  if (titleEl) titleEl.textContent = product.name;

  if (priceEl && window.ProductCard) {
    priceEl.innerHTML = ProductCard.formatPriceHtml(product);
  }

  if (inventoryEl && window.ProductCard) {
    const badge = ProductCard.inventoryBadgeHtml(product);
    const trust = [];
    if (product.authenticated) {
      trust.push('<span class="ds-badge ds-badge--verified"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Authenticated</span>');
    }
    if (product.condition) {
      trust.push(`<span class="ds-badge ds-badge--muted">${product.condition}</span>`);
    }
    let urgency = '';
    if (product.inventoryStatus === 'out_of_stock') {
      urgency = '<span class="product-detail__urgency product-detail__urgency--out">This piece has sold — but keep an eye out for similar finds.</span>';
    } else {
      urgency = '<span class="product-detail__urgency">One of a kind — a single unit in this size.</span>';
    }
    inventoryEl.innerHTML = trust.join('') + badge + urgency;
    inventoryEl.hidden = false;
  }

  function renderReviews() {
    const stats = window.ReviewsEngine ? ReviewsEngine.getStats(product) : null;
    const reviews = window.ReviewsEngine ? ReviewsEngine.getReviews(product) : product.reviews || [];

    if (ratingEl && stats) {
      const stars = '★'.repeat(Math.round(stats.average)) + '☆'.repeat(5 - Math.round(stats.average));
      ratingEl.innerHTML = `
        <span class="product-detail__rating-stars" aria-hidden="true">${stars}</span>
        <span>${stats.average ? stats.average.toFixed(1) : '—'} (${stats.count} review${stats.count === 1 ? '' : 's'})</span>
      `;
    }

    const summaryEl = document.getElementById('product-review-summary');
    if (summaryEl && stats) {
      const total = stats.count || 1;
      const bars = [5, 4, 3, 2, 1]
        .map((star) => {
          const n = stats.distribution[star] || 0;
          const pct = Math.round((n / total) * 100);
          return `
          <div class="review-dist__row">
            <span class="review-dist__label">${star}★</span>
            <span class="review-dist__bar"><span class="review-dist__fill" style="width:${pct}%"></span></span>
            <span class="review-dist__count">${n}</span>
          </div>`;
        })
        .join('');
      summaryEl.innerHTML = `
        <div class="review-dist">
          <div class="review-dist__score">
            <strong>${stats.average ? stats.average.toFixed(1) : '—'}</strong>
            <span>${stats.count} review${stats.count === 1 ? '' : 's'}</span>
          </div>
          <div class="review-dist__bars">${bars}</div>
        </div>
      `;
    }

    if (reviewsEl) {
      reviewsEl.innerHTML = reviews.length
        ? reviews
            .map(
              (r) => `
        <article class="product-detail__review">
          <div class="product-detail__review-meta">
            <strong>${esc(r.author)}</strong>
            <span aria-label="${r.rating} out of 5">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            <time datetime="${esc(r.date)}">${esc(r.date)}</time>
            ${r.verifiedPurchase ? '<span class="review-verified">Verified Purchase</span>' : ''}
          </div>
          <h3 class="product-detail__review-title">${esc(r.title)}</h3>
          <p>${esc(r.body)}</p>
        </article>`
            )
            .join('')
        : '<p class="product-detail__no-reviews">No reviews yet — be the first to review this product.</p>';
    }
  }

  function initReviewForm() {
    const form = document.getElementById('review-form');
    if (!form || !window.ReviewsEngine) return;

    let selectedRating = 0;
    const starsWrap = document.getElementById('review-stars');
    const messageEl = document.getElementById('review-message');

    starsWrap?.querySelectorAll('[data-star]').forEach((star) => {
      star.addEventListener('click', () => {
        selectedRating = Number(star.dataset.star);
        starsWrap.querySelectorAll('[data-star]').forEach((s) => {
          s.classList.toggle('is-active', Number(s.dataset.star) <= selectedRating);
        });
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const author = form.author.value.trim();
      const title = form.title.value.trim();
      const body = form.body.value.trim();

      if (!selectedRating) return showMessage('Please select a star rating.', true);
      if (!author || !title || !body) return showMessage('Please fill in all fields.', true);

      ReviewsEngine.addReview(product.id, { author, rating: selectedRating, title, body });
      form.reset();
      selectedRating = 0;
      starsWrap?.querySelectorAll('[data-star]').forEach((s) => s.classList.remove('is-active'));
      showMessage('Thank you! Your review has been added.', false);
      renderReviews();
    });

    function showMessage(text, isError) {
      if (!messageEl) return;
      messageEl.textContent = text;
      messageEl.hidden = false;
      messageEl.classList.toggle('form-message--error', isError);
      messageEl.classList.toggle('form-message--success', !isError);
    }
  }

  renderReviews();
  initReviewForm();

  if (descEl) descEl.textContent = product.description;

  if (featuresEl && product.features?.length) {
    featuresEl.innerHTML = product.features.map((f) => `<li>${esc(f)}</li>`).join('');
  }

  if (shippingEl) shippingEl.textContent = product.shippingInfo;
  if (returnsEl) returnsEl.textContent = product.returnPolicy;

  const shippingTab = document.getElementById('product-shipping-tab');
  const returnsTab = document.getElementById('product-returns-tab');
  if (shippingTab) shippingTab.textContent = product.shippingInfo;
  if (returnsTab) returnsTab.textContent = product.returnPolicy;

  if (compareLink) {
    compareLink.href = `compare.html?ids=${encodeURIComponent(product.id)}`;
  }

  if (gallery && window.ProductImages) {
    const images = product.images.length > 0 ? product.images : [];
    gallery.innerHTML = images
      .map(
        (img, i) => `
        <figure class="product-detail__figure">
          ${ProductImages.renderPicture(img, {
            widths: ProductImages.PDP_WIDTHS,
            sizes: '(min-width: 1024px) 50vw, 100vw',
            eager: i === 0,
            className: 'product-detail__picture',
          })}
        </figure>
      `
      )
      .join('');
  }

  const firstInStockSize = product.sizes.find((s) => s.inStock)?.value || product.sizes[0]?.value;
  let selectedSize = String(firstInStockSize || '');
  let selectedColor = product.colors[0]?.name || '';

  function updateGalleryForColor(colorName) {
    if (!gallery || !window.ProductImages) return;
    const color = product.colors.find((c) => c.name === colorName);
    const images = color?.images?.length ? color.images : product.images;
    gallery.innerHTML = images
      .map(
        (img, i) => `
        <figure class="product-detail__figure">
          ${ProductImages.renderPicture(img, {
            widths: ProductImages.PDP_WIDTHS,
            sizes: '(min-width: 1024px) 50vw, 100vw',
            eager: i === 0,
            className: 'product-detail__picture',
          })}
        </figure>
      `
      )
      .join('');
  }

  function syncAddButton() {
    if (!addBtn) return;
    if (product.inventoryStatus === 'out_of_stock') {
      addBtn.disabled = true;
      addBtn.textContent = 'Out of Stock';
      return;
    }
    if (product.inventoryStatus === 'backorder') {
      addBtn.disabled = false;
      addBtn.textContent = 'Pre-Order';
      return;
    }
    addBtn.disabled = false;
    addBtn.textContent = 'Add to Bag';
  }

  if (sizeGrid) {
    sizeGrid.innerHTML = product.sizes
      .map((size) => {
        const unavailable = !size.inStock && product.inventoryStatus !== 'backorder';
        return `
        <button
          type="button"
          class="size-selector__btn${String(size.value) === selectedSize ? ' is-selected' : ''}${unavailable ? ' is-unavailable' : ''}"
          data-size="${esc(size.value)}"
          aria-pressed="${String(size.value) === selectedSize ? 'true' : 'false'}"
          ${unavailable ? 'disabled aria-disabled="true"' : ''}
        >${esc(size.value)}</button>
      `;
      })
      .join('');

    sizeGrid.querySelectorAll('.size-selector__btn:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        sizeGrid.querySelectorAll('.size-selector__btn').forEach((b) => {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        selectedSize = btn.dataset.size;
      });
    });
  }

  if (colorGrid) {
    colorGrid.innerHTML = product.colors
      .map((color, i) => {
        const selected = color.name === selectedColor;
        return `
        <button
          type="button"
          class="color-selector__btn${selected ? ' is-selected' : ''}"
          data-color="${esc(color.name)}"
          aria-pressed="${selected ? 'true' : 'false'}"
          aria-label="${esc(color.name)}"
          title="${esc(color.name)}"
        >
          <span class="color-selector__swatch" style="background-color:${esc(color.hex)}"></span>
        </button>
      `;
      })
      .join('');

    colorGrid.querySelectorAll('.color-selector__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        colorGrid.querySelectorAll('.color-selector__btn').forEach((b) => {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        selectedColor = btn.dataset.color;
        updateGalleryForColor(selectedColor);
      });
    });
  }

  syncAddButton();

  function syncWishlistButton() {
    if (!wishlistBtn || !window.WishlistEngine) return;
    const saved = WishlistEngine.isWishlisted(product.id);
    wishlistBtn.setAttribute('aria-pressed', saved ? 'true' : 'false');
    wishlistBtn.textContent = saved ? 'Saved to Wishlist' : 'Save to Wishlist';
  }

  if (wishlistBtn && window.WishlistEngine) {
    syncWishlistButton();
    wishlistBtn.addEventListener('click', () => {
      WishlistEngine.toggleWishlist(product.id);
      syncWishlistButton();
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      try {
        CartEngine.addToCart(product.id, selectedSize, selectedColor, 1);

        if (window.openCartDrawer) {
          window.openCartDrawer();
        }

        const prev = addBtn.textContent;
        addBtn.textContent = product.inventoryStatus === 'backorder' ? 'Pre-Order Placed' : 'Added to Bag';
        setTimeout(() => {
          syncAddButton();
          if (addBtn.textContent === 'Added to Bag' || addBtn.textContent === 'Pre-Order Placed') {
            addBtn.textContent = prev;
          }
        }, 2000);
      } catch (err) {
        if (window.showCartToast) {
          window.showCartToast(err.message?.replace(/\[CartEngine\]\s*/, '') || 'Please select a valid size and color');
        }
      }
    });
  }

  if (specsEl && product.specifications) {
    specsEl.innerHTML = Object.entries(product.specifications)
      .map(
        ([key, val]) => `
      <div class="product-detail__spec-row">
        <dt>${esc(key)}</dt>
        <dd>${esc(val)}</dd>
      </div>
    `
      )
      .join('');
  }

  if (reviewsEl && product.reviews?.length && !window.ReviewsEngine) {
    reviewsEl.innerHTML = product.reviews
      .map(
        (r) => `
      <article class="product-detail__review">
        <div class="product-detail__review-meta">
          <strong>${esc(r.author)}</strong>
          <span>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          <time datetime="${esc(r.date)}">${esc(r.date)}</time>
          ${r.verifiedPurchase ? '<span>Verified Purchase</span>' : ''}
        </div>
        <h3 class="product-detail__review-title">${esc(r.title)}</h3>
        <p>${esc(r.body)}</p>
      </article>
    `
      )
      .join('');
  }

  function initTabs() {
    const tablist = document.getElementById('product-tabs');
    if (!tablist) return;

    const tabs = tablist.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const panelId = tab.getAttribute('aria-controls');
        tabs.forEach((t) => {
          t.setAttribute('aria-selected', 'false');
          t.tabIndex = -1;
        });
        panels.forEach((p) => {
          p.hidden = true;
        });
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;
        const panel = document.getElementById(panelId);
        if (panel) panel.hidden = false;
      });
    });
  }

  initTabs();

  function renderRecommended() {
    if (!recommendedGrid || !recommendedSection || !window.ProductCard) return;

    const ids = product.recommendedProductIds?.length
      ? product.recommendedProductIds
      : product.relatedProductIds;

    let items = (ids || [])
      .map((id) => ProductsData.getRawProductById(id))
      .filter((p) => p && p.id !== product.id);

    if (items.length < 2) {
      items = ProductsData.RAW_PRODUCTS.filter(
        (p) => p.category === product.category && p.id !== product.id
      ).slice(0, 4);
    }

    if (items.length === 0) {
      recommendedSection.hidden = true;
      return;
    }

    recommendedSection.hidden = false;
    recommendedGrid.innerHTML = items
      .slice(0, 4)
      .map((p) => ProductCard.buildShopCard(p))
      .join('');
  }

  renderRecommended();
})();
