/**
 * ARCHIVE — Sub-page interactions (Lenis, menu, accordions, filters)
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const easePremium = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- Smooth scroll (Lenis on landing only; native on inner pages) ---------- */
  const isInnerPage = document.body.classList.contains('page-inner');
  let lenis = null;

  if (!isInnerPage && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: prefersReducedMotion ? 0.01 : 1.05,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      infinite: false,
    });

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(500, 16);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target, offset) {
    const top = target.getBoundingClientRect().top + window.scrollY + offset;
    if (lenis) {
      lenis.scrollTo(target, {
        offset,
        duration: prefersReducedMotion ? 0 : 1.15,
      });
      return;
    }
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  /* ---------- Mobile Menu (legacy pages only — site-shell owns mega nav) ---------- */
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const megaNav = document.getElementById('site-mega-nav');

  function closeMobileMenu() {
    if (!menuToggle || menuToggle.getAttribute('aria-expanded') !== 'true') return;

    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    if (nav) nav.removeAttribute('style');
    if (megaNav) megaNav.hidden = true;
  }

  if (menuToggle && nav && !megaNav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';

      if (expanded) {
        closeMobileMenu();
        return;
      }

      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close menu');
      nav.style.display = 'flex';
      nav.style.position = 'fixed';
      nav.style.inset = '0';
      nav.style.flexDirection = 'column';
      nav.style.alignItems = 'center';
      nav.style.justifyContent = 'center';
      nav.style.gap = '2rem';
      nav.style.background = 'rgba(255,255,255,0.97)';
      nav.style.zIndex = '99';
      nav.style.fontSize = '1.25rem';
      nav.querySelector('a')?.focus();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  /* ---------- Anchor links ---------- */
  const headerOffset = () => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    return parseInt(value, 10) || 60;
  };

  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || !href.includes('#')) return;

      const hashIndex = href.indexOf('#');
      const hash = href.slice(hashIndex + 1);
      if (!hash) return;

      const pathPart = href.slice(0, hashIndex);
      const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      const linkFile = pathPart || currentFile;

      if (linkFile !== currentFile && pathPart !== '') return;

      const target = document.getElementById(hash);
      if (!target) return;

      e.preventDefault();
      closeMobileMenu();

      scrollToTarget(target, -headerOffset());
    });
  });

  /* ---------- Accordions ---------- */
  document.querySelectorAll('.accordion__trigger').forEach((trigger) => {
    const item = trigger.closest('.accordion__item');
    const panel = item?.querySelector('.accordion__panel');

    if (!item || !panel) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      item.closest('.accordion')?.querySelectorAll('.accordion__item.is-open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.accordion__trigger')?.setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------- Shop filters (mobile) ---------- */
  const filterToggle = document.getElementById('shop-filter-toggle');
  const filterPanel = document.getElementById('shop-filters');

  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
      filterToggle.setAttribute('aria-expanded', String(!expanded));
      filterPanel.classList.toggle('is-open', !expanded);
    });
  }

  /* ---------- Size selector ---------- */
  document.querySelectorAll('.size-selector__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.size-selector')?.querySelectorAll('.size-selector__btn').forEach((b) => {
        b.classList.remove('is-selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  /* ---------- Premium hovers ---------- */
  function initShopCardHovers() {
    if (!canHover || prefersReducedMotion || typeof gsap === 'undefined') return;

    document.querySelectorAll('.shop-card').forEach((card) => {
      const media = card.querySelector('.shop-card__media');
      if (!media || card.dataset.hoverBound) return;
      if (media.classList.contains('shop-card__media--dual')) return;
      card.dataset.hoverBound = 'true';

      const img = card.querySelector('.shop-card__media img');
      if (!img) return;

      card.addEventListener('mouseenter', () => {
        gsap.to(img, { scale: 1.06, duration: 0.7, ease: easePremium });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(img, { scale: 1, duration: 0.8, ease: easePremium });
      });
    });
  }

  window.initShopCardHovers = initShopCardHovers;

  function initHoverEffects() {
    if (!canHover || prefersReducedMotion) return;

    initShopCardHovers();

    document.querySelectorAll('.support-topic').forEach((topic) => {
      topic.addEventListener('mouseenter', () => {
        gsap.to(topic, { y: -4, duration: 0.45, ease: easePremium });
      });

      topic.addEventListener('mouseleave', () => {
        gsap.to(topic, { y: 0, duration: 0.55, ease: easePremium });
      });
    });

    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, { y: -3, scale: 1.02, duration: 0.45, ease: easePremium });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { y: 0, scale: 1, duration: 0.55, ease: easePremium });
      });
    });
  }

  initHoverEffects();
})();
