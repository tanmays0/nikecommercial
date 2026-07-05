/**
 * ARCHIVE — Static content pages (legal, about, etc.)
 */
(function () {
  'use strict';

  const main = document.getElementById('content-main');
  const pageId = document.body.dataset.content;

  if (!main || !pageId || !window.SiteConfig) return;

  const page = SiteConfig.getContentPage(pageId);

  if (!page) {
    main.innerHTML = `
      <div class="content-page content-page--404">
        <p class="eyebrow">404</p>
        <h1 class="content-page__title">Page Not Found</h1>
        <p class="content-page__lead">This content page does not exist.</p>
        <a href="index.html" class="btn btn--pill">Return Home</a>
      </div>
    `;
    return;
  }

  document.title = `${page.title} — ARCHIVE`;

  const description = page.sections?.[0]?.body?.slice(0, 160) || `${page.title} — ARCHIVE`;
  if (window.Seo) {
    Seo.setPageMeta({ title: `${page.title} — ARCHIVE`, description });
  }

  main.innerHTML = `
    <div class="content-page">
      <header class="content-page__header">
        <p class="eyebrow">Information</p>
        <h1 class="content-page__title">${page.title}</h1>
      </header>
      <div class="content-page__sections">
        ${page.sections
          .map(
            (s) => `
          <section class="content-page__section">
            <h2 class="content-page__section-title">${s.heading}</h2>
            <p class="content-page__section-body">${s.body}</p>
          </section>
        `
          )
          .join('')}
      </div>
    </div>
  `;
})();
