/**
 * ARCHIVE — Main Application
 */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- DOM Refs ---------- */
  const siteHeader = document.getElementById('site-header');
  const heroSection = document.getElementById('hero');
  const tigerCanvas = document.getElementById('tiger-canvas');
  const ambientCanvas = document.getElementById('ambient-canvas');
  const carouselTrack = document.getElementById('carousel-track');
  const carouselPrev = document.getElementById('carousel-prev');
  const carouselNext = document.getElementById('carousel-next');

  if (siteHeader) {
    gsap.set(siteHeader, { opacity: 1, y: 0 });
  }

  /* ---------- Lenis Smooth Scroll ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /** easeInOutCubic — premium micro-interaction curve */
  const easePremium = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const lenis = new Lenis({
    duration: prefersReducedMotion ? 0.01 : 1.05,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    smoothWheel: !prefersReducedMotion,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.6,
    infinite: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  ScrollTrigger.defaults({ scroller: document.body });

  ScrollTrigger.addEventListener('refresh', () => lenis.resize());

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(500, 16);

  /* ---------- Anchor Navigation ---------- */
  const headerOffset = () => {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    return parseInt(value, 10) || 60;
  };

  function scrollToInitialHash() {
    const hash = window.location.hash;
    if (!hash) return;

    const target = document.querySelector(hash);
    if (!target) return;

    lenis.scrollTo(target, {
      offset: -headerOffset(),
      duration: prefersReducedMotion ? 0 : 1.15,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    });
  }

  if (window.location.hash) {
    requestAnimationFrame(scrollToInitialHash);
  }

  /* ---------- Tiger Engine ---------- */
  let tiger;

  function initHeroHeaderScroll() {
    ScrollTrigger.create({
      trigger: heroSection,
      start: 'bottom top+=120',
      end: 'bottom top',
      scrub: Motion.scrub.soft,
      onUpdate: (self) => {
        siteHeader.classList.toggle('is-light', self.progress >= 0.5);
      },
    });
  }

  function onExperienceReady() {
    ScrollTrigger.refresh();

    requestAnimationFrame(() => {
      initHeroAnimations();
      initHeroHeaderScroll();
      if (window.location.hash) scrollToInitialHash();
    });
  }

  function onTigerFullyLoaded() {
    requestAnimationFrame(() => {
      initScrollAnimations();
      initHoverEffects();
      ScrollTrigger.refresh();
    });
  }

  tiger = new TigerExperience({
    section: heroSection,
    foregroundCanvas: tigerCanvas,
    ambientCanvas: ambientCanvas,
    onReady: onExperienceReady,
    onFullyLoaded: onTigerFullyLoaded,
    onError: () => {
      gsap.set(siteHeader, { opacity: 1, y: 0 });
      console.error('[TigerExperience] Failed to load hero frames.');
    },
  });

  tiger.init();

  /* ---------- Hero Animations ---------- */
  function initHeroAnimations() {
    const masthead = document.querySelector('.hero__masthead');
    const footer = document.querySelector('.hero__footer');
    const atmosphere = document.querySelector('.hero__atmosphere');

    Motion.entrance(masthead.children, { delay: 0.45, stagger: 0.11, y: 20 });
    Motion.entrance(footer.children, { delay: 0.75, stagger: 0.09, y: 22, duration: 1 });

    gsap.fromTo(
      atmosphere,
      { opacity: 0 },
      { opacity: 1, duration: 1.6, ease: Motion.ease.soft, delay: 0.25 }
    );

    Motion.scrubFade('.hero__masthead', {
      trigger: heroSection,
      end: '22% top',
    });

    Motion.scrubFade('.hero__footer', {
      trigger: heroSection,
      end: '20% top',
      y: 14,
    });
  }

  /* ---------- Scroll-Driven Animations ---------- */
  function initScrollAnimations() {
    /* First Look */
    const firstLook = document.querySelector('.first-look');
    if (firstLook) {
      Motion.revealSection(firstLook.querySelector('.section-block__intro'), {
        trigger: firstLook,
        start: 'top 86%',
        end: 'top 66%',
      });

      Motion.revealFade(firstLook.querySelector('.first-look__desc'), {
        trigger: firstLook,
        start: 'top 82%',
        end: 'top 60%',
      });

      Motion.revealFade(firstLook.querySelectorAll('.first-look__actions .btn'), {
        trigger: firstLook,
        start: 'top 78%',
        end: 'top 56%',
        stagger: 0.1,
      });
    }

    /* Carousel */
    const carouselSection = document.querySelector('.carousel-section');
    if (carouselSection) {
      Motion.revealSection(carouselSection.querySelector('.section-block__intro'), {
        trigger: carouselSection,
        start: 'top 88%',
        end: 'top 70%',
      });

      gsap.fromTo(
        carouselSection.querySelector('.carousel-nav'),
        { opacity: 0, x: 12 },
        {
          opacity: 1,
          x: 0,
          ease: Motion.ease.out,
          scrollTrigger: {
            trigger: carouselSection,
            start: 'top 86%',
            end: 'top 72%',
            scrub: Motion.scrub.medium,
          },
        }
      );

      Motion.revealImage(
        carouselSection.querySelectorAll('.product-card__media'),
        { trigger: carouselSection, start: 'top 85%', end: 'top 52%', stagger: 0.055 }
      );

      Motion.revealFade(
        carouselSection.querySelectorAll('.product-card__body'),
        { trigger: carouselSection, start: 'top 80%', end: 'top 50%', stagger: 0.05, y: 14 }
      );
    }

    /* Featured */
    const featured = document.querySelector('.featured');
    if (featured) {
      Motion.revealImage(featured.querySelector('.featured__image'), {
        trigger: featured,
        start: 'top 92%',
        end: 'top 55%',
        stagger: 0,
      });

      const featuredContent = featured.querySelector('.featured__content');
      Motion.revealText(featuredContent.querySelector('.eyebrow'), {
        trigger: featured,
        start: 'top 72%',
        end: 'top 48%',
        y: Motion.y.sm,
        stagger: 0,
      });

      Motion.revealText(featuredContent.querySelector('.featured__title'), {
        trigger: featured,
        start: 'top 70%',
        end: 'top 42%',
        y: Motion.y.lg,
        stagger: 0,
      });

      Motion.parallaxImage(featured.querySelector('.featured__image'), featured, '-5%');
    }

    /* Essentials */
    const essentials = document.querySelector('.essentials');
    if (essentials) {
      Motion.revealSection(essentials.querySelector('.section-block__intro'), {
        trigger: essentials,
        start: 'top 88%',
        end: 'top 68%',
      });

      Motion.revealImage(
        essentials.querySelectorAll('.essentials__card img'),
        { trigger: essentials, start: 'top 84%', end: 'top 48%', stagger: 0.08 }
      );

      Motion.revealFade(
        essentials.querySelectorAll('.essentials__card-content'),
        { trigger: essentials, start: 'top 78%', end: 'top 46%', stagger: 0.08, y: 16 }
      );
    }

    /* Footer */
    const footer = document.querySelector('.site-footer');
    if (footer) {
      Motion.revealFade(footer.querySelectorAll('.site-footer__col'), {
        trigger: footer,
        start: 'top 94%',
        end: 'top 74%',
        stagger: 0.07,
        y: 16,
      });

      Motion.revealFade(footer.querySelector('.site-footer__bottom'), {
        trigger: footer,
        start: 'top 90%',
        end: 'top 76%',
        y: 12,
      });
    }
  }

  /* ---------- Premium Hover Effects ---------- */
  function initHoverEffects() {
    if (!canHover || Motion.reduced) return;

    document.querySelectorAll('.product-card').forEach((card) => {
      const media = card.querySelector('.product-card__media');
      const img = card.querySelector('.product-card__media img');
      const body = card.querySelector('.product-card__body');
      const title = card.querySelector('.product-card__title');
      if (!img || !media) return;

      card.addEventListener('mouseenter', () => {
        gsap.to(img, {
          scale: 1.07,
          duration: 0.75,
          ease: easePremium,
        });
        gsap.to(media, {
          y: -3,
          duration: 0.65,
          ease: easePremium,
        });
        if (body) {
          gsap.to(body, { y: 4, duration: 0.55, ease: easePremium });
        }
        if (title) {
          gsap.to(title, { letterSpacing: '0.02em', duration: 0.55, ease: easePremium });
        }
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(img, { scale: 1, duration: 0.85, ease: easePremium });
        gsap.to(media, { y: 0, duration: 0.75, ease: easePremium });
        if (body) {
          gsap.to(body, { y: 0, duration: 0.65, ease: easePremium });
        }
        if (title) {
          gsap.to(title, { letterSpacing: '-0.02em', duration: 0.65, ease: easePremium });
        }
      });
    });

    document.querySelectorAll('.essentials__card').forEach((card) => {
      const img = card.querySelector('img');
      const overlay = card.querySelector('.essentials__card-overlay');
      if (!img) return;

      card.addEventListener('mouseenter', () => {
        gsap.to(img, { scale: 1.055, duration: 0.85, ease: easePremium });
        if (overlay) {
          gsap.to(overlay, { opacity: 0.75, duration: 0.65, ease: easePremium });
        }
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(img, { scale: 1, duration: 0.9, ease: easePremium });
        if (overlay) {
          gsap.to(overlay, { opacity: 1, duration: 0.75, ease: easePremium });
        }
      });
    });

    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, {
          y: -3,
          scale: 1.02,
          duration: 0.45,
          ease: easePremium,
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: easePremium,
        });
      });
    });

    document.querySelectorAll('.site-header__nav a').forEach((link) => {
      link.addEventListener('mouseenter', () => {
        gsap.to(link, { y: -1, duration: 0.4, ease: easePremium });
      });

      link.addEventListener('mouseleave', () => {
        gsap.to(link, { y: 0, duration: 0.5, ease: easePremium });
      });
    });

    [carouselPrev, carouselNext].forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, { scale: 1.06, duration: 0.4, ease: easePremium });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { scale: 1, duration: 0.45, ease: easePremium });
      });
    });
  }

  /* ---------- Product Carousel ---------- */
  const CARD_SCROLL_AMOUNT = 320;

  function getCarouselStep() {
    const card = carouselTrack.querySelector('.product-card');
    if (!card) return CARD_SCROLL_AMOUNT;
    const styles = getComputedStyle(carouselTrack);
    const gap = parseFloat(styles.gap) || 16;
    return card.offsetWidth + gap;
  }

  carouselPrev.addEventListener('click', () => {
    carouselTrack.scrollBy({ left: -getCarouselStep(), behavior: 'smooth' });
  });

  carouselNext.addEventListener('click', () => {
    carouselTrack.scrollBy({ left: getCarouselStep(), behavior: 'smooth' });
  });

  carouselTrack.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      carouselTrack.scrollBy({ left: -getCarouselStep(), behavior: 'smooth' });
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      carouselTrack.scrollBy({ left: getCarouselStep(), behavior: 'smooth' });
    }
  });

  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  carouselTrack.addEventListener('mousedown', (e) => {
    if (e.target.closest('a')) return;
    isDragging = true;
    carouselTrack.classList.add('is-dragging');
    startX = e.pageX - carouselTrack.offsetLeft;
    scrollLeft = carouselTrack.scrollLeft;
  });

  carouselTrack.addEventListener('mouseleave', () => {
    isDragging = false;
    carouselTrack.classList.remove('is-dragging');
  });

  carouselTrack.addEventListener('mouseup', () => {
    isDragging = false;
    carouselTrack.classList.remove('is-dragging');
  });

  carouselTrack.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselTrack.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselTrack.scrollLeft = scrollLeft - walk;
  });

  /* ---------- Mobile Menu Toggle ---------- */
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.querySelector('.site-header__nav');

  function closeMobileMenu() {
    if (menuToggle.getAttribute('aria-expanded') !== 'true') return;

    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');

    gsap.to(nav.querySelectorAll('a'), {
      opacity: 0,
      y: 10,
      duration: 0.25,
      stagger: 0.03,
      ease: Motion.ease.inOut,
      onComplete: () => nav.removeAttribute('style'),
    });

    if (window.scrollY < heroSection.offsetHeight - 80) {
      siteHeader.classList.remove('is-light');
      siteHeader.style.mixBlendMode = '';
    }
  }

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
    siteHeader.classList.add('is-light');
    siteHeader.style.mixBlendMode = 'normal';

    gsap.fromTo(
      nav.querySelectorAll('a'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: Motion.ease.out }
    );

    nav.querySelector('a')?.focus();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

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

      const target = document.querySelector(`#${hash}`);
      if (!target) return;

      e.preventDefault();
      closeMobileMenu();

      lenis.scrollTo(target, {
        offset: -headerOffset(),
        duration: prefersReducedMotion ? 0 : 1.15,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      });
    });
  });

})();
