# CLAUDE.md

Project guidance for AI coding agents. Local file, untracked on purpose — it stays out
of the public repo. Last full update: 2026-07-30, end of the redesign session.

## What this project is

Leo Nguyen's portfolio, live at https://leohngdev.github.io. Astro 7 + Tailwind 4,
static on GitHub Pages, **no UI framework** (React was removed deliberately; see
Decisions). Deploys automatically on every push to `main` via
`.github/workflows/deploy.yml`. There is no staging: pushing main is publishing.

The design thesis is the sentence in the hero: **"Games taught me what software
costs."** Every feature argues for it — the site measures its own page weight and
displays it, budgets are enforced at build time, and JavaScript is ~11 KB gzipped
total. Do not add dependencies casually; the cost explorer in the hero will print
whatever you add.

## Architecture map

- `src/data/profile.ts` — single source of truth for identity, skills, About text,
  thesis. The CV PDF is generated from it: run `npm run cv` after ANY edit to it or
  `src/content/experience.json`. The generator hard-fails if a phone number appears.
- `src/data/budget.ts` — performance budgets. `scripts/check-budget.mjs` enforces
  them at the end of `npm run build` and fails it when exceeded. Raising a budget is
  allowed but must be a conscious, commented decision (see the ClientRouter note in
  that file for the pattern).
- `src/components/` — Hero (thesis + word-reveal entrance), CostExplorer (interactive
  asset breakdown, toggles genuinely change the page), Instrument (live readout:
  page weight / JS / LCP via `src/lib/page-cost.ts`), Work + ProjectRow (typographic
  index, hover-expand), Timeline (two-track career chart from parsed period strings,
  `src/lib/timeline.ts`), Navigator ("doors" that preview /about), CommandPalette
  (⌘K, native `<dialog>`, commands in `src/lib/terminal-commands.ts`), CvWindow
  (CV in a dialog, `navigator.pdfViewerEnabled` fallback), NowPlaying (header music
  button + Spotify embed + palette tint), diagrams/ (inline SVG, themed by tokens).
- `src/styles/global.css` — all tokens. Fraunces = display, Inter = body, JetBrains
  Mono = data ONLY (never decoration; that rule is what un-tech'd the look).
  Semantic tokens (`--surface`, `--accent`…) flip for dark mode and are what the
  Spotify tint overrides.
- Pages: `/` (poster: hero, work, timeline, doors, contact), `/about/` (about,
  skills, experience, contact), `/work/[slug]/` (case studies + reading progress).

## Hard-won rules (violating these re-breaks fixed bugs)

1. **Never write the `animation` shorthand in a rule that also sets
   `animation-timeline`.** Lightning CSS folds them together into an invalid
   declaration the browser drops silently. Longhands only, and
   `animation-duration: auto` for scroll timelines. (global.css has the note.)
2. **Reveals have exactly one owner: the IntersectionObserver in Layout.astro.**
   A dual CSS/JS ownership scheme once left all content at opacity 0.
3. **Every script initialises on `astro:page-load`** (ClientRouter is on; module
   scripts don't re-run after navigation). Document-level listeners bind once with
   a guard; `transition:persist` nodes (NowPlaying) must not be re-bound.
4. **Measure with `encodedBodySize`, not `transferSize`** (cached visits report ~0
   and the readout would claim the page weighs 3 KB). One snapshot in
   `src/lib/page-cost.ts` feeds both readouts so they can never disagree.
5. **CV links**: `data-astro-prefetch="false"` everywhere, or prefetchAll downloads
   the PDF on every page view.
6. **Spotify palette**: most-vivid pixel, never sharp's `dominant` (returns the
   background). Monochrome art → `palette: null` → the site keeps amber.
7. Tests of visual claims happen in the browser via the gstack `/browse` binary,
   not by trusting the code. Screenshots for anything visual.

## Content rules (sensitive)

- **ANTSA**: softened deliberately (commit `ecc9fe1` rationale). Say what Leo built;
  never characterise the client's codebase. Banned claims without written
  permission: "scoring was hardcoded", "the dev environment was broken", anything
  implying the platform served clinicians wrong data ("incorrect answer options",
  "silent bug feeding clinicians…"). The sanctioned phrasing is "traced a data
  mismatch that produced no error and no log entry".
- **WORKING-NOTES.md** is local-only, gitignored, and was **removed from git history
  by a rewrite on 2026-07-30** (force-pushed; backup tag `backup-before-rewrite`
  and branch `backup-main` exist locally and still contain it — delete them once
  confident, and never push them). Never commit it again.
- Honesty is a feature: skills are grouped by depth ("shipped" vs "studied" —
  Game & 3D deliberately reads "Coursework, no shipped titles"). Do not inflate.
- Prose style: no em dashes, no adverb crutches, no "not X but Y" contrasts, active
  voice (the stop-slop pass, commit `6c68a24`). Keep new copy consistent with it.

## Spotify pipeline

`.github/workflows/now-playing.yml` (cron 6h + manual) → `scripts/fetch-now-playing.mjs`
→ commits `src/data/now-playing.json` + `src/assets/now-playing.jpg` → deploy.
Secrets (already configured in repo settings): `SPOTIFY_CLIENT_ID`,
`SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`. Re-auth helper:
`npm run spotify:auth` (prompts; never takes secrets via chat or argv). Local
fetch: `npm run spotify` (prompts). The script exits 0 with no credentials.

Front end: music button in the Header (NowPlaying.astro). First visit shows the
"This site has a soundtrack" card; *Play the vibes* = Spotify embed (30-second
preview for anonymous visitors — legal ceiling, do not try to exceed it) + album
palette tint via CSS token override. localStorage keys: `vibes`, `tint`, `theme`.
The bot's commits can race local work — when resolving, keep the bot's track
metadata WITH the artwork it committed, and recompute the palette if the extractor
changed (mismatched title/cover shipped once; fixed in `0fd619e`).

## Known outstanding

- **Shader set piece** (agreed with Leo, not built): one small hand-written WebGL
  module, ambient in the hero + static per-project variants seeded from project
  data. Will exceed the 15 KB JS budget → raise it consciously in budget.ts with
  reasoning, like the ClientRouter precedent. No three.js (~150 KB; already
  evaluated and rejected on cost).
- **Cold-start LCP**: first-ever visit measured 3.8 s (font-blocked; warm ~1 s,
  cached ~70 ms). Fix: preload the Fraunces latin woff2 and stop awaiting all of
  `document.fonts.ready` in Hero.astro before revealing.
- Engine-prototypes and character-pipeline case studies still have no visuals;
  diagrams exist only for ANTSA and FRC.
- `origin/cursor/cloud-agent-*` is a stale remote branch (verified clean of
  WORKING-NOTES); delete when convenient (`git push origin --delete …` was blocked
  for the agent — Leo can do it in the GitHub UI).
- gh CLI is available and authenticated for Actions checks (`gh run list`).

## gstack

[gstack](https://github.com/garrytan/gstack) is installed globally at
`~/.claude/skills/gstack`. Use **`/browse`** for all web browsing, QA and
screenshots — not the `mcp__claude-in-chrome__*` tools. On Windows the install is
file copies, not symlinks: re-run `~/.claude/skills/gstack/setup` after every
`git pull` in the gstack repo. `/connect-chrome` is unavailable on Windows; use
`/browse` or `/open-gstack-browser`.

Local dev quirks: default shell is PowerShell (`VAR=x cmd` fails — scripts prompt
instead), Node resolves `/tmp` to `D:\tmp` (use the session scratchpad), the
Astro dev toolbar pollutes screenshots (`document.querySelectorAll('astro-dev-toolbar').forEach(e=>e.remove())`).
