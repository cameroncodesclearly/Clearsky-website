// Clouds pass upward at their own depth as the page scrolls, with a slow
// sideways drift. Each cloud wraps around once it leaves the top of the screen.
const layer = document.querySelector<HTMLElement>('[data-sky-clouds]');
if (layer) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clouds = [...layer.querySelectorAll<HTMLImageElement>('img')].map((el) => ({
    el,
    y: Number(el.dataset.y) / 100, // start height, in viewport heights
    depth: Number(el.dataset.depth),
    x: el.style.getPropertyValue('--x'),
  }));
  const t0 = performance.now();
  const draw = (now: number) => {
    const vh = window.innerHeight;
    const loop = vh * 2.4; // one full lap of the cloud field
    const drift = reduce ? 0 : (now - t0) / 1000;
    for (const c of clouds) {
      const h = c.el.offsetHeight || 200;
      let y = (c.y * vh - window.scrollY * c.depth) % loop;
      if (y < -h) y += loop;
      // Sideways: a little with the scroll, a little with the wind.
      const dx = window.scrollY * c.depth * 0.06 + drift * (4 + c.depth * 10);
      c.el.style.translate = `calc(${c.x} + ${(dx % (window.innerWidth * 1.4)).toFixed(1)}px) ${y.toFixed(1)}px`;
    }
    if (!reduce) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  if (reduce) window.addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true });
}
