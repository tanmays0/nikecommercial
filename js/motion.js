/**
 * Motion & Interaction System (Phase 5)
 *
 * Site-wide layer that complements the homepage hero (owned by main.js /
 * tiger-experience.js). It never initializes a competing scroll system:
 * Lenis remains the single smooth-scroll engine. Reveals use IntersectionObserver
 * (pure visibility detection, self-unobserving = no off-screen work), keeping
 * everything on transform/opacity only.
 *
 * Responsibilities:
 *   - Global prefers-reduced-motion handling.
 *   - Page enter/exit transitions (subtle, non-blocking).
 *   - Staggered scroll reveals for grids and editorial sections.
 *   - Micro-interaction cues (cart/wishlist badge, form shake) via MotionFX.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reduceQuery.matches;
  if (reduced) root.classList.add('motion-reduce');

  const body = document.body;
  const isHome =
    (body && body.dataset && body.dataset.shell === 'home') ||
    !!document.getElementById('hero');

  const main = document.getElementById('main-content');

  /* ============================================================
     Micro-interactions — MotionFX (available on every page)
     ============================================================ */
  function playOnce(el, cls) {
    if (!el || reduced) return;
    el.classList.remove(cls);
    // Force reflow so the animation can replay if already applied.
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener(
      'animationend',
      () => el.classList.remove(cls),
      { once: true }
    );
  }

  const MotionFX = Object.freeze({
    pop: (el) => playOnce(el, 'fx-pop'),
    pulse: (el) => playOnce(el, 'fx-pulse'),
    shake: (el) => playOnce(el, 'fx-shake'),
  });
  window.MotionFX = MotionFX;

  // Cart add/update → pop the header cart badge.
  window.addEventListener('nikeCartUpdated', () => {
    MotionFX.pop(document.getElementById('cart-count'));
  });

  // Wishlist add/remove → pop the header wishlist badge.
  window.addEventListener('nikeWishlistUpdated', () => {
    MotionFX.pop(document.getElementById('wishlist-count'));
  });

  /* ============================================================
     Page transitions
     ============================================================ */
  // Enter: subtle rise/fade of main content (skip on homepage — the hero
  // owns first-paint choreography there).
  if (main && !isHome && !reduced) {
    main.classList.add('is-page-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        main.classList.add('is-page-ready');
        main.classList.remove('is-page-enter');
      });
    });
  }

  // Restore visibility if the page is served from the bfcache after an exit.
  window.addEventListener('pageshow', (e) => {
    if (!main) return;
    if (e.persisted) {
      main.classList.remove('is-page-exit', 'is-page-enter');
      main.classList.add('is-page-ready');
    }
  });

  // Exit: brief lift/fade before navigating to another internal page.
  if (main && !reduced) {
    document.addEventListener(
      'click',
      (e) => {
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }

        const link = e.target.closest('a[href]');
        if (!link) return;
        if (link.target && link.target !== '_self') return;
        if (link.hasAttribute('download')) return;
        if (link.dataset.noTransition !== undefined) return;

        let url;
        try {
          url = new URL(link.href, window.location.href);
        } catch (_) {
          return;
        }

        if (url.origin !== window.location.origin) return;
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
        // In-page anchor / same document → let smooth-scroll handlers work.
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash
        ) {
          return;
        }
        if (url.href === window.location.href) return;

        e.preventDefault();
        main.classList.remove('is-page-enter', 'is-page-ready');
        main.classList.add('is-page-exit');

        let navigated = false;
        const go = () => {
          if (navigated) return;
          navigated = true;
          window.location.href = url.href;
        };

        main.addEventListener('transitionend', go, { once: true });
        // Safety fallback in case transitionend never fires.
        setTimeout(go, 340);
      },
      false
    );
  }

  /* ============================================================
     Scroll reveals (inner pages only — homepage handled by main.js)
     ============================================================ */
  if (!isHome && !reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target); // stop tracking once shown
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    );

    function observe(el) {
      if (!el || el.dataset.revealObserved) return;
      el.dataset.revealObserved = '1';
      observer.observe(el);
    }

    function markReveal(el, index) {
      if (!el || el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
      if (index) {
        const delay = Math.min(index, 6) * 60;
        el.style.transitionDelay = delay + 'ms';
      }
      observe(el);
    }

    // Children of these containers reveal with a stagger.
    const STAGGER_CONTAINERS = [
      '.shop-grid',
      '.product-grid',
      '.orders-list',
      '.address-list',
      '.payment-list',
      '.discovery-grid',
      '.collection-grid',
      '.essentials',
    ];

    // These blocks reveal as a single unit.
    const BLOCK_TARGETS = [
      '.page-hero',
      '.collection-hero',
      '.featured',
      '.section-block',
      '.editorial',
      '.discovery-suggestions',
      '.content-section',
    ];

    function scan() {
      STAGGER_CONTAINERS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((container) => {
          const children = container.children;
          for (let i = 0; i < children.length; i++) {
            markReveal(children[i], i);
          }
        });
      });

      BLOCK_TARGETS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => markReveal(el, 0));
      });

      // Honor any manually authored data-reveal markup.
      document.querySelectorAll('[data-reveal]').forEach((el) => observe(el));
    }

    scan();
    window.MotionReveal = { refresh: scan };

    // Re-scan when async renderers inject grids/cards.
    const scanRoot = main || body;
    if (scanRoot && 'MutationObserver' in window) {
      let debounce;
      const mo = new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(scan, 120);
      });
      mo.observe(scanRoot, { childList: true, subtree: true });
    }

    // Safety net: a very fast fling can outrun IntersectionObserver and leave
    // an element permanently hidden. On scroll (rAF-throttled) reveal anything
    // that is already at/above the viewport but still not shown.
    let sweepQueued = false;
    function sweep() {
      sweepQueued = false;
      const cutoff = window.innerHeight * 0.94;
      document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
        if (el.getBoundingClientRect().top < cutoff) {
          el.classList.add('is-revealed');
          observer.unobserve(el);
        }
      });
    }
    window.addEventListener(
      'scroll',
      () => {
        if (sweepQueued) return;
        sweepQueued = true;
        requestAnimationFrame(sweep);
      },
      { passive: true }
    );
  }

  /* ============================================================
     Respond to live changes in the reduced-motion preference
     ============================================================ */
  const onPrefChange = (e) => {
    reduced = e.matches;
    root.classList.toggle('motion-reduce', reduced);
    if (reduced) {
      document
        .querySelectorAll('[data-reveal]')
        .forEach((el) => el.classList.add('is-revealed'));
      if (main) {
        main.classList.remove('is-page-enter', 'is-page-exit');
        main.classList.add('is-page-ready');
      }
    }
  };

  if (typeof reduceQuery.addEventListener === 'function') {
    reduceQuery.addEventListener('change', onPrefChange);
  } else if (typeof reduceQuery.addListener === 'function') {
    reduceQuery.addListener(onPrefChange);
  }
})();
