/**
 * Unified Archetype System — Single Source of Truth
 *
 * 8 archetypes derived from a 2×2×2 cube:
 *   Axis 1 — Analytical vs Creative   (logic vs pattern)
 *   Axis 2 — Methodical vs Rapid      (speed)
 *   Axis 3 — Independent vs Collaborative (self-awareness)
 *
 * This module is the canonical definition. Edge functions duplicate
 * the constants + algorithm (they cannot import from src/).
 */

import type { Category, CategoryScores } from '@/types/funnel';

/* ── Unified category floors (score-tier based) ── */

const FLOORS_DEFAULT: Record<Category, number> = {
  logic: 0.78, pattern: 0.82, spatial: 0.75, speed: 0.60, self: 0.85,
};
const FLOORS_HIGH: Record<Category, number> = {
  logic: 0.78, pattern: 0.82, spatial: 0.75, speed: 0.65, self: 0.85,
};
const FLOORS_ELITE: Record<Category, number> = {
  logic: 0.83, pattern: 0.85, spatial: 0.78, speed: 0.72, self: 0.87,
};

export function getCategoryFloors(finalScore: number): Record<Category, number> {
  if (finalScore >= 140) return FLOORS_ELITE;
  if (finalScore >= 120) return FLOORS_HIGH;
  return FLOORS_DEFAULT;
}

// Backward-compatible flat export
export const CATEGORY_FLOORS = FLOORS_DEFAULT;

/* ── Archetype definitions ── */

export interface Archetype {
  name: string;
  axes: [string, string, string]; // [analytical/creative, methodical/rapid, independent/collaborative]
  color: string;
  description: string;
}

export const ARCHETYPES: Archetype[] = [
  // index 0: Analytical + Methodical + Independent
  {
    name: 'The Architect',
    axes: ['Analytical', 'Methodical', 'Independent'],
    color: 'hsl(220 70% 45%)',
    description:
      'You build comprehensive mental models and execute with surgical precision. Architects are the masterminds who design systems that last — whether software architectures, business strategies, or life plans. You don\'t rush into action; you map every variable, stress-test your assumptions, and then move with quiet confidence. Your independence means you trust your own analysis over groupthink, which makes you exceptionally good at spotting flaws others miss. Historical Architects include Alan Turing, who designed the theoretical foundation of computing alone in his Cambridge office, and Nikola Tesla in his systematic engineering work.',
  },
  // index 1: Analytical + Methodical + Collaborative
  {
    name: 'The Strategist',
    axes: ['Analytical', 'Methodical', 'Collaborative'],
    color: 'hsl(250 55% 50%)',
    description:
      'You combine rigorous analytical thinking with patience and a deep understanding of people. Strategists don\'t just build plans — they build coalitions. You see five moves ahead and know exactly which people need to be in which roles to make the plan work. Think of chess grandmasters who also coach teams, or military leaders like Dwight Eisenhower who orchestrated D-Day by aligning dozens of competing interests into a single coherent strategy. Your collaborative nature means your plans account for human factors that pure analysts overlook, making your strategies more resilient and more likely to succeed in the real world.',
  },
  // index 2: Analytical + Rapid + Independent
  {
    name: 'The Commander',
    axes: ['Analytical', 'Rapid', 'Independent'],
    color: 'hsl(30 90% 55%)',
    description:
      'You make data-driven decisions at lightning speed and trust your own judgment under pressure. Commanders are the people everyone turns to in a crisis — while others freeze, you\'re already analyzing the situation and taking decisive action. This archetype thrives in high-pressure environments like emergency rooms, trading floors, and startup leadership. Your independence means you won\'t wait for consensus when speed matters, which makes you exceptionally effective when the cost of delay exceeds the cost of imperfect action. Fighter pilots, ER physicians, and crisis negotiators share this cognitive profile.',
  },
  // index 3: Analytical + Rapid + Collaborative
  {
    name: 'The Sentinel',
    axes: ['Analytical', 'Rapid', 'Collaborative'],
    color: 'hsl(200 65% 50%)',
    description:
      'You process information rapidly while staying attuned to the people around you. Sentinels are the ultimate team protectors — you spot risks before anyone else and communicate them clearly enough to mobilize a group response. Think of air traffic controllers coordinating dozens of flights, or team leads who can simultaneously track project deadlines, team morale, and technical risks. Your blend of speed, precision, and social awareness makes you the person who holds everything together when complexity rises. You\'re the early-warning system every high-performing team needs.',
  },
  // index 4: Creative + Methodical + Independent
  {
    name: 'The Visionary',
    axes: ['Creative', 'Methodical', 'Independent'],
    color: 'hsl(280 60% 50%)',
    description:
      'You dream big and have the patience and discipline to bring ideas to life — on your own terms. Visionaries are the rarest archetype because most creative thinkers lack follow-through, and most methodical thinkers lack imagination. You have both. Think of Leonardo da Vinci filling notebooks with inventions centuries ahead of their time, or architects who conceive buildings that redefine skylines and then spend years perfecting every detail. Your independence means you don\'t need external validation to pursue your vision — you trust the creative process and commit to the long game.',
  },
  // index 5: Creative + Methodical + Collaborative
  {
    name: 'The Philosopher',
    axes: ['Creative', 'Methodical', 'Collaborative'],
    color: 'hsl(320 50% 50%)',
    description:
      'You combine creative intuition with careful deliberation and a genuine interest in understanding others. Philosophers see patterns that connect art, science, and human nature — and they take the time to articulate those insights in ways that change how people think. Think of Carl Sagan making the cosmos accessible, or Maya Angelou weaving personal experience into universal truth. Your collaborative nature means your ideas don\'t stay in a journal — they spread, evolve, and inspire action. You\'re the person who reframes a problem so elegantly that the solution becomes obvious to everyone in the room.',
  },
  // index 6: Creative + Rapid + Independent
  {
    name: 'The Innovator',
    axes: ['Creative', 'Rapid', 'Independent'],
    color: 'hsl(160 60% 45%)',
    description:
      'You generate and iterate on ideas faster than anyone — and you don\'t wait for permission. Innovators are the engines of progress. You don\'t just have one idea; you have twenty, and you can rapidly test, refine, and discard them until you find the one that works. This "rapid prototyping" cognitive style drives breakthroughs in technology, art, and business. Silicon Valley\'s most disruptive founders tend to be Innovators — they combine creative thinking with the processing speed to outpace competitors and the independence to ignore conventional wisdom when it\'s wrong.',
  },
  // index 7: Creative + Rapid + Collaborative
  {
    name: 'The Catalyst',
    axes: ['Creative', 'Rapid', 'Collaborative'],
    color: 'hsl(45 85% 50%)',
    description:
      'You ignite energy in every room you enter — generating ideas, connecting people, and turning momentum into results. Catalysts are the spark that makes teams greater than the sum of their parts. You think fast, see creative possibilities others miss, and have the social intelligence to rally people around a shared vision before the competition even realizes what\'s happening. Think of improvisational jazz musicians who elevate the entire ensemble, or product managers who can synthesize customer insight, engineering constraints, and market timing into a winning strategy — all in a single whiteboard session.',
  },
];

/* ── Archetype calculation ── */

export function getArchetype(
  scores: CategoryScores,
  finalScore: number,
): Archetype {
  const floors = getCategoryFloors(finalScore);

  const logicScore = Math.max(scores.logic ?? 0, floors.logic);
  const patternScore = Math.max(scores.pattern ?? 0, floors.pattern);
  const speedScore = Math.max(scores.speed ?? 0, floors.speed);
  const selfScore = Math.max(scores.self ?? 0, floors.self);

  // Three boolean axes → 8 combinations (0-7)
  const x = patternScore > logicScore ? 1 : 0;  // Creative (1) vs Analytical (0)
  const y = speedScore > 0.65 ? 1 : 0;          // Rapid (1) vs Methodical (0)
  const z = selfScore > 0.85 ? 1 : 0;           // Collaborative (1) vs Independent (0)

  const index = x * 4 + y * 2 + z;
  return ARCHETYPES[index];
}
