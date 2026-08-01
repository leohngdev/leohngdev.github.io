import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fitHalfHeight } from './camera.ts';
// Relative rather than the '~' alias: node --test resolves modules with plain
// Node ESM and has no knowledge of the tsconfig path alias Astro/Vite honour,
// matching the pattern character.test.ts and rooms.test.ts already use.
import { CELL_WIDTH, CELL_HEIGHT, FRAME_PADDING } from './grid.ts';
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
