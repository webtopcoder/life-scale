import React from 'react';
import { resolveStaticSvgSrc } from '@/engine/staticSvgCache';

interface PuzzleResult {
  svg: React.ReactNode;
  answerOptions: React.ReactNode[]; // always 6 items
  correctAnswer: number; // 0-5
}

// ─── Seeded Random ───
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Constants ───
const STROKE = 'hsl(220,15%,20%)';
const STROKE_LIGHT = 'hsl(220,15%,75%)';
const GREEN = 'hsl(145,65%,42%)';
const GREEN_BG = 'hsl(145,50%,95%)';
const FILL_SOLID = 'hsl(220,15%,20%)';
const FILL_NONE = 'none';

// ─── Main Export ───
export function generatePuzzle(type: string, difficulty: number, seed: number = 42): PuzzleResult {
  const rand = seededRandom(seed + difficulty * 7);

  switch (type) {
    case 'shape_size_matrix': return genShapeSizeMatrix(rand, difficulty);
    case 'container_inner': return genContainerInner(rand, difficulty);
    case 'fill_progression': return genFillProgression(rand, difficulty);
    case 'count_grid': return genCountGrid(rand, difficulty);
    case 'stacking_matrix': return genStackingMatrix(rand, difficulty);
    case 'detail_variation': return genDetailVariation(rand, difficulty);
    case 'size_inner_fill': return genSizeInnerFill(rand, difficulty);
    case 'surface_pattern': return genSurfacePattern(rand, difficulty);
    case 'dot_arrangement': return genDotArrangement(rand, difficulty);
    case 'rotation_transform': return genRotationTransform(rand, difficulty);
    case 'detail_variation_3x3': return genDetailVariation3x3(rand, difficulty);
    case 'surface_pattern_3x3': return genSurfacePattern3x3(rand, difficulty);
    case 'count_grid_3x3': return genCountGrid3x3(rand, difficulty);
    case 'leaf_matrix': return genLeafMatrix(rand, difficulty);
    case 'sun_position_matrix': return genSunPositionMatrix(rand, difficulty);
    // Keep existing number grid types
    case 'number_grid': return genNumberGrid(rand, difficulty);
    case 'number_grid_multiply': return genNumberGridMultiply(rand, difficulty);
    case 'number_grid_diagonal': return genNumberGridDiagonal(rand, difficulty);
    // Static SVG puzzles
    case 'static_q11': return genStaticSvgPuzzle('/puzzles/q11', 3);
    case 'static_q12': return genStaticSvgPuzzle('/puzzles/q12', 2);
    case 'static_q13': return genStaticSvgPuzzle('/puzzles/q13', 0);
    case 'static_q14': return genStaticSvgPuzzle('/puzzles/q14', 4);
    case 'static_q15': return genStaticSvgPuzzle('/puzzles/q15', 0);
    case 'static_q16': return genStaticSvgPuzzle('/puzzles/q16', 0);
    case 'static_q17': return genStaticSvgPuzzle('/puzzles/q17', 2);
    case 'static_q18': return genStaticSvgPuzzle('/puzzles/q18', 2);
    case 'static_q19': return genStaticSvgPuzzle('/puzzles/q19', 3);
    case 'static_q20': return genStaticSvgPuzzle('/puzzles/q20', 3);
    case 'static_q21': return genStaticSvgPuzzle('/puzzles/q21', 0);
    case 'static_q22': return genStaticSvgPuzzle('/puzzles/q22', 2);
    case 'static_q23': return genStaticSvgPuzzle('/puzzles/q23', 1);
    case 'static_q24': return genStaticSvgPuzzle('/puzzles/q24', 2);
    case 'static_q25': return genStaticSvgPuzzle('/puzzles/q25', 0);
    case 'static_q26': return genStaticSvgPuzzle('/puzzles/q26', 3);
    case 'static_q27': return genStaticSvgPuzzle('/puzzles/q27', 2);
    case 'static_q28': return genStaticSvgPuzzle('/puzzles/q28', 2);
    case 'static_q29': return genStaticSvgPuzzle('/puzzles/q29', 4);
    case 'static_q30': return genStaticSvgPuzzle('/puzzles/q30', 1);
    case 'static_q31': return genStaticSvgPuzzle('/puzzles/q31', 1);
    case 'static_q32': return genStaticSvgPuzzle('/puzzles/q32', 0);
    case 'static_q33': return genStaticSvgPuzzle('/puzzles/q33', 5);
    case 'static_q34': return genStaticSvgPuzzle('/puzzles/q34', 3);
    case 'static_q35': return genStaticSvgPuzzle('/puzzles/q35', 4);
    
    default: return genShapeSizeMatrix(rand, difficulty);
  }
}

export function PuzzleRenderer({ type, difficulty, seed = 42 }: { type: string; difficulty: number; seed?: number }) {
  const { svg } = generatePuzzle(type, difficulty, seed);
  const isStatic = type.startsWith('static_');
  return (
    <div className={`flex items-center justify-center w-full mx-auto overflow-hidden ${isStatic ? 'sm:max-w-sm md:max-w-md' : 'max-w-[200px] sm:max-w-xs md:max-w-none py-1 md:py-0'}`}>
      {svg}
    </div>
  );
}

// ─── Drawing Primitives (monochrome line art) ───

function drawCircle(cx: number, cy: number, r: number, fill: string = FILL_NONE, sw: number = 2) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={STROKE} strokeWidth={sw} />;
}

function drawRect(x: number, y: number, w: number, h: number, fill: string = FILL_NONE, sw: number = 2) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} stroke={STROKE} strokeWidth={sw} rx={2} />;
}

function drawTriangle(cx: number, cy: number, size: number, fill: string = FILL_NONE) {
  const h = size * 0.866;
  return <polygon points={`${cx},${cy - h / 2} ${cx + size / 2},${cy + h / 2} ${cx - size / 2},${cy + h / 2}`} fill={fill} stroke={STROKE} strokeWidth={2} />;
}

function drawDiamond(cx: number, cy: number, size: number, fill: string = FILL_NONE) {
  const hs = size / 2;
  return <polygon points={`${cx},${cy - hs} ${cx + hs},${cy} ${cx},${cy + hs} ${cx - hs},${cy}`} fill={fill} stroke={STROKE} strokeWidth={2} />;
}

function drawStar(cx: number, cy: number, r: number, fill: string = FILL_NONE) {
  const ir = r * 0.4;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * Math.PI / 180;
    const rd = i % 2 === 0 ? r : ir;
    return `${cx + rd * Math.cos(a)},${cy + rd * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} stroke={STROKE} strokeWidth={2} />;
}

function drawCross(cx: number, cy: number, size: number) {
  const hs = size / 2;
  const t = size * 0.15;
  return (
    <g>
      <line x1={cx - hs} y1={cy} x2={cx + hs} y2={cy} stroke={STROKE} strokeWidth={t} />
      <line x1={cx} y1={cy - hs} x2={cx} y2={cy + hs} stroke={STROKE} strokeWidth={t} />
    </g>
  );
}

function drawHStripes(x: number, y: number, w: number, h: number, count: number) {
  const gap = h / (count + 1);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <line key={i} x1={x} y1={y + gap * (i + 1)} x2={x + w} y2={y + gap * (i + 1)} stroke={STROKE} strokeWidth={1.5} />
      ))}
    </g>
  );
}

function drawVStripes(x: number, y: number, w: number, h: number, count: number) {
  const gap = w / (count + 1);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <line key={i} x1={x + gap * (i + 1)} y1={y} x2={x + gap * (i + 1)} y2={y + h} stroke={STROKE} strokeWidth={1.5} />
      ))}
    </g>
  );
}

function drawDots(cx: number, cy: number, count: number, r: number = 3, spread: number = 12) {
  // Arrange dots in standard pip patterns like dice
  const positions: [number, number][] = [];
  if (count === 1) positions.push([0, 0]);
  else if (count === 2) { positions.push([-spread / 2, -spread / 2]); positions.push([spread / 2, spread / 2]); }
  else if (count === 3) { positions.push([-spread / 2, -spread / 2]); positions.push([0, 0]); positions.push([spread / 2, spread / 2]); }
  else if (count === 4) { positions.push([-spread / 2, -spread / 2]); positions.push([spread / 2, -spread / 2]); positions.push([-spread / 2, spread / 2]); positions.push([spread / 2, spread / 2]); }
  else if (count === 5) { positions.push([-spread / 2, -spread / 2]); positions.push([spread / 2, -spread / 2]); positions.push([0, 0]); positions.push([-spread / 2, spread / 2]); positions.push([spread / 2, spread / 2]); }
  else if (count === 6) { positions.push([-spread / 2, -spread / 2]); positions.push([spread / 2, -spread / 2]); positions.push([-spread / 2, 0]); positions.push([spread / 2, 0]); positions.push([-spread / 2, spread / 2]); positions.push([spread / 2, spread / 2]); }
  else if (count === 7) { positions.push([-spread / 2, -spread / 2]); positions.push([spread / 2, -spread / 2]); positions.push([-spread / 2, 0]); positions.push([0, 0]); positions.push([spread / 2, 0]); positions.push([-spread / 2, spread / 2]); positions.push([spread / 2, spread / 2]); }
  else if (count === 8) { positions.push([-spread / 2, -spread / 2]); positions.push([0, -spread / 2]); positions.push([spread / 2, -spread / 2]); positions.push([-spread / 2, 0]); positions.push([spread / 2, 0]); positions.push([-spread / 2, spread / 2]); positions.push([0, spread / 2]); positions.push([spread / 2, spread / 2]); }
  else if (count >= 9) { for (let row = -1; row <= 1; row++) for (let col = -1; col <= 1; col++) positions.push([col * spread / 2, row * spread / 2]); }

  return (
    <g>
      {positions.slice(0, count).map(([dx, dy], i) => (
        <circle key={i} cx={cx + dx} cy={cy + dy} r={r} fill={FILL_SOLID} />
      ))}
    </g>
  );
}

// ─── Matrix Layout Helpers ───

function missingCell(x: number, y: number, size: number) {
  // Inset by exactly half the stroke width so edges render on pixel boundaries
  const sw = 3;
  const half = sw / 2;
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} fill={GREEN_BG} stroke="none" />
      <rect x={x + half} y={y + half} width={size - sw} height={size - sw}
        fill="none" stroke={GREEN} strokeWidth={sw}
        strokeDasharray="8,6" strokeLinecap="butt"
        shapeRendering="crispEdges"
      />
      <text x={x + size / 2} y={y + size / 2} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.4} fontWeight="bold" fill={GREEN}>?</text>
    </g>
  );
}

function matrixGrid(cells: React.ReactNode[][], gridSize: number, cellSize: number, gap: number) {
  const total = gridSize * (cellSize + gap) - gap;
  // Detect which cell is the missing cell (last row, last col)
  const missingR = gridSize - 1;
  const missingC = gridSize - 1;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid cell backgrounds — skip the missing cell to avoid stroke bleed-through */}
      {Array.from({ length: gridSize }, (_, r) =>
        Array.from({ length: gridSize }, (_, c) => {
          if (r === missingR && c === missingC) return null;
          return (
            <rect key={`bg-${r}-${c}`} x={c * (cellSize + gap)} y={r * (cellSize + gap)} width={cellSize} height={cellSize}
              fill="white" stroke={STROKE_LIGHT} strokeWidth={1} rx={3} />
          );
        })
      )}
      {cells.map((row, r) =>
        row.map((cell, c) => (
          <g key={`cell-${r}-${c}`} transform={`translate(${c * (cellSize + gap)}, ${r * (cellSize + gap)})`}>
            {cell}
          </g>
        ))
      )}
    </svg>
  );
}

function makeOptionSvg(content: React.ReactNode, vb: string = "0 0 60 60") {
  return (
    <svg viewBox={vb} className="w-7 h-7 sm:w-12 sm:h-12 mx-auto">
      {content}
    </svg>
  );
}

function shuffleWithCorrect(rand: () => number, correct: React.ReactNode, distractors: React.ReactNode[]): { options: React.ReactNode[]; correctIdx: number } {
  const all = [correct, ...distractors.slice(0, 5)];
  // Pad to 6
  while (all.length < 6) all.push(distractors[all.length - 1] || correct);
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const correctIdx = all.indexOf(correct);
  return { options: all, correctIdx };
}

// ═══════════════════════════════════════════
// 1. Shape + Size Matrix (2x2, easy)
// Rows: size (small/large), Cols: shape (circle/square)
// ═══════════════════════════════════════════
function genShapeSizeMatrix(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const sizes = [16, 28]; // small, large
  const drawShape = (shape: number, size: number, cx: number, cy: number) => {
    if (shape === 0) return drawCircle(cx, cy, size / 2);
    return drawRect(cx - size / 2, cy - size / 2, size, size);
  };

  const cells = [
    [<g key="00">{drawShape(0, sizes[0], 30, 30)}</g>, <g key="01">{drawShape(1, sizes[0], 30, 30)}</g>],
    [<g key="10">{drawShape(0, sizes[1], 30, 30)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawShape(1, sizes[1], 30, 30));
  const d1 = makeOptionSvg(drawShape(0, sizes[1], 30, 30)); // wrong shape
  const d2 = makeOptionSvg(drawShape(1, sizes[0], 30, 30)); // wrong size
  const d3 = makeOptionSvg(drawShape(0, sizes[0], 30, 30)); // wrong both
  const d4 = makeOptionSvg(drawTriangle(30, 30, sizes[1])); // alien shape
  const d5 = makeOptionSvg(drawDiamond(30, 30, sizes[1])); // alien shape 2

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 2. Container + Inner Element (2x2, easy)
// Rows: inner element (dot/cross), Cols: container (circle/square)
// ═══════════════════════════════════════════
function genContainerInner(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const drawCell = (container: number, inner: number, cx: number, cy: number) => (
    <g>
      {container === 0 ? drawCircle(cx, cy, 24) : drawRect(cx - 24, cy - 24, 48, 48)}
      {inner === 0 ? <circle cx={cx} cy={cy} r={5} fill={FILL_SOLID} /> : drawCross(cx, cy, 20)}
    </g>
  );

  const cells = [
    [<g key="00">{drawCell(0, 0, 30, 30)}</g>, <g key="01">{drawCell(1, 0, 30, 30)}</g>],
    [<g key="10">{drawCell(0, 1, 30, 30)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawCell(1, 1, 30, 30));
  const d1 = makeOptionSvg(drawCell(0, 1, 30, 30));
  const d2 = makeOptionSvg(drawCell(1, 0, 30, 30));
  const d3 = makeOptionSvg(drawCell(0, 0, 30, 30));
  const d4 = makeOptionSvg(drawTriangle(30, 30, 24));
  const d5 = makeOptionSvg(<g>{drawRect(6, 6, 48, 48)}{drawCircle(30, 30, 10, FILL_SOLID)}</g>);

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 3. Fill Progression (2x2, medium)
// Rows: size (small/large), Cols: fill (empty/striped/solid → pick 2 for 2x2)
// ═══════════════════════════════════════════
function genFillProgression(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const drawFillCircle = (cx: number, cy: number, r: number, fill: number) => {
    if (fill === 0) return drawCircle(cx, cy, r);
    if (fill === 1) return <g>{drawCircle(cx, cy, r)}{drawHStripes(cx - r, cy - r, r * 2, r * 2, 4)}</g>;
    return drawCircle(cx, cy, r, FILL_SOLID);
  };

  const radii = [14, 22];
  const fills = [0, 1]; // empty, striped

  const cells = [
    [<g key="00">{drawFillCircle(30, 30, radii[0], fills[0])}</g>, <g key="01">{drawFillCircle(30, 30, radii[0], fills[1])}</g>],
    [<g key="10">{drawFillCircle(30, 30, radii[1], fills[0])}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawFillCircle(30, 30, radii[1], fills[1]));
  const d1 = makeOptionSvg(drawFillCircle(30, 30, radii[0], fills[1])); // wrong size
  const d2 = makeOptionSvg(drawFillCircle(30, 30, radii[1], fills[0])); // wrong fill
  const d3 = makeOptionSvg(drawFillCircle(30, 30, radii[1], 2)); // solid (not in set)
  const d4 = makeOptionSvg(drawFillCircle(30, 30, radii[0], fills[0])); // wrong both
  const d5 = makeOptionSvg(drawFillCircle(30, 30, 18, fills[1])); // wrong mid size

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 4. Count Grid (2x2, medium)
// Rows: row count (1,2), Cols: col count (1,2) → cell = row+col dots
// ═══════════════════════════════════════════
function genCountGrid(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const countMatrix = [[1, 2], [2, 3]]; // row+col offset

  const drawCountCell = (count: number, cx: number, cy: number) => drawDots(cx, cy, count, 4, 16);

  const cells = [
    [<g key="00">{drawCountCell(countMatrix[0][0], 30, 30)}</g>, <g key="01">{drawCountCell(countMatrix[0][1], 30, 30)}</g>],
    [<g key="10">{drawCountCell(countMatrix[1][0], 30, 30)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);
  const correctCount = countMatrix[1][1]; // 3

  const correct = makeOptionSvg(drawCountCell(correctCount, 30, 30));
  const d1 = makeOptionSvg(drawCountCell(2, 30, 30));
  const d2 = makeOptionSvg(drawCountCell(4, 30, 30));
  const d3 = makeOptionSvg(drawCountCell(1, 30, 30));
  const d4 = makeOptionSvg(drawCountCell(5, 30, 30));
  const d5 = makeOptionSvg(drawCountCell(6, 30, 30));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 5. Stacking Matrix (2x2, medium)
// Rows: base shape layers (1,2), Cols: top element (triangle/circle)
// ═══════════════════════════════════════════
function genStackingMatrix(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const drawStack = (layers: number, top: number, cx: number, cy: number) => (
    <g>
      {Array.from({ length: layers }, (_, i) =>
        drawRect(cx - 20, cy + 10 - i * 14, 40, 12, FILL_NONE, 2)
      )}
      {top === 0 ? drawTriangle(cx, cy - 8 - (layers - 1) * 14, 18) : drawCircle(cx, cy - 8 - (layers - 1) * 14, 8)}
    </g>
  );

  const cells = [
    [<g key="00">{drawStack(1, 0, 30, 40)}</g>, <g key="01">{drawStack(1, 1, 30, 40)}</g>],
    [<g key="10">{drawStack(2, 0, 30, 40)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawStack(2, 1, 30, 40));
  const d1 = makeOptionSvg(drawStack(1, 1, 30, 40));
  const d2 = makeOptionSvg(drawStack(2, 0, 30, 40));
  const d3 = makeOptionSvg(drawStack(1, 0, 30, 40));
  const d4 = makeOptionSvg(drawStack(3, 1, 30, 40));
  const d5 = makeOptionSvg(drawStack(3, 0, 30, 40));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 6. Detail Variation (2x2, hard)
// Rows: spot style (open/filled), Cols: spot count (2/4)
// ═══════════════════════════════════════════
function genDetailVariation(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const drawButterfly = (cx: number, cy: number, spotCount: number, filled: boolean, wingShape: 'normal' | 'pointed' = 'normal') => {
    const spots: React.ReactNode[] = [];
    const positions = spotCount === 2 ? [[-10, -4], [10, -4]] : [[-12, -6], [12, -6], [-8, 6], [8, 6]];
    positions.forEach(([dx, dy], i) => {
      spots.push(<circle key={`s${i}`} cx={cx + dx} cy={cy + dy} r={3.5} fill={filled ? FILL_SOLID : FILL_NONE} stroke={STROKE} strokeWidth={1.5} />);
    });
    return (
      <g>
        {/* Body */}
        <ellipse cx={cx} cy={cy} rx={3} ry={14} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
        {/* Wings */}
        {wingShape === 'pointed' ? (
          <>
            <path d={`M${cx - 3},${cy - 2} Q${cx - 20},${cy - 22} ${cx - 26},${cy - 2} Q${cx - 20},${cy + 18} ${cx - 3},${cy + 2}`} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
            <path d={`M${cx + 3},${cy - 2} Q${cx + 20},${cy - 22} ${cx + 26},${cy - 2} Q${cx + 20},${cy + 18} ${cx + 3},${cy + 2}`} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
          </>
        ) : (
          <>
            <ellipse cx={cx - 14} cy={cy - 2} rx={12} ry={16} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
            <ellipse cx={cx + 14} cy={cy - 2} rx={12} ry={16} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
          </>
        )}
        {/* Antennae */}
        <line x1={cx - 2} y1={cy - 14} x2={cx - 6} y2={cy - 22} stroke={STROKE} strokeWidth={1.5} />
        <line x1={cx + 2} y1={cy - 14} x2={cx + 6} y2={cy - 22} stroke={STROKE} strokeWidth={1.5} />
        {spots}
      </g>
    );
  };

  const cells = [
    [<g key="00">{drawButterfly(30, 34, 2, false)}</g>, <g key="01">{drawButterfly(30, 34, 4, false)}</g>],
    [<g key="10">{drawButterfly(30, 34, 2, true)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawButterfly(30, 34, 4, true));
  const d1 = makeOptionSvg(drawButterfly(30, 34, 2, true));
  const d2 = makeOptionSvg(drawButterfly(30, 34, 4, false));
  const d3 = makeOptionSvg(drawButterfly(30, 34, 2, false));
  const d4 = makeOptionSvg(drawButterfly(30, 34, 4, true, 'pointed'));
  const d5 = makeOptionSvg(drawButterfly(30, 34, 2, true, 'pointed'));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 7. Size + Inner Fill (2x2, hard)
// Rows: container size (small/large), Cols: inner star count (1/3)
// ═══════════════════════════════════════════
function genSizeInnerFill(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const drawCellSIF = (size: number, starCount: number, cx: number, cy: number) => (
    <g>
      {drawCircle(cx, cy, size)}
      {starCount === 1 && drawStar(cx, cy, size * 0.4, FILL_SOLID)}
      {starCount === 3 && (
        <g>
          {drawStar(cx, cy - size * 0.3, size * 0.22, FILL_SOLID)}
          {drawStar(cx - size * 0.28, cy + size * 0.2, size * 0.22, FILL_SOLID)}
          {drawStar(cx + size * 0.28, cy + size * 0.2, size * 0.22, FILL_SOLID)}
        </g>
      )}
    </g>
  );

  const sizes = [16, 24];
  const cells = [
    [<g key="00">{drawCellSIF(sizes[0], 1, 30, 30)}</g>, <g key="01">{drawCellSIF(sizes[0], 3, 30, 30)}</g>],
    [<g key="10">{drawCellSIF(sizes[1], 1, 30, 30)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawCellSIF(sizes[1], 3, 30, 30));
  const d1 = makeOptionSvg(drawCellSIF(sizes[0], 3, 30, 30));
  const d2 = makeOptionSvg(drawCellSIF(sizes[1], 1, 30, 30));
  const d3 = makeOptionSvg(drawCellSIF(sizes[0], 1, 30, 30));
  const d4 = makeOptionSvg(drawCellSIF(sizes[1], 2, 30, 30));
  const d5 = makeOptionSvg(drawCellSIF(20, 3, 30, 30));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 8. Surface Pattern (2x2, hard)
// Rows: stripe direction (horizontal/vertical), Cols: stripe density (2/4)
// ═══════════════════════════════════════════
function genSurfacePattern(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  let cubeId = 0;
  const drawCube = (cx: number, cy: number, dir: number, density: number) => {
    const id = `sp-${cubeId++}`;
    const s = 36;
    const hs = s / 2;
    // Isometric cube top face
    const top = `${cx},${cy - hs} ${cx + hs},${cy - hs / 3} ${cx},${cy + hs / 3} ${cx - hs},${cy - hs / 3}`;
    // Left face
    const left = `${cx - hs},${cy - hs / 3} ${cx},${cy + hs / 3} ${cx},${cy + hs} ${cx - hs},${cy + hs / 6}`;
    // Right face
    const right = `${cx + hs},${cy - hs / 3} ${cx},${cy + hs / 3} ${cx},${cy + hs} ${cx + hs},${cy + hs / 6}`;
    return (
      <g>
        <polygon points={top} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
        <polygon points={left} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
        <polygon points={right} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />
        {/* Stripes on top face */}
        <clipPath id={id}>
          <polygon points={top} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          {dir === 0
            ? drawHStripes(cx - hs, cy - hs, s, s, density)
            : drawVStripes(cx - hs, cy - hs, s, s, density)}
        </g>
      </g>
    );
  };

  const cells = [
    [<g key="00">{drawCube(30, 30, 0, 2)}</g>, <g key="01">{drawCube(30, 30, 0, 4)}</g>],
    [<g key="10">{drawCube(30, 30, 1, 2)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawCube(30, 30, 1, 4));
  const d1 = makeOptionSvg(drawCube(30, 30, 0, 4));
  const d2 = makeOptionSvg(drawCube(30, 30, 1, 2));
  const d3 = makeOptionSvg(drawCube(30, 30, 0, 2));
  const d4 = makeOptionSvg(drawCube(30, 30, 1, 6));
  const d5 = makeOptionSvg(drawCube(30, 30, 0, 6));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 9. Dot Arrangement (2x2, hard)
// Rows: pip count row axis (1,3), Cols: pip count col axis (2,4)
// Cell value = row_val + col_val
// ═══════════════════════════════════════════
function genDotArrangement(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const rv = [1, 3]; const cv = [2, 5];
  const drawDie = (count: number, cx: number, cy: number) => (
    <g>
      {drawRect(cx - 22, cy - 22, 44, 44, FILL_NONE, 2)}
      {drawDots(cx, cy, count, 3.5, 14)}
    </g>
  );

  const cells = [
    [<g key="00">{drawDie(rv[0] + cv[0], 30, 30)}</g>, <g key="01">{drawDie(rv[0] + cv[1], 30, 30)}</g>],
    [<g key="10">{drawDie(rv[1] + cv[0], 30, 30)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);
  const correctCount = rv[1] + cv[1]; // 8

  const correct = makeOptionSvg(drawDie(correctCount, 30, 30));
  const d1 = makeOptionSvg(drawDie(6, 30, 30));
  const d2 = makeOptionSvg(drawDie(7, 30, 30));
  const d3 = makeOptionSvg(drawDie(5, 30, 30));
  const d4 = makeOptionSvg(drawDie(4, 30, 30));
  const d5 = makeOptionSvg(drawDie(9, 30, 30));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 10. Rotation + Transformation (2x2, hard)
// Rows: rotation (0°/90°), Cols: element addition (arrow/arrow+dot)
// ═══════════════════════════════════════════
function genRotationTransform(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const drawArrow = (cx: number, cy: number, angle: number, hasDot: boolean) => (
    <g transform={`rotate(${angle}, ${cx}, ${cy})`}>
      <line x1={cx} y1={cy + 16} x2={cx} y2={cy - 16} stroke={STROKE} strokeWidth={2.5} />
      <polygon points={`${cx},${cy - 20} ${cx + 6},${cy - 10} ${cx - 6},${cy - 10}`} fill={FILL_SOLID} />
      {hasDot && <circle cx={cx} cy={cy + 10} r={4} fill={FILL_SOLID} />}
    </g>
  );

  const cells = [
    [<g key="00">{drawArrow(30, 30, 0, false)}</g>, <g key="01">{drawArrow(30, 30, 0, true)}</g>],
    [<g key="10">{drawArrow(30, 30, 90, false)}</g>, missingCell(0, 0, cs)],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  const correct = makeOptionSvg(drawArrow(30, 30, 90, true));
  const d1 = makeOptionSvg(drawArrow(30, 30, 0, true));
  const d2 = makeOptionSvg(drawArrow(30, 30, 90, false));
  const d3 = makeOptionSvg(drawArrow(30, 30, 180, true));
  const d4 = makeOptionSvg(drawArrow(30, 30, 270, true));
  const d5 = makeOptionSvg(drawArrow(30, 30, 180, false));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 11. Detail Variation 3x3 (hard)
// Rows: spot count (0,2,4), Cols: fill style (empty/striped/solid)
// ═══════════════════════════════════════════
function genDetailVariation3x3(rand: () => number, _d: number): PuzzleResult {
  const cs = 55; const gap = 4;
  const drawLeaf = (cx: number, cy: number, spots: number, fillStyle: number) => {
    const leafFill = fillStyle === 2 ? FILL_SOLID : FILL_NONE;
    return (
      <g>
        {/* Leaf shape */}
        <ellipse cx={cx} cy={cy} rx={14} ry={20} fill={leafFill} stroke={STROKE} strokeWidth={2} />
        {fillStyle === 1 && drawHStripes(cx - 14, cy - 20, 28, 40, 5)}
        {/* Stem */}
        <line x1={cx} y1={cy + 20} x2={cx} y2={cy + 26} stroke={STROKE} strokeWidth={2} />
        {/* Spots */}
        {Array.from({ length: spots }, (_, i) => {
          const angle = (i / spots) * Math.PI * 2 - Math.PI / 2;
          const sr = 7;
          return <circle key={i} cx={cx + Math.cos(angle) * sr} cy={cy + Math.sin(angle) * sr} r={2.5} fill={fillStyle === 2 ? 'white' : FILL_SOLID} />;
        })}
      </g>
    );
  };

  const spotCounts = [0, 2, 4];
  const fillStyles = [0, 1, 2]; // empty, striped, solid

  const cells: React.ReactNode[][] = [];
  for (let r = 0; r < 3; r++) {
    cells[r] = [];
    for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) {
        cells[r][c] = missingCell(0, 0, cs);
      } else {
        cells[r][c] = <g key={`${r}${c}`}>{drawLeaf(cs / 2, cs / 2 - 2, spotCounts[r], fillStyles[c])}</g>;
      }
    }
  }

  const svg = matrixGrid(cells, 3, cs, gap);

  const correct = makeOptionSvg(drawLeaf(30, 28, spotCounts[2], fillStyles[2]));
  const d1 = makeOptionSvg(drawLeaf(30, 28, spotCounts[1], fillStyles[2]));
  const d2 = makeOptionSvg(drawLeaf(30, 28, spotCounts[2], fillStyles[1]));
  const d3 = makeOptionSvg(drawLeaf(30, 28, spotCounts[2], fillStyles[0]));
  const d4 = makeOptionSvg(drawLeaf(30, 28, spotCounts[0], fillStyles[2]));
  const d5 = makeOptionSvg(drawLeaf(30, 28, spotCounts[1], fillStyles[1]));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 12. Surface Pattern 3x3 (very hard)
// Rows: shape (circle/square/triangle), Cols: pattern (empty/dots/stripes)
// ═══════════════════════════════════════════
function genSurfacePattern3x3(rand: () => number, _d: number): PuzzleResult {
  const cs = 55; const gap = 4;
  const drawPatternedShape = (shape: number, pattern: number, cx: number, cy: number) => {
    const clipId = `sp3-${shape}-${pattern}-${cx}-${cy}`;
    const drawClip = () => {
      if (shape === 0) return <circle cx={cx} cy={cy} r={20} />;
      if (shape === 1) return <rect x={cx - 20} y={cy - 20} width={40} height={40} />;
      const h = 34;
      return <polygon points={`${cx},${cy - h / 2} ${cx + 20},${cy + h / 2} ${cx - 20},${cy + h / 2}`} />;
    };

    const drawOutline = () => {
      if (shape === 0) return drawCircle(cx, cy, 20);
      if (shape === 1) return drawRect(cx - 20, cy - 20, 40, 40);
      return drawTriangle(cx, cy + 2, 40);
    };

    return (
      <g>
        <clipPath id={clipId}>{drawClip()}</clipPath>
        {drawOutline()}
        <g clipPath={`url(#${clipId})`}>
          {pattern === 1 && drawDots(cx, cy, 5, 2.5, 12)}
          {pattern === 2 && drawHStripes(cx - 20, cy - 20, 40, 40, 5)}
        </g>
      </g>
    );
  };

  const cells: React.ReactNode[][] = [];
  for (let r = 0; r < 3; r++) {
    cells[r] = [];
    for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) {
        cells[r][c] = missingCell(0, 0, cs);
      } else {
        cells[r][c] = <g key={`${r}${c}`}>{drawPatternedShape(r, c, cs / 2, cs / 2)}</g>;
      }
    }
  }

  const svg = matrixGrid(cells, 3, cs, gap);

  const correct = makeOptionSvg(drawPatternedShape(2, 2, 30, 30));
  const d1 = makeOptionSvg(drawPatternedShape(2, 1, 30, 30));
  const d2 = makeOptionSvg(drawPatternedShape(2, 0, 30, 30));
  const d3 = makeOptionSvg(drawPatternedShape(1, 2, 30, 30));
  const d4 = makeOptionSvg(drawPatternedShape(0, 2, 30, 30));
  const d5 = makeOptionSvg(drawPatternedShape(1, 1, 30, 30));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// 13. Count Grid 3x3 (hard)
// Rows: shape (circle/square/triangle), Cols: count (1/2/3)
// ═══════════════════════════════════════════
function genCountGrid3x3(rand: () => number, _d: number): PuzzleResult {
  const cs = 55; const gap = 4;
  const drawCountShape = (shape: number, count: number, cx: number, cy: number) => {
    const size = 12;
    const positions = count === 1 ? [[0, 0]] : count === 2 ? [[-8, 0], [8, 0]] : [[-10, 4], [10, 4], [0, -8]];
    return (
      <g>
        {positions.map(([dx, dy], i) => {
          const sx = cx + dx; const sy = cy + dy;
          if (shape === 0) return <circle key={i} cx={sx} cy={sy} r={size / 2} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />;
          if (shape === 1) return <rect key={i} x={sx - size / 2} y={sy - size / 2} width={size} height={size} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} rx={1} />;
          const h = size * 0.866;
          return <polygon key={i} points={`${sx},${sy - h / 2} ${sx + size / 2},${sy + h / 2} ${sx - size / 2},${sy + h / 2}`} fill={FILL_NONE} stroke={STROKE} strokeWidth={2} />;
        })}
      </g>
    );
  };

  const cells: React.ReactNode[][] = [];
  for (let r = 0; r < 3; r++) {
    cells[r] = [];
    for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) {
        cells[r][c] = missingCell(0, 0, cs);
      } else {
        cells[r][c] = <g key={`${r}${c}`}>{drawCountShape(r, c + 1, cs / 2, cs / 2)}</g>;
      }
    }
  }

  const svg = matrixGrid(cells, 3, cs, gap);

  const correct = makeOptionSvg(drawCountShape(2, 3, 30, 30));
  const d1 = makeOptionSvg(drawCountShape(2, 2, 30, 30));
  const d2 = makeOptionSvg(drawCountShape(2, 1, 30, 30));
  const d3 = makeOptionSvg(drawCountShape(1, 3, 30, 30));
  const d4 = makeOptionSvg(drawCountShape(0, 3, 30, 30));
  const d5 = makeOptionSvg(drawCountShape(1, 2, 30, 30));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// Number Grid generators (kept from original, updated to 6 options)
// ═══════════════════════════════════════════

function numberGridSvg(grid: number[][], hint: string) {
  const cellSize = 52; const pad = 10;
  return (
    <svg viewBox={`0 0 ${3 * cellSize + pad * 2} ${3 * cellSize + pad * 2 + 20}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <text x={(3 * cellSize + pad * 2) / 2} y={14} textAnchor="middle" fontSize={10} fill="hsl(220,10%,55%)" fontStyle="italic">{hint}</text>
      {grid.map((row, r) =>
        row.map((val, c) => {
          const x = c * cellSize + pad;
          const y = r * cellSize + pad + 18;
          return (
            <g key={`${r}-${c}`}>
              <rect x={val === -1 ? x + 1.5 : x} y={val === -1 ? y + 1.5 : y}
                width={val === -1 ? cellSize - 3 : cellSize} height={val === -1 ? cellSize - 3 : cellSize}
                fill={val === -1 ? GREEN_BG : 'white'}
                stroke={val === -1 ? GREEN : 'hsl(220,15%,82%)'}
                strokeWidth={val === -1 ? 3 : 1}
                strokeDasharray={val === -1 ? '8,6' : '0'}
                strokeLinecap={val === -1 ? 'butt' : undefined}
                shapeRendering={val === -1 ? 'crispEdges' : undefined}
                rx={val === -1 ? 0 : 4}
              />
              {val !== -1 ? (
                <text x={x + cellSize / 2} y={y + cellSize / 2 + 6} textAnchor="middle" fontSize={20} fontWeight="bold" fill="hsl(220,20%,30%)">{val}</text>
              ) : (
                <text x={x + cellSize / 2} y={y + cellSize / 2 + 7} textAnchor="middle" fontSize={22} fontWeight="bold" fill={GREEN}>?</text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

function numberOptions(rand: () => number, correct: number, distractorVals: number[]): { options: React.ReactNode[]; correctIdx: number } {
  const makeNum = (v: number) => makeOptionSvg(
    <text x={30} y={38} textAnchor="middle" fontSize={22} fontWeight="bold" fill="hsl(220,20%,30%)">{v}</text>,
    "0 0 60 60"
  );
  const correctNode = makeNum(correct);
  const dNodes = distractorVals.map(v => makeNum(v));
  return shuffleWithCorrect(rand, correctNode, dNodes);
}

function genNumberGrid(rand: () => number, _d: number): PuzzleResult {
  const grid = [[2, 7, 6], [9, 5, 1], [4, 3, -1]];
  const svg = numberGridSvg(grid, 'Each row sums to the same total');
  const { options, correctIdx } = numberOptions(rand, 8, [10, 7, 5, 6, 9]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

function genNumberGridMultiply(rand: () => number, _d: number): PuzzleResult {
  const grid = [[3, 4, 12], [5, 3, 15], [2, 6, -1]];
  const svg = numberGridSvg(grid, 'Each row follows the same rule');
  const { options, correctIdx } = numberOptions(rand, 12, [8, 18, 10, 14, 6]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

function genNumberGridDiagonal(rand: () => number, _d: number): PuzzleResult {
  const grid = [[8, 3, 7], [4, 9, 5], [6, 6, -1]];
  const svg = numberGridSvg(grid, 'Each column sums to the same total');
  const { options, correctIdx } = numberOptions(rand, 6, [4, 8, 3, 7, 5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// Leaf Matrix (2x2)
// Rows: fill (outline → solid), Cols: detail (no veins → with veins)
// ═══════════════════════════════════════════

function drawLeafPath(cx: number, cy: number, size: number, variant: 'normal' | 'alt' = 'normal'): string {
  const s = size / 2;
  if (variant === 'alt') {
    // Rounder, wider leaf shape
    return `M ${cx} ${cy - s}
      C ${cx + s * 1.1} ${cy - s * 0.5}, ${cx + s * 1.1} ${cy + s * 0.5}, ${cx} ${cy + s}
      C ${cx - s * 1.1} ${cy + s * 0.5}, ${cx - s * 1.1} ${cy - s * 0.5}, ${cx} ${cy - s} Z`;
  }
  // Standard pointed leaf
  return `M ${cx} ${cy - s}
    C ${cx + s * 0.8} ${cy - s * 0.3}, ${cx + s * 0.7} ${cy + s * 0.4}, ${cx} ${cy + s}
    C ${cx - s * 0.7} ${cy + s * 0.4}, ${cx - s * 0.8} ${cy - s * 0.3}, ${cx} ${cy - s} Z`;
}

function drawLeafVeins(cx: number, cy: number, size: number, veinColor: string, variant: 'normal' | 'alt' = 'normal'): React.ReactNode {
  const s = size / 2;
  const sw = 1.5;
  // Central midrib
  const midrib = <line x1={cx} y1={cy - s * 0.85} x2={cx} y2={cy + s * 0.85} stroke={veinColor} strokeWidth={sw} strokeLinecap="round" />;
  // Side veins (3 pairs, angled)
  const veins = [-0.35, 0.0, 0.3].map((offset, i) => {
    const y = cy + s * offset;
    const spread = variant === 'alt' ? s * 0.45 * (1 - Math.abs(offset) * 0.5) : s * 0.4 * (1 - Math.abs(offset) * 0.5);
    const tipY = y - s * 0.15;
    return (
      <g key={`vein-${i}`}>
        <line x1={cx} y1={y} x2={cx + spread} y2={tipY} stroke={veinColor} strokeWidth={sw} strokeLinecap="round" />
        <line x1={cx} y1={y} x2={cx - spread} y2={tipY} stroke={veinColor} strokeWidth={sw} strokeLinecap="round" />
      </g>
    );
  });
  return <g>{midrib}{veins}</g>;
}

function drawLeaf(cx: number, cy: number, size: number, fill: string, showVeins: boolean, variant: 'normal' | 'alt' = 'normal') {
  const isFilled = fill === FILL_SOLID;
  const veinColor = isFilled ? 'white' : STROKE;
  const path = drawLeafPath(cx, cy, size, variant);
  // Add stem
  const s = size / 2;
  return (
    <g>
      <line x1={cx} y1={cy + s} x2={cx} y2={cy + s + size * 0.15} stroke={isFilled ? FILL_SOLID : STROKE} strokeWidth={2} strokeLinecap="round" />
      <path d={path} fill={fill} stroke={STROKE} strokeWidth={2} />
      {showVeins && drawLeafVeins(cx, cy, size, veinColor, variant)}
    </g>
  );
}

function genLeafMatrix(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const leafSize = 38;

  const cells = [
    [
      <g key="00">{drawLeaf(30, 28, leafSize, FILL_NONE, false)}</g>,
      <g key="01">{drawLeaf(30, 28, leafSize, FILL_NONE, true)}</g>,
    ],
    [
      <g key="10">{drawLeaf(30, 28, leafSize, FILL_SOLID, false)}</g>,
      missingCell(0, 0, cs),
    ],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  // Correct: filled + veins (normal leaf)
  const correct = makeOptionSvg(drawLeaf(30, 28, leafSize, FILL_SOLID, true));
  // D1: outline + veins (wrong fill)
  const d1 = makeOptionSvg(drawLeaf(30, 28, leafSize, FILL_NONE, true));
  // D2: filled + no veins (wrong detail)
  const d2 = makeOptionSvg(drawLeaf(30, 28, leafSize, FILL_SOLID, false));
  // D3: outline + no veins (wrong both)
  const d3 = makeOptionSvg(drawLeaf(30, 28, leafSize, FILL_NONE, false));
  // D4: filled + no veins, alt leaf shape
  const d4 = makeOptionSvg(drawLeaf(30, 28, leafSize, FILL_SOLID, false, 'alt'));
  // D5: filled + veins, alt leaf shape
  const d5 = makeOptionSvg(drawLeaf(30, 28, leafSize, FILL_SOLID, true, 'alt'));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// Sun Position Matrix (2x2)
// Pattern: vertical reflection — Row 2 mirrors Row 1's sun positions
// ═══════════════════════════════════════════

function drawSun(
  cx: number,
  cy: number,
  r: number,
  rayCount: number = 8,
  rayLength: number = 8,
  rayStyle: 'line' | 'pointed' = 'line',
  rayStrokeWidth: number = 2.5,
  coreStrokeWidth: number = 2,
) {
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < rayCount; i++) {
    const angle = (i * 360 / rayCount) * Math.PI / 180;
    const x1 = cx + (r + 2) * Math.cos(angle);
    const y1 = cy + (r + 2) * Math.sin(angle);
    const x2 = cx + (r + 2 + rayLength) * Math.cos(angle);
    const y2 = cy + (r + 2 + rayLength) * Math.sin(angle);

    if (rayStyle === 'pointed') {
      const perpX = Math.sin(angle) * 2.5;
      const perpY = -Math.cos(angle) * 2.5;
      rays.push(
        <polygon
          key={`ray-${i}`}
          points={`${x1 - perpX},${y1 - perpY} ${x2},${y2} ${x1 + perpX},${y1 + perpY}`}
          fill={FILL_SOLID}
          stroke="none"
        />
      );
    } else {
      rays.push(
        <line
          key={`ray-${i}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={STROKE}
          strokeWidth={rayStrokeWidth}
          strokeLinecap="round"
        />
      );
    }
  }

  return (
    <g>
      {rays}
      <circle cx={cx} cy={cy} r={r} fill={FILL_SOLID} stroke={STROKE} strokeWidth={coreStrokeWidth} />
    </g>
  );
}

function genSunPositionMatrix(rand: () => number, _d: number): PuzzleResult {
  const cs = 60; const gap = 6;
  const sunR = 6;
  const rayLen = 7;

  // Positions tuned to match the provided reference image:
  // TL: lower-right, TR: upper-right, BL: upper-left, BR (missing): lower-left
  const cells = [
    [
      <g key="00">{drawSun(42, 42, sunR, 8, rayLen)}</g>,   // TL: lower-right
      <g key="01">{drawSun(42, 18, sunR, 8, rayLen)}</g>,   // TR: upper-right
    ],
    [
      <g key="10">{drawSun(18, 18, sunR, 8, rayLen)}</g>,   // BL: upper-left
      missingCell(0, 0, cs),
    ],
  ];

  const svg = matrixGrid(cells, 2, cs, gap);

  // Use IDENTICAL sun size + stroke as the grid cells so options match perfectly
  const makeOpt = (content: React.ReactNode) => (
    <svg viewBox="0 0 60 60" className="w-12 h-12 sm:w-16 sm:h-16 mx-auto">
      {content}
    </svg>
  );

  // Correct: bottom-left (matches vertical reflection pattern)
  const correct = makeOpt(drawSun(18, 42, sunR, 8, rayLen));
  // D1: bottom-right
  const d1 = makeOpt(drawSun(42, 42, sunR, 8, rayLen));
  // D2: top-left
  const d2 = makeOpt(drawSun(18, 18, sunR, 8, rayLen));
  // D3: center
  const d3 = makeOpt(drawSun(30, 30, sunR, 8, rayLen));
  // D4: top-right
  const d4 = makeOpt(drawSun(42, 18, sunR, 8, rayLen));
  // D5: dead-center-bottom
  const d5 = makeOpt(drawSun(30, 42, sunR, 8, rayLen));

  const { options, correctIdx } = shuffleWithCorrect(rand, correct, [d1, d2, d3, d4, d5]);
  return { svg, answerOptions: options, correctAnswer: correctIdx };
}

// ═══════════════════════════════════════════
// Static SVG Puzzle (loads pre-made SVG files)
// ═══════════════════════════════════════════
function genStaticSvgPuzzle(basePath: string, correctAnswer: number): PuzzleResult {
  const svg = (
    <img src={resolveStaticSvgSrc(`${basePath}/problem.svg`)} alt="Puzzle" className="w-full h-full object-contain" />
  );

  const answerOptions = Array.from({ length: 6 }, (_, i) => (
    <img
      key={i}
      src={resolveStaticSvgSrc(`${basePath}/answer-${i + 1}.svg`)}
      alt={`Option ${String.fromCharCode(65 + i)}`}
      className="w-full h-auto"
    />
  ));

  return { svg, answerOptions, correctAnswer };
}
