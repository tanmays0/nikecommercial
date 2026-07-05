/**
 * SEO utilities — meta tags, Open Graph, canonical URLs, JSON-LD.
 */
(function () {
  'use strict';

  const SITE = Object.freeze({
    name: 'ARCHIVE',
    defaultImage: 'assets/images/air-max-pulse.jpg',
    twitterCard: 'summary_large_image',
  });

  function origin() {
    return window.location.origin || '';
  }

  function pageUrl() {
    return `${origin()}${window.location.pathname}${window.location.search}`;
  }

  function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function upsertLink(rel, href) {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function injectJsonLd(data) {
    const id = 'page-jsonld';
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  /**
   * Sync title, description, OG, Twitter, and canonical for any page.
   */
  function setPageMeta({ title, description, image, type = 'website', url }) {
    if (title) document.title = title;
    if (description) upsertMeta('name', 'description', description);

    const canonical = url || pageUrl();
    upsertLink('canonical', canonical);

    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE.name);
    upsertMeta('property', 'og:title', title || document.title);
    upsertMeta('property', 'og:description', description || '');
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', image || `${origin()}/${SITE.defaultImage}`);

    upsertMeta('name', 'twitter:card', SITE.twitterCard);
    upsertMeta('name', 'twitter:title', title || document.title);
    upsertMeta('name', 'twitter:description', description || '');
    upsertMeta('name', 'twitter:image', image || `${origin()}/${SITE.defaultImage}`);
  }

  /**
   * Product structured data for PDPs (schema.org/Product).
   */
  function setProductJsonLd(product) {
    if (!product) return;

    const image =
      (window.ProductSchema && ProductSchema.getPrimaryImageUrl(product)) ||
      product.images?.[0]?.url ||
      SITE.defaultImage;

    const stats = window.ReviewsEngine?.getStats(product);
    const reviews = window.ReviewsEngine?.getReviews(product)?.slice(0, 5) || [];

    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: image.startsWith('http') ? image : `${origin()}/${image.replace(/^\//, '')}`,
      sku: product.id,
      brand: { '@type': 'Brand', name: product.brand || SITE.name },
      offers: {
        '@type': 'Offer',
        url: pageUrl(),
        priceCurrency: 'USD',
        price: product.price,
        availability:
          product.inventoryStatus === 'out_of_stock'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
      },
    };

    if (stats && stats.count > 0) {
      data.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: stats.average,
        reviewCount: stats.count,
      };
    }

    if (reviews.length) {
      data.review = reviews.map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating },
        name: r.title,
        reviewBody: r.body,
      }));
    }

    injectJsonLd(data);
  }

  /** Organization schema for the storefront. */
  function setOrganizationJsonLd() {
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url: origin() || undefined,
      logo: `${origin()}/${SITE.defaultImage}`,
    });
  }

  /** Enhance static head tags once when seo.js loads (before page-specific scripts). */
  function init() {
    const title = document.title;
    const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    setPageMeta({ title, description: desc });
    if (!document.getElementById('page-jsonld')) {
      setOrganizationJsonLd();
    }
  }

  init();

  window.Seo = Object.freeze({
    SITE,
    setPageMeta,
    setProductJsonLd,
    setOrganizationJsonLd,
  });
})();
