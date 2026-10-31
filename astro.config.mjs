// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Pages are prerendered static HTML. Only the Keystatic editor routes
// (/keystatic and /api/keystatic) run on demand through the adapter.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://www.clearskycreations.com',
  integrations: [react(), markdoc(), keystatic(), sitemap({ filter: (page) => !page.includes('/sun-options') })],
  adapter: vercel(),
  image: { responsiveStyles: true },
});
