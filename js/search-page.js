/**
 * ARCHIVE — Search with debounced instant results + suggestions
 */
(function () {
  'use strict';

  if (!window.ProductsData || !window.ProductCard) return;

  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  const emptyEl = document.getElementById('search-empty');
  const countEl = document.getElementById('search-count');

  if (!input || !resultsEl) return;

  const SUGGESTIONS = ['Air Max', 'Running', 'Jordan', 'Black', 'Training', 'Sale'];
  let timer = null;
  let reqId = 0;

  function suggestionChips() {
    return `
      <div class="search-suggestions">
        <p class="search-suggestions__label">Popular searches</p>
        <div class="search-suggestions__chips">
          ${SUGGESTIONS.map((s) => `<button type="button" class="search-chip" data-suggest="${s}">${s}</button>`).join('')}
        </div>
      </div>
    `;
  }

  function bindChips(root) {
    root.querySelectorAll('[data-suggest]').forEach((chip) => {
      chip.addEventListener('click', () => {
        input.value = chip.dataset.suggest;
        runSearch(input.value.trim());
      });
    });
  }

  function fetchResults(query) {
    const producer = () => ProductsData.searchProducts(query).map((p) => ProductsData.getRawProductById(p.id));
    return window.MockService ? MockService.request(producer, { min: 180, max: 460 }) : Promise.resolve(producer());
  }

  function runSearch(query) {
    const current = ++reqId;

    if (!query) {
      if (countEl) countEl.textContent = 'Start typing to search the catalog';
      if (emptyEl) emptyEl.hidden = true;
      resultsEl.innerHTML = suggestionChips();
      bindChips(resultsEl);
      updateUrl('');
      return;
    }

    resultsEl.innerHTML = window.MockService ? MockService.spinnerHtml('Searching…') : '';

    fetchResults(query)
      .then((products) => {
        if (current !== reqId) return; // stale response
        updateUrl(query);

        if (countEl) {
          countEl.textContent = `${products.length} result${products.length === 1 ? '' : 's'} for “${query}”`;
        }

        if (products.length === 0) {
          resultsEl.innerHTML = '';
          if (emptyEl) emptyEl.hidden = false;
          resultsEl.innerHTML = suggestionChips();
          bindChips(resultsEl);
          return;
        }

        if (emptyEl) emptyEl.hidden = true;
        resultsEl.innerHTML = products.map((p) => ProductCard.buildSearchResult(p)).join('');
      })
      .catch((err) => {
        if (current !== reqId) return;
        resultsEl.innerHTML = MockService.errorHtml(err.message, 'Retry Search');
        const retry = resultsEl.querySelector('[data-mock-retry]');
        if (retry) retry.addEventListener('click', () => runSearch(query));
      });
  }

  function updateUrl(query) {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => runSearch(input.value.trim()), 220);
  });

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    input.value = q;
    runSearch(q);
  } else {
    runSearch('');
  }
})();
