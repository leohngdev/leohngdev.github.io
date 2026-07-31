/**
 * Cell layout for the house. Deliberately free of any three.js import so the
 * layout rules can be unit tested in Node without a browser or a GL context.
 *
 * Row 0 is the TOP row and holds the earliest rooms, so time runs downward and the
 * row index increases as you descend. Going down is peeling back a surface, and on a
 * phone it also matches the reflex to move down rather than up.
 *
 * worldPositionFor is the ONLY place that decides which way is later. Every other
 * module derives its Y from it rather than multiplying row by height itself.
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
  // Negative Y: row 0 is the top floor and later rooms sit below it. Row 0 is
  // guarded explicitly so it returns 0 rather than the -0 that -cell.row * CELL_HEIGHT
  // would produce, since strict deep equality treats -0 and 0 as distinct values.
  const y = cell.row === 0 ? 0 : -cell.row * CELL_HEIGHT;
  return { x: cell.col * CELL_WIDTH, y };
}

/**
 * Cell position with the whole house centred on the origin.
 *
 * The scene, the camera rig and the character all need this same shift, and each
 * doing its own version is how a sign error becomes three sign errors. One function,
 * one direction, no arithmetic anywhere else.
 *
 * roomCount is passed in rather than imported so this module stays free of runtime
 * imports and its tests need no path alias resolution.
 */
export function centeredPositionFor(
  cell: Cell,
  columns: number,
  roomCount: number,
): { x: number; y: number } {
  const world = worldPositionFor(cell);
  const rowCount = Math.ceil(roomCount / columns);
  return {
    x: world.x - ((columns - 1) * CELL_WIDTH) / 2,
    y: world.y + ((rowCount - 1) * CELL_HEIGHT) / 2,
  };
}

/** Every room paired with the cell it occupies at the given column count. */
export function layout(
  roomList: readonly Room[],
  columns: number,
): readonly { room: Room; cell: Cell }[] {
  return roomList.map((room) => ({ room, cell: cellFor(room.index, columns) }));
}
