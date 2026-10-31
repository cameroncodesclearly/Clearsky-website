// Scroll-driven sunrise for <SunRise />. Progress runs from 0, as the top of the
// headline enters the bottom of the screen, to 1 once it reaches the middle.
// The sun climbs from behind the headline's last line to sit just above it.
const rigs = [...document.querySelectorAll<HTMLElement>('[data-sunrise]')];
if (rigs.length) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = (t: number) => 1 - Math.pow(1 - t, 2.2);
  const visible = new Set<HTMLElement>();
  const update = () => {
    const vh = window.innerHeight;
    for (const rig of rigs) {
      if (!visible.has(rig) && !reduce) continue;
      // The headline follows the rig (Astro may put this script tag in between).
      let headline = rig.nextElementSibling as HTMLElement | null;
      while (headline?.tagName === 'SCRIPT') headline = headline.nextElementSibling as HTMLElement | null;
      if (!headline) continue;
      const top = headline.getBoundingClientRect().top;
      const p = reduce ? 1 : ease(Math.min(1, Math.max(0, (vh - top) / (vh * 0.5))));
      const d = rig.querySelector<HTMLElement>('.sunrise__sun')!.offsetWidth;
      // Centre of the sun, in the rig's coordinates (the rig starts where the
      // headline's box does, so offsetTop is the headline's top).
      const start = headline.offsetTop + headline.offsetHeight + d * 0.2;
      const end = headline.offsetTop - d * 0.42;
      const centre = start + (end - start) * p;
      rig.parentElement!.style.setProperty('--p', p.toFixed(3));
      rig.style.setProperty('--y', `${(centre - d / 2).toFixed(1)}px`);
    }
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement);
    update();
  }, { rootMargin: '20% 0px' });
  rigs.forEach((r) => io.observe(r));
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}
