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
