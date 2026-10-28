/* The organizer: open a drawer, its parts show; pick one and it lands on the bench. */
(() => {
  const grid = document.getElementById('orggrid');
  const bench = document.getElementById('bench');
  const card = document.getElementById('benchCard');
  const name = document.getElementById('benchName');
  const spec = document.getElementById('benchSpec');
  if (!grid || !bench || !card) return;

  grid.addEventListener('click', (e) => {
    const part = e.target.closest('.part');
    if (part && part.closest('.drawer').classList.contains('is-open')) {
      grid.querySelectorAll('.part.is-on').forEach((p) => p.classList.remove('is-on'));
      part.classList.add('is-on');
      name.textContent = part.textContent;
      spec.innerHTML =
        `<div><dt>Role</dt><dd>${part.dataset.role}</dd></div>` +
        `<div><dt>Package</dt><dd>${part.dataset.pkg}</dd></div>` +
        `<div><dt>Note</dt><dd>${part.dataset.note}</dd></div>`;
      card.hidden = false;
      bench.querySelector(".bench__hint").hidden = true;
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = '';
      bench.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
