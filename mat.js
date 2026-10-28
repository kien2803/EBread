/* The mat: a metric grid, a live ruler, old scars, and cuts that heal. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MM = 96 / 25.4;                 /* px per mm */
  const MINOR = 10 * MM;                /* 10 mm minor grid */
  const MAJOR = 50 * MM;                /* 50 mm major grid */
  const RULER = 30;                     /* left ruler strip, px */
  const HEAL = reduced ? 500 : 3400;    /* ms from open cut to closed */
  const MAX_CUTS = 48;

  const toMM = (px) => px / MM;
  const fmt = (v) => v.toFixed(1).padStart(6, '0');

  const base = document.getElementById('mat');
  const top = document.getElementById('cuts');
  const bctx = base.getContext('2d');
  const tctx = top.getContext('2d');
  const rx = document.getElementById('rx');
  const ry = document.getElementById('ry');

  const ink = 'rgba(240, 250, 244, 1)';
  const cuts = [];
  const scars = [];
  let dpr = 1, vw = 0, vh = 0, active = null, lastPointer = null;
  let baseDirty = true, cutRaf = 0;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth; vh = innerHeight;
    for (const c of [base, top]) {
      c.width = Math.round(vw * dpr);
      c.height = Math.round(vh * dpr);
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    seedScars();
    baseDirty = true;
    renderBase();
  }

  function seedScars() {
    if (scars.length) return;
    const docH = Math.max(document.body.scrollHeight, vh);
    const n = Math.round(docH / 420);
    for (let i = 0; i < n; i++) {
      const x = RULER + Math.random() * (vw - RULER - 80) + 20;
      const y = Math.random() * docH;
      const len = 30 + Math.random() * 130;
      const a = Math.random() * Math.PI;
      const pts = [{ x, y }];
      const segs = 1 + Math.floor(Math.random() * 3);
      for (let s = 0; s < segs; s++) {
        const prev = pts[pts.length - 1];
        const da = a + (Math.random() - 0.5) * 0.6;
        pts.push({ x: prev.x + Math.cos(da) * len / segs, y: prev.y + Math.sin(da) * len / segs });
      }
      scars.push({ pts, alpha: 0.05 + Math.random() * 0.07 });
    }
  }

  /* ---------- static layer: grid, ruler, diagonals, scars ---------- */

  function renderBase() {
    if (!baseDirty) return;
    baseDirty = false;
    const sy = scrollY;
    bctx.clearRect(0, 0, vw, vh);

    const docTop = sy, docBot = sy + vh;

    /* 45-degree guides */
    const diagStep = MAJOR;
    bctx.strokeStyle = 'rgba(238, 250, 242, 0.05)';
    bctx.lineWidth = 1;
    bctx.beginPath();
    for (let d = -vh; d < vw + vh; d += diagStep) {
      const off = d - (docTop % diagStep);
      bctx.moveTo(off, 0);
      bctx.lineTo(off + vh, vh);
    }
    bctx.stroke();

    /* minor + major grid, attached to the document */
    const x0 = RULER;
    const y0 = Math.floor(docTop / MINOR) * MINOR;
    const y1 = Math.floor(docTop / MAJOR) * MAJOR;
    bctx.lineWidth = 1;
    bctx.strokeStyle = 'rgba(238, 250, 242, 0.10)';
    bctx.beginPath();
    for (let x = x0; x < vw; x += MINOR) { bctx.moveTo(x, 0); bctx.lineTo(x, vh); }
    for (let y = y0; y < docBot + MINOR; y += MINOR) { const cy = y - docTop; bctx.moveTo(x0, cy); bctx.lineTo(vw, cy); }
    bctx.stroke();
    bctx.strokeStyle = 'rgba(238, 250, 242, 0.22)';
    bctx.beginPath();
    for (let x = x0; x < vw; x += MAJOR) { bctx.moveTo(x, 0); bctx.lineTo(x, vh); }
    for (let y = y1; y < docBot + MAJOR; y += MAJOR) { const cy = y - docTop; bctx.moveTo(x0, cy); bctx.lineTo(vw, cy); }
    bctx.stroke();

    /* old healed scars */
    for (const s of scars) {
      if (s.pts[0].y < docTop - 200 || s.pts[0].y > docBot + 200) continue;
      bctx.strokeStyle = `rgba(238, 250, 242, ${s.alpha})`;
      bctx.lineWidth = 1;
      bctx.beginPath();
      bctx.moveTo(s.pts[0].x, s.pts[0].y - docTop);
      for (let i = 1; i < s.pts.length; i++) bctx.lineTo(s.pts[i].x, s.pts[i].y - docTop);
      bctx.stroke();
    }

    /* the ruler strip */
    bctx.fillStyle = 'rgba(6, 18, 11, 0.30)';
    bctx.fillRect(0, 0, RULER, vh);
    bctx.strokeStyle = 'rgba(238, 250, 242, 0.5)';
    bctx.beginPath();
    bctx.moveTo(RULER - 0.5, 0); bctx.lineTo(RULER - 0.5, vh);
    bctx.stroke();

    /* ticks every 10 mm, longer at 50, numbered at 100 */
    const ty0 = Math.floor(docTop / MINOR) * MINOR;
    bctx.strokeStyle = 'rgba(238, 250, 242, 0.55)';
    bctx.fillStyle = 'rgba(238, 250, 242, 0.6)';
    bctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
    bctx.textAlign = 'right';
    bctx.textBaseline = 'middle';
    for (let y = ty0; y < docBot + MINOR; y += MINOR) {
      const cy = Math.round(y - docTop) + 0.5;
      const mm = Math.round(toMM(y));
      const long = mm % 50 === 0;
      bctx.beginPath();
      bctx.moveTo(RULER - 1, cy); bctx.lineTo(RULER - (long ? 12 : 7), cy);
      bctx.stroke();
      if (mm > 0 && mm % 100 === 0) {
        bctx.save();
        bctx.translate(9, cy);
        bctx.rotate(-Math.PI / 2);
        bctx.fillText(String(mm), 0, 0);
        bctx.restore();
      }
    }
  }

  /* ---------- top layer: cuts that heal ---------- */

  function stroke(pts, sy) {
    tctx.moveTo(pts[0].x, pts[0].y - sy);
    for (let i = 1; i < pts.length; i++) tctx.lineTo(pts[i].x, pts[i].y - sy);
  }

  function frame(now) {
    cutRaf = 0;
    const sy = scrollY;
    tctx.clearRect(0, 0, vw, vh);
    tctx.lineCap = 'round';
    tctx.lineJoin = 'round';
    for (let i = cuts.length - 1; i >= 0; i--) {
      const c = cuts[i];
      const life = 1 - (now - c.born) / HEAL;
      if (life <= 0 || c.pts.length < 1) { cuts.splice(i, 1); continue; }
      const a = Math.min(1, life * 1.25);
      /* the dark channel the blade opened */
      tctx.strokeStyle = `rgba(6, 16, 10, ${0.85 * a})`;
      tctx.lineWidth = 0.4 + 3.4 * life;
      tctx.beginPath(); stroke(c.pts, sy); tctx.stroke();
      /* the bright lip of the slit, closing first */
      tctx.strokeStyle = `rgba(240, 250, 244, ${0.8 * life})`;
      tctx.lineWidth = Math.max(0.5, 1.6 * life);
      tctx.beginPath(); stroke(c.pts, sy); tctx.stroke();
      /* the stab mark where the blade went in */
      if (life > 0.55) {
        const p = c.pts[0], r = 5 * (life - 0.55) / 0.45 + 1;
        tctx.strokeStyle = `rgba(240, 250, 244, ${0.9 * life})`;
        tctx.lineWidth = 1;
        tctx.beginPath();
        tctx.moveTo(p.x - r, p.y - sy); tctx.lineTo(p.x + r, p.y - sy);
        tctx.moveTo(p.x, p.y - sy - r); tctx.lineTo(p.x, p.y - sy + r);
        tctx.stroke();
      }
    }
    if (cuts.length) cutRaf = requestAnimationFrame(frame);
  }

  function ensureLoop() { if (!cutRaf) cutRaf = requestAnimationFrame(frame); }

  /* ---------- cutting ---------- */

  function down(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.pointerType === 'touch') return; /* a swipe scrolls, it does not cut */
    if (e.target.closest && e.target.closest('.viewer')) return; /* a drag there turns the board, not the blade */
    const p = { x: e.clientX, y: e.clientY + scrollY };
    const cut = { pts: [p, { ...p }], born: performance.now() };
    cuts.push(cut);
    if (cuts.length > MAX_CUTS) cuts.splice(0, cuts.length - MAX_CUTS);
    active = { id: e.pointerId, cut };
    ensureLoop();
  }

  function move(e) {
    lastPointer = { x: e.clientX, y: e.clientY };
    updateReadout();
    if (!active || e.pointerId !== active.id) return;
    const p = { x: e.clientX, y: e.clientY + scrollY };
    const pts = active.cut.pts, last = pts[pts.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 3) {
      active.cut.born = performance.now(); /* a live cut stays open while you drag */
      pts.push(p);
      const px = pts.reduce((s, q, i) => i ? s + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0, 0);
      rx.textContent = 'cut ' + fmt(toMM(px));
    }
  }

  function up(e) { if (active && e.pointerId === active.id) active = null; }

  /* ---------- readout ---------- */

  function updateReadout() {
    if (!lastPointer) return;
    if (!active) {
      rx.textContent = 'x ' + fmt(toMM(lastPointer.x - RULER));
      ry.textContent = 'y ' + fmt(toMM(lastPointer.y + scrollY));
    } else {
      ry.textContent = 'mm';
    }
  }

  /* ---------- chrome ---------- */

  const bar = document.querySelector('.bar');
  let lastY = scrollY;
  function onScroll() {
    baseDirty = true;
    renderBase();
    const y = scrollY;
    bar.classList.toggle('is-hidden', y > lastY && y > 140);
    lastY = y;
    if (lastPointer) updateReadout();
    if (cuts.length) ensureLoop();
  }

  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-draw]').forEach((el) => io.observe(el));

  addEventListener('resize', resize, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('pointerdown', down);
  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
  document.addEventListener('mouseleave', up);

  resize();
})();
