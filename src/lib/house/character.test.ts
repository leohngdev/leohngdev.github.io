import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { createCharacter } from './character.ts';

/**
 * These construct plain three.js objects (Object3D, Mesh, Vector3) with no
 * renderer and no canvas, so they run under plain Node like grid.test.ts and
 * path.test.ts. Only rendering needs a WebGL context; the movement state machine
 * exercised here does not touch the renderer at all.
 */

test('a superseded follow cancels the earlier callback instead of firing it', () => {
  const character = createCharacter(new THREE.Object3D());
  character.placeAt({ col: 0, row: 0 }, 3);

  let firstFired = false;
  let secondFired = false;
  character.follow([{ kind: 'walk', to: { col: 2, row: 0 } }], 3, () => {
    firstFired = true;
  });
  // Redirect before the first route can complete, the way a second room click
  // would while the character is still mid-walk toward the first.
  character.follow([{ kind: 'walk', to: { col: 0, row: 1 } }], 3, () => {
    secondFired = true;
  });

  character.update(1000); // large dt: finishes the surviving route in one tick
  assert.equal(firstFired, false, 'the superseded callback must never fire');
  assert.equal(secondFired, true, 'the route that replaced it must still arrive');
  assert.deepEqual(character.cell, { col: 0, row: 1 });
});

test('placeAt mid-route cancels the outstanding callback rather than leaving it pending', () => {
  const character = createCharacter(new THREE.Object3D());
  character.placeAt({ col: 0, row: 0 }, 3);

  let fired = false;
  character.follow([{ kind: 'walk', to: { col: 2, row: 0 } }], 3, () => {
    fired = true;
  });
  // A breakpoint resize snaps the character home mid-route; index.ts calls
  // placeAt for exactly this.
  character.placeAt({ col: 0, row: 0 }, 1);

  character.update(1000);
  assert.equal(fired, false, 'a route interrupted by placeAt must not report arrival');
  assert.equal(character.moving, false);
});

test('a zero-distance leg does not stall the queue', () => {
  const character = createCharacter(new THREE.Object3D());
  character.placeAt({ col: 0, row: 0 }, 3);

  let arrived = false;
  // The first move names the cell the character already occupies, so its leg has
  // zero distance and therefore zero duration.
  character.follow(
    [
      { kind: 'walk', to: { col: 0, row: 0 } },
      { kind: 'walk', to: { col: 1, row: 0 } },
    ],
    3,
    () => {
      arrived = true;
    },
  );

  // If the zero-distance leg stalled the queue, moving would be false here and
  // cell would still read the zero-distance leg's target rather than the real one.
  assert.equal(character.moving, true);
  assert.deepEqual(character.cell, { col: 1, row: 0 });

  character.update(1000);
  assert.equal(arrived, true);
  assert.equal(character.moving, false);
});
