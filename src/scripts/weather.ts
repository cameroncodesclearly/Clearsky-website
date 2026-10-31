// Live weather for the homepage sky. Fetches the visitor's conditions from
// /api/sky, then drives --wx (weather strength) from scroll: full until the
// headline locks in place, then clearing over the first 40% of the locked
// stretch as the sun starts to rise behind it.
// Rain and snow are drawn on a canvas; storms add the odd lightning flash.
// Preview any look with ?sky=rain&phase=night (sky: clear, partly, overcast,
// rain, storm, snow, fog; phase: morning, afternoon, sunset, night).
import type { Sky } from '../pages/api/sky';

const sky = document.querySelector<HTMLElement>('.sky');
const rise = document.querySelector<HTMLElement>('[data-rise]');
const headline = rise?.querySelector<HTMLElement>('h2') ?? null;
if (sky && rise) {
  const root = document.documentElement;
  const header = document.querySelector<HTMLElement>('[data-header]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = sky.querySelector<HTMLCanvasElement>('[data-sky-precip]')!;
  const flash = sky.querySelector<HTMLElement>('[data-sky-flash]')!;

  const load = async (): Promise<Sky> => {
    const q = new URLSearchParams(location.search);
    if (q.get('sky') || q.get('phase')) {
      return { condition: (q.get('sky') as Sky['condition']) || 'clear', intensity: Number(q.get('intensity') || 1), phase: (q.get('phase') as Sky['phase']) || 'afternoon' };
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem('cs-sky') || 'null');
      if (saved && Date.now() - saved.at < 15 * 60 * 1000) return saved.sky;
    } catch {}
    const res = await fetch('/api/sky');
    if (!res.ok) throw new Error(String(res.status));
    const fresh: Sky = await res.json();
    try { sessionStorage.setItem('cs-sky', JSON.stringify({ at: Date.now(), sky: fresh })); } catch {}
    return fresh;
  };

  load()
    .then((s) => start(s))
    .catch(() => {}); // no weather: the default pastel sky stays as it is

  function start(s: Sky) {
    sky!.dataset.weather = s.condition;
    sky!.dataset.phase = s.phase;
    const dark = s.phase === 'night' || s.condition === 'storm';
    root.classList.toggle('sky-dark', dark);

    // Weather strength from scroll ------------------------------------------------
    // Written only to the sky and the headline, and only when it changes, so a
    // scroll never restyles the rest of the page.
    let wx = 1, written = '';
    let queued = false;
    const update = () => {
      queued = false;
      const r = rise!.getBoundingClientRect();
      const q = -r.top / Math.max(1, r.height - window.innerHeight); // 0 when locked, 1 when released
      wx = 1 - Math.min(1, Math.max(0, q / 0.4));
      const value = wx.toFixed(3);
      if (value === written) return;
      written = value;
      sky!.style.setProperty('--wx', value);
      headline?.style.setProperty('--wx', value);
      header?.classList.toggle('on-dark-sky', dark && wx > 0.5);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);

    if (reduce || !['rain', 'storm', 'snow'].includes(s.condition)) return;

    // Precipitation ---------------------------------------------------------------
    const ctx = canvas.getContext('2d')!;
    const snow = s.condition === 'snow';
    const amount = (snow ? 140 : s.condition === 'storm' ? 380 : 240) * s.intensity;
    type Drop = { x: number; y: number; v: number; l: number; r: number; p: number };
    let drops: Drop[] = [];
    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(amount * Math.min(1, (w * h) / (1440 * 900)) + amount * 0.25);
      drops = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        v: snow ? 0.5 + Math.random() * 1.1 : 14 + Math.random() * 10,
        l: 10 + Math.random() * 16, r: 1 + Math.random() * 2.2, p: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    const wind = s.condition === 'storm' ? 0.32 : 0.16;
    let nextFlash = performance.now() + 4000 + Math.random() * 6000;
    const frame = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      if (wx > 0.01) {
        if (snow) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          for (const d of drops) {
            d.y += d.v; d.x += Math.sin(now / 1400 + d.p) * 0.5;
            if (d.y > h + 4) { d.y = -4; d.x = Math.random() * w; }
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.strokeStyle = 'rgba(214, 226, 242, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (const d of drops) {
            d.y += d.v; d.x -= d.v * wind;
            if (d.y > h + d.l) { d.y = -d.l; d.x = Math.random() * (w + 200); }
            ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * wind, d.y - d.l);
          }
          ctx.stroke();
        }
        // Lightning: a quick double flicker every few seconds while the storm is up.
        if (s.condition === 'storm' && now > nextFlash) {
          nextFlash = now + 5000 + Math.random() * 9000;
          if (wx > 0.4) {
            flash.animate(
              [{ opacity: 0 }, { opacity: 0.55 * wx }, { opacity: 0.1 }, { opacity: 0.4 * wx }, { opacity: 0 }],
              { duration: 420, easing: 'ease-out' },
            );
          }
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
