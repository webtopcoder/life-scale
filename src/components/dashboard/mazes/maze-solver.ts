/**
 * Rule-accurate maze solver using state-based BFS.
 * Mirrors exact gameplay rules: 4-direction movement, key/door gating,
 * teleporter jumps, moving-wall phase toggling.
 */
import type { MazeData, CellType } from "./maze-types";

type Pos = [number, number];

interface SolverState {
  row: number;
  col: number;
  hasKey: boolean;
  doorOpen: boolean;
  collectedStars: number; // bitmask
  wallPhase: boolean;
  moveCount: number;
}

function stateKey(s: SolverState): string {
  return `${s.row},${s.col},${s.hasKey ? 1 : 0},${s.doorOpen ? 1 : 0},${s.collectedStars},${s.wallPhase ? 1 : 0}`;
}

export function findCell(grid: CellType[][], type: CellType): Pos | null {
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[r].length; c++)
      if (grid[r][c] === type) return [r, c];
  return null;
}

export function findAllCells(grid: CellType[][], type: CellType): Pos[] {
  const result: Pos[] = [];
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[r].length; c++)
      if (grid[r][c] === type) result.push([r, c]);
  return result;
}

function buildEffectiveGrid(maze: MazeData, wallPhase: boolean): CellType[][] {
  const g = maze.gridData.map((row) => [...row]);
  maze.specialElements
    .filter((e) => e.type === "moving_wall")
    .forEach((e) => {
      e.positions.forEach(([r, c]) => {
        g[r][c] = wallPhase ? 1 : 0;
      });
      e.linkedTo?.forEach(([r, c]) => {
        g[r][c] = wallPhase ? 0 : 1;
      });
    });
  return g;
}

function buildTeleporterMap(maze: MazeData): Map<string, Pos> {
  const map = new Map<string, Pos>();
  maze.specialElements
    .filter((e) => e.type === "teleporter")
    .forEach((e) => {
      if (e.linkedTo && e.positions.length && e.linkedTo.length) {
        map.set(`${e.positions[0][0]},${e.positions[0][1]}`, e.linkedTo[0]);
        map.set(`${e.linkedTo[0][0]},${e.linkedTo[0][1]}`, e.positions[0]);
      }
    });
  return map;
}

function buildStarBitmask(maze: MazeData): Map<string, number> {
  const map = new Map<string, number>();
  let bit = 0;
  maze.specialElements
    .filter((e) => e.type === "star")
    .forEach((e) => {
      e.positions.forEach(([r, c]) => {
        map.set(`${r},${c}`, 1 << bit);
        bit++;
      });
    });
  return map;
}

export interface SolverResult {
  isSolvable: boolean;
  minMoves: number;
  statesExplored: number;
}

const DIRS: Pos[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function solveMaze(maze: MazeData): SolverResult {
  const start = findCell(maze.gridData, 2);
  if (!start) return { isSolvable: false, minMoves: -1, statesExplored: 0 };

  const hasMovingWalls = maze.specialElements.some((e) => e.type === "moving_wall");
  const teleporters = buildTeleporterMap(maze);
  const starBits = buildStarBitmask(maze);
  const rows = maze.gridData.length;
  const cols = maze.gridData[0].length;

  const gridPhaseA = buildEffectiveGrid(maze, false);
  const gridPhaseB = hasMovingWalls ? buildEffectiveGrid(maze, true) : gridPhaseA;

  const initial: SolverState = {
    row: start[0],
    col: start[1],
    hasKey: false,
    doorOpen: false,
    collectedStars: 0,
    wallPhase: false,
    moveCount: 0,
  };

  const visited = new Set<string>();
  visited.add(stateKey(initial));
  const queue: SolverState[] = [initial];
  let statesExplored = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    statesExplored++;

    for (const [dr, dc] of DIRS) {
      const nr = current.row + dr;
      const nc = current.col + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      const phasesToTry = hasMovingWalls ? [false, true] : [current.wallPhase];

      for (const phase of phasesToTry) {
        const grid = phase ? gridPhaseB : gridPhaseA;
        const cell = grid[nr][nc];
        const origCell = maze.gridData[nr][nc];

        if (cell === 0) continue;
        if (origCell === 5 && !current.hasKey && !current.doorOpen) continue;

        let newHasKey = current.hasKey;
        let newDoorOpen = current.doorOpen;
        let newStars = current.collectedStars;

        if (origCell === 4 && !current.hasKey) newHasKey = true;
        if (origCell === 5 && current.hasKey && !current.doorOpen) newDoorOpen = true;

        const starKey = `${nr},${nc}`;
        if (origCell === 7 && starBits.has(starKey)) {
          newStars |= starBits.get(starKey)!;
        }

        let finalRow = nr;
        let finalCol = nc;
        const teleKey = `${nr},${nc}`;
        if (teleporters.has(teleKey)) {
          const dest = teleporters.get(teleKey)!;
          finalRow = dest[0];
          finalCol = dest[1];
        }

        if (origCell === 3) {
          return { isSolvable: true, minMoves: current.moveCount + 1, statesExplored };
        }
        if (maze.gridData[finalRow]?.[finalCol] === 3) {
          return { isSolvable: true, minMoves: current.moveCount + 1, statesExplored };
        }

        const newState: SolverState = {
          row: finalRow,
          col: finalCol,
          hasKey: newHasKey,
          doorOpen: newDoorOpen,
          collectedStars: newStars,
          wallPhase: phase,
          moveCount: current.moveCount + 1,
        };

        const key = stateKey(newState);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(newState);
        }
      }
    }
  }

  return { isSolvable: false, minMoves: -1, statesExplored };
}
