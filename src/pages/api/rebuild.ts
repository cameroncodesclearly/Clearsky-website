import type { APIRoute } from 'astro';

// Rebuilds the site so it picks up anything newly published in Notion.
// Vercel calls this once a day (vercel.json "crons") as a safety net for the
// Notion "Push to website" button, which hits the deploy hook directly.
// Needs two environment settings in Vercel: DEPLOY_HOOK_URL (the project's
// deploy hook) and CRON_SECRET (any long random string; Vercel sends it).
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET ?? process.env.CRON_SECRET;
  const hook = import.meta.env.DEPLOY_HOOK_URL ?? process.env.DEPLOY_HOOK_URL;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  if (!hook) return new Response('DEPLOY_HOOK_URL is not set', { status: 500 });
  const res = await fetch(hook, { method: 'POST' });
  return new Response(res.ok ? 'Rebuild started' : `Deploy hook failed: ${res.status}`, { status: res.ok ? 200 : 502 });
};
