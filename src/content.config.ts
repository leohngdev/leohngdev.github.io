import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // One line, shown under the title on cards and as the terminal list description.
      tagline: z.string(),
      role: z.string(),
      org: z.string().optional(),
      period: z.string(),
      // Lower numbers surface first. ANTSA leads at 1.
      order: z.number(),
      featured: z.boolean().default(true),
      category: z.enum(['web', 'game', 'threed', 'hardware']),
      // Longer paragraph used on the case study page header and meta description.
      summary: z.string(),
      stack: z.array(z.string()).min(1),
      // Two or three concrete outcomes. Kept short enough to read on a card.
      highlights: z.array(z.string()).default([]),
      links: z
        .array(
          z.object({
            label: z.string(),
            href: z.url(),
          }),
        )
        .default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      confidential: z.boolean().default(false),
    }),
});

const experience = defineCollection({
  loader: file('./src/content/experience.json'),
  schema: z.object({
    id: z.string(),
    role: z.string(),
    org: z.string(),
    location: z.string(),
    period: z.string(),
    order: z.number(),
    points: z.array(z.string()).min(1),
  }),
});

export const collections = { projects, experience };
