# The House: portfolio redesign

Date: 2026-07-31
Status: approved design, not yet built
Branch: `direction-decision`

## Why this exists

The current site argues one thing: "Games taught me what software costs." It measures
its own page weight, enforces budgets at build time, and ships about 11 KB of JavaScript.
It is coherent and it works.

It is also not what Leo wants to show. The ask is a portfolio that leads with imagination
and range instead of discipline, that hits a visitor with personality in the first second,
and that gets explored rather than scrolled. Two references drove the conversation:
`aahanabobade.com` (a working VS Code clone) and `looc.dev/finder` (a working macOS
desktop). Neither uses 3D. What both do is commit completely to one idea, and make the
site itself the strongest project in the portfolio.

### Decisions taken before this design

1. **The cost thesis is retired.** Not reframed. The cost explorer, the live page-weight
   readout, and the build-time budget gate go with it. Accepted risk: without a spine,
   "creative developer portfolio with 3D" is a crowded category, so a replacement spine
   was required before any visual work.
2. **The replacement spine: the gap between what a thing seems to be and what it
   actually is.** Taken from Leo's own writing about two years on an FRC robotics team:
   "the gap between what you think a system does and what it does." A closed door you
   peek behind is that idea made personal.
3. **The form: a cutaway house.** One building with the front wall removed, seen side on.
   A child version of Leo runs and climbs between rooms. Click a room, he goes to it,
   leans in, and the camera pushes through the doorway.
4. **Modelling tool: Blender, moving from Maya.** Blender's glTF export is the best
   supported path into three.js. Eevee covers the pre-rendered fallback. Geometry Nodes can
   scatter room dressing.

   The CV claims both tools, not a switch. Knowing Maya and Blender is worth more than
   knowing either. But the timing matters: `profile.ts` groups skills by depth and Game & 3D
   currently reads "Coursework, no shipped titles." Adding Blender before anything has been
   built in it is the inflation that rule exists to prevent. **Add Blender to `profile.ts` in
   Phase 4, not before**, and re-run `npm run cv`. By then it is not only honest, it is the
   most-shipped 3D tool on the list, and the depth label for that whole group can move up
   from "studied". Shipping this project is what makes the claim true.

## The core idea

A visitor lands on a lit house at night with one room glowing and a kid standing in it.
Nothing explains itself. Clicking a room sends the kid there and pushes the camera inside,
where that chapter's content lives.

The house is chronological. Bottom left is Ho Chi Minh City at twelve; top right is
Melbourne now. The kid grows a little taller each floor. That delivers the whole career
arc without a word of copy, and it replaces the current Timeline component outright.

## Site map

Six rooms, read bottom left to top right, which is also 2013 to now.

| # | Room | Era | Absorbs |
|---|------|-----|---------|
| 01 | The bedroom | 2013, Ho Chi Minh City | About |
| 02 | The workshop | 2021, FRC robotics | Experience, FRC diagram |
| 03 | The odd pairing | 2023, Monash | Education, Skills |
| 04 | The live platform | 2025, ANTSA | ANTSA case study and diagram |
| 05 | The engine room | ongoing | Engine prototypes, character pipeline |
| 06 | The desk | now, Melbourne | Contact, CV, Now Playing |

Room notes:

- **01 The bedroom** is the landing room and the only one lit at first. Peek in and it is
  Leo at twelve, in his own words.
- **02 The workshop** holds a half-built robot, cables, a whiteboard. This is where the
  spine came from, so it gets told as a story rather than a list of duties.
- **03 The odd pairing** has two desks facing each other, software on one and games on the
  other. The room is the argument that the pairing was deliberate.
- **04 The live platform** covers the runtime-configurable scoring engine and the data
  mismatch that produced no error and no log entry. Content rules in `CLAUDE.md` for ANTSA
  still apply in full and are unchanged by this redesign.
- **05 The engine room** gets the best room in the house. It is the half of the degree with
  no visuals on the current site. It holds a real object the visitor can turn, rendered by
  the same engine they are standing in.
- **06 The desk** is present tense: what Leo is looking for, how to reach him, the CV on the
  desk. The record player in the corner is the Spotify integration.

## Interaction model

**Primary loop.** Click or tap a room. The kid walks, runs or climbs a ladder along a grid
path to that room. He reaches the doorway and leans in. The camera pushes through. Room
content appears. Backing out reverses the camera and returns control.

**Movement is scripted, not simulated.** Rooms are cells on a grid, so the path between any
two cells is computed from grid coordinates. No pathfinding, no physics, no navmesh.

**The scroll is gone.** There is no page scroll on the house view. Navigation is selection
plus camera movement. Room content, once open, may scroll internally when it is long.

**The debug lens is cut from v1.** An earlier concept had a global hold-to-reveal wireframe
mode showing colliders and labels. Two competing reveal gestures is one too many, and the
peek already carries the spine. It returns later as a discoverable inside room 05 only,
where a debug view is native to the subject matter.

**The command palette survives.** It stays as a shortcut for visitors who would rather type
than explore, and it doubles as part of the keyboard route.

## Phone

A six-cell cutaway at 375 px gives each room roughly 110 px of width, which is unreadable.
The house re-composes instead of shrinking.

**Chosen: the house stands up.** The 3x2 grid re-flows to 1x6 and becomes a tower the kid
climbs. One room fills the screen width. Tapping a room above or below sends him up or down
the ladder. Because rooms are cells with a layout, this is a layout change and needs no new
art. Vertical reads as climbing and climbing reads as growing up, so the phone version
arguably tells the story better than the desktop one.

Movement must be tap-to-climb, not swipe-to-scroll. A tall thing you scroll through is the
scroll wearing a costume.

**Deferred, revisit after Phase 4:** an establishing shot of the whole house that holds for
about two seconds before pushing into room 01, with a minimap for orientation. This keeps
the strongest beat of the desktop version on phones. It was deferred because it needs a
camera state machine and a minimap that nothing else requires. Reconsider once the build is
otherwise complete.

## Legibility: making the metaphor land for a stranger

The two reference sites get away with zero explanation because everyone already knows VS
Code and macOS. Nobody knows Leo's life. A room holding a crate and a whiteboard cannot on
its own tell a stranger "FRC robotics, Ho Chi Minh City, two years." Explanatory text here
is load-bearing, not a failure of the metaphor.

Three tiers, each catching a different visitor.

**Tier 1: exterior labels.** Every room is tagged on the outside with year and place,
readable before a single click. Six labels running from "2013, Ho Chi Minh" to "Now,
Melbourne" explain the whole conceit in about two seconds with no sentence required. This
tier does most of the work.

**Tier 2: entry text, 40 words hard cap.** Shows every time a visitor enters a room. It is
not a hover, not a toggle, and not optional. The visitor it exists for is the one who did
not understand the room, and that visitor will not go hunting for a button.

The 40-word cap is a requirement, not a guideline. It is what keeps "short and concise" true
by the time room six gets written.

- **Desktop treatment: the placard.** A small museum placard stands in the room. The house
  reads as an exhibit of a life, which is a stronger idea than the house alone, and it is
  the only treatment where the explaining text strengthens the metaphor rather than
  apologising for it.
- **Phone treatment: the caption band.** A placard is unreadable in a tower cell at 375 px.
  On phone the same text sits in a band beneath the room, the way a caption sits under a
  photograph. One component, two layouts, not two features.
- Render the placard as a DOM overlay positioned to look diegetic. Never as 3D text: 3D text
  is unreadable at small sizes and invisible to assistive technology.

**Tier 3: the full case study.** The existing prose, for anyone who wants the detail. Tier 2
must carry an explicit, visible affordance into Tier 3. A visitor who wants more has to be
able to see that more exists. Discovery by accident does not count.

Draft copy for all six rooms is written in Phase 2 alongside room dressing, under the 40-word
cap and the prose rules in `CLAUDE.md`: active voice, no em dashes, no adverb crutches.

## Fallbacks and accessibility

These are requirements, not enhancements. A recruiter on a locked-down corporate machine is
a real and common visitor.

**Render once, deliver three ways.** Blender renders the house at a quality live WebGL will
never reach. That single art pass feeds:

1. Live three.js on capable hardware.
2. A pre-rendered still or short image sequence where WebGL is blocked, unavailable, or
   cannot hold 30 fps.
3. The loading poster. The still shows immediately and the live scene swaps in when ready,
   so nothing meaningful waits on a multi-megabyte download.
4. The OG image, generated from the same source.

**Detection.** Feature-detect WebGL2 and respect `prefers-reduced-motion`. Fall back on
context creation failure, not on user-agent sniffing.

**Text spine.** Every room's content exists as real HTML underneath the 3D layer. The house
is a presentation of that content, not a replacement for it. This gives screen readers a
complete document, gives search engines something to index, and makes the no-WebGL path a
styling problem rather than a rebuild.

The text spine and the legibility ladder above are the same feature. Tier 2 entry text and
Tier 3 case studies are the spine's content; the placard and the caption band are two of its
presentations. Build it once and it serves the stranger who did not get the metaphor, the
screen reader, the blocked-WebGL visitor and the search crawler together. Author it as HTML
first and layer the 3D presentation over it, never the reverse.

**Keyboard.** Arrow keys move between rooms, Enter enters a room, Escape backs out. Focus
order follows the text spine. The command palette reaches every room directly.

## Art direction and production

The point of the art plan is speed. Every rule below exists to remove a step.

**Rooms are dressed, not modelled.** Model a kit of roughly ten props once: bed, desk,
shelf, screen, crate, wheel, door, rug, chair, window. Every room is a different
arrangement, palette and lighting out of that same kit. This is standard game level
construction, so the technique is on theme.

**One palette atlas, no UV unwrapping.** Use a tiny palette texture, for example 64x64 of
flat colour swatches, and assign faces to swatches. This removes per-prop UV unwrapping
entirely, which is the single largest time sink in a kit this size. It also gives the whole
kit one material and lets props batch into very few draw calls.

**Budgets.**

| Item | Target |
|------|-------:|
| Prop, each | 200 to 800 tris |
| Kid, including head | 2,000 to 4,000 tris |
| Whole scene | under 100k tris |
| Draw calls | under 30 |
| Scene assets, compressed | under 2.5 MB |

The triangle counts are generous on purpose. Draw calls and download size are the real
constraints, and the palette atlas addresses both.

**Grid discipline.** Model everything to a shared unit grid with consistent pivot
conventions, so props snap when kitbashing and rooms can be authored quickly.

**The kid.** Build a minimal hand-made rig of roughly fifteen bones. Skip Rigify: it is
excellent for film work and it exports to glTF messily. Animations needed for v1 are idle,
run, climb and lean. Evaluate Mixamo for the run cycle during Phase 1, with the caveat that
a bespoke idle sells character far more than a bespoke run does, so hand-animate the idle
regardless.

**Export.** glTF binary with Draco or meshopt compression. One `.glb` for the prop kit, one
for the kid, one for the house shell.

**A step-by-step Blender walkthrough is a Phase 0 deliverable**, written before modelling
starts, covering the palette atlas setup, the grid and pivot conventions, the export
settings, and the rig. It is a separate document from this spec.

## Technical architecture

Astro stays. No UI framework, consistent with the current site.

- `/` becomes the house once Phase 4 lands. Until then the current site stays live and
  untouched, and the house is built at `/house`.
- three.js loads only on routes that use it, via dynamic import, so the text spine and the
  no-WebGL path never pay for it.
- The per-build global budget gate in `scripts/check-budget.mjs` is replaced by per-route
  budgets. The house route is allowed to be heavy. Every other route stays close to zero.
- Scene code lives in `src/lib/house/` split by responsibility: scene setup, camera rig,
  room grid and layout, character controller, input. Keep files focused enough to reason
  about individually.
- Room content stays in the existing content collections. The 3D layer reads from them.
  There is one source of truth for content, as there is today.

## What survives, what is retired

**Survives:**

- The Spotify pipeline in full. The workflow, the workflow's secrets, and
  `fetch-now-playing.mjs` are untouched. The header music button becomes the record player
  in room 06, and the album palette tint now lights the house.
- The command palette.
- The CV generator, still built from `profile.ts`.
- All written case study prose. The container changes, the writing does not.
- `profile.ts` and the content collections as the single source of truth.

**Retired:**

- CostExplorer and Instrument.
- The global build-time budget gate, replaced by per-route budgets.
- The Timeline component. The house does this better.
- Hero, Work index, ProjectRow, Navigator, Section, and the whole poster-scroll layout.

## Phasing and estimate

Roughly 150 to 200 hours total. Four to five weeks full time, or about three months at a
realistic part-time pace alongside a job search.

| Work | Estimate |
|------|---------:|
| Prop kit, modelled, textured, exported | 15 to 25h |
| The kid: model, UV, rig, skin, idle/run/climb/peek | 30 to 50h |
| House shell and dressing six rooms | 10 to 15h |
| three.js scene, camera, materials, responsive re-flow | 25 to 40h |
| Interaction: room select, path, push-in, exit | 20 to 30h |
| Content layer inside rooms | 15 to 25h |
| Fallbacks: pre-render pipeline, no-WebGL, keyboard, screen reader | 15 to 25h |
| Loading experience, performance, real-device testing | 15 to 25h |

**Phase 0, about 15 hours. Greybox.** No art at all. Boxes for props, a capsule for the kid.
Get the run, the climb, the camera push-in and the exit right. If poking around a house of
grey boxes is boring, no amount of Blender fixes it, and that is worth knowing in week one
rather than month three. The Blender walkthrough is written in this phase.

**Phase 1, about 50 hours. Vertical slice.** Room 01 only, with the real kid and real props.
Answers the two questions that decide the project: does the character read as charming, and
does it hold 30 fps on the worst phone available for testing.

**Phase 2. The other five rooms.** Cheap once the kit and the systems exist.

**Phase 3. Fallbacks, accessibility, loading, performance.**

**Phase 4. Cut over.** `/house` becomes `/`. Retire the replaced components.

**The live site stays up throughout.** Build at `/house` and cut over only when the house
beats what is already there. Going dark on a portfolio for three months during a job search
is the one clearly bad outcome available, and it is avoidable. Every phase is publishable on
its own.

## Risks

1. **The character carries the concept.** This design leans on the skill Leo's own CV marks
   as weakest: "Game & 3D, coursework, no shipped titles." A kid that lands in the uncanny
   valley kills the whole thing regardless of how good the rest is. Phases 0 and 1 exist to
   find this out early. This is the single largest risk in the project.
2. **Estimate blowout on the character.** The 30 to 50 hour line is the one most likely to
   double.
3. **Blender learning curve.** Real, but small next to the glTF pipeline risk it removes.
   Modelling transfers from Maya reasonably well; rigging is where the relearning lands.
4. **Phone performance.** Mid-range Android under thermal throttling is the worst case. The
   pre-rendered path is the mitigation and is why it is a requirement rather than a nicety.
5. **Losing search visibility during the rebuild.** Mitigated by the text spine and by not
   cutting over until Phase 4.
6. **Scope creep into a game.** The house is a portfolio. Anything that does not help a
   visitor understand Leo or reach him is out.

## Open questions

None blocking. Two to answer with evidence during the build:

- Does the kid age visibly across floors, or only change height? Decide in Phase 2 once the
  rig exists, since visible ageing multiplies character work.
- Does Mixamo produce an acceptable run cycle on a stylised child rig, or is hand animation
  required? Decide in Phase 1.
