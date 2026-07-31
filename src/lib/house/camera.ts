/**
 * Two camera states and an eased move between them: the whole house, or one room
 * filling the frame. An orthographic camera keeps the cutaway reading as a cutaway
 * rather than a perspective interior, and it makes the framing maths a zoom rather
 * than a dolly.
 */
import * as THREE from 'three';

import { CELL_HEIGHT, type Cell, centeredPositionFor } from './grid.ts';
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
    // Same centring the scene uses, from the same function, so the camera can never
    // disagree with the geometry about where a room is.
    return centeredPositionFor(cell, columns, rooms.length);
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
