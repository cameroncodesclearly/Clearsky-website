// Measures where the sun starts and finishes for <SunRise />: from just below
// the headline's last line to sitting above its first. The climb itself is a
// scroll-driven CSS animation; this only re-measures on resize. Browsers
// without scroll timelines get --p (0 to 1) from here on scroll instead.
const rigs = [...document.querySelectorAll<HTMLElement>('[data-sunrise]')];
const scrollTimelines = CSS.supports('animation-timeline: view()');

const headlineOf = (rig: HTMLElement) => {
  // The headline follows the rig (Astro may put this script tag in between).
  let el = rig.nextElementSibling as HTMLElement | null;
  while (el?.tagName === 'SCRIPT') el = el.nextElementSibling as HTMLElement | null;
  return el;
};

const measure = () => {
  for (const rig of rigs) {
    const headline = headlineOf(rig);
    if (!headline) continue;
    const d = rig.querySelector<HTMLElement>('.sunrise__sun')!.offsetWidth;
    // Rig coordinates: the rig starts where the headline's box does, so
    // offsetTop is the headline's top.
    const start = headline.offsetTop + headline.offsetHeight + d * 0.2 - d / 2;
    const end = headline.offsetTop - d * 0.42 - d / 2;
    rig.style.setProperty('--y0', `${start.toFixed(1)}px`);
    rig.style.setProperty('--y1', `${end.toFixed(1)}px`);
  }
};

if (rigs.length) {
  measure();
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  if (!scrollTimelines && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let queued = false;
    const scrub = () => {
      queued = false;
      const vh = window.innerHeight;
      for (const rig of rigs) {
        const headline = headlineOf(rig);
        if (!headline) continue;
        const top = headline.getBoundingClientRect().top;
        if (top > vh * 1.2 || top < -vh) continue;
        const p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.5)));
        rig.parentElement!.style.setProperty('--p', p.toFixed(3));
      }
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(scrub); }
    }, { passive: true });
    scrub();
  }
}
