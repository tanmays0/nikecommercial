/**
 * DOM utilities — shared across all renderers.
 */
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Announce dynamic updates to screen readers. */
  function announce(message, priority = 'polite') {
    if (!message) return;
    let region = document.getElementById('sr-announcer');
    if (!region) {
      region = document.createElement('div');
      region.id = 'sr-announcer';
      region.className = 'sr-only';
      region.setAttribute('aria-live', priority);
      region.setAttribute('aria-atomic', 'true');
      region.setAttribute('role', 'status');
      document.body.appendChild(region);
    }
    region.setAttribute('aria-live', priority);
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  window.Dom = Object.freeze({ escapeHtml, announce });
})();
