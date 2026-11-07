// Every photo on the site is shown as a Polaroid from the camera carousel
// (src/components/PolaroidCarousel.astro). Photos come from two places:
//   src/data/polaroids.json          prints kept in the repo (the approved set)
//   src/data/polaroids.notion.json   the Notion "Photos" database, framed at
//                                    build time by scripts/notion-sync.mjs
// Each photo lists the pages it belongs to as path tags ("/about",
// "/work/good-stuff-restaurants"), or named carousels ("team") that can be
// placed anywhere with <PolaroidCarousel tag="team" />.

export interface Polaroid {
  src: string;
  alt: string;
  orientation: 'portrait' | 'landscape';
  pages: string[];
  order: number;
}

const files = import.meta.glob<{ default: Polaroid[] }>('../data/polaroids*.json', { eager: true });
const all: Polaroid[] = Object.values(files).flatMap((m) => m.default ?? []);

/** "/about/" -> "/about", "" -> "/" */
export const pageTag = (pathname: string) => (pathname.replace(/\/+$/, '') || '/').toLowerCase();

/** Photos for one or more tags, in order, without duplicates. */
export function polaroidsFor(tags: string | string[]): Polaroid[] {
  const want = new Set((Array.isArray(tags) ? tags : [tags]).map((t) => (t.startsWith('/') ? pageTag(t) : t.toLowerCase())));
  const seen = new Set<string>();
  return all
    .filter((p) => p.pages.some((t) => want.has(t.startsWith('/') ? pageTag(t) : t.toLowerCase())))
    .sort((a, b) => a.order - b.order)
    .filter((p) => !seen.has(p.src) && seen.add(p.src));
}
