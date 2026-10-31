// Measures where the sun starts and finishes for <SunRise />: from below the
// bottom of the pinned stage to sitting just above the headline. The climb
// itself is a scroll-driven CSS animation; this only re-measures on resize.
// Browsers without scroll timelines get --p (0 to 1) from here on scroll.
const rigs = [...document.querySelectorAll<HTMLElement>('[data-sunrise]')];
const scrollTimelines = CSS.supports('animation-timeline: view()');

const measure = () => {
  for (const rig of rigs) {
    const stage = rig.parentElement!;
    const headline = stage.querySelector<HTMLElement>('h1, h2');
    if (!headline) continue;
    const d = rig.querySelector<HTMLElement>('.sunrise__sun')!.offsetWidth;
    // The rig fills the stage, so stage offsets are rig offsets.
    rig.style.setProperty('--y0', `${(stage.clientHeight + d * 0.1).toFixed(1)}px`);
    rig.style.setProperty('--y1', `${(headline.offsetTop - d * 0.42 - d / 2).toFixed(1)}px`);
  }
};

if (rigs.length) {
  measure();
  window.addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  if (!scrollTimelines && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Same window as the CSS: 15% to 90% of the pinned stretch.
    let queued = false;
    const scrub = () => {
      queued = false;
      for (const rig of rigs) {
        const box = rig.closest<HTMLElement>('[data-rise]');
        if (!box) continue;
        const r = box.getBoundingClientRect();
        const q = -r.top / Math.max(1, r.height - window.innerHeight);
        const p = Math.min(1, Math.max(0, (q - 0.15) / 0.75));
        box.style.setProperty('--p', p.toFixed(3));
      }
    };
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(scrub); }
    }, { passive: true });
    scrub();
  }
}
