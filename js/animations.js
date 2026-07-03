/**
 * Motion — shared animation tokens and reveal helpers
 */
const Motion = {
  ease: {
    out: 'power3.out',
    inOut: 'power2.inOut',
    entrance: 'power3.out',
    soft: 'power1.out',
  },

  scrub: {
    soft: 0.55,
    medium: 0.48,
    tight: 0.38,
  },

  y: {
    sm: 16,
    md: 26,
    lg: 38,
  },

  get reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  _scrollTrigger(options) {
    if (this.reduced) {
      return { trigger: options.trigger, start: 'top 95%', toggleActions: 'play none none none' };
    }
    return options;
  },

  revealText(targets, options = {}) {
    const {
      trigger,
      start = 'top 86%',
      end = 'top 68%',
      scrub = Motion.scrub.medium,
      stagger = 0.09,
      y = Motion.y.md,
    } = options;

    const from = Motion.reduced
      ? { opacity: 0, y: y * 0.5 }
      : { opacity: 0, y, filter: 'blur(6px)' };

    const to = Motion.reduced
      ? { opacity: 1, y: 0, ease: Motion.ease.out, stagger }
      : { opacity: 1, y: 0, filter: 'blur(0px)', ease: Motion.ease.out, stagger };

    if (Motion.reduced) {
      gsap.fromTo(targets, from, { ...to, scrollTrigger: Motion._scrollTrigger({ trigger, start }) });
      return;
    }

    gsap.fromTo(targets, from, {
      ...to,
      scrollTrigger: { trigger, start, end, scrub },
    });
  },

  revealFade(targets, options = {}) {
    const {
      trigger,
      start = 'top 84%',
      end = 'top 62%',
      scrub = Motion.scrub.medium,
      stagger = 0.07,
      y = Motion.y.sm,
    } = options;

    gsap.fromTo(
      targets,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        ease: Motion.ease.soft,
        stagger,
        scrollTrigger: Motion.reduced
          ? Motion._scrollTrigger({ trigger, start })
          : { trigger, start, end, scrub },
      }
    );
  },

  revealImage(targets, options = {}) {
    const {
      trigger,
      start = 'top 88%',
      end = 'top 58%',
      scrub = Motion.scrub.soft,
      stagger = 0.06,
    } = options;

    const from = Motion.reduced
      ? { opacity: 0 }
      : { clipPath: 'inset(100% 0 0 0)', scale: 1.04 };

    const to = Motion.reduced
      ? { opacity: 1, ease: Motion.ease.out, stagger }
      : { clipPath: 'inset(0% 0 0 0)', scale: 1, ease: Motion.ease.out, stagger };

    gsap.fromTo(targets, from, {
      ...to,
      scrollTrigger: Motion.reduced
        ? Motion._scrollTrigger({ trigger, start })
        : { trigger, start, end, scrub },
    });
  },

  revealSection(introEl, options = {}) {
    const {
      trigger,
      start = 'top 86%',
      end = 'top 66%',
      scrub = Motion.scrub.medium,
    } = options;

    if (!introEl) return;

    const eyebrow = introEl.querySelector('.eyebrow');
    const title = introEl.querySelector('.section-title, .featured__title');

    if (eyebrow) {
      Motion.revealText(eyebrow, { trigger, start, end, scrub: scrub * 0.9, y: Motion.y.sm, stagger: 0 });
    }

    if (title) {
      Motion.revealText(title, { trigger, start, end, scrub, y: Motion.y.lg, stagger: 0 });
    }
  },

  parallaxImage(target, trigger, amount = '-5%') {
    if (!target || Motion.reduced) return;

    gsap.fromTo(
      target,
      { y: '0%' },
      {
        y: amount,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  },

  entrance(targets, options = {}) {
    const {
      delay = 0,
      stagger = 0.1,
      y = Motion.y.md,
      duration = 1.1,
    } = options;

    if (Motion.reduced) {
      return gsap.set(targets, { opacity: 1, y: 0, filter: 'none' });
    }

    return gsap.fromTo(
      targets,
      { opacity: 0, y, filter: 'blur(8px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration,
        delay,
        stagger,
        ease: Motion.ease.entrance,
      }
    );
  },

  scrubFade(target, options = {}) {
    const {
      trigger,
      start = 'top top',
      end = '18% top',
      scrub = Motion.scrub.soft,
      y = 14,
    } = options;

    if (Motion.reduced) return;

    gsap.to(target, {
      opacity: 0,
      y,
      ease: Motion.ease.inOut,
      scrollTrigger: { trigger, start, end, scrub },
    });
  },
};
