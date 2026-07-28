# leohngdev.github.io

Personal portfolio site for Nguyen Le Hoang (Leo) — a Melbourne-based software developer.

Live at **[leohngdev.github.io](https://leohngdev.github.io)**.

## Stack

- **[Astro](https://astro.build)** — static output, zero client JavaScript except where explicitly opted in
- **React 19** — used only for the interactive terminal, hydrated with `client:visible`
- **Tailwind CSS 4** — via the Vite plugin, no config file
- **TypeScript** — strict, with `astro check` gating the build

## Design notes

**One interactive element, deliberately.** The hero terminal accepts real commands (`whoami`, `projects`, `skills`, `open <project>`). It is the only piece of the site that ships JavaScript to the browser, and everything it can tell you is also present as ordinary HTML elsewhere on the page — so it degrades to nothing if scripting is unavailable, and screen readers get the static content rather than a keyboard trap.

**One source of truth per fact.** Projects live in a typed content collection under `src/content/projects/`. The visual cards, the case study pages, and the terminal's `projects` command all read from it, so they cannot disagree. The deployed URL lives only in `src/data/site.ts`; the CV PDF is generated from the same `profile.ts` and `experience.json` the site renders, so the CV and the site can never drift apart.

**The CV generator refuses to leak.** `scripts/generate-cv.mjs` reads its own output back, extracts the text, and exits non-zero if anything phone-number-shaped survived into the PDF.

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run cv` | Regenerate `public/leo-nguyen-cv.pdf` |
| `npm run og` | Regenerate the Open Graph card |
| `npm run assets` | Both of the above |

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages.

## Licence

MIT for the code. The written content, CV, and project descriptions are not licensed for reuse.
