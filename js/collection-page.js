/**
 * ARCHIVE — Editorial collection landing pages
 */
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const heroEl = document.getElementById('collection-hero');
  const grid = document.getElementById('collection-grid');
  const listEl = document.getElementById('collections-list');

  if (!window.SiteConfig || !window.ProductsData) return;

  if (listEl) {
    listEl.innerHTML = SiteConfig.COLLECTIONS.map(
      (c) => `
      <a href="collection.html?slug=${encodeURIComponent(c.slug)}" class="collection-card">
        <img src="${c.heroImage}" alt="" loading="lazy" width="800" height="1000">
        <div class="collection-card__body">
          <span class="eyebrow">${c.eyebrow}</span>
          <h2 class="collection-card__title">${c.title}</h2>
          <p class="collection-card__desc">${c.description}</p>
        </div>
      </a>
    `
    ).join('');
    return;
  }

  if (!slug || !heroEl) return;

  const collection = SiteConfig.getCollectionBySlug(slug);

  if (!collection) {
    heroEl.innerHTML = `
      <div class="content-page content-page--404">
        <p class="eyebrow">404</p>
        <h1 class="content-page__title">Collection Not Found</h1>
        <a href="collections.html" class="btn btn--pill">All Collections</a>
      </div>
    `;
    return;
  }

  document.title = `${collection.title} — ARCHIVE`;
  if (window.Seo) {
    Seo.setPageMeta({
      title: `${collection.title} — ARCHIVE`,
      description: collection.description,
      image: collection.heroImage,
    });
  }

  heroEl.innerHTML = `
    <div class="collection-hero" style="background-image:url('${collection.heroImage}')">
      <div class="collection-hero__overlay">
        <p class="eyebrow eyebrow--light">${collection.eyebrow}</p>
        <h1 class="collection-hero__title">${collection.title}</h1>
        <p class="collection-hero__lead">${collection.description}</p>
      </div>
    </div>
  `;

  const products = SiteConfig.getCollectionProducts(slug);

  if (grid) {
    grid.innerHTML = products
      .map((p) => (window.ProductCard ? ProductCard.buildShopCard(p) : ''))
      .join('');
  }
})();
