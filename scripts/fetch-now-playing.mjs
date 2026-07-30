/**
 * Fetches what Leo is listening to and bakes it into the repo.
 *
 * Runs in a GitHub Action, not in the browser. Doing the work here rather than at
 * page load matters for a site that publishes its own weight:
 *
 *   - No Spotify request from the visitor, so no third-party connection and no
 *     credentials that could live in client code.
 *   - The album art is downloaded, resized and re-encoded here, so it is served
 *     from our own origin at a size we chose instead of whatever the CDN hands out.
 *   - The tint colour is extracted here with sharp, so the browser never runs image
 *     analysis to work out a palette.
 *
 * Writes src/data/now-playing.json and src/assets/now-playing.jpg. Both are
 * committed, so the site reads them at build time and ships zero fetch.
 *
 * Requires SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN.
 * Exits 0 without touching anything when they are absent, so a fork or a local run
 * is a no-op rather than a failure.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = path.join(ROOT, 'src', 'data', 'now-playing.json');
const ART_OUT = path.join(ROOT, 'src', 'assets', 'now-playing.jpg');

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  console.log('now-playing: Spotify credentials absent, leaving the existing data alone.');
  process.exit(0);
}

/** Exchanges the long-lived refresh token for a short-lived access token. */
async function getAccessToken() {
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error(`token exchange failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).access_token;
}

async function spotify(endpoint, token) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // 204 means nothing is playing, which is not an error.
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`${endpoint} failed: ${response.status}`);
  return response.json();
}

/** sRGB relative luminance, per WCAG. */
function luminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const hex = ({ r, g, b }) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/**
 * Walks a colour toward the given target until it clears a contrast ratio.
 *
 * An album cover is chosen by an art director, not by an accessibility auditor: pull
 * a pale pastel or a near-black straight out of one and body text on top of it stops
 * being readable. The hue is what carries the personality, so this keeps the hue and
 * moves only the lightness until the ratio is met.
 */
function clampForContrast(colour, against, ratio, toward) {
  let current = { ...colour };
  for (let step = 0; step < 40; step += 1) {
    if (contrast(current, against) >= ratio) break;
    current = {
      r: current.r + (toward.r - current.r) * 0.06,
      g: current.g + (toward.g - current.g) * 0.06,
      b: current.b + (toward.b - current.b) * 0.06,
    };
  }
  return current;
}

async function main() {
  const token = await getAccessToken();

  let track = null;
  let live = false;

  const playing = await spotify('/me/player/currently-playing', token);
  if (playing?.item) {
    track = playing.item;
    live = true;
  } else {
    const recent = await spotify('/me/player/recently-played?limit=1', token);
    track = recent?.items?.[0]?.track ?? null;
  }

  if (!track) {
    console.log('now-playing: nothing playing and no history, leaving data alone.');
    return;
  }

  const artUrl = track.album?.images?.[0]?.url;
  let palette = null;

  if (artUrl) {
    const art = Buffer.from(await (await fetch(artUrl)).arrayBuffer());

    await mkdir(path.dirname(ART_OUT), { recursive: true });
    // 320px is twice the rendered size, which covers a 2x display and no more.
    await sharp(art).resize(320, 320, { fit: 'cover' }).jpeg({ quality: 78 }).toFile(ART_OUT);

    // The mean colour of the artwork carries its mood without picking up a single
    // saturated pixel from a logo in the corner.
    const { dominant } = await sharp(art).stats();

    // These are the site's own surfaces, from global.css.
    const lightSurface = { r: 248, g: 247, b: 245 };
    const darkSurface = { r: 12, g: 11, b: 10 };

    palette = {
      raw: hex(dominant),
      // Accents sit on text-sized elements, so hold them to AA body contrast.
      onLight: hex(clampForContrast(dominant, lightSurface, 4.5, { r: 0, g: 0, b: 0 })),
      onDark: hex(clampForContrast(dominant, darkSurface, 4.5, { r: 255, g: 255, b: 255 })),
    };
  }

  const payload = {
    track: {
      title: track.name,
      artist: track.artists?.map((a) => a.name).join(', ') ?? '',
      album: track.album?.name ?? '',
      href: track.external_urls?.spotify ?? null,
      live,
      art: artUrl ? 'now-playing.jpg' : null,
      palette,
      fetchedAt: new Date().toISOString(),
    },
  };

  await writeFile(JSON_OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`now-playing: ${payload.track.title} — ${payload.track.artist} (live: ${live})`);
}

await main();
