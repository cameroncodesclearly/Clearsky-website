// PostHog product analytics, web analytics, and session replay, behind the
// visitor's consent (src/scripts/consent.ts).
// The project key is public by design (it ships in every page); override it
// with PUBLIC_POSTHOG_KEY / PUBLIC_POSTHOG_HOST if the project ever changes.
import posthog from 'posthog-js';
import { onConsent } from './consent';

const key = import.meta.env.PUBLIC_POSTHOG_KEY || 'phc_nquJm5nW9vVagzR9NPfgcY786BbDQJStWkHsN3VD7CNy';
const host = import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Skip local development so test clicks don't land in the real project.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

// Starts only once consent.ts says it may (see that file for the rules per
// region), and stops again if the visitor later opts out.
let started = false;
onConsent(({ analytics: allowed }) => {
  if (!key || isLocal) return;
  if (allowed && !started) {
    started = true;
    posthog.init(key, {
      api_host: host,
      ui_host: 'https://us.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      respect_dnt: true,
      // Session replays never record what people type.
      session_recording: { maskAllInputs: true },
    });
    // Someone who opted out on an earlier visit and has now agreed.
    if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing();
  } else if (allowed) {
    posthog.opt_in_capturing();
  } else if (started) {
    posthog.opt_out_capturing();
    posthog.reset();
  }
});

/** Send a named event; safe to call even when analytics is off. */
export function track(event: string, props?: Record<string, unknown>) {
  if (started && !posthog.has_opted_out_capturing()) posthog.capture(event, props);
}

// Clicks on any link to the contact page, wherever it sits on the site.
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a');
  if (!a) return;
  const url = new URL(a.href, location.href);
  if (url.origin === location.origin && url.pathname.startsWith('/contact')) {
    track('contact_cta_clicked', { label: a.textContent?.trim().slice(0, 60), from: location.pathname });
  } else if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
    track('contact_link_clicked', { method: url.protocol.replace(':', ''), from: location.pathname });
  }
});
