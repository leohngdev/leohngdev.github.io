/**
 * Fails the build if a case study contains an HTML comment.
 *
 * Markdown passes raw HTML straight through, so `<!-- note to self -->` in a
 * case study is published verbatim in the page source. This site has already
 * shipped working notes that way once, including client-sensitive detail and
 * the name of an unmerged branch.
 *
 * Stripping comments at render time would not have been enough: this repository
 * is public, so anything written in a tracked file is readable in the source
 * tree whether or not it reaches the HTML. The only real fix is to keep notes
 * out of tracked content entirely, which is what this check enforces.
 *
 * Working notes belong in WORKING-NOTES.md, which is gitignored.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const contentDir = join(root, 'src', 'content');

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return markdownFiles(path);
      return entry.name.endsWith('.md') ? [path] : [];
    }),
  );

  return nested.flat();
}

const failures = [];

for (const path of await markdownFiles(contentDir)) {
  const lines = (await readFile(path, 'utf8')).split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes('<!--')) {
      failures.push(`${relative(root, path)}:${index + 1}`);
    }
  });
}

if (failures.length > 0) {
  console.error(
    `\nHTML comments found in content. These publish into the page source and are\n` +
      `readable in this public repository. Move them to WORKING-NOTES.md:\n\n` +
      failures.map((failure) => `  ${failure}`).join('\n') +
      '\n',
  );
  process.exit(1);
}

console.log('Content check passed — no HTML comments in case studies.');
