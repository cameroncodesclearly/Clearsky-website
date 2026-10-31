// Clouds pass upward at their own depth as the page scrolls, with a slow
// sideways drift. Each cloud wraps around once it leaves the top of the screen.
// Scroll depth also drives --sunset on the sky: daytime until about halfway down
// the page, then easing into full sunset just as the footer reaches the top of
// the screen, so the sky has fully turned by the time it meets the beach video.
const layer = document.querySelector<HTMLElement>('[data-sky-clouds]');
const sky = layer?.parentElement;
if (layer && sky) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clouds = [...layer.querySelectorAll<HTMLImageElement>('img')].map((el) => ({
    el,
    y: Number(el.dataset.y) / 100, // start height, in viewport heights
    depth: Number(el.dataset.depth),
    x: el.style.getPropertyValue('--x'),
  }));
  const footer = document.querySelector<HTMLElement>('footer');
  const header = document.querySelector<HTMLElement>('[data-header]');
  const t0 = performance.now();
  const smooth = (t: number) => t * t * (3 - 2 * t);
  let lastSunset = '';
  const draw = (now: number) => {
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const start = max * 0.45;
    const end = Math.max(start + 1, Math.min(max, footer ? footer.offsetTop - vh * 0.15 : max));
    const sunset = smooth(Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)))).toFixed(3);
    if (sunset !== lastSunset) {
      lastSunset = sunset;
      sky.style.setProperty('--sunset', sunset);
      // Light header text once the dusk sky is dark enough.
      header?.classList.toggle('on-dusk', Number(sunset) > 0.55);
    }
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
