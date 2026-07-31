// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE_URL } from './src/data/site.ts';

// No UI framework integration. The only interactive pieces — the command palette,
// the cost explorer and the instrument readout — are plain TypeScript modules, which
// is why this site ships single-digit kilobytes of JavaScript instead of react-dom.
export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // The budget gate accounts for the house separately from the rest of the
          // site, and it identifies the house by chunk name. Pinning three.js and
          // everything under src/lib/house into one predictably named chunk is what
          // makes that accounting deterministic instead of a guess about hashes.
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'house';
            if (id.includes('src/lib/house')) return 'house';
            return undefined;
          },
        },
      },
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
