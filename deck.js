/* The deck: one line of boards; the picked one grows, centres, shows its spec.
 * The line drifts slowly until pointed at, and a search field filters the boards. */
(() => {
  const deck = document.getElementById('deck');
  if (!deck) return;
  const boards = [...deck.querySelectorAll('.board')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const find = document.getElementById('find');
  const driftBtn = document.getElementById('drift');

  const mk = (cls, label) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label);
    b.appendChild(document.createElement('span'));
    return b;
  };

  const visible = () => boards.filter((b) => !b.hidden);

  function select(i, quiet) {
    boards.forEach((b, j) => {
      b.classList.toggle('is-on', i === j);
      b.querySelectorAll('.board__nav').forEach((n) => n.remove());
    });
    const b = boards[i];
    if (b.hidden) return;
    if (!quiet) requestAnimationFrame(() =>
      b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' }));
    const vs = visible(), vi = vs.indexOf(b);
    if (vi > 0) {
      const p = mk('board__nav board__nav--prev', 'Previous board');
      p.addEventListener('click', (e) => { e.stopPropagation(); select(boards.indexOf(vs[vi - 1])); });
      b.prepend(p);
    }
    if (vi < vs.length - 1) {
      const n = mk('board__nav board__nav--next', 'Next board');
      n.addEventListener('click', (e) => { e.stopPropagation(); select(boards.indexOf(vs[vi + 1])); });
      b.append(n);
    }
  }

  deck.addEventListener('click', (e) => {
    const f = e.target.closest('.board');
    if (f && !f.hidden) select(boards.indexOf(f));
  });
  deck.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const f = e.target.closest('.board');
    if (f && !f.hidden) { e.preventDefault(); select(boards.indexOf(f)); }
  });

  /* search: keep the boards matching name or spec */
  if (find) find.addEventListener('input', () => {
    const q = find.value.trim().toLowerCase();
    boards.forEach((b) => { b.hidden = q && !b.textContent.toLowerCase().includes(q); });
    const vs = visible();
    const on = boards.find((b) => b.classList.contains('is-on') && !b.hidden);
    if (!on && vs.length) select(boards.indexOf(vs[0]), true);
  });

  /* the drift: a slow slide, pausable */
  let held = reduced, hover = false, focus = false, seen = false, dir = 1, raf = 0, last = 0;
  const running = () => seen && !hover && !focus && !held;
  function step(t) {
    raf = 0;
    if (!running()) return;
    const dt = Math.min(50, t - last); last = t;
    deck.scrollLeft += dir * dt * 0.03;
    const max = deck.scrollWidth - deck.clientWidth - 1;
    if (deck.scrollLeft >= max) dir = -1;
    else if (deck.scrollLeft <= 0) dir = 1;
    raf = requestAnimationFrame(step);
  }
  const sync = () => {
    if (running() && !raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    if (driftBtn) {
      driftBtn.textContent = held ? 'Drift' : 'Pause';
      driftBtn.setAttribute('aria-pressed', String(!held));
    }
  };
  if (driftBtn) driftBtn.addEventListener('click', () => { held = !held; sync(); });
  deck.addEventListener('pointerenter', () => { hover = true; });
  deck.addEventListener('pointerleave', () => { hover = false; sync(); });
  deck.addEventListener('focusin', () => { focus = true; });
  deck.addEventListener('focusout', () => { focus = false; sync(); });
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }).observe(deck);
  if (reduced && driftBtn) driftBtn.textContent = 'Drift';

  select(Math.max(0, boards.findIndex((b) => b.classList.contains('is-on'))), true);
  sync();
})();
