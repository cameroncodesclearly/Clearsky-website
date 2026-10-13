import { getCollection } from 'astro:content';
import settings from '../content/settings/site.json';

export const site = {
  name: 'Clear Sky Creations',
  shortName: 'Clear Sky',
  description:
    'Clear Sky Creations is a video production and social media studio that helps brands get known, earn trust, and stand apart with content that tells the truth beautifully.',
  ...settings,
};

export const nav = [
  { href: '/work/', label: 'Work' },
  { href: '/services/', label: 'Services' },
  { href: '/about/', label: 'About' },
  { href: '/journal/', label: 'Journal' },
];

// Draft entries stay editable in Keystatic but never reach the public site.
export async function publishedCaseStudies() {
  const entries = await getCollection('caseStudies', (e) => !e.data.draft);
  return entries.sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year);
}

export async function publishedPosts() {
  const entries = await getCollection('posts', (e) => !e.data.draft);
  return entries.sort((a, b) => b.data.publishedDate.getTime() - a.data.publishedDate.getTime());
}

export const SERVICE_LABELS: Record<string, string> = {
  'social-media': 'Social Media Management',
  'video-production': 'Video Production',
  'content-strategy': 'Content Strategy',
  photography: 'Photography',
  'paid-social': 'Paid Social',
  branding: 'Branding',
  web: 'Web',
};

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
