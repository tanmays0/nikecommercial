/**
 * TigerExperience — Dual-canvas frame scrubbing engine
 * Foreground + ambient: object-fit cover with fractional crossfade
 */
class TigerExperience {
  static FRAME_PATHS = [
    'tigerimages/ezgif-frame-',
    'assets/frames/ezgif-frame-',
  ];
  static MAX_FRAMES = 500;
  static PRELOAD_CONCURRENCY = 4;
  static LOAD_RETRIES = 4;
  /** Minimum blend delta before redrawing (reduces redundant paints) */
  static BLEND_EPSILON = 0.0008;

  constructor({
    section,
    foregroundCanvas,
    ambientCanvas,
    onProgress = null,
    onReady = null,
    onError = null,
  }) {
    this.section = section;
    this.foregroundCanvas = foregroundCanvas;
    this.ambientCanvas = ambientCanvas;
    this.onProgress = onProgress;
    this.onReady = onReady;
    this.onError = onError;

    this.frameCount = 0;
    /** @type {HTMLImageElement[]} In-memory frame cache, index-ordered */
    this.frames = [];

    this.targetProgress = 0;
    this.displayProgress = 0;
    this._stateA = -1;
    this._stateB = -1;
    this._stateBlend = -1;
    this._metricsCache = null;

    this.isReady = false;
    this._render = this._render.bind(this);

    this.fgCtx = foregroundCanvas.getContext('2d', { alpha: false });
    this.ambCtx = ambientCanvas.getContext('2d', { alpha: false });

    this.fgCtx.imageSmoothingEnabled = true;
    this.fgCtx.imageSmoothingQuality = 'high';
    this.ambCtx.imageSmoothingEnabled = true;
    this.ambCtx.imageSmoothingQuality = 'high';

    this.fgSize = { width: 0, height: 0 };
    this.ambSize = { width: 0, height: 0 };

    this.scrollTrigger = null;
    this._probeCache = new Map();
    this.framePath = TigerExperience.FRAME_PATHS[0];
    this._onResize = this._debounce(this._handleResize.bind(this), 150);
    this._inView = true;
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._bindEvents();
  }

  /** Register render pass after Lenis on the GSAP ticker */
  attachToTicker() {
    gsap.ticker.add(this._render);
  }

  detachFromTicker() {
    gsap.ticker.remove(this._render);
  }

  /* ---------- Public API ---------- */

  async init() {
    try {
      this.frameCount = await this._detectFrameCount();

      if (this.frameCount === 0) {
        throw new Error('No animation frames found in assets/frames/');
      }

      await this._preloadFrames();
      this._setupCanvases();
      this._forceRender(0);
      this._setupScrollTrigger();
      this.isReady = true;

      if (this.onReady) this.onReady(this.frameCount);
    } catch (err) {
      console.error('[TigerExperience]', err.message);
      if (this.onError) this.onError(err);
    }
  }

  destroy() {
    this.detachFromTicker();
    window.removeEventListener('resize', this._onResize);
    if (this.scrollTrigger) this.scrollTrigger.kill();
    this.frames = [];
    this.isReady = false;
  }

  /* ---------- Frame Discovery ---------- */

  _frameSrc(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${this.framePath}${num}.jpg`;
  }

  async _resolveFramePath() {
    for (const basePath of TigerExperience.FRAME_PATHS) {
      this.framePath = basePath;
      this._probeCache.clear();

      if (await this._probeFrame(0)) {
        return basePath;
      }
    }

    return null;
  }

  async _detectFrameCount() {
    const resolved = await this._resolveFramePath();
    if (!resolved) return 0;

    if (await this._probeFrame(241)) {
      return 242;
    }

    let count = 0;

    for (let i = 0; i < TigerExperience.MAX_FRAMES; i++) {
      const exists = await this._probeFrame(i);
      if (!exists) break;
      count = i + 1;
    }

    return count;
  }

  _probeFrame(index) {
    if (this._probeCache.has(index)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(false), 8000);

      img.onload = () => {
        clearTimeout(timer);
        this._probeCache.set(index, img);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };

      img.src = this._frameSrc(index);
    });
  }

  /* ---------- Preloading ---------- */

  _loadFrame(index, attempt = 0) {
    const cached = this._probeCache.get(index);
    if (cached && cached.naturalWidth) {
      return Promise.resolve({ index, img: cached });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';

      img.onload = async () => {
        try {
          if (img.decode) await img.decode();
        } catch (_) {
          /* decode optional */
        }
        this._probeCache.set(index, img);
        resolve({ index, img });
      };

      img.onerror = () => {
        if (attempt < TigerExperience.LOAD_RETRIES) {
          const delay = 150 * (attempt + 1);
          setTimeout(() => {
            this._loadFrame(index, attempt + 1).then(resolve).catch(reject);
          }, delay);
          return;
        }
        reject(new Error(`Failed to load frame ${index + 1}: ${this._frameSrc(index)}`));
      };

      const suffix = attempt > 0 ? `?r=${attempt}` : '';
      img.src = `${this._frameSrc(index)}${suffix}`;
    });
  }

  async _preloadFrames() {
    const cache = new Array(this.frameCount);
    let loaded = 0;

    const report = () => {
      if (this.onProgress) {
        this.onProgress(loaded / this.frameCount);
      }
    };

    const batchSize = TigerExperience.PRELOAD_CONCURRENCY;

    for (let start = 0; start < this.frameCount; start += batchSize) {
      const end = Math.min(start + batchSize, this.frameCount);
      const batch = [];

      for (let i = start; i < end; i++) {
        batch.push(this._loadFrame(i));
      }

      const results = await Promise.all(batch);

      for (const { index, img } of results) {
        cache[index] = img;
        loaded++;
        report();
      }
    }

    for (let i = 0; i < this.frameCount; i++) {
      if (!cache[i] || !cache[i].naturalWidth) {
        throw new Error(`Frame ${i + 1} is missing or corrupt`);
      }
    }

    this.frames = cache;
  }

  /* ---------- Canvas Setup ---------- */

  _setupCanvases() {
    this._resizeCanvas(this.foregroundCanvas, this.fgCtx, this.fgSize);
    this._resizeCanvas(this.ambientCanvas, this.ambCtx, this.ambSize);
    this._metricsCache = null;
    this._stateA = -1;
    this._stateB = -1;
    this._stateBlend = -1;
  }

  _resizeCanvas(canvas, ctx, sizeStore) {
    const maxDpr = window.innerWidth < 768 ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sizeStore.width = w;
    sizeStore.height = h;
  }

  _handleResize() {
    this._setupCanvases();
    if (this.isReady) {
      this._forceRender(this.targetProgress);
    }
    if (this.scrollTrigger) this.scrollTrigger.refresh();
  }

  /* ---------- ScrollTrigger ---------- */

  _setupScrollTrigger() {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: this._reducedMotion ? false : 0.55,
      scroller: document.body,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        this.targetProgress = self.progress;
      },
      onEnter: () => {
        this._inView = true;
      },
      onEnterBack: () => {
        this._inView = true;
      },
      onLeave: () => {
        this._inView = false;
      },
      onLeaveBack: () => {
        this._inView = false;
      },
    });
  }

  /* ---------- Render Loop (GSAP ticker, synced with Lenis) ---------- */

  _getFrameIndices(progress) {
    const last = this.frameCount - 1;
    const floatFrame = progress * last;
    const frameA = Math.min(Math.floor(floatFrame), last);
    const frameB = Math.min(frameA + 1, last);
    const blend = frameB === frameA ? 0 : floatFrame - frameA;
    return { frameA, frameB, blend };
  }

  _shouldRedraw(frameA, frameB, blend) {
    return (
      frameA !== this._stateA ||
      frameB !== this._stateB ||
      Math.abs(blend - this._stateBlend) >= TigerExperience.BLEND_EPSILON
    );
  }

  _render() {
    if (!this.isReady || !this._inView) return;

    if (this._reducedMotion) {
      this.displayProgress = this.targetProgress;
    } else {
      const delta = this.targetProgress - this.displayProgress;
      if (Math.abs(delta) > 0.0001) {
        this.displayProgress += delta * 0.22;
      } else {
        this.displayProgress = this.targetProgress;
      }
    }

    const { frameA, frameB, blend } = this._getFrameIndices(this.displayProgress);

    if (!this._shouldRedraw(frameA, frameB, blend)) return;

    this._stateA = frameA;
    this._stateB = frameB;
    this._stateBlend = blend;

    this._paintCrossfade(this.fgCtx, this.fgSize, frameA, frameB, blend);
    this._paintCrossfade(this.ambCtx, this.ambSize, frameA, frameB, blend);
  }

  _forceRender(progress) {
    this.displayProgress = progress;
    this.targetProgress = progress;
    this._stateA = -1;
    this._stateB = -1;
    this._stateBlend = -1;

    const { frameA, frameB, blend } = this._getFrameIndices(progress);

    if (!this._shouldRedraw(frameA, frameB, blend)) return;

    this._stateA = frameA;
    this._stateB = frameB;
    this._stateBlend = blend;

    this._paintCrossfade(this.fgCtx, this.fgSize, frameA, frameB, blend);
    this._paintCrossfade(this.ambCtx, this.ambSize, frameA, frameB, blend);
  }

  _getCoverMetrics(cw, ch) {
    const key = `${cw}x${ch}`;

    if (!this._metricsCache) {
      this._metricsCache = {};
    }

    if (this._metricsCache[key]) {
      return this._metricsCache[key];
    }

    const ref = this.frames[0];
    if (!ref) return { dx: 0, dy: 0, dw: cw, dh: ch };

    const imgRatio = ref.naturalWidth / ref.naturalHeight;
    const canvasRatio = cw / ch;
    let dw, dh, dx, dy;

    if (imgRatio > canvasRatio) {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
      dy = 0;
    } else {
      dw = cw;
      dh = cw / imgRatio;
      dx = 0;
      dy = (ch - dh) / 2;
    }

    this._metricsCache[key] = { dx, dy, dw, dh };
    return this._metricsCache[key];
  }

  _paintCrossfade(ctx, size, frameA, frameB, blend) {
    const imgA = this.frames[frameA];
    if (!imgA || !imgA.naturalWidth) return;

    const { width: cw, height: ch } = size;
    const { dx, dy, dw, dh } = this._getCoverMetrics(cw, ch);

    if (frameA === frameB || blend < TigerExperience.BLEND_EPSILON) {
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, dx, dy, dw, dh);
      return;
    }

    const imgB = this.frames[frameB];
    if (!imgB || !imgB.naturalWidth) {
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, dx, dy, dw, dh);
      return;
    }

    const t = Math.min(1, Math.max(0, blend));

    ctx.globalAlpha = 1;
    ctx.drawImage(imgA, dx, dy, dw, dh);
    ctx.globalAlpha = t;
    ctx.drawImage(imgB, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }

  /* ---------- Utilities ---------- */

  _bindEvents() {
    window.addEventListener('resize', this._onResize);
  }

  _debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
}
