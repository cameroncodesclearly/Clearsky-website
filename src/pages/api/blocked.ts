import type { APIRoute } from 'astro';

// Crawlers on the block list (src/lib/bots.ts) are redirected here by the
// "redirects" rules in vercel.json, which run before any page is served.
export const prerender = false;
const blocked = () =>
  new Response('Automated access to this site is not permitted.', {
    status: 403,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'no-store' },
  });
export const GET: APIRoute = blocked;
export const HEAD: APIRoute = blocked;
export const POST: APIRoute = blocked;
