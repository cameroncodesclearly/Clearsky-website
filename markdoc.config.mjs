import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

// Custom blocks used by pages written in Notion (scripts/notion-sync.mjs turns
// Notion images, video links and "Before and after" toggles into these).
export default defineMarkdocConfig({
  tags: {
    figure: {
      render: component('./src/components/md/Figure.astro'),
      selfClosing: true,
      attributes: { src: { type: String, required: true }, alt: { type: String } },
    },
    gallery: { render: component('./src/components/md/Gallery.astro') },
    video: {
      render: component('./src/components/md/Video.astro'),
      selfClosing: true,
      attributes: { url: { type: String, required: true } },
    },
    videos: { render: component('./src/components/md/Videos.astro') },
    beforeafter: {
      render: component('./src/components/md/BeforeAfterTag.astro'),
      selfClosing: true,
      attributes: { before: { type: String, required: true }, after: { type: String, required: true }, caption: { type: String } },
    },
  },
});
