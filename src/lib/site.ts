import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import settings from '../content/settings/site.json';

export const site = {
  name: 'Clear Sky Creations',
  shortName: 'Clear Sky',
  description:
    'Clear Sky Creations is a story-first video production and social media studio in Southern California. We help good brands get known, earn trust, and stand apart.',
  ...settings,
};

export const nav = [
  { href: '/work/', label: 'Work' },
  { href: '/about/', label: 'About' },
  { href: '/services/', label: 'Services', submenu: true },
  { href: '/contact/', label: 'Contact' },
];

// Draft entries stay editable in Keystatic but never reach the public site.
export async function publishedCaseStudies() {
  const entries = await getCollection('caseStudies', (e) => !e.data.draft);
  return entries.sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year);
}

export async function publishedServices() {
  const entries = await getCollection('services');
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function publishedPosts() {
  const entries = await getCollection('posts', (e) => !e.data.draft);
  return entries.sort((a, b) => b.data.publishedDate.getTime() - a.data.publishedDate.getTime());
}

export const SERVICE_LABELS: Record<string, string> = {
  'social-media': 'Social Media',
  'video-production': 'Video Production',
  'content-strategy': 'Strategy',
  'post-production': 'Post-Production',
  photography: 'Photography',
  'paid-social': 'Paid Social',
  branding: 'Branding',
  web: 'Web',
};

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

// ---------------------------------------------------------------------------
// Video links. Editors paste a normal Vimeo or YouTube link; the site works out
// the embed URLs and a poster.
export interface VideoRef {
  provider: 'vimeo' | 'youtube';
  id: string;
  hash?: string;
}

export function parseVideo(url?: string | null): VideoRef | null {
  if (!url) return null;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]+))?(?:.*[?&]h=([0-9a-f]+))?/i);
  if (vimeo) return { provider: 'vimeo', id: vimeo[1], hash: vimeo[2] || vimeo[3] };
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return { provider: 'youtube', id: yt[1] };
  return null;
}

/** Muted, looping, chrome-free player for backgrounds and cards. */
export function backgroundEmbed(v: VideoRef) {
  if (v.provider === 'vimeo') {
    const h = v.hash ? `h=${v.hash}&` : '';
    return `https://player.vimeo.com/video/${v.id}?${h}background=1&autoplay=1&loop=1&muted=1&dnt=1`;
  }
  return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&loop=1&playlist=${v.id}&controls=0&playsinline=1&modestbranding=1`;
}

/** Full player with sound and controls. */
export function playerEmbed(v: VideoRef) {
  if (v.provider === 'vimeo') {
    const h = v.hash ? `h=${v.hash}&` : '';
    return `https://player.vimeo.com/video/${v.id}?${h}dnt=1&title=0&byline=0&portrait=0&color=d9b435`;
  }
  return `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`;
}

// Posters saved as src/assets/video-posters/<vimeo id>.jpg are picked up automatically.
const posters = import.meta.glob<{ default: ImageMetadata }>('../assets/video-posters/*.{jpg,jpeg,png,webp}', { eager: true });
export function posterFor(v: VideoRef | null): ImageMetadata | undefined {
  if (!v) return undefined;
  const hit = Object.entries(posters).find(([path]) => path.split('/').pop()!.split('.')[0] === v.id);
  return hit?.[1].default;
}

// Settings singletons are plain JSON, so their image fields are strings like
// "../../assets/about/photo.webp". This turns them into optimisable images.
const assets = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true });
export function resolveImage(path?: string | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const tail = path.replace(/^(\.\.\/)+/, '').replace(/^src\//, '');
  return assets[`../${tail}`]?.default;
}

export const THEME_CLASS: Record<string, string> = {
  paper: 'theme-paper',
  blue: 'theme-blue',
  sky: 'theme-sky',
  butter: 'theme-butter',
  ink: 'theme-ink',
};
