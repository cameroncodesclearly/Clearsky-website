// Analytics consent, by region (see src/pages/api/geo.ts):
// - EEA, UK, Switzerland, Quebec, Brazil (and unknown locations): nothing is
//   tracked until the visitor taps "Accept".
// - Everywhere else: analytics runs unless the visitor opts out, or their
//   browser sends Global Privacy Control or Do Not Track.
// The choice is remembered in localStorage (strictly necessary, so it needs no
// consent itself) and can be changed any time from "Privacy choices" in the
// footer, which reopens the banner.

export type Choice = 'granted' | 'denied';
const KEY = 'cs-consent';

export function storedChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function store(choice: Choice) {
  try { localStorage.setItem(KEY, choice); } catch {}
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

type Listener = (allowed: boolean) => void;
const listeners: Listener[] = [];
/** Called with true when analytics may run, false when it must stop. */
export function onConsent(fn: Listener) { listeners.push(fn); }
const emit = (allowed: boolean) => listeners.forEach((fn) => fn(allowed));

function banner(optIn: boolean) {
  const el = document.querySelector<HTMLElement>('[data-consent]');
  if (!el) return;
  el.querySelector('[data-consent-text-optin]')?.toggleAttribute('hidden', !optIn);
  el.querySelector('[data-consent-text-optout]')?.toggleAttribute('hidden', optIn);
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-on'));
  const close = (choice: Choice) => {
    store(choice);
    el.classList.remove('is-on');
    setTimeout(() => (el.hidden = true), 400);
    emit(choice === 'granted');
  };
  el.querySelector<HTMLButtonElement>('[data-consent-accept]')!.onclick = () => close('granted');
  el.querySelector<HTMLButtonElement>('[data-consent-decline]')!.onclick = () => close('denied');
}

export async function initConsent() {
  const choice = storedChoice();
  const { optIn } = await region();
  if (choice) emit(choice === 'granted');
  else if (privacySignal()) emit(false); // GPC / DNT count as opting out
  else if (optIn) banner(true); // nothing runs until they choose
  else { emit(true); banner(false); } // runs, with a one-time notice and an opt-out

  // "Privacy choices" links anywhere on the page reopen the banner.
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-privacy-choices]')) return;
    e.preventDefault();
    banner(optIn);
  });
}
