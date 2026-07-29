# Working notes — portfolio content

**Local only. This file is gitignored and must stay that way.**

These notes used to live as `<!-- -->` comments inside the case study markdown. That was wrong twice
over: markdown passes raw HTML through, so they were being published in the page source, and this
repository is public, so they were readable in the source tree regardless. Both fixed — the comments
are gone from the content, and `src/lib/rehype-strip-comments.mjs` now strips any that reappear.

Companion document: `PROJECT-INVENTORY.md` (also gitignored) has the full audit and the 31-item
confirmation checklist this file refers to.

---

## Current state

| Project | Order | Published | Blocked on |
| --- | --- | --- | --- |
| Yard | 1 | yes | Redeploy for a working link, screenshots, accuracy check |
| ANTSA | 2 | yes | Written permission from ANTSA to restore detail |
| PostMint | 3 | yes | Merge branches to `main`, credential check, demo clip |
| Barn — Environment & Audio | 4 | yes | Screenshots or flythrough video |
| Maya 3D Work | 5 | **no** (`featured: false`) | Renders, and a description of what the files are |

`featured: false` now gates the entire site — no card, no case study page, no terminal entry, and
excluded from the next-case-study rotation. Flip one boolean to publish.

---

## ANTSA — restore this once permission lands

The live page is a deliberately softened version. Removed pending written sign-off:

- The specific mechanics of the scoring engine: custom categories, per-category severity thresholds,
  configurable weighting with auto-redistribution, reverse scoring.
- The statement that scoring was previously hardcoded.
- The specifics of the silent defect. In full detail this amounted to publicly stating that a live
  mental health platform had been serving clinicians incorrect answer options. **This is the single
  most sensitive claim available to you and must not be republished without written permission.**

The full original text is in git history. The softened version keeps the role, team size, stack,
agile delivery and the 100% UAT outcome, which is the part employers actually screen for.

Same softening was applied to the `antsa` entry in `src/content/experience.json` and the About
paragraph in `src/data/profile.ts` — both were leaking the identical detail. If you restore one,
restore all three together, and rerun `npm run cv` because the CV is built from those two files.

Inventory checklist Q11, Q12, Q13 relate to this. Q13 (permission) is the blocker.

---

## Yard — the hero, currently linkless

1. **Accuracy.** The page was written from the inventory's read of the repo tree, not from your own
   description. Read it and correct anything wrong. Checklist Q2 is unanswered.
2. **The link.** `links:` is empty because `https://yard-lime.vercel.app` returns 404. A portfolio
   link to a dead deployment is worse than no link. After redeploying:

```yaml
links:
  - label: Live app
    href: https://your-url-here
```

   If the repo stays private, do not add a repo link — a GitHub 404 reads badly to a recruiter.
3. **Screenshots.** This is the hero and it has no image. The yard grid and the interactive map are
   the two visuals that explain the concept fastest. Put them in `src/assets/`, set `cover:` and
   `coverAlt:`.
4. **Unresolved:** whether to lead with the web app on `main` or the Expo app on `mobile-migration`.
   The page currently presents them as one product with two clients, which is accurate and defers
   the decision. Revisit after the monorepo migration.

---

## PostMint — do not link yet

1. **Merge first.** The real code is on `video-gen` and `claude/goofy-hawking-5f3aa3`. Default branch
   `main` has only README, .gitignore and LICENSE, so a visitor sees an empty repo and concludes the
   page is fiction. After merging:

```yaml
links:
  - label: Source
    href: https://github.com/leohngdev/PostMint
```

   The inventory calls this the cheapest big win available: the code is already written.
2. **Credential check — do this before anything else.** `auth.json`, `generate.json` and `video.json`
   sit in the root of that **public** repo. Confirm they are sample payloads and not captured
   responses containing real tokens. If they hold live keys: rotate the keys, purge the files from
   history, and only then merge. Merging first would just drive traffic to them. Checklist Q10.
3. A 30-second clip of one generated video moves this from described to demonstrated, and is worth
   more than all the prose on the page.

---

## Barn — Environment & Audio

1. **This entry deliberately does not claim Unity programming, and it must stay that way.** Of 1,197
   `.cs` files in `Assets/`, 1,192 belong to PlayMaker, nTools and the Synty POLYGON Nature pack. Of
   the five remaining, two carry the header "Written by Mike Yeates for FIT3169". That leaves roughly
   3 KB — `Player.cs` (NavMesh click-to-move), `CameraLook.cs`, `AudioFollow.cs` — that is plausibly
   yours, and even that resembles unit-supplied starter code. As design and audio work this is honest
   and genuinely employable. As "a Unity game I built", the first technical question exposes it.
2. **No images means no entry.** It describes a visual and audio artifact and shows neither. Minimum:
   three or four screenshots from good angles. Much better: a 30-second flythrough with the FMOD
   audio playing, which demonstrates both halves at once. If you will not capture anything, set
   `featured: false` rather than shipping a wall of text about a place nobody can see.
3. The words "supplemental" and "supplementary assessment" are deliberately absent from the page even
   though that is the unit context. It implies a resit and costs more than the context gains.
4. The FMOD project (`Supp Ass.fspro`) and the Unity scene are bundled as one entry per the
   inventory's recommendation — stronger and more honest than two thin ones. Checklist Q15, Q16, Q17.

---

## Maya — unpublished until there are renders

1. **There is not one rendered image on disk.** `D:\Maya Projects` contains only `.mb`, `.mel` and a
   `.zip`. Nobody hires a 3D artist from a `.mb` file. Maya 2025 is installed at `D:\Autodesk\Maya2025`,
   so this is a rendering session, not new modelling. Render 3–5 stills or a turntable from
   `A1.0002.mb`, put them in `src/assets/`, set `cover:`.
2. **The prose is a scaffold, not a description.** The Maya binaries could not be read, so the page
   says nothing specific about what you made. Checklist Q20 asks directly. Tell me what these are and
   the page gets rewritten properly:

```
A1.0002.mb                     13.9 MB   5 Oct 2025    <- biggest, probably your best
HomeRun_01_StartingFrames.mb   629 KB    12 Jun 2025   <- animation?
FIT3097_A1/A1.0001.mb          188 KB    30 Aug 2025
Maker Lab.mb                   181 KB    23 Oct 2025
FIT3097_A1/A1.mb               126 KB    30 Aug 2025
Dungeon_LowPoly.mb             75 KB     30 Aug 2025
```

3. **Removed claims — do not restore without evidence.** The previous version claimed Substance
   Painter texturing and character rigging. No `.spp` or `.sbs` files exist anywhere and Substance is
   not installed; no rigging files were found either, though rigging may be inside `A1.0002.mb`,
   which could not be read. If it is in there, say so and it goes back.
4. `D:\Documents\Showreel Video.mp4` (440 MB, Oct 2025) has never been watched. If it is your 3D and
   games work it is potentially the best portfolio asset you own — video beats every repo link for
   visual work. Checklist Q18.

---

## Deleted entries — reasoning, in case you want them back

- **`frc-robotics.md`** — no robotics code found locally or on GitHub. Absence of an artifact is not
  proof the work did not happen; a 2020–2022 team repo in Vietnam that you no longer have access to
  is entirely plausible. But a project card with a case study implies something you can show. It
  remains in `experience.json` as the `frc` entry, which is the right home. Checklist Q26.
- **`fullstack-web-apps.md`** — nothing attributable. `Copyfrometan` has zero commits by you (all 104
  are Brian Lu and elii0022), `Divine-vines` has no git history, and the inventory found no PHP you
  personally wrote. Checklist Q24: if PHP you wrote exists elsewhere, point at it and this can come
  back as a named project.

---

## Skills chips — a deliberate decision, revisit if uncomfortable

`profile.ts` still lists Unreal Engine, C++, AR/VR, Substance Painter, Character Rigging & Animation,
CakePHP and PHP. Kept on purpose, following the inventory's own rule (§5.5): unbacked items "should
stay as CV line items and not become portfolio project cards." A skills chip reads as "I have worked
with this"; a project card promises something showable.

What was softened instead was the first-person prose that claimed built artifacts — the About
paragraphs in `profile.ts` and the `monash` entry in `experience.json`. Those now describe coursework
and exposure.

If you would rather trim the chips too, the four most exposed are Unreal Engine, C++, AR/VR and
Substance Painter — the inventory found no trace of any of them on the machine.

---

## Non-website items from the inventory, by urgency

1. **`D:\GitDirectories\AntSa` contains `.env`, `.env.production` and `.env.current-backup`** which
   may hold live credentials for a production healthcare system, unencrypted on a personal drive.
   Highest severity item in the whole audit. Checklist Q14.
2. **PostMint's `auth.json` / `generate.json` / `video.json`** in a public repo, as above.
3. Stale Windows credential `GitHub - https://api.github.com/lngu0100-it` — safe to delete. Leave
   `git:https://github.com` (user `LeoNg14`) alone, that is your working login. Checklist Q30.
4. `hnguyen.leo04@gmail.com` is public in PostMint's commit history. Minor for a personal Gmail, but
   checklist Q31 asks whether to rewrite.
