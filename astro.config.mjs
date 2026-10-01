// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE_URL } from './src/data/site.ts';

// The scroll film, command palette, CV and music controls use plain TypeScript.
export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    // Six complete chapters are already visible in the scroll. Only fetch a full
    // case study when a visitor shows intent to follow its link.
    defaultStrategy: 'hover',
  },
});
