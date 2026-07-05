/**
 * ARCHIVE — Legacy PDP alias → redirects to product-detail.html
 */
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const query = params.toString();
  window.location.replace(`product-detail.html${query ? `?${query}` : ''}`);
})();
