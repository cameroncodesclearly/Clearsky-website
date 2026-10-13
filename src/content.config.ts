import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Mirrors keystatic.config.ts. Keystatic owns the editing UI; this file owns
// how the site reads and validates the same files at build time.
const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      industry: z.string().optional().default(''),
      year: z.number().int(),
      services: z.array(z.string()).default([]),
      summary: z.string(),
      cover: image(),
      coverVideo: z.string().nullish(),
      videoUrl: z.string().url().nullish(),
      gallery: z.array(z.object({ image: image(), alt: z.string() })).default([]),
      results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      testimonial: z
        .object({ quote: z.string().optional().default(''), person: z.string().optional().default(''), role: z.string().optional().default('') })
        .optional(),
      featured: z.boolean().default(false),
      order: z.number().int().default(100),
      draft: z.boolean().default(false),
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      publishedDate: z.coerce.date(),
      author: z.string().default('Clear Sky Creations'),
      cover: image().nullish(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { caseStudies, posts };
