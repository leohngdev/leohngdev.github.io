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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ece9df"/>
  <g font-family="Arial, sans-serif" fill="#2b2d25">
    <text x="62" y="64" font-size="22" font-weight="700" letter-spacing="1">LEO NGUYEN</text>
    <text x="1138" y="64" text-anchor="end" font-size="15" letter-spacing="1">SOFTWARE DEVELOPER / MELBOURNE</text>
    <path d="M62 86H1138" stroke="#c2c3b3"/>
    <g font-family="Arial Narrow, Arial, sans-serif" font-size="82" font-weight="700" letter-spacing="-3">
      <text x="62" y="220">A few things</text>
      <text x="62" y="314">that make</text>
      <text x="62" y="408">me, <tspan fill="#b84629" font-style="italic">me.</tspan></text>
    </g>
    <path d="M230 429Q302 417 375 425M242 435Q318 427 362 432" fill="none" stroke="#b84629" stroke-width="4" stroke-linecap="round"/>
    <text x="62" y="479" font-size="21">Software, skating, and how things work.</text>
    <text x="62" y="571" font-size="16">${SITE_DOMAIN}</text>
    <text x="1138" y="571" text-anchor="end" font-size="14" letter-spacing="1">A PERSONAL COLLECTION, STILL GROWING.</text>
  </g>
  <ellipse cx="901" cy="323" rx="217" ry="174" fill="none" stroke="#b3bba5" transform="rotate(-18 901 323)"/>
  <g transform="translate(722 174) rotate(-9 165 95)">
    <rect x="4" y="5" width="330" height="198" rx="12" fill="#b7bbaa"/>
    <rect width="330" height="198" rx="12" fill="#2b2d25"/>
    <rect x="14" y="13" width="302" height="88" rx="4" fill="#b84629"/>
    <text x="29" y="68" font-family="Arial Narrow, Arial, sans-serif" font-size="47" font-weight="700" fill="#f7f3e9">LOOSE PARTS</text>
    <text x="31" y="88" font-family="Arial, sans-serif" font-size="11" fill="#f7f3e9" letter-spacing="1">PRODUCTS / GAMES / SYSTEMS</text>
    <rect x="36" y="118" width="258" height="42" rx="21" fill="#cecdbb"/>
    <circle cx="63" cy="139" r="14" fill="#2b2d25" stroke="#aab29d" stroke-width="6" stroke-dasharray="5 3"/>
    <circle cx="267" cy="139" r="14" fill="#2b2d25" stroke="#aab29d" stroke-width="6" stroke-dasharray="5 3"/>
    <path d="M102 183H228" stroke="#727962"/>
  </g>
  <g transform="translate(908 385) rotate(8)">
    <rect x="4" y="4" width="178" height="93" fill="#b5b9a8"/>
    <path d="M0 0H69L78 11H178V93H0Z" fill="#d1d7b8" stroke="#8e9777"/>
    <text x="16" y="52" font-family="Arial, sans-serif" font-size="29" font-weight="700" fill="#2b2d25">WORK</text>
    <path d="M16 65H152M16 74H122" stroke="#8e9777"/>
  </g>
  <path d="M737 125 809 130 805 152 734 147Z" fill="#d6d3b1" opacity=".8"/>
</svg>`;

const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(OUT, buffer);

console.log(`Wrote ${OUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
