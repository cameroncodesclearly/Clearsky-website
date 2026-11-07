// Visitor consent, in two separate categories:
//   analytics  PostHog (src/scripts/analytics.ts)
//   marketing  Meta Pixel and Google Ads tag (src/scripts/ads.ts)
//
// Rules by region (see src/pages/api/geo.ts):
// - EEA, UK, Switzerland, Quebec, Brazil (and unknown locations): nothing runs
//   until the visitor accepts it. Each category can be accepted on its own.
// - Everywhere else: both run unless the visitor opts out. Advertising pixels
//   count as "sharing" under California and other US state laws, so the footer
//   carries a "Do Not Sell or Share My Personal Information" link.
// - Global Privacy Control or Do Not Track always turn both off.
//
// The choice is kept in localStorage (strictly necessary, so it needs no
// consent itself) and can be changed any time from the footer links, which
// reopen the banner.

export interface Choices { analytics: boolean; marketing: boolean }
const KEY = 'cs-consent';
const VERSION = 2; // bump when a new category is added, so people are asked again

export function storedChoices(): Choices | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v?.v !== VERSION) return null;
    return { analytics: Boolean(v.analytics), marketing: Boolean(v.marketing) };
  } catch {
    return null; // includes the old "granted"/"denied" strings: ask again
  }
}

function store(c: Choices) {
  try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...c, at: new Date().toISOString() })); } catch {}
}

export const privacySignal = () =>
  Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) ||
  navigator.doNotTrack === '1' || (window as Window & { doNotTrack?: string }).doNotTrack === '1';

async function region(): Promise<{ optIn: boolean }> {
  try {
    const cached = sessionStorage.getItem('cs-geo');
    if (cached) return JSON.parse(cached);
  } catch {}
  try {
    const res = await fetch('/api/geo', { cache: 'no-store' });
    const geo = await res.json();
    try { sessionStorage.setItem('cs-geo', JSON.stringify({ optIn: geo.optIn })); } catch {}
    return { optIn: Boolean(geo.optIn) };
  } catch {
    return { optIn: true }; // can't tell where they are: be strict
  }
}

type Listener = (c: Choices) => void;
const listeners: Listener[] = [];
let current: Choices = { analytics: false, marketing: false };
/** Called with the current choices whenever they are decided or change. */
export function onConsent(fn: Listener) { listeners.push(fn); }
const emit = (c: Choices) => { current = c; listeners.forEach((fn) => fn(c)); };

const NONE: Choices = { analytics: false, marketing: false };
const ALL: Choices = { analytics: true, marketing: true };

function banner(optIn: boolean, openPanel = false) {
  const el = document.querySelector<HTMLElement>('[data-consent]');
  if (!el) return;
  el.querySelector('[data-consent-text-optin]')?.toggleAttribute('hidden', !optIn);
  el.querySelector('[data-consent-text-optout]')?.toggleAttribute('hidden', optIn);
  const panel = el.querySelector<HTMLElement>('[data-consent-panel]')!;
  const boxes = {
    analytics: el.querySelector<HTMLInputElement>('[data-consent-analytics]')!,
    marketing: el.querySelector<HTMLInputElement>('[data-consent-marketing]')!,
  };
  // Toggles start from what's in effect now.
  boxes.analytics.checked = current.analytics;
  boxes.marketing.checked = current.marketing;
  panel.hidden = !openPanel;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-on'));
  if (openPanel) boxes.marketing.focus();

  const close = (c: Choices) => {
    store(c);
    el.classList.remove('is-on');
    setTimeout(() => (el.hidden = true), 400);
    emit(c);
  };
  el.querySelector<HTMLButtonElement>('[data-consent-accept]')!.onclick = () => close(ALL);
  el.querySelector<HTMLButtonElement>('[data-consent-decline]')!.onclick = () => close(NONE);
  el.querySelector<HTMLButtonElement>('[data-consent-customize]')!.onclick = () => { panel.hidden = !panel.hidden; };
  el.querySelector<HTMLButtonElement>('[data-consent-save]')!.onclick = () =>
    close({ analytics: boxes.analytics.checked, marketing: boxes.marketing.checked });
}

export async function initConsent() {
  const saved = storedChoices();
  const { optIn } = await region();
  if (privacySignal()) {
    // GPC / DNT is an opt-out of selling and sharing, so advertising stays off
    // whatever was chosen before. Analytics runs only if they said yes to it.
    emit({ analytics: saved?.analytics ?? false, marketing: false });
  } else if (saved) emit(saved);
  else if (optIn) banner(true); // nothing runs until they choose
  else { emit(ALL); banner(false); } // runs, with a one-time notice and an easy opt-out

  // Footer links reopen the banner; "Do not sell or share" opens the toggles.
  document.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-privacy-choices]');
    if (!t) return;
    e.preventDefault();
    banner(optIn, t.dataset.privacyChoices === 'panel');
  });
}
