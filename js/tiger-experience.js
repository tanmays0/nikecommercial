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
  static BOOTSTRAP_COUNT = 30;
  static PRELOAD_BATCH_IDLE = 6;
  static PRELOAD_BATCH_ACTIVE = 3;
  static PLAYHEAD_AHEAD = 55;
  static PLAYHEAD_BEHIND = 12;
  static SCROLL_IDLE_MS = 200;
  static LOAD_RETRIES = 4;
  /** Minimum blend delta before redrawing (reduces redundant paints) */
  static BLEND_EPSILON = 0.0012;

  constructor({
    section,
    foregroundCanvas,
    ambientCanvas,
    onProgress = null,
    onReady = null,
    onFullyLoaded = null,
    onError = null,
  }) {
    this.section = section;
    this.foregroundCanvas = foregroundCanvas;
    this.ambientCanvas = ambientCanvas;
    this.onProgress = onProgress;
    this.onReady = onReady;
    this.onFullyLoaded = onFullyLoaded;
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
    this._preloadComplete = false;
    this._isInteracting = false;
    this._scrollIdleTimer = null;
    this._preloadRunning = false;
    this._loadingIndices = new Set();
    this._urgentPreloadActive = false;
    this._render = this._render.bind(this);

    this.fgCtx = foregroundCanvas.getContext('2d', { alpha: false });
    this.ambCtx = ambientCanvas.getContext('2d', { alpha: false });

    this.fgCtx.imageSmoothingEnabled = true;
    this.fgCtx.imageSmoothingQuality = 'medium';
    this.ambCtx.imageSmoothingEnabled = true;
    this.ambCtx.imageSmoothingQuality = 'medium';

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

      this.frames = new Array(this.frameCount);

      await this._bootstrapFrames();

      this._setupCanvases();
      this._forceRender(0);
      this._setupScrollTrigger();
      this.isReady = true;
      this._inView = true;
      this.attachToTicker();

      if (this.onReady) this.onReady(this.frameCount);

      this._startBackgroundPreload();
    } catch (err) {
      console.error('[TigerExperience]', err.message);
      if (this.onError) this.onError(err);
    }
  }

  destroy() {
    this.detachFromTicker();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('wheel', this._markInteracting);
    window.removeEventListener('touchstart', this._markInteracting);
    window.removeEventListener('touchmove', this._markInteracting);
    if (this.scrollTrigger) this.scrollTrigger.kill();
    clearTimeout(this._scrollIdleTimer);
    this.frames = [];
    this.isReady = false;
    this._preloadRunning = false;
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
    if (this.frames[index]?.naturalWidth) {
      return Promise.resolve({ index, img: this.frames[index] });
    }

    const cached = this._probeCache.get(index);
    if (cached && cached.naturalWidth) {
      this.frames[index] = cached;
      return Promise.resolve({ index, img: cached });
    }

    if (this._loadingIndices.has(index)) {
      return new Promise((resolve, reject) => {
        const check = () => {
          if (this.frames[index]?.naturalWidth) {
            resolve({ index, img: this.frames[index] });
            return;
          }
          if (!this._loadingIndices.has(index)) {
            reject(new Error(`Frame ${index + 1} load aborted`));
            return;
          }
          setTimeout(check, 24);
        };
        check();
      });
    }

    this._loadingIndices.add(index);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';

      img.onload = () => {
        this._loadingIndices.delete(index);
        this._probeCache.set(index, img);
        resolve({ index, img });
      };

      img.onerror = () => {
        if (attempt < TigerExperience.LOAD_RETRIES) {
          const delay = 150 * (attempt + 1);
          setTimeout(() => {
            this._loadFrame(index, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
          return;
        }
        this._loadingIndices.delete(index);
        reject(new Error(`Failed to load frame ${index + 1}: ${this._frameSrc(index)}`));
      };

      const suffix = attempt > 0 ? `?r=${attempt}` : '';
      img.src = `${this._frameSrc(index)}${suffix}`;
    });
  }

  async _loadBatch(indices) {
    const pending = indices.filter((i) => !this.frames[i]?.naturalWidth);
    if (pending.length === 0) return 0;

    const results = await Promise.all(pending.map((index) => this._loadFrame(index)));

    for (const { index, img } of results) {
      this.frames[index] = img;
    }

    return results.length;
  }

  async _bootstrapFrames() {
    const quickStart = Math.min(TigerExperience.BOOTSTRAP_COUNT, this.frameCount);

    for (let start = 0; start < quickStart; start += 10) {
      const end = Math.min(start + 10, quickStart);
      const indices = Array.from({ length: end - start }, (_, i) => start + i);
      await this._loadBatch(indices);
    }
  }

  _reportProgress() {
    if (!this.onProgress) return;

    const loaded = this.frames.reduce(
      (count, frame) => count + (frame?.naturalWidth ? 1 : 0),
      0
    );
    this.onProgress(loaded / this.frameCount);
  }

  _getPlayheadIndex() {
    const last = this.frameCount - 1;
    const playhead = Math.max(this.targetProgress, this.displayProgress);
    return Math.min(Math.round(playhead * last), last);
  }

  _getPlayheadPriority() {
    const center = this._getPlayheadIndex();
    const last = this.frameCount - 1;
    const priority = [];
    const seen = new Set();

    const push = (index) => {
      if (index < 0 || index > last || seen.has(index)) return;
      if (this.frames[index]?.naturalWidth) return;
      seen.add(index);
      priority.push(index);
    };

    for (let offset = 0; offset <= TigerExperience.PLAYHEAD_AHEAD; offset++) {
      push(center + offset);
      if (offset > 0) push(center - offset);
    }

    for (let i = 0; i < this.frameCount; i++) {
      if (!seen.has(i) && !this.frames[i]?.naturalWidth) {
        priority.push(i);
      }
    }

    return priority;
  }

  _needsPlayheadFrames() {
    const center = this._getPlayheadIndex();
    const last = this.frameCount - 1;

    for (let i = center; i <= Math.min(center + 4, last); i++) {
      if (!this.frames[i]?.naturalWidth) return true;
    }

    return false;
  }

  _getPreloadPriority() {
    return this._getPlayheadPriority();
  }

  _startBackgroundPreload() {
    if (this._preloadRunning) return;
    this._preloadRunning = true;
    this._reportProgress();
    this._preloadLoop();
  }

  async _preloadLoop() {
    while (this._preloadRunning) {
      const missing = this._getPlayheadPriority();
      if (missing.length === 0) break;

      const batchSize = this._isInteracting
        ? TigerExperience.PRELOAD_BATCH_ACTIVE
        : TigerExperience.PRELOAD_BATCH_IDLE;

      const batch = missing.slice(0, batchSize);

      try {
        await this._loadBatch(batch);
      } catch (err) {
        console.warn('[TigerExperience]', err.message);
      }

      this._reportProgress();

      if (this._isInteracting) {
        await this._wait(16);
      } else {
        await this._waitForIdle();
      }
    }

    this._preloadComplete = true;
    this.fgCtx.imageSmoothingQuality = 'high';
    this.ambCtx.imageSmoothingQuality = 'high';
    this._reportProgress();
    this._forceRender(this.displayProgress);

    if (this.onFullyLoaded) this.onFullyLoaded(this.frameCount);
  }

  _kickPlayheadPreload() {
    if (!this._preloadRunning || this._preloadComplete || this._urgentPreloadActive) return;
    if (!this._needsPlayheadFrames()) return;

    const center = this._getPlayheadIndex();
    const urgent = [];

    for (let i = center; i <= Math.min(center + 2, this.frameCount - 1); i++) {
      if (!this.frames[i]?.naturalWidth && !this._loadingIndices.has(i)) {
        urgent.push(i);
      }
    }

    if (urgent.length === 0) return;

    this._urgentPreloadActive = true;

    this._loadBatch(urgent)
      .then(() => {
        this._reportProgress();
        this._stateA = -1;
      })
      .finally(() => {
        this._urgentPreloadActive = false;
      });
  }

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _waitForIdle() {
    if (typeof requestIdleCallback === 'function') {
      return new Promise((resolve) => {
        requestIdleCallback(() => resolve(), { timeout: 120 });
      });
    }

    return this._wait(32);
  }

  _markInteracting() {
    this._isInteracting = true;
    clearTimeout(this._scrollIdleTimer);
    this._scrollIdleTimer = setTimeout(() => {
      this._isInteracting = false;
    }, TigerExperience.SCROLL_IDLE_MS);
  }

  _getLoadedFrame(index) {
    const last = this.frameCount - 1;
    const clamped = Math.min(Math.max(index, 0), last);
    const direct = this.frames[clamped];

    if (direct?.naturalWidth) return direct;

    for (let i = clamped - 1; i >= 0; i--) {
      if (this.frames[i]?.naturalWidth) return this.frames[i];
    }

    for (let i = clamped + 1; i < this.frameCount; i++) {
      if (this.frames[i]?.naturalWidth) return this.frames[i];
    }

    return null;
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
    const maxDpr = window.innerWidth < 768 ? 1.25 : 1.75;
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
        this._markInteracting();
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
    if (!this.isReady) return;

    const heroProgress = this.scrollTrigger?.progress ?? 0;
    if (heroProgress > 1.02) return;

    if (this._reducedMotion) {
      this.displayProgress = this.targetProgress;
    } else {
      const delta = this.targetProgress - this.displayProgress;
      if (Math.abs(delta) > 0.0001) {
        this.displayProgress += delta * 0.22;
        this._markInteracting();
      } else {
        this.displayProgress = this.targetProgress;
      }
    }

    const { frameA, frameB, blend } = this._getFrameIndices(this.displayProgress);

    if (frameB > frameA && !this.frames[frameB]?.naturalWidth) {
      this._kickPlayheadPreload();
    }

    if (!this._shouldRedraw(frameA, frameB, blend)) return;

    this._stateA = frameA;
    this._stateB = frameB;
    this._stateBlend = blend;

    this._paintCrossfade(this.fgCtx, this.fgSize, frameA, frameB, blend);

    if (this._preloadComplete) {
      this._paintCrossfade(this.ambCtx, this.ambSize, frameA, frameB, blend);
    }
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

    if (this._preloadComplete) {
      this._paintCrossfade(this.ambCtx, this.ambSize, frameA, frameB, blend);
    }
  }

  _getCoverMetrics(cw, ch) {
    const key = `${cw}x${ch}`;

    if (!this._metricsCache) {
      this._metricsCache = {};
    }

    if (this._metricsCache[key]) {
      return this._metricsCache[key];
    }

    const ref = this._getLoadedFrame(0);
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
    const imgA = this._getLoadedFrame(frameA);
    if (!imgA) return;

    const { width: cw, height: ch } = size;
    const { dx, dy, dw, dh } = this._getCoverMetrics(cw, ch);

    if (frameA === frameB || blend < TigerExperience.BLEND_EPSILON) {
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, dx, dy, dw, dh);
      return;
    }

    const imgB = this._getLoadedFrame(frameB);
    if (!imgB || imgB === imgA) {
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
    this._markInteracting = this._markInteracting.bind(this);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('wheel', this._markInteracting, { passive: true });
    window.addEventListener('touchstart', this._markInteracting, { passive: true });
    window.addEventListener('touchmove', this._markInteracting, { passive: true });
  }

  _debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
}
