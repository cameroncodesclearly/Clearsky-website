import type { APIRoute } from 'astro';
import { AI_TRAINING_BOTS, SCRAPERS } from '../lib/bots';

// Search engines may crawl everything public; AI training crawlers and
// scrapers may not crawl anything. Compliance is voluntary, which is why
// src/middleware.ts also enforces it.
export const GET: APIRoute = ({ site }) => {
  const named = [...AI_TRAINING_BOTS, ...SCRAPERS.filter((s) => /^[A-Za-z][\w-]*$/.test(s))];
  const body = [
    ...named.map((b) => `User-agent: ${b}\nDisallow: /`),
    'User-agent: *\nAllow: /\nDisallow: /keystatic\nDisallow: /api/',
    `Sitemap: ${new URL('/sitemap-index.xml', site)}`,
  ].join('\n\n');
  return new Response(body + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
