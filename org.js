/* The organizer: open a drawer, its parts show; pick one and it flies to the bench. */
(() => {
  const grid = document.getElementById('orggrid');
  const bench = document.getElementById('bench');
  const card = document.getElementById('benchCard');
  const name = document.getElementById('benchName');
  const spec = document.getElementById('benchSpec');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!grid || !bench || !card) return;

  function fill(part) {
    name.textContent = part.textContent;
    spec.innerHTML =
      `<div><dt>Role</dt><dd>${part.dataset.role}</dd></div>` +
      `<div><dt>Package</dt><dd>${part.dataset.pkg}</dd></div>` +
      `<div><dt>Note</dt><dd>${part.dataset.note}</dd></div>`;
    bench.querySelector('.bench__hint').hidden = true;
    card.hidden = false;
  }

  function fly(part) {
    fill(part);
    if (reduced) return;
    const src = part.getBoundingClientRect();
    const ghost = part.cloneNode();
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.cssText = `position:fixed;z-index:500;left:${src.left}px;top:${src.top}px;width:${src.width}px;height:${src.height}px;margin:0;pointer-events:none;transition:transform 420ms cubic-bezier(0.16,1,0.3,1),opacity 420ms ease;transform-origin:top left;`;
    document.body.appendChild(ghost);
    const dst = card.getBoundingClientRect();
    const dx = dst.left + 8 - src.left, dy = dst.top + 8 - src.top;
    void ghost.offsetWidth;
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
    ghost.style.opacity = '0';
    ghost.addEventListener('transitionend', () => ghost.remove(), { once: true });
  }

  grid.addEventListener('click', (e) => {
    const part = e.target.closest('.part');
    if (part && part.closest('.drawer').classList.contains('is-open')) {
      grid.querySelectorAll('.part.is-on').forEach((p) => p.classList.remove('is-on'));
      part.classList.add('is-on');
      bench.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      requestAnimationFrame(() => fly(part));
      return;
    }
    const d = e.target.closest('.drawer');
    if (d) {
      grid.querySelectorAll('.drawer.is-open').forEach((x) => { if (x !== d) x.classList.remove('is-open'); });
      d.classList.toggle('is-open');
    }
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest('.drawer, .part');
    if (t) { e.preventDefault(); t.click(); }
  });
})();
