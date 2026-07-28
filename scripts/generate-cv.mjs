/**
 * Renders public/leo-nguyen-cv.pdf from the same data the website uses, so the
 * CV and the site can never disagree about dates, roles or skills.
 *
 * This is the ONLY supported way to produce that file. Run with: npm run cv
 *
 * Deliberately single column with real (non-vector) text and standard fonts so
 * applicant tracking systems can parse it.
 *
 * The script reads the finished PDF back and refuses to leave a file on disk
 * that contains a phone number. See the leak guard at the bottom.
 */
import { createWriteStream } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { once } from 'node:events';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import PDFDocument from 'pdfkit';

import { profile } from '../src/data/profile.ts';
import { SITE_DOMAIN, SITE_URL } from '../src/data/site.ts';
import experience from '../src/content/experience.json' with { type: 'json' };

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'leo-nguyen-cv.pdf',
);

const INK = '#111111';
const MUTED = '#555555';
const RULE = '#cccccc';
const LINK = '#1a4f8a';

const MARGIN = 48;
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  info: {
    Title: `${profile.fullDisplayName} — ${profile.role} CV`,
    Author: profile.fullDisplayName,
    Subject: 'Curriculum Vitae',
    Keywords: profile.skills.flatMap((g) => g.items).join(', '),
  },
});

let pageCount = 1;
doc.on('pageAdded', () => {
  pageCount += 1;
});

const file = createWriteStream(OUT);
doc.pipe(file);

const CONTENT_WIDTH = doc.page.width - MARGIN * 2;

/**
 * Type scale. Tuned so the current volume of content fills a single A4 page
 * without crowding; the script reports its page count on every run, so if the
 * content grows past one page these are the numbers to bring back down.
 */
const BODY = 10;
const SMALL = 9.5;

function sectionHeading(text) {
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(11.5).fillColor(INK).text(text.toUpperCase(), {
    characterSpacing: 0.8,
  });
  const y = doc.y + 3.5;
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_WIDTH, y)
    .lineWidth(0.75)
    .strokeColor(RULE)
    .stroke();
  doc.moveDown(0.75);
}

function bullets(items) {
  doc.font('Helvetica').fontSize(BODY).fillColor(INK);
  for (const item of items) {
    const startY = doc.y;
    doc.text('•', MARGIN + 4, startY, { width: 10, continued: false });
    doc.text(item, MARGIN + 16, startY, {
      width: CONTENT_WIDTH - 16,
      align: 'left',
      lineGap: 2,
    });
    doc.moveDown(0.35);
  }
}

/** Role title on the left, dates flush right on the same baseline. */
function roleHeader(title, dates) {
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(title, MARGIN, y, {
    width: CONTENT_WIDTH - 130,
  });
  doc.font('Helvetica').fontSize(SMALL).fillColor(MUTED).text(dates, MARGIN + CONTENT_WIDTH - 130, y, {
    width: 130,
    align: 'right',
  });
  doc.y = Math.max(doc.y, y + 15);
}

/* ---------------------------------- Header --------------------------------- */

doc.font('Helvetica-Bold').fontSize(23).fillColor(INK).text(profile.fullDisplayName);
doc.moveDown(0.4);

const contactY = doc.y;
doc.font('Helvetica').fontSize(SMALL).fillColor(MUTED);

// No phone number, by choice. Adding one here will trip the leak guard below.
const contactParts = [
  { text: profile.location, href: null },
  { text: profile.email, href: `mailto:${profile.email}` },
  { text: 'linkedin.com/in/leo-hnguyen', href: profile.linkedin },
  { text: SITE_DOMAIN, href: SITE_URL },
];

let x = MARGIN;
contactParts.forEach((part, index) => {
  const label = part.text;
  const width = doc.widthOfString(label);
  doc.fillColor(part.href ? LINK : MUTED).text(label, x, contactY, {
    width: width + 2,
    lineBreak: false,
    ...(part.href ? { link: part.href } : {}),
  });
  x += width;

  if (index < contactParts.length - 1) {
    const sep = '  |  ';
    doc.fillColor(RULE).text(sep, x, contactY, { width: doc.widthOfString(sep) + 2, lineBreak: false });
    x += doc.widthOfString(sep);
  }
});

doc.x = MARGIN;
doc.y = contactY + 15;

/* --------------------------------- Summary --------------------------------- */

sectionHeading('Summary');
doc.font('Helvetica').fontSize(BODY).fillColor(INK).text(profile.cvSummary, {
  width: CONTENT_WIDTH,
  align: 'left',
  lineGap: 2,
});

/* -------------------------------- Education -------------------------------- */

const ordered = [...experience].sort((a, b) => a.order - b.order);

// The degree has its own section, so its entry is shown there instead of being
// repeated verbatim under Experience.
const degreeEntry = ordered.find(
  (role) => role.role === profile.education.degree && role.org === profile.education.institution,
);
const roles = ordered.filter((role) => role !== degreeEntry);

sectionHeading('Education');
roleHeader(`${profile.education.institution} — ${profile.education.degree}`, profile.education.period);
doc
  .font('Helvetica')
  .fontSize(BODY)
  .fillColor(MUTED)
  .text(
    `Major: ${profile.education.major}  |  Minor: ${profile.education.minor}`,
    MARGIN,
    doc.y,
    { width: CONTENT_WIDTH },
  );
doc.moveDown(0.2);
doc
  .fontSize(SMALL)
  .fillColor(MUTED)
  .text(`Coursework: ${profile.education.coursework.join(', ')}`, { width: CONTENT_WIDTH });

if (degreeEntry) {
  // The site shows the major/minor as a bullet; the CV already has it on its own
  // line above, so drop the bullet that only restates it.
  const points = degreeEntry.points.filter(
    (point) => !(point.includes(profile.education.major) && point.includes(profile.education.minor)),
  );
  doc.moveDown(0.35);
  bullets(points);
}

/* -------------------------------- Experience ------------------------------- */

sectionHeading('Experience');

roles.forEach((role, index) => {
  roleHeader(`${role.role} — ${role.org}`, role.period);
  doc.font('Helvetica-Oblique').fontSize(SMALL).fillColor(MUTED).text(role.location, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
  });
  doc.moveDown(0.35);
  bullets(role.points);
  if (index < roles.length - 1) doc.moveDown(0.55);
});

/* ------------------------------- Technologies ------------------------------ */

sectionHeading('Technologies');

for (const group of profile.skills) {
  const y = doc.y;
  const label = `${group.label}: `;
  doc.font('Helvetica-Bold').fontSize(BODY).fillColor(INK).text(label, MARGIN, y, {
    continued: true,
  });
  doc.font('Helvetica').fillColor(INK).text(group.items.join(', '), {
    width: CONTENT_WIDTH,
  });
  doc.moveDown(0.35);
}

doc.end();
await once(file, 'finish');

/* -------------------------------- Leak guard ------------------------------- */

/**
 * A phone number must never reach a published artifact. Rather than relying on
 * whoever edits the data above remembering that, read the PDF back, pull the
 * text out of it, and delete the file and fail the build if anything that looks
 * like a phone number survived.
 *
 * The checks match phone *shapes* rather than one specific number, both so any
 * number is caught and so this file — which is public — does not itself spell
 * out the number it is protecting.
 *
 * Dependency free: pdfkit writes text into Flate-compressed content streams as
 * BT/ET blocks containing hex (<4e677579>) or literal ((Nguy)) strings, so
 * node's own zlib is enough to recover it. The canary check below fails loudly
 * if pdfkit ever changes that encoding out from under us.
 */

/** Turns PDF string escapes (\( \) \\ \ddd \n ...) back into characters. */
function decodeLiteral(raw) {
  const named = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
  return raw.replace(/\\(?:(\d{1,3})|(\r\n|[\r\n])|([\s\S]))/g, (_, octal, newline, char) => {
    if (octal !== undefined) return String.fromCharCode(parseInt(octal, 8));
    if (newline !== undefined) return '';
    return named[char] ?? char;
  });
}

function decodeHex(raw) {
  const digits = raw.replace(/[^0-9A-Fa-f]/g, '');
  const even = digits.length % 2 ? digits + '0' : digits;
  let text = '';
  for (let i = 0; i < even.length; i += 2) {
    text += String.fromCharCode(parseInt(even.slice(i, i + 2), 16));
  }
  return text;
}

/** Decompresses every stream in the file. */
function streams(pdf) {
  const START = Buffer.from('stream');
  const END = Buffer.from('endstream');
  const found = [];

  let cursor = 0;
  while ((cursor = pdf.indexOf(START, cursor)) !== -1) {
    // `indexOf` also lands inside "endstream"; skip those.
    if (cursor >= 3 && pdf.subarray(cursor - 3, cursor).toString('latin1') === 'end') {
      cursor += START.length;
      continue;
    }

    let start = cursor + START.length;
    if (pdf[start] === 0x0d) start += 1;
    if (pdf[start] === 0x0a) start += 1;

    const end = pdf.indexOf(END, start);
    if (end === -1) break;

    const body = pdf.subarray(start, end);
    try {
      found.push(inflateSync(body).toString('latin1'));
    } catch {
      found.push(body.toString('latin1')); // Uncompressed, or not text at all.
    }

    cursor = end + END.length;
  }

  return found;
}

const PDF_STRING = /\((?:\\[\s\S]|[^\\()])*\)|<[0-9A-Fa-f\s]*>/g;

/**
 * One entry per text-showing block. Kerning splits a single line into several
 * hex chunks, so the chunks inside a BT/ET pair are rejoined to recover the
 * string that was actually written.
 */
function extractTextRuns(pdf) {
  const runs = [];

  for (const stream of streams(pdf)) {
    for (const block of stream.matchAll(/BT([\s\S]*?)ET/g)) {
      let run = '';
      for (const match of block[1].matchAll(PDF_STRING)) {
        const token = match[0];
        run += token.startsWith('<')
          ? decodeHex(token.slice(1, -1))
          : decodeLiteral(token.slice(1, -1));
      }
      if (run) runs.push(run);
    }
  }

  return runs;
}

/**
 * The document's own dictionaries — /Info metadata, /URI link actions — with
 * stream bodies removed so binary payloads and the 10-digit xref offsets cannot
 * masquerade as text.
 */
function extractObjectText(pdf) {
  const withoutStreams = pdf.toString('latin1').replace(/stream[\s\S]*?endstream/g, ' ');
  return [...withoutStreams.matchAll(PDF_STRING)]
    .map((match) => (match[0].startsWith('<') ? '' : decodeLiteral(match[0].slice(1, -1))))
    // PDF timestamps (D:20260728040631+10'00') are a long digit run and a UTC
    // offset that reads like a dialling code. They are structural, not content.
    .filter((value) => !/^D:\d/.test(value))
    .join('\n');
}

/**
 * A telephone number, in any of the formats one might be written in: a run of
 * digits and phone punctuation holding nine or more digits. Years, percentages
 * and date ranges stay well under that.
 */
function findPhoneShape(text) {
  for (const match of text.matchAll(/[\d+][\d\s()+.-]*\d/g)) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length >= 9) return match[0].trim();
  }
  return null;
}

async function reject(reason) {
  await unlink(OUT).catch(() => {});
  console.error('\n' + '!'.repeat(72));
  console.error('CV GENERATION ABORTED — ' + reason);
  console.error(`Deleted ${OUT} rather than publish it.`);
  console.error('!'.repeat(72) + '\n');
  process.exit(1);
}

const pdf = await readFile(OUT);
const runs = extractTextRuns(pdf);

// Joined without separators, so a number that kerning split across glyph runs
// is still seen as one number.
const pageText = runs.join('');
const objectText = extractObjectText(pdf);
const rawBytes = pdf.toString('latin1');

// If extraction silently broke, every check below would trivially "pass".
// Known-present strings prove the guard is actually reading the document.
for (const canary of [profile.email, SITE_DOMAIN, 'EXPERIENCE']) {
  if (!pageText.includes(canary)) {
    await reject(`text extraction is broken (expected to find "${canary}" in the PDF)`);
  }
}

for (const [where, text] of [
  ['visible page text', pageText],
  ['document metadata or a link target', objectText],
]) {
  const hit = findPhoneShape(text);
  if (hit) await reject(`${where} contains a phone number ("${hit}")`);

  const country = text.match(/\+\s*\d{1,3}[\s(]/);
  if (country) await reject(`${where} contains an international dialling code ("${country[0].trim()}")`);
}

if (/\btel:/i.test(rawBytes)) await reject('the PDF contains a tel: link');

console.log(
  `Wrote ${OUT} — ${pageCount} page${pageCount === 1 ? '' : 's'}, ${pdf.length} bytes, no phone number.`,
);
