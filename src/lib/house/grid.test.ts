import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CELL_HEIGHT,
  CELL_WIDTH,
  cellFor,
  centeredPositionFor,
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

test('room 0 sits top-left on desktop', () => {
  assert.deepEqual(cellFor(0, 3), { col: 0, row: 0 });
});

test('the first three rooms fill the top floor on desktop', () => {
  assert.deepEqual(cellFor(1, 3), { col: 1, row: 0 });
  assert.deepEqual(cellFor(2, 3), { col: 2, row: 0 });
});

test('the last three rooms fill the floor below on desktop', () => {
  assert.deepEqual(cellFor(3, 3), { col: 0, row: 1 });
  assert.deepEqual(cellFor(5, 3), { col: 2, row: 1 });
});

test('phone stacks every room in one column, earliest at the top', () => {
  assert.deepEqual(cellFor(0, 1), { col: 0, row: 0 });
  assert.deepEqual(cellFor(5, 1), { col: 0, row: 5 });
});

test('world position grows right with column and DOWN with row', () => {
  assert.deepEqual(worldPositionFor({ col: 0, row: 0 }), { x: 0, y: 0 });
  assert.deepEqual(worldPositionFor({ col: 2, row: 1 }), {
    x: 2 * CELL_WIDTH,
    y: -CELL_HEIGHT,
  });
});

test('later rooms are always lower than earlier ones', () => {
  const first = worldPositionFor(cellFor(0, 1)).y;
  const last = worldPositionFor(cellFor(5, 1)).y;
  assert.ok(last < first, 'room 06 must sit below room 01');
});

test('centring puts the middle of the desktop house on the origin', () => {
  // 3x2: columns span 0..2, rows span 0..-1. Centre is (1 * CELL_WIDTH, -CELL_HEIGHT/2).
  assert.deepEqual(centeredPositionFor({ col: 1, row: 0 }, 3, 6), {
    x: 0,
    y: CELL_HEIGHT / 2,
  });
  assert.deepEqual(centeredPositionFor({ col: 1, row: 1 }, 3, 6), {
    x: 0,
    y: -CELL_HEIGHT / 2,
  });
});

test('centring keeps later rooms below earlier ones on phone', () => {
  const first = centeredPositionFor(cellFor(0, 1), 1, 6).y;
  const last = centeredPositionFor(cellFor(5, 1), 1, 6).y;
  assert.ok(last < first, 'room 06 must stay below room 01 after centring');
});
