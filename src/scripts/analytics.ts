// PostHog product analytics, web analytics, and session replay.
// The project key is public by design (it ships in every page); override it
// with PUBLIC_POSTHOG_KEY / PUBLIC_POSTHOG_HOST if the project ever changes.
import posthog from 'posthog-js';

const key = import.meta.env.PUBLIC_POSTHOG_KEY || 'phc_nquJm5nW9vVagzR9NPfgcY786BbDQJStWkHsN3VD7CNy';
const host = import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Skip local development so test clicks don't land in the real project.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

if (key && !isLocal) {
  posthog.init(key, {
    api_host: host,
    ui_host: 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
}

/** Send a named event; safe to call even when analytics is off. */
export function track(event: string, props?: Record<string, unknown>) {
  if (key && !isLocal) posthog.capture(event, props);
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
