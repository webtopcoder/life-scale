/**
 * Structural and solvability validator for maze data.
 */
import type { MazeData } from "./maze-types";
import { findCell, findAllCells, solveMaze, type SolverResult } from "./maze-solver";

export interface ValidationResult {
  mazeId: string;
  errors: string[];
  warnings: string[];
  solverResult: SolverResult | null;
}

export const DIFFICULTY_MIN_MOVES: Record<number, number> = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 35,
};

export function validateMaze(maze: MazeData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const grid = maze.gridData;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    if (grid[r].length !== cols) {
      errors.push(`Row ${r} has ${grid[r].length} columns, expected ${cols}`);
    }
  }

  const starts = findAllCells(grid, 2);
  const exits = findAllCells(grid, 3);
  if (starts.length === 0) errors.push("No start cell (2) found");
  if (starts.length > 1) errors.push(`Multiple start cells found: ${starts.length}`);
  if (exits.length === 0) errors.push("No exit cell (3) found");
  if (exits.length > 1) errors.push(`Multiple exit cells found: ${exits.length}`);

  for (const elem of maze.specialElements) {
    for (const [r, c] of elem.positions) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        errors.push(`${elem.type} position [${r},${c}] out of bounds`);
      }
    }
    if (elem.linkedTo) {
      for (const [r, c] of elem.linkedTo) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
          errors.push(`${elem.type} linkedTo [${r},${c}] out of bounds`);
        }
      }
    }
  }

  const keyElems = maze.specialElements.filter((e) => e.type === "key");
  const doorElems = maze.specialElements.filter((e) => e.type === "door");
  const teleElems = maze.specialElements.filter((e) => e.type === "teleporter");
  const starElems = maze.specialElements.filter((e) => e.type === "star");

  for (const k of keyElems) {
    for (const [r, c] of k.positions) {
      if (grid[r]?.[c] !== 4) errors.push(`Key declared at [${r},${c}] but grid cell is ${grid[r]?.[c]}, expected 4`);
    }
  }
  for (const d of doorElems) {
    for (const [r, c] of d.positions) {
      if (grid[r]?.[c] !== 5) errors.push(`Door declared at [${r},${c}] but grid cell is ${grid[r]?.[c]}, expected 5`);
    }
  }
  for (const t of teleElems) {
    for (const [r, c] of t.positions) {
      if (grid[r]?.[c] !== 6) errors.push(`Teleporter declared at [${r},${c}] but grid cell is ${grid[r]?.[c]}, expected 6`);
    }
    if (t.linkedTo) {
      for (const [r, c] of t.linkedTo) {
        if (grid[r]?.[c] !== 6) errors.push(`Teleporter linkedTo at [${r},${c}] but grid cell is ${grid[r]?.[c]}, expected 6`);
      }
    }
  }
  for (const s of starElems) {
    for (const [r, c] of s.positions) {
      if (grid[r]?.[c] !== 7) errors.push(`Star declared at [${r},${c}] but grid cell is ${grid[r]?.[c]}, expected 7`);
    }
  }

  let solverResult: SolverResult | null = null;
  if (errors.length === 0) {
    solverResult = solveMaze(maze);
    if (!solverResult.isSolvable) {
      errors.push("Maze is NOT solvable");
    } else {
      const minRequired = DIFFICULTY_MIN_MOVES[maze.difficulty] ?? 10;
      if (solverResult.minMoves < minRequired) {
        warnings.push(
          `Difficulty ${maze.difficulty} requires ≥${minRequired} min moves, but solver found ${solverResult.minMoves}`
        );
      }
    }
  }

  return { mazeId: maze.id, errors, warnings, solverResult };
}

export function validateAllMazes(mazes: MazeData[]): ValidationResult[] {
  return mazes.map(validateMaze);
}
