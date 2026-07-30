# The House, Phase 0: Greybox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the house is fun to explore before any art exists, using grey boxes and a capsule, at `/house`, without touching the live site.

**Architecture:** A new route `/house` renders real HTML for all six rooms first (the text spine). A plain TypeScript module tree under `src/lib/house/` is dynamically imported only when WebGL is available, and layers a three.js greybox over that HTML. Room geometry comes from a pure grid module with no three.js dependency, so layout and pathfinding are unit tested in Node without a browser.

**Tech Stack:** Astro 7, TypeScript strict, three.js (new dependency), `node:test` with native TypeScript stripping (Node 22.18, zero new dev dependencies).

## Global Constraints

Copied from `docs/superpowers/specs/2026-07-31-portfolio-house-design.md` and `CLAUDE.md`. Every task's requirements implicitly include this section.

- **The live site must stay untouched.** Do not modify `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/work/`, `Hero.astro`, `Work.astro`, `ProjectRow.astro`, `Timeline.astro`, `Navigator.astro`, `CostExplorer.astro`, or `Instrument.astro` in this phase. Retirement happens in Phase 4.
- **No UI framework.** Plain TypeScript modules only. No React, no three.js scene-graph helper libraries.
- **Every script initialises on `astro:page-load`.** ClientRouter is enabled and module scripts do not re-run after navigation.
- **Never write the `animation` shorthand in a rule that also sets `animation-timeline`.** Lightning CSS folds them into a declaration browsers drop silently. Longhands only.
- **Reveals have exactly one owner:** the IntersectionObserver in `Layout.astro`. Do not add a second reveal mechanism on `/house`.
- **`prefetchAll: true` is on** with a `viewport` strategy. Every link pointing at `/house` must carry `data-astro-prefetch="false"` or visitors download the three.js chunk from pages that never use it.
- **Path alias:** `~/*` resolves to `src/*`.
- **Prose rules for any visitor-facing copy:** active voice, no em dashes, no adverb crutches, no "not X but Y" contrasts.
- **Tier 2 entry text is capped at 40 words per room.** Hard limit, enforced by a test in Task 4.
- **Do not commit `WORKING-NOTES.md`.** It is gitignored and was removed from git history deliberately.
- **Branch:** `direction-decision`. Commit after every task.

## Grid convention, resolved

The approved spec says rooms read "bottom left to top right", and the phone tower has the kid climbing upward through time. The floor plan mockup drew room 01 top-left, which contradicts both. **This plan uses the spec prose: row 0 is the bottom row and holds the earliest rooms.** Desktop bottom row is rooms 01 to 03, top row is 04 to 06. Climbing always moves forward in time, on both desktop and phone.

## File Structure

**Created:**

| File | Responsibility |
|------|----------------|
| `src/data/house.ts` | The six room definitions. Pure data, no logic. |
| `src/lib/house/grid.ts` | Cell layout maths. Index to `{col,row}`, cell to world position, viewport to column count. No three.js import. |
| `src/lib/house/grid.test.ts` | Unit tests for `grid.ts`. |
| `src/lib/house/path.ts` | Route between two cells as walk and climb moves. No three.js import. |
| `src/lib/house/path.test.ts` | Unit tests for `path.ts`. |
| `src/lib/house/rooms.test.ts` | Guards the 40-word Tier 2 cap and room data integrity. |
| `src/lib/house/scene.ts` | three.js scene, renderer, greybox meshes built from the grid. |
| `src/lib/house/camera.ts` | Camera rig with overview and pushed-in states. |
| `src/lib/house/character.ts` | The capsule, and following a path produced by `path.ts`. |
| `src/lib/house/input.ts` | Pointer and keyboard to room selection. |
| `src/lib/house/index.ts` | Orchestrator. The only module the page dynamically imports. |
| `src/pages/house.astro` | The route. Text spine markup plus the mount point. |
| `src/components/house/RoomSpine.astro` | One room's HTML content. Rendered six times. |
| `docs/blender-production-guide.md` | The Phase 1 art walkthrough. |

**Modified:**

| File | Change |
|------|--------|
| `src/data/budget.ts` | Add `houseJavascript` build budget. |
| `scripts/check-budget.mjs` | Split JS accounting into site and house buckets. |
| `astro.config.mjs` | Force three.js and `src/lib/house/` into a chunk named `house`. |
| `package.json` | Add `three`, `@types/three`, and a `test` script. |

---

### Task 1: Per-route budgets so three.js can exist at all

`check-budget.mjs` currently sums every `.js` file in `dist/` against a 15 KB gzip ceiling. three.js is roughly ten times that. Until this task lands, `npm run build` fails and no later task can be verified. Nothing else in this plan is blocked by anything except this.

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/data/budget.ts:66-72`
- Modify: `scripts/check-budget.mjs:63-90`

**Interfaces:**
- Consumes: nothing.
- Produces: `buildBudget.houseJavascript: number`. A build convention that every emitted chunk belonging to the house has a filename beginning with `house`.

- [ ] **Step 1: Force the house code into a predictably named chunk**

In `astro.config.mjs`, add a `build.rollupOptions` block inside the existing `vite` object, after the `plugins` key:

```js
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // The budget gate accounts for the house separately from the rest of the
          // site, and it identifies the house by chunk name. Pinning three.js and
          // everything under src/lib/house into one predictably named chunk is what
          // makes that accounting deterministic instead of a guess about hashes.
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'house';
            if (id.includes('src/lib/house')) return 'house';
            return undefined;
          },
        },
      },
    },
  },
```

- [ ] **Step 2: Add the house budget**

In `src/data/budget.ts`, add a field to the `BuildBudget` interface after `javascript`:

```ts
  /**
   * Combined gzipped size of every .js chunk belonging to the house route.
   *
   * Budgeted separately from `javascript` on purpose. The site retired its
   * page-weight thesis, but the argument that the rest of the site should stay
   * near zero still holds: only the route that needs a 3D scene should pay for
   * one. A single global figure would have let three.js hide the cost of
   * everything else.
   */
  houseJavascript: number;
```

Then add the value to the `buildBudget` object after `javascript: 15 * KB,`:

```ts
  // three.js core plus the house modules. Set with headroom over the greybox
  // build so Phase 1 art loading does not trip it, and low enough that pulling in
  // a second large dependency does.
  houseJavascript: 220 * KB,
```

- [ ] **Step 3: Split the accounting in the budget script**

In `scripts/check-budget.mjs`, replace the block from `const js = files.filter(...)` through the `const checks = [` array. Replace:

```js
  const js = files.filter((f) => f.endsWith('.js'));
```

with:

```js
  const allJs = files.filter((f) => f.endsWith('.js'));
  // Chunk naming is pinned in astro.config.mjs so this match is a contract, not a
  // heuristic about how Rollup happens to name things today.
  const houseJs = allJs.filter((f) => path.basename(f).startsWith('house'));
  const js = allJs.filter((f) => !houseJs.includes(f));
```

Then in the `checks` array, add a second entry directly after the `JavaScript` one:

```js
    {
      name: 'JS (house)',
      detail: `${houseJs.length} files`,
      actual: houseTotal,
      limit: buildBudget.houseJavascript,
    },
```

And add the sum alongside `const jsTotal = await sum(js);`:

```js
  const houseTotal = await sum(houseJs);
```

- [ ] **Step 4: Verify the gate still passes on the untouched site**

Run: `npm run build`

Expected: PASS. `JS (house)` reports `0 files` and `0.0 KB / 220.0 KB`, and the `JavaScript` line is unchanged from before this task, around 10.9 KB.

- [ ] **Step 5: Verify the gate can still fail**

Temporarily set `houseJavascript: 0` in `src/data/budget.ts`, create a throwaway file `src/lib/house/probe.ts` containing `export const probe = 1;`, and import it from a dynamic import in any page. Run `npm run build`.

Expected: FAIL, with `JS (house)` over budget and a non-zero exit code.

Then revert both changes: restore `houseJavascript: 220 * KB` and delete `src/lib/house/probe.ts` and the temporary import.

- [ ] **Step 6: Commit**

```bash
git add astro.config.mjs src/data/budget.ts scripts/check-budget.mjs
git commit -m "build: budget the house route separately from the site"
```

---

### Task 2: Room data and the grid layout

**Files:**
- Create: `src/data/house.ts`
- Create: `src/lib/house/grid.ts`
- Create: `src/lib/house/grid.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `rooms: readonly Room[]` where `Room = { id: string; index: number; title: string; era: string; place: string; entry: string }`
  - `type Cell = { col: number; row: number }`
  - `columnsFor(viewportWidth: number): number`
  - `cellFor(index: number, columns: number): Cell`
  - `worldPositionFor(cell: Cell): { x: number; y: number }`
  - `CELL_WIDTH: number`, `CELL_HEIGHT: number`, `PHONE_BREAKPOINT: number`

- [ ] **Step 1: Add the test script**

In `package.json`, add to `scripts`, after `"budget"`:

```json
    "test": "node --test src/**/*.test.ts",
```

Node 22.18 strips TypeScript types natively, so this needs no test framework and no new dependency.

- [ ] **Step 2: Write the room data**

Create `src/data/house.ts`:

```ts
/**
 * The six rooms, in chronological order. Index 0 is the earliest and sits on the
 * bottom-left of the house; index 5 is the present and sits top-right. Climbing
 * always moves forward in time.
 *
 * `entry` is Tier 2 of the legibility ladder and is capped at 40 words. The cap is
 * enforced by src/lib/house/rooms.test.ts because it is the thing most likely to
 * erode quietly while writing room six.
 */
export interface Room {
  /** URL fragment and DOM id. Stable; the command palette will link to these. */
  readonly id: string;
  /** Chronological position, 0 to 5. Drives grid placement. */
  readonly index: number;
  readonly title: string;
  readonly era: string;
  readonly place: string;
  /** Tier 2 entry text. 40 words maximum. */
  readonly entry: string;
}

export const rooms: readonly Room[] = [
  {
    id: 'bedroom',
    index: 0,
    title: 'The Bedroom',
    era: '2013',
    place: 'Ho Chi Minh City',
    entry:
      'Where this starts. A kid who wanted to know how the games he played were made, ' +
      'taking things apart to find out.',
  },
  {
    id: 'workshop',
    index: 1,
    title: 'The Workshop',
    era: '2021',
    place: 'Ho Chi Minh City',
    entry:
      'Two years on an FRC robotics team writing navigation and sensor code in Python ' +
      'and C++. Watching a machine do the wrong thing taught me where the work lives.',
  },
  {
    id: 'monash',
    index: 2,
    title: 'The Odd Pairing',
    era: '2023',
    place: 'Monash University',
    entry:
      'Software Development major, Games Development minor. Two desks facing each other. ' +
      'I would choose the same pairing again.',
  },
  {
    id: 'antsa',
    index: 3,
    title: 'The Live Platform',
    era: '2025',
    place: 'ANTSA',
    entry:
      'A live Australian digital mental health platform. I made questionnaire scoring ' +
      'configurable at runtime, and traced a data mismatch that produced no error and no ' +
      'log entry.',
  },
  {
    id: 'engine',
    index: 4,
    title: 'The Engine Room',
    era: 'ongoing',
    place: 'Unity, Unreal, Blender',
    entry:
      'Gameplay systems in C# and C++, and topology optimised for realtime rendering. ' +
      'This half of the degree is why I count frames and bytes in a backend.',
  },
  {
    id: 'desk',
    index: 5,
    title: 'The Desk',
    era: 'now',
    place: 'Melbourne',
    entry:
      'Present tense. Open to graduate and junior software roles in Melbourne. The CV is ' +
      'on the desk and the record player is playing.',
  },
];
```

- [ ] **Step 3: Write the failing grid tests**

Create `src/lib/house/grid.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CELL_HEIGHT,
  CELL_WIDTH,
  cellFor,
  columnsFor,
  worldPositionFor,
} from './grid.ts';

test('desktop viewports lay the house out three wide', () => {
  assert.equal(columnsFor(1280), 3);
  assert.equal(columnsFor(1024), 3);
});

test('phone viewports lay the house out as a single column', () => {
  assert.equal(columnsFor(375), 1);
  assert.equal(columnsFor(767), 1);
});

test('the breakpoint itself is a desktop layout', () => {
  assert.equal(columnsFor(768), 3);
});

test('room 0 sits bottom-left on desktop', () => {
  assert.deepEqual(cellFor(0, 3), { col: 0, row: 0 });
});

test('the first three rooms fill the bottom row on desktop', () => {
  assert.deepEqual(cellFor(1, 3), { col: 1, row: 0 });
  assert.deepEqual(cellFor(2, 3), { col: 2, row: 0 });
});

test('the last three rooms fill the top row on desktop', () => {
  assert.deepEqual(cellFor(3, 3), { col: 0, row: 1 });
  assert.deepEqual(cellFor(5, 3), { col: 2, row: 1 });
});

test('phone stacks every room in one column, earliest at the bottom', () => {
  assert.deepEqual(cellFor(0, 1), { col: 0, row: 0 });
  assert.deepEqual(cellFor(5, 1), { col: 0, row: 5 });
});

test('world position grows right with column and up with row', () => {
  assert.deepEqual(worldPositionFor({ col: 0, row: 0 }), { x: 0, y: 0 });
  assert.deepEqual(worldPositionFor({ col: 2, row: 1 }), {
    x: 2 * CELL_WIDTH,
    y: CELL_HEIGHT,
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL with a module resolution error for `./grid.ts`.

- [ ] **Step 5: Write the grid module**

Create `src/lib/house/grid.ts`:

```ts
/**
 * Cell layout for the house. Deliberately free of any three.js import so the
 * layout rules can be unit tested in Node without a browser or a GL context.
 *
 * Row 0 is the BOTTOM row and holds the earliest rooms. Climbing moves forward in
 * time on both layouts, which is the whole point of the phone tower.
 */
import type { Room } from '~/data/house';

export interface Cell {
  readonly col: number;
  readonly row: number;
}

/** World units. Arbitrary in the greybox; the art in Phase 1 is built to match. */
export const CELL_WIDTH = 10;
export const CELL_HEIGHT = 7;

/**
 * Below this width the house re-flows from 3x2 into a 1x6 tower. 768 counts as
 * desktop: at 768 a three-wide house still gives each room 256 CSS pixels, which
 * reads, and tablets in landscape should get the full composition.
 */
export const PHONE_BREAKPOINT = 768;

export function columnsFor(viewportWidth: number): number {
  return viewportWidth < PHONE_BREAKPOINT ? 1 : 3;
}

export function cellFor(index: number, columns: number): Cell {
  return { col: index % columns, row: Math.floor(index / columns) };
}

export function worldPositionFor(cell: Cell): { x: number; y: number } {
  return { x: cell.col * CELL_WIDTH, y: cell.row * CELL_HEIGHT };
}

/** Every room paired with the cell it occupies at the given column count. */
export function layout(
  roomList: readonly Room[],
  columns: number,
): readonly { room: Room; cell: Cell }[] {
  return roomList.map((room) => ({ room, cell: cellFor(room.index, columns) }));
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`

Expected: PASS, 8 tests.

- [ ] **Step 7: Commit**

```bash
git add package.json src/data/house.ts src/lib/house/grid.ts src/lib/house/grid.test.ts
git commit -m "feat(house): room data and the cell grid, with tests"
```

---

### Task 3: Path between cells

**Files:**
- Create: `src/lib/house/path.ts`
- Create: `src/lib/house/path.test.ts`

**Interfaces:**
- Consumes: `Cell` from `./grid.ts`.
- Produces:
  - `type MoveKind = 'walk' | 'climb'`
  - `type Move = { kind: MoveKind; to: Cell }`
  - `ladderColumnFor(columns: number): number`
  - `pathBetween(from: Cell, to: Cell, ladderColumn: number): readonly Move[]`

- [ ] **Step 1: Write the failing path tests**

Create `src/lib/house/path.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ladderColumnFor, pathBetween } from './path.ts';

test('standing still produces no moves', () => {
  assert.deepEqual(pathBetween({ col: 1, row: 0 }, { col: 1, row: 0 }, 2), []);
});

test('same floor is a single walk', () => {
  assert.deepEqual(pathBetween({ col: 0, row: 0 }, { col: 2, row: 0 }, 2), [
    { kind: 'walk', to: { col: 2, row: 0 } },
  ]);
});

test('a different floor walks to the ladder, climbs, then walks on', () => {
  assert.deepEqual(pathBetween({ col: 0, row: 0 }, { col: 1, row: 1 }, 2), [
    { kind: 'walk', to: { col: 2, row: 0 } },
    { kind: 'climb', to: { col: 2, row: 1 } },
    { kind: 'walk', to: { col: 1, row: 1 } },
  ]);
});

test('starting at the ladder skips the approach walk', () => {
  assert.deepEqual(pathBetween({ col: 2, row: 0 }, { col: 0, row: 1 }, 2), [
    { kind: 'climb', to: { col: 2, row: 1 } },
    { kind: 'walk', to: { col: 0, row: 1 } },
  ]);
});

test('arriving at the ladder column skips the departure walk', () => {
  assert.deepEqual(pathBetween({ col: 0, row: 0 }, { col: 2, row: 1 }, 2), [
    { kind: 'walk', to: { col: 2, row: 0 } },
    { kind: 'climb', to: { col: 2, row: 1 } },
  ]);
});

test('climbing down works the same way', () => {
  assert.deepEqual(pathBetween({ col: 0, row: 1 }, { col: 1, row: 0 }, 2), [
    { kind: 'walk', to: { col: 2, row: 1 } },
    { kind: 'climb', to: { col: 2, row: 0 } },
    { kind: 'walk', to: { col: 1, row: 0 } },
  ]);
});

test('climbing more than one floor is still one climb move', () => {
  const path = pathBetween({ col: 0, row: 0 }, { col: 0, row: 5 }, 0);
  assert.deepEqual(path, [{ kind: 'climb', to: { col: 0, row: 5 } }]);
});

test('the ladder sits in the last column on desktop and the only one on phone', () => {
  assert.equal(ladderColumnFor(3), 2);
  assert.equal(ladderColumnFor(1), 0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL with a module resolution error for `./path.ts`.

- [ ] **Step 3: Write the path module**

Create `src/lib/house/path.ts`:

```ts
/**
 * Routing between room cells.
 *
 * Rooms are cells on a fixed grid, so there is nothing here to solve: no
 * pathfinding, no navmesh, no physics. The kid walks along a floor, climbs one
 * ladder, and walks again. Keeping this pure and three.js-free is what lets the
 * movement rules be tested in Node rather than eyeballed in a browser.
 */
import type { Cell } from './grid.ts';

export type MoveKind = 'walk' | 'climb';

export interface Move {
  readonly kind: MoveKind;
  readonly to: Cell;
}

/** One ladder serves the whole house. On desktop it is the rightmost column. */
export function ladderColumnFor(columns: number): number {
  return columns - 1;
}

export function pathBetween(from: Cell, to: Cell, ladderColumn: number): readonly Move[] {
  if (from.col === to.col && from.row === to.row) return [];

  if (from.row === to.row) {
    return [{ kind: 'walk', to }];
  }

  const moves: Move[] = [];
  if (from.col !== ladderColumn) {
    moves.push({ kind: 'walk', to: { col: ladderColumn, row: from.row } });
  }
  moves.push({ kind: 'climb', to: { col: ladderColumn, row: to.row } });
  if (to.col !== ladderColumn) {
    moves.push({ kind: 'walk', to });
  }
  return moves;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`

Expected: PASS, 16 tests total across both files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/house/path.ts src/lib/house/path.test.ts
git commit -m "feat(house): walk and climb routing between room cells"
```

---

### Task 4: The text spine, with no 3D at all

This is the whole route working as a plain document. It is the accessibility spine, the no-WebGL fallback, the search-indexable copy and the legibility ladder, all at once. Building it before the 3D is deliberate: the 3D is a presentation layered over this, never a replacement for it.

**Files:**
- Create: `src/components/house/RoomSpine.astro`
- Create: `src/pages/house.astro`
- Create: `src/lib/house/rooms.test.ts`

**Interfaces:**
- Consumes: `rooms` from `~/data/house`.
- Produces: DOM contract relied on by Tasks 5 to 9. `#house-stage` is the mount point for the canvas. Each room section has `id="room-{id}"` and `data-room-index="{index}"`.

- [ ] **Step 1: Write the failing content tests**

Create `src/lib/house/rooms.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { rooms } from '~/data/house';

const wordCount = (text: string) => text.trim().split(/\s+/).length;

test('there are exactly six rooms', () => {
  assert.equal(rooms.length, 6);
});

test('indices are contiguous and in chronological order', () => {
  rooms.forEach((room, i) => assert.equal(room.index, i));
});

test('room ids are unique', () => {
  assert.equal(new Set(rooms.map((r) => r.id)).size, rooms.length);
});

test('every entry text stays inside the 40 word cap', () => {
  for (const room of rooms) {
    const count = wordCount(room.entry);
    assert.ok(count <= 40, `${room.id} entry is ${count} words, cap is 40`);
  }
});

test('entry text uses no em dashes', () => {
  for (const room of rooms) {
    assert.ok(!room.entry.includes('—'), `${room.id} entry contains an em dash`);
  }
});
```

Node resolves the `~` alias from `tsconfig.json` only under a bundler. Run the tests with the alias mapped explicitly by adding to `package.json` scripts, replacing the `test` script from Task 2:

```json
    "test": "node --experimental-strip-types --test src/**/*.test.ts",
```

If `~/data/house` fails to resolve under `node --test`, change the import in this test file to a relative path `../../data/house.ts` and keep the alias for application code only. Verify which works in Step 2 and keep the one that does.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL on the import until the resolution question above is settled, then PASS once resolved, since `src/data/house.ts` already exists from Task 2 and its copy is already within the cap. If any entry exceeds 40 words, shorten the copy, do not raise the cap.

- [ ] **Step 3: Write the room spine component**

Create `src/components/house/RoomSpine.astro`:

```astro
---
import type { Room } from '~/data/house';

interface Props {
  room: Room;
}

const { room } = Astro.props;
---

<!--
  One room as plain HTML. This is Tier 2 and Tier 3 of the legibility ladder and the
  accessibility spine in one component. The three.js layer positions a placard over
  this on desktop and a caption band under it on phone; neither replaces it, and with
  JavaScript off or WebGL blocked this is the whole experience.
-->
<section
  id={`room-${room.id}`}
  class="house-room"
  data-room-index={room.index}
  aria-labelledby={`room-${room.id}-title`}
>
  <p class="house-room__label">
    <span>{String(room.index + 1).padStart(2, '0')}</span>
    <span>{room.era}</span>
    <span>{room.place}</span>
  </p>

  <h2 id={`room-${room.id}-title`} class="house-room__title">{room.title}</h2>

  <p class="house-room__entry">{room.entry}</p>

  <a class="house-room__more" href={`#room-${room.id}-detail`}>
    Read the full story
  </a>

  <div id={`room-${room.id}-detail`} class="house-room__detail">
    <slot />
  </div>
</section>
```

- [ ] **Step 4: Write the route**

Create `src/pages/house.astro`:

```astro
---
import Layout from '~/layouts/Layout.astro';
import RoomSpine from '~/components/house/RoomSpine.astro';
import { rooms } from '~/data/house';

/**
 * The house, under construction. The live site at / is untouched until Phase 4.
 *
 * The markup below is authored first and is the source of truth for content. The
 * three.js layer in src/lib/house/ is dynamically imported over the top of it, only
 * when WebGL is available and motion is not reduced.
 */
---

<Layout title="The House" description="A portfolio you walk around in. Under construction." subpage>
  <div id="house-stage" class="house-stage" data-house-state="spine">
    <div class="house-spine">
      {rooms.map((room) => <RoomSpine room={room}>
        <p>Full case study for {room.title} lands in Phase 2.</p>
      </RoomSpine>)}
    </div>
  </div>
</Layout>

<style>
  /* Greybox styling only. Phase 1 replaces this wholesale. */
  .house-stage { position: relative; min-height: 100svh; }
  .house-spine { max-width: 46rem; margin: 0 auto; padding: 4rem 1.5rem; }
  .house-room { padding-block: 2.5rem; border-top: 1px solid var(--border, #ccc); }
  .house-room__label {
    display: flex; gap: 0.75rem;
    font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--text-muted, #666);
  }
  .house-room__title { font-family: var(--font-display); font-size: 2rem; margin-block: 0.5rem; }
  .house-room__entry { max-width: 34rem; }
  .house-room__more { display: inline-block; margin-top: 1rem; font-size: 0.875rem; }
</style>

<script>
  /**
   * Loads the 3D layer only when it can actually run, and only on this route.
   *
   * Initialises on astro:page-load because ClientRouter is on and module scripts do
   * not re-run after navigation. The guard keeps a second navigation back to /house
   * from mounting two scenes.
   */
  let mounted = false;

  async function mountHouse() {
    const stage = document.getElementById('house-stage');
    if (!stage || mounted) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return;

    mounted = true;
    const { mountHouseScene } = await import('~/lib/house/index.ts');
    mountHouseScene(stage);
  }

  document.addEventListener('astro:page-load', mountHouse);
</script>
```

- [ ] **Step 5: Verify the spine renders and the site still builds**

Run: `npm run build`

Expected: PASS. `JS (house)` still reports near zero because `src/lib/house/index.ts` does not exist yet, so the dynamic import is not resolved into a chunk. If `astro check` errors on the missing module, create `src/lib/house/index.ts` containing only `export function mountHouseScene(_stage: HTMLElement): void {}` and note that Task 5 replaces it.

- [ ] **Step 6: Verify in the browser**

Run `npm run dev`, then check `http://localhost:4321/house` with the gstack `/browse` binary. Take a screenshot.

Expected: six room sections, each with label, title, entry text and a "Read the full story" link. Confirm the page is fully readable with JavaScript disabled.

- [ ] **Step 7: Commit**

```bash
git add src/components/house src/pages/house.astro src/lib/house/rooms.test.ts package.json
git commit -m "feat(house): the text spine at /house, authored before the 3D"
```

---

### Task 5: The greybox scene

**Files:**
- Modify: `package.json`
- Create: `src/lib/house/scene.ts`
- Create: `src/lib/house/index.ts` (replacing the Task 4 stub if it was created)

**Interfaces:**
- Consumes: `layout`, `worldPositionFor`, `CELL_WIDTH`, `CELL_HEIGHT` from `./grid.ts`; `rooms` from `~/data/house`.
- Produces:
  - `createScene(container: HTMLElement, columns: number): HouseScene`
  - `interface HouseScene { scene: THREE.Scene; renderer: THREE.WebGLRenderer; roomMeshes: Map<number, THREE.Mesh>; rebuild(columns: number): void; resize(): void; dispose(): void }`
  - `mountHouseScene(stage: HTMLElement): void`

- [ ] **Step 1: Install three.js**

```bash
npm install three
npm install --save-dev @types/three
```

- [ ] **Step 2: Write the scene module**

Create `src/lib/house/scene.ts`:

```ts
/**
 * Greybox house. Boxes for rooms, boxes for props, no materials worth the name.
 *
 * The point of Phase 0 is to find out whether moving around this is enjoyable before
 * any art exists. If it is boring in grey, no amount of Blender fixes it.
 */
import * as THREE from 'three';

import { rooms } from '~/data/house';
import { CELL_HEIGHT, CELL_WIDTH, layout } from './grid.ts';

export interface HouseScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly roomMeshes: Map<number, THREE.Mesh>;
  rebuild(columns: number): void;
  resize(): void;
  dispose(): void;
}

const ROOM_DEPTH = 6;
const WALL = 0.3;

export function createScene(container: HTMLElement, columns: number): HouseScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0c10);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 8, 10);
  scene.add(key);

  const roomMeshes = new Map<number, THREE.Mesh>();
  const group = new THREE.Group();
  scene.add(group);

  let columnsNow = columns;

  const shellMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2740 });
  const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x1b1828 });
  const propMaterial = new THREE.MeshLambertMaterial({ color: 0x564a75 });

  function clear() {
    group.clear();
    roomMeshes.clear();
  }

  function build(cols: number) {
    clear();
    columnsNow = cols;

    for (const { room, cell } of layout(rooms, cols)) {
      const x = cell.col * CELL_WIDTH;
      const y = cell.row * CELL_HEIGHT;

      // The room volume. Invisible, and used only as the click target and the
      // anchor the camera pushes toward.
      const volume = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_WIDTH - WALL, CELL_HEIGHT - WALL, ROOM_DEPTH),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      volume.position.set(x, y, 0);
      volume.userData.roomIndex = room.index;
      group.add(volume);
      roomMeshes.set(room.index, volume);

      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_WIDTH, WALL, ROOM_DEPTH),
        floorMaterial,
      );
      floor.position.set(x, y - CELL_HEIGHT / 2, 0);
      group.add(floor);

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_WIDTH, CELL_HEIGHT, WALL),
        shellMaterial,
      );
      back.position.set(x, y, -ROOM_DEPTH / 2);
      group.add(back);

      // Three grey props per room, so each cell reads as occupied and the camera
      // has something to frame when it pushes in.
      for (let i = 0; i < 3; i += 1) {
        const w = 1 + ((room.index + i) % 3) * 0.6;
        const h = 0.8 + ((room.index * 2 + i) % 3) * 0.7;
        const prop = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.4), propMaterial);
        prop.position.set(
          x - CELL_WIDTH / 2 + 1.8 + i * 2.6,
          y - CELL_HEIGHT / 2 + WALL / 2 + h / 2,
          0,
        );
        group.add(prop);
      }
    }

    // Centre the house on the origin so the camera framing maths stays simple.
    const width = (cols - 1) * CELL_WIDTH;
    const height = (Math.ceil(rooms.length / cols) - 1) * CELL_HEIGHT;
    group.position.set(-width / 2, -height / 2, 0);
  }

  function resize() {
    const w = container.clientWidth;
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h, false);

    // Default framing: the whole house, with padding. The camera rig in camera.ts
    // takes ownership of the frustum once it exists, but setting a real one here
    // keeps this module independently viewable rather than rendering an empty
    // canvas until the rig lands.
    const rowCount = Math.ceil(rooms.length / columnsNow);
    const halfHeight = (rowCount * CELL_HEIGHT * 1.15) / 2;
    const halfWidth = halfHeight * (w / h);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }

  build(columns);
  resize();

  return {
    scene,
    camera,
    renderer,
    roomMeshes,
    rebuild: build,
    resize,
    dispose() {
      clear();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
```

- [ ] **Step 3: Write the orchestrator**

Create `src/lib/house/index.ts`, replacing the Task 4 stub if present:

```ts
/**
 * The only module src/pages/house.astro imports. Everything three.js hangs off here
 * so the dynamic import boundary stays in one obvious place.
 */
import { columnsFor } from './grid.ts';
import { createScene, type HouseScene } from './scene.ts';

let active: HouseScene | null = null;

export function mountHouseScene(stage: HTMLElement): void {
  if (active) return;

  const columns = columnsFor(window.innerWidth);
  active = createScene(stage, columns);
  stage.dataset.houseState = 'scene';

  let frame = 0;
  const tick = () => {
    frame = requestAnimationFrame(tick);
    active?.renderer.render(active.scene, active.camera);
  };
  tick();

  window.addEventListener('resize', () => active?.resize());

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(frame);
    active?.dispose();
    active = null;
  }, { once: true });
}
```

- [ ] **Step 4: Verify the build and the budget**

Run: `npm run build`

Expected: PASS. `JS (house)` now reports a real number, roughly 130 to 170 KB gzipped, under the 220 KB limit. The site `JavaScript` line must be unchanged at around 10.9 KB. If the site line moved, the manual chunk from Task 1 is not catching three.js and must be fixed before continuing.

- [ ] **Step 5: Verify in the browser**

Run `npm run dev` and open `/house` with the gstack `/browse` binary. Screenshot it.

Expected: a dark canvas showing six grey room boxes in a 3x2 arrangement with grey props on each floor. Check the console for errors with `$B console --errors`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/house/scene.ts src/lib/house/index.ts
git commit -m "feat(house): greybox scene with six room cells"
```

---

### Task 6: Camera rig

**Files:**
- Create: `src/lib/house/camera.ts`
- Modify: `src/lib/house/index.ts`

**Interfaces:**
- Consumes: `Cell` and `worldPositionFor` from `./grid.ts`.
- Produces:
  - `createCameraRig(camera: THREE.OrthographicCamera, container: HTMLElement): CameraRig`
  - `interface CameraRig { frameHouse(columns: number): void; pushInto(cell: Cell, columns: number): void; pullOut(): void; update(dt: number): void; get state(): 'overview' | 'room' }`

- [ ] **Step 1: Write the camera rig**

Create `src/lib/house/camera.ts`:

```ts
/**
 * Two camera states and an eased move between them: the whole house, or one room
 * filling the frame. An orthographic camera keeps the cutaway reading as a cutaway
 * rather than a perspective interior, and it makes the framing maths a zoom rather
 * than a dolly.
 */
import * as THREE from 'three';

import { CELL_HEIGHT, CELL_WIDTH, type Cell, worldPositionFor } from './grid.ts';
import { rooms } from '~/data/house';

export type CameraState = 'overview' | 'room';

export interface CameraRig {
  frameHouse(columns: number): void;
  pushInto(cell: Cell, columns: number): void;
  pullOut(): void;
  update(dt: number): void;
  readonly state: CameraState;
}

/** Seconds for a full push-in or pull-out. Inside the 50 to 700ms design range. */
const TRANSITION = 0.65;
const PADDING = 1.15;

export function createCameraRig(
  camera: THREE.OrthographicCamera,
  container: HTMLElement,
): CameraRig {
  let state: CameraState = 'overview';
  let columnsNow = 3;

  const target = { x: 0, y: 0, halfHeight: 1 };
  const current = { x: 0, y: 0, halfHeight: 1 };
  let t = 1;
  const from = { x: 0, y: 0, halfHeight: 1 };

  function apply() {
    const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    const halfW = current.halfHeight * aspect;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = current.halfHeight;
    camera.bottom = -current.halfHeight;
    camera.position.x = current.x;
    camera.position.y = current.y;
    camera.updateProjectionMatrix();
  }

  function moveTo(x: number, y: number, halfHeight: number) {
    from.x = current.x;
    from.y = current.y;
    from.halfHeight = current.halfHeight;
    target.x = x;
    target.y = y;
    target.halfHeight = halfHeight;
    t = 0;
  }

  function houseHalfHeight(columns: number) {
    const rowCount = Math.ceil(rooms.length / columns);
    return (rowCount * CELL_HEIGHT * PADDING) / 2;
  }

  function offsetFor(cell: Cell, columns: number) {
    // The group is centred on the origin in scene.ts, so a cell's world position has
    // to be shifted by the same amount to line the camera up with it.
    const world = worldPositionFor(cell);
    const rowCount = Math.ceil(rooms.length / columns);
    return {
      x: world.x - ((columns - 1) * CELL_WIDTH) / 2,
      y: world.y - ((rowCount - 1) * CELL_HEIGHT) / 2,
    };
  }

  return {
    frameHouse(columns) {
      columnsNow = columns;
      state = 'overview';
      moveTo(0, 0, houseHalfHeight(columns));
    },
    pushInto(cell, columns) {
      columnsNow = columns;
      state = 'room';
      const o = offsetFor(cell, columns);
      moveTo(o.x, o.y, (CELL_HEIGHT * PADDING) / 2);
    },
    pullOut() {
      state = 'overview';
      moveTo(0, 0, houseHalfHeight(columnsNow));
    },
    update(dt) {
      if (t < 1) {
        t = Math.min(1, t + dt / TRANSITION);
        // ease-out cubic: fast departure, soft arrival. Entering motion per the
        // design rules uses ease-out.
        const e = 1 - Math.pow(1 - t, 3);
        current.x = from.x + (target.x - from.x) * e;
        current.y = from.y + (target.y - from.y) * e;
        current.halfHeight = from.halfHeight + (target.halfHeight - from.halfHeight) * e;
      }
      apply();
    },
    get state() {
      return state;
    },
  };
}
```

- [ ] **Step 2: Wire the rig into the orchestrator**

In `src/lib/house/index.ts`, replace the whole file:

```ts
import { columnsFor } from './grid.ts';
import { createScene, type HouseScene } from './scene.ts';
import { createCameraRig, type CameraRig } from './camera.ts';

let active: HouseScene | null = null;
let rig: CameraRig | null = null;

export function mountHouseScene(stage: HTMLElement): void {
  if (active) return;

  let columns = columnsFor(window.innerWidth);
  active = createScene(stage, columns);
  rig = createCameraRig(active.camera, stage);
  rig.frameHouse(columns);
  stage.dataset.houseState = 'scene';

  let frame = 0;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    rig?.update(dt);
    if (active) active.renderer.render(active.scene, active.camera);
  };
  frame = requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    const next = columnsFor(window.innerWidth);
    if (next !== columns) {
      columns = next;
      active?.rebuild(columns);
      rig?.frameHouse(columns);
    }
    active?.resize();
  });

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(frame);
    active?.dispose();
    active = null;
    rig = null;
  }, { once: true });
}
```

- [ ] **Step 3: Verify the framing in the browser**

Run `npm run dev` and open `/house`. In the console, temporarily call the rig by exposing it: add `(window as any).__rig = rig;` after `rig.frameHouse(columns)`, then run `__rig.pushInto({col:0,row:0}, 3)` via `$B js`.

Expected: the camera eases into the bottom-left room over roughly 0.65 seconds and that room fills the frame. `__rig.pullOut()` returns to the whole house. Screenshot both states.

Remove the `window.__rig` line before committing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/house/camera.ts src/lib/house/index.ts
git commit -m "feat(house): camera rig with overview and push-in states"
```

---

### Task 7: The character capsule

**Files:**
- Create: `src/lib/house/character.ts`
- Modify: `src/lib/house/index.ts`

**Interfaces:**
- Consumes: `Move` from `./path.ts`; `Cell`, `CELL_WIDTH`, `CELL_HEIGHT`, `worldPositionFor` from `./grid.ts`.
- Produces:
  - `createCharacter(parent: THREE.Object3D): Character`
  - `interface Character { mesh: THREE.Mesh; cell: Cell; placeAt(cell: Cell, columns: number): void; follow(moves: readonly Move[], columns: number, onArrive: () => void): void; update(dt: number): void; get moving(): boolean }`

- [ ] **Step 1: Write the character module**

Create `src/lib/house/character.ts`:

```ts
/**
 * The kid, as a capsule. Phase 1 replaces the mesh with a rigged character; the
 * movement rules below do not change when it does.
 *
 * Movement consumes the pure Move list from path.ts, so what the character does is
 * decided by tested code and this module only interpolates positions.
 */
import * as THREE from 'three';

import { CELL_HEIGHT, CELL_WIDTH, type Cell, worldPositionFor } from './grid.ts';
import type { Move } from './path.ts';
import { rooms } from '~/data/house';

/** World units per second. Climbing is slower on purpose; it should read as effort. */
const WALK_SPEED = 9;
const CLIMB_SPEED = 5;

export interface Character {
  readonly mesh: THREE.Mesh;
  readonly cell: Cell;
  placeAt(cell: Cell, columns: number): void;
  follow(moves: readonly Move[], columns: number, onArrive: () => void): void;
  update(dt: number): void;
  readonly moving: boolean;
}

const FLOOR_OFFSET = -CELL_HEIGHT / 2 + 1.1;

function positionFor(cell: Cell, columns: number): THREE.Vector3 {
  const world = worldPositionFor(cell);
  const rowCount = Math.ceil(rooms.length / columns);
  return new THREE.Vector3(
    world.x - ((columns - 1) * CELL_WIDTH) / 2,
    world.y - ((rowCount - 1) * CELL_HEIGHT) / 2 + FLOOR_OFFSET,
    1.6,
  );
}

export function createCharacter(parent: THREE.Object3D): Character {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.1, 4, 10),
    new THREE.MeshLambertMaterial({ color: 0xd98c5f }),
  );
  parent.add(mesh);

  let cell: Cell = { col: 0, row: 0 };
  let queue: Move[] = [];
  let columnsNow = 3;
  let legStart = new THREE.Vector3();
  let legEnd = new THREE.Vector3();
  let legTime = 0;
  let legDuration = 0;
  let arrived: (() => void) | null = null;

  function beginNextLeg() {
    const move = queue.shift();
    if (!move) {
      const done = arrived;
      arrived = null;
      legDuration = 0;
      done?.();
      return;
    }
    legStart = mesh.position.clone();
    legEnd = positionFor(move.to, columnsNow);
    const distance = legStart.distanceTo(legEnd);
    const speed = move.kind === 'climb' ? CLIMB_SPEED : WALK_SPEED;
    legDuration = distance / speed;
    legTime = 0;
    cell = move.to;
  }

  return {
    mesh,
    get cell() {
      return cell;
    },
    placeAt(next, columns) {
      columnsNow = columns;
      cell = next;
      queue = [];
      legDuration = 0;
      arrived = null;
      mesh.position.copy(positionFor(next, columns));
    },
    follow(moves, columns, onArrive) {
      columnsNow = columns;
      queue = [...moves];
      arrived = onArrive;
      if (queue.length === 0) {
        arrived = null;
        onArrive();
        return;
      }
      beginNextLeg();
    },
    update(dt) {
      if (legDuration <= 0) return;
      legTime = Math.min(legDuration, legTime + dt);
      const k = legTime / legDuration;
      mesh.position.lerpVectors(legStart, legEnd, k);
      if (k >= 1) beginNextLeg();
    },
    get moving() {
      return legDuration > 0;
    },
  };
}
```

- [ ] **Step 2: Wire the character in**

In `src/lib/house/index.ts`, add the import and create the character after the rig. Add to the imports:

```ts
import { createCharacter, type Character } from './character.ts';
```

Add a module-level binding beside `rig`:

```ts
let kid: Character | null = null;
```

After `rig.frameHouse(columns);` add:

```ts
  kid = createCharacter(active.scene);
  kid.placeAt({ col: 0, row: 0 }, columns);
```

Inside `tick`, before the render call, add:

```ts
    kid?.update(dt);
```

Inside the resize handler, in the `if (next !== columns)` branch after `rig?.frameHouse(columns);` add:

```ts
      kid?.placeAt({ col: 0, row: 0 }, columns);
```

And in the `astro:before-swap` handler add `kid = null;`.

- [ ] **Step 3: Verify movement in the browser**

Temporarily expose the pieces: add `(window as any).__house = { kid, rig, columns };` after the character is placed. Run `npm run dev`, open `/house`, and run via `$B js`:

```js
__house.kid.follow(
  [{kind:'walk',to:{col:2,row:0}},{kind:'climb',to:{col:2,row:1}},{kind:'walk',to:{col:0,row:1}}],
  3,
  () => console.log('arrived'),
);
```

Expected: the capsule slides right along the bottom floor, rises to the top floor at a visibly slower speed, then slides left, and logs `arrived`. Screenshot mid-climb.

Remove the `window.__house` line before committing.

- [ ] **Step 4: Commit**

```bash
git add src/lib/house/character.ts src/lib/house/index.ts
git commit -m "feat(house): capsule character that walks and climbs a path"
```

---

### Task 8: Selection by pointer and keyboard

**Files:**
- Create: `src/lib/house/input.ts`
- Modify: `src/lib/house/index.ts`

**Interfaces:**
- Consumes: `HouseScene` from `./scene.ts`.
- Produces:
  - `createInput(options: InputOptions): { dispose(): void }`
  - `interface InputOptions { renderer: THREE.WebGLRenderer; camera: THREE.Camera; roomMeshes: Map<number, THREE.Mesh>; onSelect(index: number): void; onBack(): void }`

- [ ] **Step 1: Write the input module**

Create `src/lib/house/input.ts`:

```ts
/**
 * Pointer and keyboard to room selection.
 *
 * Keyboard is not an afterthought here: arrow keys move between rooms, Enter
 * enters, Escape backs out. The same handlers serve mouse, touch and keyboard so
 * there is no path that only works with a pointer.
 */
import * as THREE from 'three';

import { rooms } from '~/data/house';

export interface InputOptions {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  roomMeshes: Map<number, THREE.Mesh>;
  onSelect(index: number): void;
  onBack(): void;
}

export function createInput(options: InputOptions): { dispose(): void } {
  const { renderer, camera, roomMeshes, onSelect, onBack } = options;
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let focused = 0;

  function pick(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...roomMeshes.values()], false);
    const first = hits[0]?.object;
    if (!first) return;
    const index = first.userData.roomIndex;
    if (typeof index === 'number') {
      focused = index;
      onSelect(index);
    }
  }

  function onKey(event: KeyboardEvent) {
    // Leave the command palette's own shortcut alone.
    if (event.metaKey || event.ctrlKey) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        focused = Math.min(rooms.length - 1, focused + 1);
        onSelect(focused);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        focused = Math.max(0, focused - 1);
        onSelect(focused);
        break;
      case 'Enter':
        event.preventDefault();
        onSelect(focused);
        break;
      case 'Escape':
        event.preventDefault();
        onBack();
        break;
      default:
        break;
    }
  }

  canvas.addEventListener('pointerdown', pick);
  window.addEventListener('keydown', onKey);
  canvas.style.cursor = 'pointer';

  return {
    dispose() {
      canvas.removeEventListener('pointerdown', pick);
      window.removeEventListener('keydown', onKey);
    },
  };
}
```

- [ ] **Step 2: Wire selection to movement and camera**

In `src/lib/house/index.ts`, add imports:

```ts
import { createInput } from './input.ts';
import { cellFor } from './grid.ts';
import { ladderColumnFor, pathBetween } from './path.ts';
```

After the character is placed, add:

```ts
  const input = createInput({
    renderer: active.renderer,
    camera: active.camera,
    roomMeshes: active.roomMeshes,
    onSelect(index) {
      if (!kid || !rig) return;
      if (kid.moving) return;
      const destination = cellFor(index, columns);
      const moves = pathBetween(kid.cell, destination, ladderColumnFor(columns));
      kid.follow(moves, columns, () => rig?.pushInto(destination, columns));
      stage.dataset.houseRoom = String(index);
    },
    onBack() {
      rig?.pullOut();
      delete stage.dataset.houseRoom;
    },
  });
```

Add `input.dispose();` inside the `astro:before-swap` handler.

- [ ] **Step 3: Verify the full loop in the browser**

Run `npm run dev` and open `/house`. Using `/browse`, click each of the six room boxes in turn and screenshot after each.

Expected for every room: the capsule walks and climbs to that room, then the camera pushes in and the room fills the frame. Pressing Escape pulls back out to the whole house. Arrow keys move the selection room by room. No console errors via `$B console --errors`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/house/input.ts src/lib/house/index.ts
git commit -m "feat(house): select rooms by pointer, touch and keyboard"
```

---

### Task 9: Phone re-flow

**Files:**
- Modify: `src/lib/house/index.ts`

**Interfaces:**
- Consumes: everything from Tasks 5 to 8.
- Produces: no new exports. Correct behaviour across the 768 px breakpoint.

- [ ] **Step 1: Preserve the current room across a re-flow**

The resize handler currently resets the character to room 0 on every re-flow, which throws away the visitor's position. Replace the resize handler in `src/lib/house/index.ts` with:

```ts
  window.addEventListener('resize', () => {
    const next = columnsFor(window.innerWidth);
    if (next !== columns) {
      // Keep the visitor where they were. The room index is layout-independent;
      // only the cell it maps to changes when the house re-flows.
      const currentRoom = Number(stage.dataset.houseRoom ?? 0);
      columns = next;
      active?.rebuild(columns);
      const cell = cellFor(currentRoom, columns);
      kid?.placeAt(cell, columns);
      if (rig?.state === 'room') rig.pushInto(cell, columns);
      else rig?.frameHouse(columns);
    }
    active?.resize();
  });
```

- [ ] **Step 2: Verify the tower at phone width**

Run `npm run dev`. With `/browse`, resize to 375x812 and open `/house`. Screenshot.

Expected: six rooms stacked in a single column, room 01 at the bottom and room 06 at the top, the whole tower framed. Tapping a room above sends the capsule climbing upward.

- [ ] **Step 3: Verify the breakpoint crossing**

At 1280 wide, select room 04. Resize to 375 wide.

Expected: the layout becomes a tower, the capsule is still in room 04, and the camera is still pushed into room 04 rather than resetting to the ground floor.

- [ ] **Step 4: Verify the desktop layout is unharmed**

Resize back to 1280.

Expected: 3x2 layout, still in room 04.

- [ ] **Step 5: Commit**

```bash
git add src/lib/house/index.ts
git commit -m "feat(house): re-flow to a tower on phones without losing position"
```

---

### Task 10: The go/no-go measurement

This task decides whether the project continues. It produces evidence, not code.

**Files:**
- Create: `docs/superpowers/plans/2026-07-31-house-phase-0-findings.md`

**Interfaces:**
- Consumes: the working greybox.
- Produces: a written go/no-go recommendation.

- [ ] **Step 1: Add a frame counter behind a query parameter**

In `src/lib/house/index.ts`, inside `mountHouseScene`, after the `tick` function is defined:

```ts
  // ?fps exposes a frame counter for the Phase 0 go/no-go measurement. Deliberately
  // opt-in so it never ships as visible chrome.
  if (new URLSearchParams(location.search).has('fps')) {
    const readout = document.createElement('p');
    readout.style.cssText =
      'position:fixed;top:8px;left:8px;z-index:99;font:12px ui-monospace,monospace;color:#4ade80';
    document.body.appendChild(readout);
    let frames = 0;
    let since = performance.now();
    setInterval(() => {
      const now = performance.now();
      readout.textContent = `${Math.round((frames * 1000) / (now - since))} fps`;
      frames = 0;
      since = now;
    }, 500);
    fpsCount = () => { frames += 1; };
  }
```

Declare `let fpsCount: (() => void) | null = null;` above `mountHouseScene` and call `fpsCount?.();` inside `tick`.

- [ ] **Step 2: Measure on desktop**

Run `npm run build && npm run preview`, open `/house?fps`, and move between all six rooms.

Record: idle fps, fps during a camera push-in, and gzipped `JS (house)` from the build output.

- [ ] **Step 3: Measure on a real phone**

Serve the preview build on the local network and open `/house?fps` on the worst phone available. Move between rooms for at least sixty seconds so the device has time to thermally throttle.

Record: fps at start, fps after sixty seconds, and whether interaction stayed responsive.

- [ ] **Step 4: Judge whether it is fun**

Have at least one person who is not Leo explore the greybox with no explanation. Ask two questions and write down the answers verbatim: what did you think this was, and did you want to keep clicking.

- [ ] **Step 5: Write the findings**

Create `docs/superpowers/plans/2026-07-31-house-phase-0-findings.md` recording all measurements, the verbatim answers, and one of two recommendations: proceed to Phase 1, or stop and reconsider the form. State plainly if the interaction was not enjoyable. This document exists so that outcome is recordable rather than awkward.

Exit criteria for proceeding: the phone holds 30 fps after sixty seconds of use, and the outside tester wanted to keep clicking.

- [ ] **Step 6: Commit**

```bash
git add src/lib/house/index.ts docs/superpowers/plans/2026-07-31-house-phase-0-findings.md
git commit -m "chore(house): phase 0 fps harness and go/no-go findings"
```

---

### Task 11: The Blender production guide

Written now, while the constraints are fresh, so Phase 1 modelling starts against a spec rather than against taste.

**Files:**
- Create: `docs/blender-production-guide.md`

**Interfaces:**
- Consumes: budgets and conventions from `src/lib/house/grid.ts` and the design spec.
- Produces: the art contract Phase 1 builds against.

- [ ] **Step 1: Write the guide**

Create `docs/blender-production-guide.md` covering these sections in this order, each with concrete numbers and exact menu paths, no prose about general Blender use:

1. **Scene setup.** Unit scale 1.0, metric. One Blender unit equals one world unit in `grid.ts`. A room cell is `CELL_WIDTH` 10 by `CELL_HEIGHT` 7 by 6 deep. Grid snap on, 0.25 increments.
2. **The palette atlas.** Create a 64x64 image, fill it with flat swatches in a 8x8 layout, set interpolation to Closest so swatches never blend. Assign faces by selecting them in UV Edit mode and scaling the UV island to a single swatch. This removes UV unwrapping from every prop. One image, one material, whole kit.
3. **Prop conventions.** Origin at the base centre of every prop so it sits on a floor at y=0. Apply all transforms before export. Naming: `prop_bed`, `prop_desk`, `prop_shelf`, `prop_screen`, `prop_crate`, `prop_wheel`, `prop_door`, `prop_rug`, `prop_chair`, `prop_window`.
4. **Budgets.** 200 to 800 triangles per prop, 2,000 to 4,000 for the kid, under 100k for the whole scene, under 30 draw calls, under 2.5 MB compressed for all scene assets. State that the triangle numbers are generous and that draw calls and download size are the real constraints.
5. **The rig.** Roughly fifteen bones, hand built, named `root, hips, spine, chest, neck, head, shoulder_L/R, arm_L/R, forearm_L/R, thigh_L/R, shin_L/R, foot_L/R`. State explicitly that Rigify is not used and why: it exports to glTF messily. Weight paint with automatic weights then fix the shoulders and hips by hand.
6. **Animations.** Idle, run, climb, lean. Idle is hand animated regardless of what else is sourced elsewhere, because idle is what sells character. Frame ranges and loop points for each.
7. **Export settings.** File, Export, glTF 2.0. Format `.glb`. Include: Selected Objects off, Custom Properties on. Transform: +Y Up on. Geometry: Apply Modifiers on, UVs on, Normals on, Tangents off, Materials Export, Compression on with Draco level 6. Animation: Export Animations on for the character file only.
8. **The three delivery paths.** How to render the same scene with Eevee for the pre-rendered still, the phone image sequence, and the OG image, including resolution and output settings for each.

- [ ] **Step 2: Verify the guide against the code**

Read `src/lib/house/grid.ts` and confirm every dimension quoted in section 1 of the guide matches the exported constants. Fix the guide if they differ. The code is the source of truth.

- [ ] **Step 3: Commit**

```bash
git add docs/blender-production-guide.md
git commit -m "docs: Blender production guide for the house art kit"
```

---

## Self-Review

**Spec coverage.** Every Phase 0 item in the spec maps to a task: per-route budgets (Task 1), the 3x2 grid and 1x6 re-flow (Tasks 2 and 9), grid-path walk and climb movement (Tasks 3 and 7), camera push-in and exit (Task 6), selection by click, tap and keyboard (Task 8), the HTML text spine authored first (Task 4), the dynamic import boundary and WebGL detection (Task 4 Step 4), the 40-word Tier 2 cap (Task 4 Step 1), the fps go/no-go (Task 10), and the Blender walkthrough (Task 11). The live site is untouched throughout: no task modifies any existing page or component.

**Deferred to later phases, deliberately.** The Tier 1 exterior labels, the placard and caption-band treatments, the pre-rendered fallback images, and the screen-reader focus management are Phase 1 and Phase 3 work. Phase 0 ships the text spine those layer onto, and the reduced-motion and no-WebGL guards that keep the spine reachable.

**Known rough edge.** Task 4 Step 1 leaves the `~` alias resolution under `node --test` to be settled during execution, with a stated fallback to relative imports in test files. That is a real environment unknown rather than a gap in the plan, and the fallback is specified.
