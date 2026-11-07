// Advertising pixels: Meta Pixel and the Google Ads tag. They load only when
// the visitor's "marketing" consent allows it (src/scripts/consent.ts) and
// switch off again if they opt out.
//
// IDs come from environment settings in Vercel, so nothing loads until they
// are set:
//   PUBLIC_META_PIXEL_ID     e.g. 123456789012345
//   PUBLIC_GOOGLE_ADS_ID     e.g. AW-123456789
//   PUBLIC_GOOGLE_ADS_LEAD   optional conversion label for a contact form lead
import { onConsent } from './consent';

const META = import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined;
const GADS = import.meta.env.PUBLIC_GOOGLE_ADS_ID as string | undefined;
const GADS_LEAD = import.meta.env.PUBLIC_GOOGLE_ADS_LEAD as string | undefined;
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown };
declare global {
  interface Window { fbq?: Fbq; _fbq?: Fbq; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

const script = (src: string) => {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.append(s);
};

// Google Consent Mode v2: everything is denied until the visitor's choice says
// otherwise. Google requires these signals for visitors in the EEA and UK.
window.dataLayer = window.dataLayer || [];
window.gtag = function gtag() { window.dataLayer!.push(arguments); };
window.gtag('consent', 'default', {
  ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
  wait_for_update: 500,
});

let metaLoaded = false, googleLoaded = false;

function loadMeta() {
  if (!META || metaLoaded) return;
  metaLoaded = true;
  const fbq = function (...args: unknown[]) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
  window.fbq = window._fbq = fbq;
  script('https://connect.facebook.net/en_US/fbevents.js');
  fbq('consent', 'grant');
  fbq('init', META);
  fbq('track', 'PageView');
}

function loadGoogle() {
  if (!GADS || googleLoaded) return;
  googleLoaded = true;
  script(`https://www.googletagmanager.com/gtag/js?id=${GADS}`);
  window.gtag!('js', new Date());
  window.gtag!('config', GADS);
}

// Delete the first-party cookies the pixels set, after an opt-out.
function clearCookies() {
  const host = location.hostname.split('.').slice(-2).join('.');
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (/^(_fbp|_fbc|_gcl_|_gac_|_ga)/.test(name)) {
      for (const domain of ['', `; domain=.${host}`, `; domain=${location.hostname}`]) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  }
}

if (!isLocal && (META || GADS)) {
  onConsent(({ marketing }) => {
    const v = marketing ? 'granted' : 'denied';
    window.gtag!('consent', 'update', { ad_storage: v, ad_user_data: v, ad_personalization: v });
    if (marketing) {
      loadMeta();
      loadGoogle();
      window.fbq?.('consent', 'grant');
    } else {
      window.fbq?.('consent', 'revoke');
      clearCookies();
    }
  });
}

/** Report a lead (a sent contact form) to both ad platforms, if allowed. */
export function trackLead() {
  if (metaLoaded) window.fbq?.('track', 'Lead');
  if (googleLoaded && GADS_LEAD) window.gtag?.('event', 'conversion', { send_to: `${GADS}/${GADS_LEAD}` });
}
