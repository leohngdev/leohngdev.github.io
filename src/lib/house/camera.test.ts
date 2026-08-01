import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { fitHalfHeight, createCameraRig } from './camera.ts';
// Relative rather than the '~' alias: node --test resolves modules with plain
// Node ESM and has no knowledge of the tsconfig path alias Astro/Vite honour,
// matching the pattern character.test.ts and rooms.test.ts already use.
import { CELL_WIDTH, CELL_HEIGHT, FRAME_PADDING, centeredPositionFor, type Cell } from './grid.ts';
import { rooms } from '../../data/house.ts';

/**
 * fitHalfHeight is the pure contain/cover split pulled out of camera.ts's
 * apply(). It takes no three.js import and needs no renderer or WebGL context,
 * so these run under plain Node like the rest of this directory's tests.
 *
 * This maths shipped wrong twice on this branch and both times was caught by
 * hand arithmetic during review, never by a test. Every assertion below checks
 * a real computed number rather than a loose bound, specifically so a min/max
 * swap inside fitHalfHeight fails at least one of them.
 */

// A simple target rectangle, wider than it is tall (halfW 10, halfH 5, target
// aspect 2:1), used for the four generic contain/cover checks below.
const TARGET_HALF_W = 10;
const TARGET_HALF_H = 5;

test('contain never crops the target at a wide aspect', () => {
  // Query aspect (4) is wider than the target's own aspect (2), so contain
  // must fall back to the target's half-height and letterbox the sides.
  const halfHeight = fitHalfHeight('contain', TARGET_HALF_W, TARGET_HALF_H, 4);
  const halfWidth = halfHeight * 4;
  assert.equal(halfHeight, 5, 'contain must keep the target half-height when width is not the constraint');
  assert.equal(halfWidth, 20);
  assert.ok(halfHeight >= TARGET_HALF_H && halfWidth >= TARGET_HALF_W, 'contain must never crop below the target');
});

test('contain never crops the target at a tall aspect', () => {
  // Query aspect (1) is narrower than the target's aspect (2), so contain must
  // grow past the target half-height to keep the full width visible.
  const halfHeight = fitHalfHeight('contain', TARGET_HALF_W, TARGET_HALF_H, 1);
  const halfWidth = halfHeight * 1;
  assert.equal(halfHeight, 10, 'contain must grow when height is not the constraint');
  assert.equal(halfWidth, 10);
  assert.ok(halfHeight >= TARGET_HALF_H && halfWidth >= TARGET_HALF_W, 'contain must never crop below the target');
});

test('cover never reveals beyond the target at a wide aspect', () => {
  const halfHeight = fitHalfHeight('cover', TARGET_HALF_W, TARGET_HALF_H, 4);
  const halfWidth = halfHeight * 4;
  assert.equal(halfHeight, 2.5, 'cover must shrink past the target half-height when width is the constraint');
  assert.equal(halfWidth, 10);
  assert.ok(halfHeight <= TARGET_HALF_H && halfWidth <= TARGET_HALF_W, 'cover must never reveal beyond the target');
});

test('cover never reveals beyond the target at a tall aspect', () => {
  const halfHeight = fitHalfHeight('cover', TARGET_HALF_W, TARGET_HALF_H, 1);
  const halfWidth = halfHeight * 1;
  assert.equal(halfHeight, 5, 'cover must keep the target half-height when height is the constraint');
  assert.equal(halfWidth, 5);
  assert.ok(halfHeight <= TARGET_HALF_H && halfWidth <= TARGET_HALF_W, 'cover must never reveal beyond the target');
});

/**
 * houseHalfExtents in camera.ts is not exported, so these reproduce its exact
 * formula from the same constants it uses, rather than duplicating literals
 * that would drift if CELL_WIDTH, CELL_HEIGHT or FRAME_PADDING ever changed.
 */
function houseHalfExtents(columns: number) {
  const rowCount = Math.ceil(rooms.length / columns);
  return {
    halfW: (columns * CELL_WIDTH * FRAME_PADDING) / 2,
    halfH: (rowCount * CELL_HEIGHT * FRAME_PADDING) / 2,
  };
}

test('desktop house overview at aspect 1.6 fits by width, not by the raw halfH', () => {
  const { halfW, halfH } = houseHalfExtents(3);
  const aspect = 1.6;
  const expected = Math.max(halfH, halfW / aspect);
  const halfHeight = fitHalfHeight('contain', halfW, halfH, aspect);
  assert.equal(halfHeight, expected);
  assert.equal(halfHeight, 10.78125);
  assert.equal(halfHeight * aspect, halfW, 'width must exactly fill the frame at this aspect');
});

test('desktop house overview at aspect 1.92 fits by width, not by the raw halfH', () => {
  const { halfW, halfH } = houseHalfExtents(3);
  const aspect = 1.92;
  const expected = Math.max(halfH, halfW / aspect);
  const halfHeight = fitHalfHeight('contain', halfW, halfH, aspect);
  assert.equal(halfHeight, expected);
  assert.equal(halfHeight, 8.984375);
  assert.equal(halfHeight * aspect, halfW, 'width must exactly fill the frame at this aspect');
});

test('phone tower overview at aspect 0.46 fits by the raw halfH, not by width', () => {
  const { halfW, halfH } = houseHalfExtents(1);
  const aspect = 0.46;
  const expected = Math.max(halfH, halfW / aspect);
  const halfHeight = fitHalfHeight('contain', halfW, halfH, aspect);
  assert.equal(halfHeight, expected);
  assert.equal(halfHeight, halfH, 'the tall tower is height-constrained: raw halfH must win, not halfW / aspect');
  assert.ok(halfHeight * aspect >= halfW, 'the resulting width must still cover the tower, never crop it');
});

/**
 * pushInto's own extents, reproduced from the same constants camera.ts builds
 * roomHalfExtents from. roomHalfExtents itself is not exported, matching the
 * houseHalfExtents pattern above.
 */
function roomHalfExtents() {
  return {
    halfW: (CELL_WIDTH * FRAME_PADDING) / 2,
    halfH: (CELL_HEIGHT * FRAME_PADDING) / 2,
  };
}

/**
 * The three aspects a real visitor hit this bug at: a laptop reported 75 percent
 * of room height visible at 1.91, 79 percent at 1.80, and a phone reported 36
 * percent of room width visible at 0.51. Each assertion checks the specific
 * numbers pushInto now produces, not just a >= bound: a min/max swap back to
 * cover fails the exact equality here, where a loose bound could still slip past it.
 */
test('room push-in at the reported laptop aspect 1.91 keeps the full room height and width', () => {
  // 1.91 is wider than the room's own aspect (halfW / halfH, 5.75 / 4.025 ≈
  // 1.4286), so height is the binding constraint: contain must hold the raw
  // halfH and let width grow past halfW, showing a slice of the rooms to
  // either side. Cover cropped the room's own bottom edge here instead
  // (min would have picked halfW / aspect ≈ 3.01, only 75 percent of halfH).
  const { halfW, halfH } = roomHalfExtents();
  const aspect = 1.91;
  const halfHeight = fitHalfHeight('contain', halfW, halfH, aspect);
  assert.equal(halfHeight, halfH, 'height is the binding constraint at this aspect');
  assert.ok(halfHeight >= halfH, 'full room height must be visible');
  assert.ok(halfHeight * aspect >= halfW, 'full room width must be visible');
});

test('room push-in at the reported laptop aspect 1.80 keeps the full room height and width', () => {
  // Same shape as 1.91: still wider than the room's own aspect, so height
  // still binds and cover would still have cropped it (to 79 percent of halfH
  // per the report).
  const { halfW, halfH } = roomHalfExtents();
  const aspect = 1.8;
  const halfHeight = fitHalfHeight('contain', halfW, halfH, aspect);
  assert.equal(halfHeight, halfH, 'height is the binding constraint at this aspect');
  assert.ok(halfHeight >= halfH, 'full room height must be visible');
  assert.ok(halfHeight * aspect >= halfW, 'full room width must be visible');
});

test('room push-in at the reported phone aspect 0.51 keeps the full room height and width', () => {
  // 0.51 is narrower than the room's own aspect, so width is the binding
  // constraint here: contain holds the exact halfW and lets height grow past
  // halfH, revealing the rooms above and below. Cover cropped the room's own
  // sides here instead (min would have picked the raw halfH, only 36 percent
  // of the width the report measured).
  const { halfW, halfH } = roomHalfExtents();
  const aspect = 0.51;
  const halfHeight = fitHalfHeight('contain', halfW, halfH, aspect);
  const halfWidth = halfHeight * aspect;
  assert.equal(halfWidth, halfW, 'width is the binding constraint at this aspect');
  assert.ok(halfHeight >= halfH, 'full room height must be visible');
  assert.ok(halfWidth >= halfW, 'full room width must be visible');
});

/**
 * The general claim Fix 1 makes: at any aspect ratio, contain never crops a room
 * on either axis. Swept across a range here, not just sampled once, so a
 * regression narrower than the three reported aspects above still trips this.
 * Temporarily changing the 'contain' argument below to 'cover' and rerunning
 * confirmed every assertion in this test fails: that failure is what makes this
 * a test of the fix, since the old cover behaviour would still pass a looser
 * version of the same check.
 */
test('room push-in with contain never crops the room at any aspect ratio', () => {
  const { halfW, halfH } = roomHalfExtents();
  for (let aspect = 0.2; aspect <= 5; aspect += 0.1) {
    const halfHeight = fitHalfHeight('contain', halfW, halfH, aspect);
    const halfWidth = halfHeight * aspect;
    assert.ok(
      halfHeight >= halfH - 1e-9,
      `aspect ${aspect}: halfHeight ${halfHeight} must cover room halfH ${halfH}`,
    );
    assert.ok(
      halfWidth >= halfW - 1e-9,
      `aspect ${aspect}: halfWidth ${halfWidth} must cover room halfW ${halfW}`,
    );
  }
});

/**
 * Every test above calls fitHalfHeight directly with 'contain' written as a
 * literal in the test itself, so none of them can fail if pushInto stopped
 * passing 'contain' through to fitHalfHeight: they exercise the formula, not
 * the wiring. The two tests below close that gap by building a real
 * CameraRig with createCameraRig and calling pushInto on it, the exact path
 * index.ts drives, then reading the mode pushInto actually chose back off
 * the live THREE.OrthographicCamera it produced.
 *
 * A plain object with clientWidth/clientHeight stands in for the container
 * element: apply() inside camera.ts only ever reads those two properties off
 * it, and OrthographicCamera's own maths needs no renderer or WebGL context,
 * so this still runs under plain Node.
 */
function fakeContainer(width: number, height: number): HTMLElement {
  return { clientWidth: width, clientHeight: height } as unknown as HTMLElement;
}

/**
 * The room's real geometry, independent of FRAME_PADDING: the raw cell size,
 * with no wall gap subtracted. scene.ts's actual room mesh is smaller still
 * (CELL_WIDTH/CELL_HEIGHT each shrunk by a wall gap), so a frustum that
 * contains this slightly larger rectangle contains the true mesh too, and
 * this test needs nothing from scene.ts to say so.
 */
function realRoomExtent(cell: Cell, columns: number) {
  const { x, y } = centeredPositionFor(cell, columns, rooms.length);
  return {
    left: x - CELL_WIDTH / 2,
    right: x + CELL_WIDTH / 2,
    bottom: y - CELL_HEIGHT / 2,
    top: y + CELL_HEIGHT / 2,
  };
}

function assertRoomInsideFrustum(camera: THREE.OrthographicCamera, room: ReturnType<typeof realRoomExtent>) {
  const xMin = camera.position.x + camera.left;
  const xMax = camera.position.x + camera.right;
  const yMin = camera.position.y + camera.bottom;
  const yMax = camera.position.y + camera.top;
  assert.ok(xMin <= room.left, `frustum left ${xMin} must reach the room's left edge ${room.left}`);
  assert.ok(xMax >= room.right, `frustum right ${xMax} must reach the room's right edge ${room.right}`);
  assert.ok(yMin <= room.bottom, `frustum bottom ${yMin} must reach the room's bottom edge ${room.bottom}`);
  assert.ok(yMax >= room.top, `frustum top ${yMax} must reach the room's top edge ${room.top}`);
}

test('createCameraRig.pushInto keeps a real room fully inside the camera frustum at a wide desktop aspect', () => {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  // 1280x670: aspect ≈ 1.9104, matching the 1.91 laptop aspect the bug report
  // measured. Picked deliberately over a rounder aspect like 1.6: FRAME_PADDING
  // leaves enough slack that cover's crop at 1.6 still (barely) covers the raw,
  // unpadded room, so a test at 1.6 would not actually catch a cover regression.
  // 1.91 is where the report measured cover cropping the room to 75 percent of
  // its height, which is the aspect this test needs to fail loudly at.
  const container = fakeContainer(1280, 670);
  const rig = createCameraRig(camera, container);

  const columns = 3;
  const cell: Cell = { col: 1, row: 1 }; // room 4, with a neighbour on every side
  rig.pushInto(cell, columns);
  // The very first pushInto call on a fresh rig snaps to place instead of
  // easing (camera.ts's `framed` guard), so update(0) only needs to flush
  // apply() once; there is no transition to fast-forward through.
  rig.update(0);

  assertRoomInsideFrustum(camera, realRoomExtent(cell, columns));
});

test('createCameraRig.pushInto keeps a real room fully inside the camera frustum at a tall phone aspect', () => {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  // 375x812: aspect ≈ 0.4618, the phone viewport the bug report measured.
  const container = fakeContainer(375, 812);
  const rig = createCameraRig(camera, container);

  const columns = 1;
  const cell: Cell = { col: 0, row: 3 }; // an interior room on the phone tower, not the first or last
  rig.pushInto(cell, columns);
  rig.update(0);

  assertRoomInsideFrustum(camera, realRoomExtent(cell, columns));
});
