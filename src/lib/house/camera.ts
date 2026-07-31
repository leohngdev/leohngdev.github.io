/**
 * Two camera states and an eased move between them: the whole house, or one room
 * filling the frame. An orthographic camera keeps the cutaway reading as a cutaway
 * rather than a perspective interior, and it makes the framing maths a zoom rather
 * than a dolly.
 */
import * as THREE from 'three';

import { CELL_HEIGHT, CELL_WIDTH, FRAME_PADDING, type Cell, centeredPositionFor } from './grid.ts';
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

/**
 * Overview states must CONTAIN their rectangle: the whole house has to stay fully
 * visible on any aspect ratio, letterboxing whichever axis has room to spare. Room
 * states must COVER their rectangle: a neighbouring room must never be visible, so
 * the frame crops to the room instead of letterboxing around it. The two states
 * need opposite formulas, so the fit mode travels with the target rather than
 * being inferred from the extents alone.
 */
type FitMode = 'contain' | 'cover';

export function createCameraRig(
  camera: THREE.OrthographicCamera,
  container: HTMLElement,
): CameraRig {
  let state: CameraState = 'overview';
  let columnsNow = 3;
  // Set the moment frameHouse first runs. Guards the snap-vs-ease branch below:
  // the very first framing snaps straight to place, every framing after that eases.
  let framed = false;
  // The fit mode switches the instant a new target is set, in step with state,
  // rather than easing alongside x/y/halfW/halfH: there is no meaningful
  // in-between formula for "half contain, half cover".
  let mode: FitMode = 'contain';

  // current/from/target hold the rectangle being framed: its centre and its half
  // extents. apply() derives the actual camera frustum from these every frame,
  // which is what keeps the fit correct across an ordinary window resize without a
  // dedicated resize handler in this module: apply() reruns every frame regardless
  // of whether a transition is in flight.
  const target = { x: 0, y: 0, halfW: 1, halfH: 1 };
  const current = { x: 0, y: 0, halfW: 1, halfH: 1 };
  const from = { x: 0, y: 0, halfW: 1, halfH: 1 };
  let t = 1;

  function apply() {
    const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    // Contain picks the smaller frustum height so nothing outside the rectangle
    // shows; cover picks the larger one so nothing inside it is cropped off.
    const halfHeight =
      mode === 'contain'
        ? Math.max(current.halfH, current.halfW / aspect)
        : Math.min(current.halfH, current.halfW / aspect);
    const halfWidth = halfHeight * aspect;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.position.x = current.x;
    camera.position.y = current.y;
    camera.updateProjectionMatrix();
  }

  function moveTo(nextMode: FitMode, x: number, y: number, halfW: number, halfH: number) {
    from.x = current.x;
    from.y = current.y;
    from.halfW = current.halfW;
    from.halfH = current.halfH;
    target.x = x;
    target.y = y;
    target.halfW = halfW;
    target.halfH = halfH;
    mode = nextMode;
    t = 0;
  }

  function snapTo(nextMode: FitMode, x: number, y: number, halfW: number, halfH: number) {
    current.x = target.x = from.x = x;
    current.y = target.y = from.y = y;
    current.halfW = target.halfW = from.halfW = halfW;
    current.halfH = target.halfH = from.halfH = halfH;
    mode = nextMode;
    t = 1;
  }

  function houseHalfExtents(columns: number) {
    const rowCount = Math.ceil(rooms.length / columns);
    return {
      halfW: (columns * CELL_WIDTH * FRAME_PADDING) / 2,
      halfH: (rowCount * CELL_HEIGHT * FRAME_PADDING) / 2,
    };
  }

  function roomHalfExtents() {
    return {
      halfW: (CELL_WIDTH * FRAME_PADDING) / 2,
      halfH: (CELL_HEIGHT * FRAME_PADDING) / 2,
    };
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
      const { halfW, halfH } = houseHalfExtents(columns);
      if (!framed) {
        // First framing ever: snap straight to place instead of easing out from
        // the placeholder halfW/halfH of 1, which would otherwise zoom out from a
        // tiny arbitrary frustum on every mount.
        framed = true;
        snapTo('contain', 0, 0, halfW, halfH);
      } else {
        moveTo('contain', 0, 0, halfW, halfH);
      }
    },
    pushInto(cell, columns) {
      columnsNow = columns;
      state = 'room';
      const o = offsetFor(cell, columns);
      const { halfW, halfH } = roomHalfExtents();
      moveTo('cover', o.x, o.y, halfW, halfH);
    },
    pullOut() {
      state = 'overview';
      const { halfW, halfH } = houseHalfExtents(columnsNow);
      moveTo('contain', 0, 0, halfW, halfH);
    },
    update(dt) {
      if (t < 1) {
        t = Math.min(1, t + dt / TRANSITION);
        // ease-out cubic: fast departure, soft arrival. Entering motion per the
        // design rules uses ease-out.
        const e = 1 - Math.pow(1 - t, 3);
        current.x = from.x + (target.x - from.x) * e;
        current.y = from.y + (target.y - from.y) * e;
        current.halfW = from.halfW + (target.halfW - from.halfW) * e;
        current.halfH = from.halfH + (target.halfH - from.halfH) * e;
      }
      apply();
    },
    get state() {
      return state;
    },
  };
}
