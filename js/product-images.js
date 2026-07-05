/**
 * ARCHIVE — Responsive product imagery (<picture>, srcset, blur-up)
 */
(function () {
  'use strict';

  if (!window.ProductSchema) return;

  const CARD_WIDTHS = [400, 600, 800];
  const PDP_WIDTHS = [600, 900, 1200];
  const THUMB_SIZE = 120;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Flickr static images expose sized variants via a suffix on the filename
  // (e.g. _w=400, _z=640, _c=800, _b=1024). Requesting the right size avoids
  // shipping a 1024px JPG for an 88px thumbnail.
  function flickrSuffix(width) {
    if (width <= 240) return 'n'; // 320px longest edge
    if (width <= 500) return 'w'; // 400px
    if (width <= 700) return 'z'; // 640px
    if (width <= 900) return 'c'; // 800px
    return 'b'; // 1024px
  }

  function resizeUrl(url, width) {
    if (!url) return '';
    if (url.includes('live.staticflickr.com')) {
      return url.replace(/_[a-z0-9]{1,3}\.jpg(\?.*)?$/i, `_${flickrSuffix(width)}.jpg`);
    }
    if (url.includes('images.unsplash.com')) {
      const base = url.split('?')[0];
      return `${base}?w=${width}&fit=crop&auto=format&q=82`;
    }
    return url;
  }

  function sizedUrl(image, width) {
    if (!image) return '';
    const url = ProductSchema.imageUrl(image);
    if (!url) return '';

    if (url.includes('live.staticflickr.com')) {
      return resizeUrl(url, width);
    }

    if (url.includes('images.unsplash.com')) {
      const h = Math.round(width * (image.height / image.width));
      const base = url.split('?')[0];
      return `${base}?w=${width}&h=${h}&fit=crop&auto=format&q=82`;
    }

    if (url.includes('picsum.photos/seed/')) {
      const h = Math.round(width * (image.height / image.width));
      const parts = url.replace(/\.webp$|\.avif$/, '').split('/');
      const seed = parts[parts.length - 3];
      return `https://picsum.photos/seed/${seed}/${Math.round(width * 0.8)}/${h}`;
    }

    if (url.startsWith('assets/')) {
      return url;
    }

    return url;
  }

  function formatUrl(image, width, format) {
    const url = sizedUrl(image, width);
    if (!url || !url.includes('unsplash.com')) return url;
    const join = url.includes('?') ? '&' : '?';
    if (format === 'webp') return `${url}${join}fm=webp`;
    if (format === 'avif') return `${url}${join}fm=avif`;
    return url;
  }

  function buildSrcSet(image, widths, format) {
    return widths
      .map((w) => `${formatUrl(image, w, format)} ${w}w`)
      .join(', ');
  }

  /**
   * @param {import('./product-schema').ProductImage} image
   * @param {Object} opts
   */
  function renderPicture(image, opts = {}) {
    if (!image) return '';

    const {
      widths = CARD_WIDTHS,
      sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
      loading = 'lazy',
      decoding = 'async',
      className = '',
      eager = false,
    } = opts;

    const primary = sizedUrl(image, widths[widths.length - 1]);
    const webpSet = buildSrcSet(image, widths, 'webp');
    const avifSet = buildSrcSet(image, widths, 'avif');
    const fallbackSet = buildSrcSet(image, widths, null);
    const loadAttr = eager ? 'eager' : loading;
    const fetchPriority = eager ? ' fetchpriority="high"' : '';

    return `
      <picture class="product-picture ${className}">
        <source type="image/avif" srcset="${escapeHtml(avifSet)}" sizes="${escapeHtml(sizes)}" />
        <source type="image/webp" srcset="${escapeHtml(webpSet)}" sizes="${escapeHtml(sizes)}" />
        <img
          class="product-picture__img"
          src="${escapeHtml(primary)}"
          srcset="${escapeHtml(fallbackSet)}"
          sizes="${escapeHtml(sizes)}"
          alt="${escapeHtml(image.alt)}"
          width="${image.width}"
          height="${image.height}"
          loading="${loadAttr}"
          decoding="${decoding}"${fetchPriority}
        />
      </picture>
    `;
  }

  function renderCardMedia(product, opts = {}) {
    const primary = product.images[0];
    const hover = product.images[1] || primary;
    if (!primary) return '';

    const primaryHtml = renderPicture(primary, { ...opts, className: 'shop-card__picture shop-card__picture--primary' });
    const hoverHtml =
      hover && hover !== primary
        ? renderPicture(hover, { ...opts, className: 'shop-card__picture shop-card__picture--hover' })
        : '';

    return `
      <div class="shop-card__media shop-card__media--dual product-picture-wrap">
        <div class="shop-card__img shop-card__img--primary">${primaryHtml}</div>
        ${hoverHtml ? `<div class="shop-card__img shop-card__img--hover">${hoverHtml}</div>` : ''}
      </div>
    `;
  }

  function renderThumbnail(image) {
    return renderPicture(image, {
      widths: [THUMB_SIZE, THUMB_SIZE * 2],
      sizes: `${THUMB_SIZE}px`,
      className: 'product-thumb',
    });
  }

  window.ProductImages = Object.freeze({
    CARD_WIDTHS,
    PDP_WIDTHS,
    sizedUrl,
    resizeUrl,
    buildSrcSet,
    renderPicture,
    renderCardMedia,
    renderThumbnail,
  });
})();
