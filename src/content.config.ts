import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Mirrors keystatic.config.ts. Keystatic owns the editing UI; this file owns
// how the site reads and validates the same files at build time.
// Each collection also reads src/content/notion/<collection>/, written by
// scripts/notion-sync.mjs from the Notion "Website CMS" databases. The entry id
// (its web address) is the file name, wherever the file lives.
const fileId = ({ entry }: { entry: string }) => entry.split('/').pop()!.replace(/\.mdoc$/, '');
const seo = { seoTitle: z.string().optional(), seoDescription: z.string().optional() };

const videoItem = (image: () => z.ZodTypeAny) =>
  z.object({
    url: z.string().url().nullish(),
    poster: image().nullish(),
    title: z.string().optional().default(''),
    vertical: z.boolean().default(false),
  });

const caseStudies = defineCollection({
  loader: glob({ pattern: ['case-studies/**/*.mdoc', 'notion/case-studies/**/*.mdoc'], base: './src/content', generateId: fileId }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      category: z.string().optional().default(''),
      clientType: z.string().optional().default(''),
      industry: z.string().optional().default(''),
      location: z.string().optional().default(''),
      year: z.number().int(),
      completed: z.string().optional().default(''),
      services: z.array(z.string()).default([]),
      summary: z.string(),
      intro: z.string().optional().default(''),
      cover: image(),
      coverVertical: z.boolean().default(false),
      coverVideo: z.string().nullish(),
      videoUrl: z.string().url().nullish(),
      videos: z.array(videoItem(image)).default([]),
      gallery: z.array(z.object({ image: image(), alt: z.string() })).default([]),
      beforeAfter: z
        .object({ before: image().nullish(), after: image().nullish(), caption: z.string().optional().default('') })
        .nullish(),
      results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      testimonial: z
        .object({ quote: z.string().optional().default(''), person: z.string().optional().default(''), role: z.string().optional().default('') })
        .optional(),
      featured: z.boolean().default(false),
      order: z.number().int().default(100),
      draft: z.boolean().default(false),
      // "building": a placeholder that shows the "Building in progress" page and
      // stays out of the Work grid and homepage until the study is written.
      status: z.enum(['live', 'building']).default('live'),
      ...seo,
    }),
});

// Service pages follow the layout in the "Our Services" Google Doc: headline,
// optional video, alternating text and case-study rows, a big list of what's
// included, a stat line, packages, how it works, case studies, then the photo
// carousel and the sunset footer (both added by the layout).
// status "building" shows the "Building in progress" page instead.
const services = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/services' }),
  schema: () =>
    z.object({
      title: z.string(),
      tagline: z.string().optional().default(''),
      status: z.enum(['live', 'building']).default('live'),
      order: z.number().int().default(100),
      headline: z.string().optional().default(''),
      video: z.string().url().nullish(),
      subtitle: z.string().optional().default(''),
      lead: z.string().optional().default(''),
      rows: z.array(z.object({ text: z.string(), caseStudy: z.string().optional() })).default([]),
      included: z.array(z.string()).default([]),
      stat: z.string().optional().default(''),
      packagesIntro: z.string().optional().default(''),
      packages: z
        .array(z.object({ name: z.string(), price: z.string().optional().default(''), summary: z.string().optional().default(''), includes: z.array(z.string()).default([]) }))
        .default([]),
      customQuote: z.string().optional().default(''),
      steps: z.array(z.object({ title: z.string(), body: z.string().optional().default('') })).default([]),
      caseStudies: z.array(z.string()).default([]),
      ...seo,
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: ['posts/**/*.mdoc', 'notion/posts/**/*.mdoc'], base: './src/content', generateId: fileId }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      publishedDate: z.coerce.date(),
      author: z.string().default('Clear Sky Creations'),
      cover: image().nullish(),
      tags: z.array(z.string()).default([]),
      category: z.string().optional(),
      keyword: z.string().optional(),
      draft: z.boolean().default(false),
      ...seo,
    }),
});

export const collections = { caseStudies, services, posts };
