/* The organizer: pick a drawer, it slides open and its parts land on the bench. */
(() => {
  const grid = document.getElementById('orggrid');
  const bench = document.getElementById('bench');
  const rows = document.getElementById('benchRows');
  if (!grid || !bench || !rows) return;

  function openDrawer(d) {
    grid.querySelectorAll('.drawer.is-open').forEach((x) => x.classList.remove('is-open'));
    d.classList.add('is-open');
    const tpl = d.querySelector('template');
    if (tpl) rows.innerHTML = tpl.innerHTML;
    bench.classList.add('is-on');
    bench.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  grid.addEventListener('click', (e) => {
    const d = e.target.closest('.drawer');
    if (d) openDrawer(d);
  });
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const d = e.target.closest('.drawer');
    if (d) { e.preventDefault(); openDrawer(d); }
  });
})();
