import { onPlaying } from './player';

// Site-wide behaviour. Each block looks for its own data attribute, so pages
// only pay for what they use.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Reveal on scroll -----------------------------------------------------------
const revealer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealer.unobserve(entry.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px' },
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealer.observe(el));

// Line-boil doodles (Lottie) --------------------------------------------------
// <div data-doodle="/lottie/breeze.json"></div>. Plays only while on screen and
// holds the first frame for people who prefer reduced motion.
const doodles = document.querySelectorAll<HTMLElement>('[data-doodle]');
if (doodles.length) {
  import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
    const watcher = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const anim = (entry.target as HTMLElement & { _anim?: ReturnType<typeof lottie.loadAnimation> })._anim;
        if (!anim || reduceMotion) continue;
        if (entry.isIntersecting) anim.play();
        else anim.pause();
      }
    });
    doodles.forEach((el) => {
      const anim = lottie.loadAnimation({
        container: el,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: el.dataset.doodle!,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
      anim.addEventListener('DOMLoaded', () => {
        anim.goToAndStop(0, true);
        el.classList.add('is-ready');
      });
      (el as HTMLElement & { _anim?: typeof anim })._anim = anim;
      watcher.observe(el);
    });
  });
}

// Cursor label ---------------------------------------------------------------
// Anything with data-cursor="Text" shows a small pill that trails the pointer.
if (finePointer) {
  const label = document.createElement('div');
  label.className = 'cursor-label';
  label.setAttribute('aria-hidden', 'true');
  document.body.append(label);
  let x = 0, y = 0, lx = 0, ly = 0, active: HTMLElement | null = null;
  const tick = () => {
    lx += (x - lx) * 0.22;
    ly += (y - ly) * 0.22;
    label.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
    if (target !== active) {
      active = target;
      if (target) {
        label.textContent = target.dataset.cursor!;
        label.classList.add('is-on');
      } else {
        label.classList.remove('is-on');
      }
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => label.classList.remove('is-on'));
}

// Hero to card -----------------------------------------------------------------
// [data-shrink] media starts full-bleed and settles into a rounded card as the
// page scrolls past it.
const shrinkers = [...document.querySelectorAll<HTMLElement>('[data-shrink]')];
if (shrinkers.length && !reduceMotion) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of shrinkers) {
      const top = el.getBoundingClientRect().top;
      const raw = el.dataset.shrinkStart ?? '0';
      const start = raw.endsWith('vh') ? (parseFloat(raw) / 100) * vh : Number(raw);
      const p = Math.min(1, Math.max(0, (start - top) / (vh * 0.5)));
      el.style.setProperty('--shrink', p.toFixed(4));
    }
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

// In-view video ------------------------------------------------------------------
// [data-embed] frames load their muted background player only while near the
// viewport, and drop it again when far away, so long feeds stay light.
const embeds = document.querySelectorAll<HTMLElement>('[data-embed]');
if (embeds.length && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        // A player someone opened with sound is theirs now; leave it alone.
        if (el.classList.contains('is-open') || !el.dataset.embed) continue;
        const existing = el.querySelector('iframe');
        if (entry.isIntersecting && !existing) {
          const iframe = document.createElement('iframe');
          iframe.src = el.dataset.embed!;
          iframe.allow = 'autoplay; fullscreen; picture-in-picture';
          iframe.tabIndex = -1;
          iframe.title = '';
          iframe.setAttribute('aria-hidden', 'true');
          el.append(iframe);
          onPlaying(iframe, () => el.classList.add('is-playing'), () => iframe.remove());
        } else if (!entry.isIntersecting && existing) {
          el.classList.remove('is-playing');
          existing.remove();
        }
      }
    },
    { rootMargin: '25% 0px' },
  );
  embeds.forEach((el) => io.observe(el));
}

// Live clock -------------------------------------------------------------------
document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => {
  const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const render = () => {
    const parts = fmt.formatToParts(new Date());
    el.innerHTML = parts
      .map((p) => (p.type === 'literal' && p.value === ':' ? '<span class="blink">:</span>' : p.value))
      .join('')
      .toUpperCase();
  };
  render();
  setInterval(render, 1000);
});

// Header: dropdown, mobile menu, and colour over dark heroes -------------------
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const submenuButton = header.querySelector<HTMLButtonElement>('[data-submenu-toggle]');
  const submenu = header.querySelector<HTMLElement>('[data-submenu]');
  const setSubmenu = (open: boolean) => {
    submenuButton?.setAttribute('aria-expanded', String(open));
    header.classList.toggle('submenu-open', open);
    document.documentElement.classList.toggle('dim-page', open);
  };
  submenuButton?.addEventListener('click', () => setSubmenu(submenuButton.getAttribute('aria-expanded') !== 'true'));
  if (finePointer && submenuButton && submenu) {
    const wrap = submenuButton.parentElement!;
    wrap.addEventListener('pointerenter', () => setSubmenu(true));
    wrap.addEventListener('pointerleave', () => setSubmenu(false));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setSubmenu(false);
      setMenu(false);
    }
  });

  const menuButton = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const setMenu = (open: boolean) => {
    menuButton?.setAttribute('aria-expanded', String(open));
    header.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('no-scroll', open);
  };
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));

  // Sections marked data-header-light make the header text light while it sits over them.
  const lightZones = document.querySelectorAll('[data-header-light]');
  if (lightZones.length) {
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
        header.classList.toggle('is-light', visible.size > 0);
      },
      { rootMargin: `0px 0px -${window.innerHeight - 40}px 0px` },
    );
    lightZones.forEach((z) => io.observe(z));
  }
}

// Page fade on internal navigation ------------------------------------------------
const fader = document.querySelector<HTMLElement>('[data-fader]');
if (fader && !reduceMotion) {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname.startsWith('/keystatic')) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    fader.classList.add('is-in');
    setTimeout(() => (location.href = url.href), 450);
  });
  window.addEventListener('pageshow', () => fader.classList.remove('is-in'));
}

// Preloader, first visit per session only ----------------------------------------
const preloader = document.querySelector<HTMLElement>('[data-preloader]');
if (preloader) {
  let seen = false;
  try {
    seen = sessionStorage.getItem('cs-preloader') === '1';
    sessionStorage.setItem('cs-preloader', '1');
  } catch {}
  if (seen || reduceMotion) {
    preloader.remove();
  } else {
    const words = preloader.querySelector<HTMLElement>('[data-preloader-word]')!;
    const list = ['CHECKING THE FORECAST...', 'CLEARING THE SKIES...', 'SETTING UP LIGHTS...', 'ROLLING CAMERA...', 'CATCHING A BREEZE...'];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    let n = 0;
    words.textContent = list[0];
    const cycle = setInterval(() => (words.textContent = list[++n % list.length]), 420);
    const done = () => {
      clearInterval(cycle);
      preloader.classList.add('is-done');
      setTimeout(() => preloader.remove(), 900);
    };
    const failsafe = setTimeout(done, 3200);
    window.addEventListener('load', () => {
      clearTimeout(failsafe);
      setTimeout(done, 900);
    });
  }
}
