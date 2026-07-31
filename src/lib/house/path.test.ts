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
