/**
 * Routing between room cells.
 *
 * Rooms are cells on a fixed grid, so there is nothing here to solve: no
 * pathfinding, no navmesh, no physics. The kid walks along a floor, climbs one
 * ladder, and walks again. Keeping this pure and three.js-free is what lets the
 * movement rules be tested in Node rather than eyeballed in a browser.
 */
import type { Cell } from './grid.ts';

export type MoveKind = 'walk' | 'climb';

export interface Move {
  readonly kind: MoveKind;
  readonly to: Cell;
}

/** One ladder serves the whole house. On desktop it is the rightmost column. */
export function ladderColumnFor(columns: number): number {
  return columns - 1;
}

export function pathBetween(from: Cell, to: Cell, ladderColumn: number): readonly Move[] {
  if (from.col === to.col && from.row === to.row) return [];

  if (from.row === to.row) {
    return [{ kind: 'walk', to }];
  }

  const moves: Move[] = [];
  if (from.col !== ladderColumn) {
    moves.push({ kind: 'walk', to: { col: ladderColumn, row: from.row } });
  }
  moves.push({ kind: 'climb', to: { col: ladderColumn, row: to.row } });
  if (to.col !== ladderColumn) {
    moves.push({ kind: 'walk', to });
  }
  return moves;
}
