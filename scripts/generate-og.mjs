/**
 * Renders public/og.png, the 1200x630 preview card used when the site is shared
 * on LinkedIn, Slack or in a message to a recruiter.
 *
 * Run with: npm run og
 *
 * The output is committed to the repo rather than generated during the build,
 * so the deployed image never depends on which fonts the CI runner happens to have.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

import { SITE_DOMAIN } from '../src/data/site.ts';

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'og.png',
);

const INK = '#0c0b0a';
const AMBER = '#f5a524';
const WHITE = '#f8f7f5';
const MUTED = '#b9b3a9';
const BORDER = '#26221e';

const SANS = "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Cascadia Code', 'Consolas', 'JetBrains Mono', monospace";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${INK}"/>

  <!-- Amber edge, echoing the accent used across the site -->
  <rect x="0" y="0" width="10" height="630" fill="${AMBER}"/>

  <!-- Faint framing rule so the card reads as a deliberate object -->
  <rect x="64" y="56" width="1080" height="518" fill="none" stroke="${BORDER}" stroke-width="2" rx="14"/>

  <text x="112" y="140" font-family="${MONO}" font-size="26" fill="${AMBER}" letter-spacing="1">~/leo-nguyen</text>

  <text x="112" y="266" font-family="${SANS}" font-size="104" font-weight="700" fill="${WHITE}" letter-spacing="-3">Leo Nguyen</text>

  <text x="112" y="342" font-family="${SANS}" font-size="38" fill="${MUTED}">Software developer. Full stack web, games</text>
  <text x="112" y="392" font-family="${SANS}" font-size="38" fill="${MUTED}">and 3D, from Melbourne.</text>

  <line x1="112" y1="450" x2="1088" y2="450" stroke="${BORDER}" stroke-width="2"/>

  <text x="112" y="502" font-family="${MONO}" font-size="24" fill="${MUTED}">Nest.js  ·  PostgreSQL  ·  React  ·  Unreal  ·  Unity  ·  Maya</text>

  <text x="112" y="544" font-family="${MONO}" font-size="24" fill="${AMBER}">${SITE_DOMAIN}</text>
</svg>`;

const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(OUT, buffer);

console.log(`Wrote ${OUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
