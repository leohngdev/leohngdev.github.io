/**
 * The kid, as a capsule. Phase 1 replaces the mesh with a rigged character; the
 * movement rules below do not change when it does.
 *
 * Movement consumes the pure Move list from path.ts, so what the character does is
 * decided by tested code and this module only interpolates positions.
 */
import * as THREE from 'three';

import { CELL_HEIGHT, type Cell, centeredPositionFor } from './grid.ts';
import type { Move } from './path.ts';
// Relative rather than the '~' alias: node --test resolves modules with plain
// Node ESM and has no knowledge of the tsconfig path alias Astro/Vite honour, so
// character.test.ts (a value import away from this file) needs a path Node can
// follow on its own.
import { rooms } from '../../data/house.ts';

/** World units per second. Climbing is slower on purpose; it should read as effort. */
const WALK_SPEED = 9;
const CLIMB_SPEED = 5;

export interface Character {
  // Object3D rather than Mesh: Phase 1 swaps this for a Group or SkinnedMesh, and
  // every operation this module performs (parent.add, mesh.position.*) already
  // lives on Object3D, so the wider type needs no change when that swap happens.
  readonly mesh: THREE.Object3D;
  readonly cell: Cell;
  placeAt(cell: Cell, columns: number): void;
  follow(moves: readonly Move[], columns: number, onArrive: () => void): void;
  update(dt: number): void;
  readonly moving: boolean;
}

const FLOOR_OFFSET = -CELL_HEIGHT / 2 + 1.1;

function positionFor(cell: Cell, columns: number): THREE.Vector3 {
  const { x, y } = centeredPositionFor(cell, columns, rooms.length);
  return new THREE.Vector3(x, y + FLOOR_OFFSET, 1.6);
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

  // A route can be superseded before it finishes: a second follow() call while the
  // first is still in flight, or a placeAt() snap (index.ts does this on every
  // breakpoint resize). The superseded callback is cancelled, not invoked: it was
  // registered for arrival at the OLD destination, and the character never reaches
  // it, so firing it would report an arrival that did not happen. The caller that
  // actually wants a signal is the one behind the route that superseded it, and
  // that route gets its own onArrive when it completes. Nothing is left pending:
  // cancelling clears the outstanding callback immediately, on the spot, rather
  // than deferring it, so there is no dangling reference for anything to wait on.
  function cancelPending() {
    arrived = null;
  }

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
    // A zero-distance leg (the route names a cell the character already occupies)
    // has nothing to animate. update() only advances time when legDuration is
    // positive, so a zero duration here would never reach k >= 1 and the rest of
    // the queue, plus the arrival callback, would never run. Snap it and move on
    // instead of leaving the character stuck for the rest of the session.
    if (legDuration <= 0) {
      mesh.position.copy(legEnd);
      beginNextLeg();
    }
  }

  return {
    mesh,
    get cell() {
      return cell;
    },
    placeAt(next, columns) {
      cancelPending();
      columnsNow = columns;
      cell = next;
      queue = [];
      legDuration = 0;
      mesh.position.copy(positionFor(next, columns));
    },
    follow(moves, columns, onArrive) {
      cancelPending();
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
