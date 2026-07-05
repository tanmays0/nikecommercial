/**
 * ARCHIVE — Mock service layer
 * Simulates network latency, loading states, and occasional errors so the UX
 * behaves like a real backend even though data lives in localStorage/fixtures.
 */
(function () {
  'use strict';

  const DEFAULT_MIN_MS = 260;
  const DEFAULT_MAX_MS = 720;
  const DEFAULT_FAIL_RATE = 0; // per-call override for demoing error states

  function delay(min = DEFAULT_MIN_MS, max = DEFAULT_MAX_MS) {
    const ms = Math.round(min + Math.random() * Math.max(0, max - min));
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wrap a synchronous producer in a simulated async request.
   * @template T
   * @param {() => T} producer
   * @param {{ min?: number, max?: number, failRate?: number, errorMessage?: string }} [opts]
   * @returns {Promise<T>}
   */
  async function request(producer, opts = {}) {
    const {
      min = DEFAULT_MIN_MS,
      max = DEFAULT_MAX_MS,
      failRate = DEFAULT_FAIL_RATE,
      errorMessage = 'Something went wrong. Please try again.',
    } = opts;

    await delay(min, max);

    if (failRate > 0 && Math.random() < failRate) {
      const err = new Error(errorMessage);
      err.isMockNetworkError = true;
      throw err;
    }

    return producer();
  }

  /* ---------- Shared state-view HTML helpers ---------- */

  function loadingHtml(label = 'Loading…', count = 6) {
    const cards = Array.from({ length: count })
      .map(
        () => `
        <div class="ds-skeleton-card" aria-hidden="true">
          <div class="ds-skeleton ds-skeleton--media"></div>
          <div class="ds-skeleton ds-skeleton--text"></div>
          <div class="ds-skeleton ds-skeleton--text ds-skeleton--short"></div>
        </div>`
      )
      .join('');
    return `
      <div class="ds-state ds-state--loading" role="status" aria-live="polite">
        <span class="visually-hidden">${label}</span>
        <div class="ds-skeleton-grid">${cards}</div>
      </div>
    `;
  }

  function spinnerHtml(label = 'Loading…') {
    return `
      <div class="ds-state ds-state--spinner" role="status" aria-live="polite">
        <span class="ds-spinner" aria-hidden="true"></span>
        <p>${label}</p>
      </div>
    `;
  }

  function errorHtml(message = 'We couldn’t load this right now.', retryLabel = 'Try Again') {
    return `
      <div class="ds-state ds-state--error" role="alert">
        <p class="ds-state__title">${message}</p>
        <button type="button" class="btn btn--pill btn--outline" data-mock-retry>${retryLabel}</button>
      </div>
    `;
  }

  function emptyHtml(title = 'Nothing here yet.', body = '', ctaHref = '', ctaLabel = '') {
    const cta = ctaHref && ctaLabel ? `<a href="${ctaHref}" class="btn btn--pill">${ctaLabel}</a>` : '';
    return `
      <div class="ds-state ds-state--empty">
        <p class="ds-state__title">${title}</p>
        ${body ? `<p class="ds-state__body">${body}</p>` : ''}
        ${cta}
      </div>
    `;
  }

  /**
   * Convenience: render a list into a container with loading/error/empty states.
   * @param {HTMLElement} container
   * @param {() => (any[]|Promise<any[]>)} fetcher
   * @param {{ render:(items:any[])=>string, loading?:string, empty?:string, error?:string, onDone?:(items:any[])=>void }} cfg
   */
  async function hydrateList(container, fetcher, cfg) {
    if (!container) return;
    const run = async () => {
      container.innerHTML = cfg.loading || loadingHtml();
      try {
        const items = await fetcher();
        if (!items || items.length === 0) {
          container.innerHTML = cfg.empty || emptyHtml();
          return;
        }
        container.innerHTML = cfg.render(items);
        if (typeof cfg.onDone === 'function') cfg.onDone(items);
      } catch (err) {
        container.innerHTML = cfg.error || errorHtml(err.message);
        const retry = container.querySelector('[data-mock-retry]');
        if (retry) retry.addEventListener('click', run);
      }
    };
    await run();
  }

  window.MockService = Object.freeze({
    delay,
    request,
    loadingHtml,
    spinnerHtml,
    errorHtml,
    emptyHtml,
    hydrateList,
  });
})();
