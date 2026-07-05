/**
 * ARCHIVE — Global header/footer shell (IA navigation)
 */
(function () {
  'use strict';

  if (!window.SiteConfig) return;

  const { NAV, FOOTER } = SiteConfig;

  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));

  function currentPath() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function isActive(href) {
    const file = href.split('?')[0].split('#')[0];
    if (file === currentPath()) return true;
    if (file === 'index.html' && currentPath() === '') return true;
    return false;
  }

  function linkList(items, className = '') {
    return items
      .map((item) => {
        const active = isActive(item.href) ? ' aria-current="page"' : '';
        return `<a href="${esc(item.href)}" class="${className}"${active}>${esc(item.label)}</a>`;
      })
      .join('');
  }

  function renderHeader(variant) {
    const isHome = variant === 'home';

    const primaryNav = isHome
      ? `
        <a href="new-arrivals.html">New</a>
        <a href="trending.html">Trending</a>
        <a href="#featured">Featured</a>
        <a href="shop.html">Shop</a>
      `
      : linkList(NAV.primary);

    return `
      <header class="site-header${isHome ? '' : ' is-light'}" id="site-header">
        <a href="index.html" class="site-header__logo" aria-label="ARCHIVE — home">
          <svg viewBox="0 0 148 24" fill="none" aria-hidden="true">
            <path d="M2 12 L7 5.5 H20 A1.8 1.8 0 0 1 21.8 7.3 V16.7 A1.8 1.8 0 0 1 20 18.5 H7 Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <circle cx="7.6" cy="12" r="1.5" stroke="currentColor" stroke-width="1.4"/>
            <text class="site-header__wordmark" x="33" y="16.5">ARCHIVE</text>
          </svg>
        </a>

        <nav class="site-header__nav" id="site-nav" aria-label="Main navigation">
          ${primaryNav}
        </nav>

        <div class="site-header__actions">
          <a href="search.html" class="site-header__icon" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </a>
          <a href="wishlist.html" class="site-header__icon site-header__icon--wishlist" id="wishlist-badge" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
            <span class="site-header__badge-count" id="wishlist-count" hidden>0</span>
          </a>
          <a href="login.html" class="site-header__icon site-header__icon--account" id="account-link" aria-label="Account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
          <a href="cart.html" class="site-header__cart" id="cart-badge" aria-label="Shopping bag, empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span class="site-header__cart-count" id="cart-count" hidden>0</span>
          </a>
          <button class="site-header__menu" id="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav site-mega-nav">
            <span></span><span></span>
          </button>
        </div>

        <div class="site-mega-nav" id="site-mega-nav" hidden>
          <div class="site-mega-nav__grid">
            <div class="site-mega-nav__col">
              <h3 class="site-mega-nav__heading">Shop</h3>
              ${linkList(NAV.shop, 'site-mega-nav__link')}
            </div>
            <div class="site-mega-nav__col">
              <h3 class="site-mega-nav__heading">Categories</h3>
              ${linkList(NAV.categories, 'site-mega-nav__link')}
            </div>
            <div class="site-mega-nav__col">
              <h3 class="site-mega-nav__heading">Sport Lines</h3>
              ${linkList(NAV.lines, 'site-mega-nav__link')}
            </div>
            <div class="site-mega-nav__col">
              <h3 class="site-mega-nav__heading">Collections</h3>
              ${linkList(NAV.collections, 'site-mega-nav__link')}
              <a href="collections.html" class="site-mega-nav__link site-mega-nav__link--all">View All Collections</a>
            </div>
            <div class="site-mega-nav__col">
              <h3 class="site-mega-nav__heading">Discover</h3>
              ${linkList(NAV.discover, 'site-mega-nav__link')}
            </div>
            <div class="site-mega-nav__col">
              <h3 class="site-mega-nav__heading">Account</h3>
              ${linkList(NAV.account, 'site-mega-nav__link')}
            </div>
          </div>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    const cols = FOOTER.map(
      (col) => `
        <div class="site-footer__col">
          <h4 class="site-footer__heading">${esc(col.heading)}</h4>
          <ul>
            ${col.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}
          </ul>
        </div>
      `
    ).join('');

    return `
      <footer class="site-footer" role="contentinfo">
        <div class="container">
          <div class="site-footer__grid">${cols}</div>
          <div class="site-footer__legal">
            <a href="privacy-policy.html">Privacy</a>
            <a href="terms-of-service.html">Terms</a>
            <a href="accessibility.html">Accessibility</a>
          </div>
          <div class="site-footer__bottom">
            <p class="site-footer__disclaimer">ARCHIVE is an independent curated resale marketplace. All items are pre-owned and sold as-is. ARCHIVE is not affiliated with, authorized by, or endorsed by any of the brands listed on this site; all trademarks belong to their respective owners.</p>
            <p>&copy; 2026 ARCHIVE. Curated vintage &amp; pre-loved fashion.</p>
          </div>
        </div>
      </footer>
    `;
  }

  function mountShell() {
    const body = document.body;
    const variant = body.dataset.shell === 'home' ? 'home' : 'inner';
    const headerMount = document.getElementById('site-header-mount');
    const footerMount = document.getElementById('site-footer-mount');

    if (headerMount) {
      headerMount.innerHTML = renderHeader(variant);
    } else if (variant === 'inner') {
      const existingHeader = document.getElementById('site-header');
      if (existingHeader) {
        existingHeader.outerHTML = renderHeader('inner');
      }
    }

    if (footerMount) {
      footerMount.innerHTML = renderFooter();
    } else {
      const existingFooter = document.querySelector('.site-footer');
      if (existingFooter) {
        existingFooter.outerHTML = renderFooter();
      }
    }

    bindMegaMenu();
    syncIndicators();
    bindIndicatorEvents();
  }

  function syncWishlistIndicator() {
    const countEl = document.getElementById('wishlist-count');
    if (!countEl || !window.WishlistEngine) return;
    const n = WishlistEngine.getWishlist().length;
    if (n > 0) {
      countEl.textContent = String(n);
      countEl.hidden = false;
      if (window.Dom) Dom.announce(`Wishlist updated, ${n} item${n === 1 ? '' : 's'}`);
    } else {
      countEl.hidden = true;
    }
  }

  function syncAccountIndicator() {
    const link = document.getElementById('account-link');
    if (!link || !window.AuthEngine) return;
    const session = AuthEngine.getSession();
    if (session) {
      link.href = 'profile.html';
      link.setAttribute('aria-label', `Account — ${session.name}`);
      link.classList.add('is-authed');
    } else {
      link.href = 'login.html';
      link.setAttribute('aria-label', 'Sign in');
      link.classList.remove('is-authed');
    }
  }

  function syncIndicators() {
    syncWishlistIndicator();
    syncAccountIndicator();
  }

  function bindIndicatorEvents() {
    if (window.WishlistEngine) {
      window.addEventListener(WishlistEngine.EVENT_WISHLIST, syncWishlistIndicator);
    }
    if (window.AuthEngine) {
      window.addEventListener(AuthEngine.EVENT_AUTH, syncAccountIndicator);
    }
  }

  function bindMegaMenu() {
    const toggle = document.getElementById('menu-toggle');
    const mega = document.getElementById('site-mega-nav');
    const nav = document.getElementById('site-nav');

    if (!toggle || !mega) return;

    function closeMegaMenu() {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      mega.hidden = true;
      if (nav) nav.removeAttribute('style');
    }

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';

      if (open) {
        closeMegaMenu();
        return;
      }

      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      mega.hidden = false;

      if (window.innerWidth < 768 && nav) {
        nav.style.display = 'flex';
        nav.style.position = 'fixed';
        nav.style.inset = '0';
        nav.style.flexDirection = 'column';
        nav.style.alignItems = 'center';
        nav.style.justifyContent = 'center';
        nav.style.gap = '2rem';
        nav.style.background = 'rgba(242,238,230,0.97)';
        nav.style.zIndex = '99';
        nav.style.fontSize = '1.25rem';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMegaMenu();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountShell);
  } else {
    mountShell();
  }
})();
