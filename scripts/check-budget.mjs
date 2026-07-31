/**
 * Fails the build when an emitted asset crosses its performance budget.
 *
 * The site displays its own page weight as a design element. That claim is only
 * worth making if something stops it quietly becoming false, so this runs as part
 * of `npm run build` and exits non-zero on a breach. CI runs the same command, so
 * a regression cannot reach GitHub Pages.
 *
 * Measures gzipped bytes because that is roughly what crosses the wire and it is
 * reproducible without a browser. The live readout in the footer measures the real
 * thing via Resource Timing; the two will differ slightly and that is expected.
 *
 * Fonts are deliberately excluded. woff2 is already compressed, only the subsets a
 * given visitor needs are fetched, and the total on disk would be a misleading
 * number to gate on. They are still counted in the runtime figure the page shows.
 *
 * Run with: npm run budget (or automatically via npm run build)
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { buildBudget } from '../src/data/budget.ts';

const gzipAsync = promisify(gzip);
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

async function walk(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return found;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(full)));
    else found.push(full);
  }
  return found;
}

/** Gzipped size at maximum compression, matching what a CDN would serve. */
async function gzipSize(file) {
  const buffer = await readFile(file);
  const compressed = await gzipAsync(buffer, { level: 9 });
  return compressed.length;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function main() {
  const distStat = await stat(DIST).catch(() => null);
  if (!distStat) {
    console.error('check-budget: no dist/ directory. Run the build first.');
    process.exit(1);
  }

  const files = await walk(DIST);
  const allJs = files.filter((f) => f.endsWith('.js'));
  // Chunk naming is pinned in astro.config.mjs so this match is a contract, not a
  // heuristic about how Rollup happens to name things today.
  const houseJs = allJs.filter((f) => path.basename(f).startsWith('house'));
  const js = allJs.filter((f) => !houseJs.includes(f));
  const css = files.filter((f) => f.endsWith('.css'));
  const html = files.filter((f) => f.endsWith('.html'));

  const sum = async (list) => (await Promise.all(list.map(gzipSize))).reduce((a, b) => a + b, 0);

  const jsTotal = await sum(js);
  const houseTotal = await sum(houseJs);
  const cssTotal = await sum(css);

  // HTML is measured per page, not summed: adding more pages should not fail a
  // budget that is really about how heavy any single page is.
  const htmlSizes = await Promise.all(
    html.map(async (f) => ({ file: path.relative(DIST, f), size: await gzipSize(f) })),
  );
  const heaviestHtml = htmlSizes.sort((a, b) => b.size - a.size)[0] ?? { file: '(none)', size: 0 };

  const checks = [
    { name: 'JavaScript', detail: `${js.length} files`, actual: jsTotal, limit: buildBudget.javascript },
    {
      name: 'JS (house)',
      detail: `${houseJs.length} files`,
      actual: houseTotal,
      limit: buildBudget.houseJavascript,
    },
    { name: 'CSS', detail: `${css.length} files`, actual: cssTotal, limit: buildBudget.css },
    {
      name: 'HTML (largest)',
      detail: heaviestHtml.file,
      actual: heaviestHtml.size,
      limit: buildBudget.html,
    },
  ];

  let failed = false;
  console.log('\nPerformance budget (gzipped)\n');
  for (const check of checks) {
    const over = check.actual > check.limit;
    if (over) failed = true;
    const pct = Math.round((check.actual / check.limit) * 100);
    console.log(
      `  ${over ? 'FAIL' : 'ok  '}  ${check.name.padEnd(15)} ${kb(check.actual).padStart(9)} / ${kb(
        check.limit,
      ).padStart(9)}  ${String(pct).padStart(3)}%  ${check.detail}`,
    );
  }
  console.log('');

  if (failed) {
    console.error(
      'Budget exceeded. Either make it smaller, or raise the limit in src/data/budget.ts\n' +
        'and accept that the number the site displays goes up.\n',
    );
    process.exit(1);
  }
}

await main();
