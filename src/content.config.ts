import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Mirrors keystatic.config.ts. Keystatic owns the editing UI; this file owns
// how the site reads and validates the same files at build time.
const theme = z.enum(['paper', 'blue', 'sky', 'butter', 'ink']).default('paper');

const videoItem = (image: () => z.ZodTypeAny) =>
  z.object({
    url: z.string().url().nullish(),
    poster: image().nullish(),
    title: z.string().optional().default(''),
    vertical: z.boolean().default(false),
  });

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/case-studies' }),
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
      theme,
      cover: image(),
      coverVertical: z.boolean().default(false),
      coverVideo: z.string().nullish(),
      videoUrl: z.string().url().nullish(),
      videos: z.array(videoItem(image)).default([]),
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

const services = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string().optional().default(''),
      intro: z.string().optional().default(''),
      statement: z.string().optional().default(''),
      capabilities: z.array(z.string()).default([]),
      theme,
      heroVideo: z.string().url().nullish(),
      heroImage: image().nullish(),
      media: z.array(videoItem(image)).default([]),
      featuredWork: z.string().nullish(),
      order: z.number().int().default(100),
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

export const collections = { caseStudies, services, posts };
