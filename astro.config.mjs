// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { main as notionSync } from './scripts/notion-sync.mjs';

// Before every build, pull published case studies and journal posts from
// Notion (scripts/notion-sync.mjs). Skipped when NOTION_TOKEN isn't set.
const notion = {
  name: 'notion-sync',
  hooks: {
    'astro:config:setup': async ({ command }) => {
      if (command === 'build') await notionSync().catch((e) => console.error(`[notion] ${e.message}`));
    },
  },
};

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
  integrations: [notion, react(), markdoc(), keystatic(), sitemap()],
  adapter: vercel(),
  image: { responsiveStyles: true },
});
