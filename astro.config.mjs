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
  // The address used for canonical links and link-preview images. On Vercel it
  // follows the project's production domain (today the .vercel.app address;
  // clearskycreations.com once that domain is connected), so previews always
  // come from this site. SITE_URL overrides it.
  site:
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://www.clearskycreations.com'),
  integrations: [react(), markdoc(), keystatic(), sitemap()],
  adapter: vercel(),
  image: { responsiveStyles: true },
});
