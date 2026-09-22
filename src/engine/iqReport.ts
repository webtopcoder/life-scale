/**
 * IQ report deepening engine.
 *
 * Pure derivations from raw answers + category scores. Zero DB, zero React.
 * Everything here is designed to let the report cite the user's own behavior
 * (accuracy, timing, difficulty tolerance) rather than generic archetype prose.
 */

import type { Answer, CategoryScores, Category } from '@/types/funnel';

/* ------------------------------------------------------------------------ */
/* Category signal                                                          */
/* ------------------------------------------------------------------------ */

export interface CategorySignal {
  category: Category;
  label: string;
  score01: number;           // 0..1
  scorePct: number;          // 0..100 rounded
  correct: number;
  attempted: number;
  accuracyPct: number;       // rounded
  avgTimeSec: number;        // avg response seconds
  medianTimeSec: number;
  hardestCorrectDifficulty: number | null;   // 1..5 or null
  easiestMissedDifficulty: number | null;    // 1..5 or null
  consistency: 'tight' | 'variable' | 'wide'; // variance band
  peakLoadDropPct: number;   // accuracy drop hard - easy, positive means degraded
}

export const CATEGORY_LABEL: Record<Category, string> = {
  logic: 'Logical Reasoning',
  pattern: 'Pattern Recognition',
  spatial: 'Spatial Reasoning',
  speed: 'Processing Speed',
  self: 'Self-Awareness',
};

interface AnswerWithMeta extends Answer {
  category?: Category;
  difficulty?: number;
  isScored?: boolean; // false for likert/self
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function variance(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  return nums.reduce((s, n) => s + (n - m) * (n - m), 0) / nums.length;
}

export function computeCategorySignal(
  cat: Category,
  answers: AnswerWithMeta[],
  scoreForCat: number,
): CategorySignal {
  const items = answers.filter(a => a.category === cat);
  const scored = items.filter(a => a.isScored !== false && a.isCorrect !== null);
  const correct = scored.filter(a => a.isCorrect === true).length;
  const attempted = scored.length;
  const accuracyPct = attempted ? Math.round((correct / attempted) * 100) : Math.round(scoreForCat * 100);

  const times = items.map(a => a.timeSpent / 1000).filter(t => t > 0 && t < 300);
  const avgTimeSec = times.length ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10 : 0;
  const medianTimeSec = Math.round(median(times) * 10) / 10;

  const correctItems = scored.filter(a => a.isCorrect === true && typeof a.difficulty === 'number');
  const missedItems = scored.filter(a => a.isCorrect === false && typeof a.difficulty === 'number');
  const hardestCorrectDifficulty = correctItems.length
    ? Math.max(...correctItems.map(a => a.difficulty!)) : null;
  const easiestMissedDifficulty = missedItems.length
    ? Math.min(...missedItems.map(a => a.difficulty!)) : null;

  // Peak-load drop: accuracy on top half of difficulty vs bottom half.
  let peakLoadDropPct = 0;
  const withDiff = scored.filter(a => typeof a.difficulty === 'number');
  if (withDiff.length >= 4) {
    const sorted = [...withDiff].sort((a, b) => a.difficulty! - b.difficulty!);
    const half = Math.floor(sorted.length / 2);
    const easy = sorted.slice(0, half);
    const hard = sorted.slice(sorted.length - half);
    const easyAcc = easy.filter(a => a.isCorrect === true).length / easy.length;
    const hardAcc = hard.filter(a => a.isCorrect === true).length / hard.length;
    peakLoadDropPct = Math.round((easyAcc - hardAcc) * 100);
  }

  const timeVar = variance(times);
  const consistency: CategorySignal['consistency'] =
    timeVar < 8 ? 'tight' : timeVar < 25 ? 'variable' : 'wide';

  return {
    category: cat,
    label: CATEGORY_LABEL[cat],
    score01: scoreForCat,
    scorePct: Math.round(scoreForCat * 100),
    correct,
    attempted,
    accuracyPct,
    avgTimeSec,
    medianTimeSec,
    hardestCorrectDifficulty,
    easiestMissedDifficulty,
    consistency,
    peakLoadDropPct,
  };
}

/* ------------------------------------------------------------------------ */
/* Signature axes: 3 processing style dimensions                            */
/* ------------------------------------------------------------------------ */

export type IqAxisKey = 'verbal-spatial' | 'fluid-crystallized' | 'focus-flexibility';

export interface IqAxis {
  key: IqAxisKey;
  leftLabel: string;
  rightLabel: string;
  value: number; // -100..+100
  interpretation: string;
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function interpretAxis(left: string, right: string, v: number): string {
  const mag = Math.abs(v);
  const side = v < 0 ? left : right;
  if (mag < 15) return `You sit almost centered — you can shift either way as the problem demands.`;
  if (mag < 40) return `You lean ${side}, with enough flex to work in the other mode when needed.`;
  if (mag < 70) return `You run clearly ${side}. It shapes how you frame most cognitive work.`;
  return `You are strongly ${side} — this is a defining feature of how your mind operates.`;
}

export function computeIqAxes(scores: CategoryScores): IqAxis[] {
  // Verbal here proxies from "self" (self-awareness/verbal-reflective items) and
  // "logic" (verbal-analytical). Spatial is direct.
  const verbal = (scores.logic + scores.self) / 2;
  const spatialV = scores.spatial;
  const verbalSpatial = clamp((spatialV - verbal) * 100, -100, 100);

  // Fluid = pattern + spatial (novel reasoning). Crystallized = logic + self (learned reasoning).
  const fluid = (scores.pattern + scores.spatial) / 2;
  const crystal = (scores.logic + scores.self) / 2;
  const fluidCrystal = clamp((crystal - fluid) * 100, -100, 100);

  // Focus vs flexibility: variance across the 5 category scores.
  const arr = [scores.logic, scores.pattern, scores.spatial, scores.speed, scores.self];
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const varc = arr.reduce((s, n) => s + (n - mean) * (n - mean), 0) / arr.length;
  // Low variance = flexible generalist. High variance = focused specialist.
  const focusFlex = clamp((0.05 - varc) * 800, -100, 100);

  return [
    { key: 'verbal-spatial', leftLabel: 'Verbal', rightLabel: 'Spatial',
      value: Math.round(verbalSpatial),
      interpretation: interpretAxis('verbal-reasoning', 'spatial-reasoning', verbalSpatial) },
    { key: 'fluid-crystallized', leftLabel: 'Fluid', rightLabel: 'Crystallized',
      value: Math.round(fluidCrystal),
      interpretation: interpretAxis('fluid (novel) reasoning', 'crystallized (learned) reasoning', fluidCrystal) },
    { key: 'focus-flexibility', leftLabel: 'Focused', rightLabel: 'Flexible',
      value: Math.round(focusFlex),
      interpretation: interpretAxis('a focused specialist profile', 'a flexible generalist profile', focusFlex) },
  ];
}

/* ------------------------------------------------------------------------ */
/* Speed-accuracy quadrant                                                  */
/* ------------------------------------------------------------------------ */

export type SpeedAccuracyLabel =
  | 'Deliberate & precise'
  | 'Fast & fluent'
  | 'Cautious'
  | 'Rushed'
  | 'Balanced';

export interface SpeedAccuracy {
  accuracyPct: number;   // overall
  avgTimeSec: number;    // overall
  accuracyZ: number;     // relative to items
  timeZ: number;         // relative to items
  label: SpeedAccuracyLabel;
  paragraph: string;
}

export function computeSpeedAccuracy(answers: AnswerWithMeta[]): SpeedAccuracy {
  const scored = answers.filter(a => a.isScored !== false && a.isCorrect !== null);
  const correct = scored.filter(a => a.isCorrect === true).length;
  const accuracyPct = scored.length ? Math.round((correct / scored.length) * 100) : 0;

  const times = scored.map(a => a.timeSpent / 1000).filter(t => t > 0 && t < 300);
  const avgTimeSec = times.length
    ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10 : 0;

  // Rough normalization: accuracy Z where 60% is the median, 15pt SD.
  // Time Z where 12s is the median, 8s SD.
  const accuracyZ = (accuracyPct - 60) / 15;
  const timeZ = avgTimeSec > 0 ? (avgTimeSec - 12) / 8 : 0;

  const fast = timeZ < -0.5;
  const slow = timeZ > 0.5;
  const high = accuracyZ > 0.5;
  const low = accuracyZ < -0.5;

  let label: SpeedAccuracyLabel = 'Balanced';
  let paragraph = 'You balance speed and accuracy without leaning hard either way.';

  if (slow && high) {
    label = 'Deliberate & precise';
    paragraph = 'You trade time for accuracy — strong in research, diagnostics and review, where wrong answers cost.';
  } else if (fast && high) {
    label = 'Fast & fluent';
    paragraph = 'Quick and correct — a rare combination. Where you have pattern coverage, your first instinct is usually right.';
  } else if (slow && low) {
    label = 'Cautious';
    paragraph = 'You take your time but still miss harder items — second-guessing, not reasoning. Commit to your first read.';
  } else if (fast && low) {
    label = 'Rushed';
    paragraph = 'Fast enough that reading errors slip through. A 20% slowdown on harder items would lift accuracy.';
  }
  return { accuracyPct, avgTimeSec, accuracyZ, timeZ, label, paragraph };
}

/* ------------------------------------------------------------------------ */
/* Cognitive fingerprint (rarity)                                           */
/* ------------------------------------------------------------------------ */

export interface Fingerprint {
  band: '1 in 10' | '1 in 25' | '1 in 50' | '1 in 100';
  headline: string;
  body: string;
}

export function computeFingerprint(finalScore: number, axes: IqAxis[]): Fingerprint {
  const axisMag = axes.reduce((s, a) => s + Math.abs(a.value), 0) / axes.length;
  const scoreLift = Math.max(0, finalScore - 100);
  const rarity = scoreLift * 0.6 + axisMag * 0.5;

  let band: Fingerprint['band'] = '1 in 10';
  if (rarity >= 55) band = '1 in 100';
  else if (rarity >= 40) band = '1 in 50';
  else if (rarity >= 25) band = '1 in 25';

  return {
    band,
    headline: `Roughly ${band} people show this cognitive fingerprint.`,
    body: rarity >= 40
      ? 'Uncommon enough that generic advice misses. The Growth Levers below target your pattern.'
      : 'Your shape sits close to the general population — the differences that matter show up in the axes above.',
  };
}

/* ------------------------------------------------------------------------ */
/* Growth levers                                                            */
/* ------------------------------------------------------------------------ */

export interface GrowthLever {
  category: Category;
  label: string;
  why: string;             // cites the user's actual signal
  drill: string;           // concrete 5-15 min practice
  cadence: string;         // e.g. "5 min/day"
}

const DRILLS: Record<Category, { drill: string; cadence: string; hookPhrase: string }[]> = {
  logic: [
    { drill: 'Solve one syllogism-chain puzzle before opening any app in the morning.', cadence: '10 min/day', hookPhrase: 'logical chain-building' },
    { drill: 'Rewrite one news headline as an if/then statement and identify the assumption it hides.', cadence: '5 min/day', hookPhrase: 'assumption-spotting' },
  ],
  pattern: [
    { drill: 'Practice 3x3 matrix-completion drills: 5 easy, then 2 hard.', cadence: '10 min/day', hookPhrase: 'matrix scanning' },
    { drill: 'Take a sequence of 6 numbers and, in under 30s, articulate the rule out loud before checking.', cadence: '5 min/day', hookPhrase: 'rule-articulation' },
  ],
  spatial: [
    { drill: 'Do 5 mental rotation problems, calling "same" or "mirrored" out loud first.', cadence: '5 min/day', hookPhrase: 'rotation reps' },
    { drill: 'Sketch one everyday object from three angles without looking at it a second time.', cadence: '10 min/session, 3x/week', hookPhrase: 'perspective sketching' },
  ],
  speed: [
    { drill: 'Timed digit-symbol drills for 90 seconds. Track your score across 5 sessions.', cadence: '2 min/day', hookPhrase: 'symbol-coding sprints' },
    { drill: 'N-back at n=2 for 10 minutes, uninterrupted. Phone in another room.', cadence: '10 min/day, 4x/week', hookPhrase: 'working-memory load' },
  ],
  self: [
    { drill: 'End of day: write one sentence naming what your best decision was and one for what you\'d redo.', cadence: '3 min/day', hookPhrase: 'reflective loops' },
    { drill: 'Before a decision, predict how you\'ll feel about it in a week. Track accuracy.', cadence: '2 min/decision', hookPhrase: 'prospective calibration' },
  ],
};

export function computeGrowthLevers(signals: CategorySignal[]): GrowthLever[] {
  // Two weakest scored categories (skip 'self' if we've already got weaker ones).
  const ranked = [...signals]
    .sort((a, b) => a.score01 - b.score01)
    .slice(0, 2);

  return ranked.map(s => {
    const options = DRILLS[s.category];
    const pick = options[0];
    const whyBits: string[] = [];
    if (s.attempted > 0) {
      whyBits.push(`You got ${s.correct} of ${s.attempted} ${s.label.toLowerCase()} items`);
    }
    if (s.peakLoadDropPct >= 20) {
      whyBits.push(`accuracy dropped ~${s.peakLoadDropPct}% on the harder items`);
    }
    if (s.easiestMissedDifficulty && s.easiestMissedDifficulty <= 2) {
      whyBits.push(`with misses starting at difficulty ${s.easiestMissedDifficulty}`);
    }
    const why = whyBits.length
      ? whyBits.join(', ') + '. Targeted ' + pick.hookPhrase + ' addresses that pattern directly.'
      : `Your ${s.label} score sits below your other categories. Targeted ${pick.hookPhrase} lifts the floor fastest.`;
    return {
      category: s.category,
      label: s.label,
      why,
      drill: pick.drill,
      cadence: pick.cadence,
    };
  });
}

/* ------------------------------------------------------------------------ */
/* Top-level report bundle                                                  */
/* ------------------------------------------------------------------------ */

export interface IqReportSignals {
  perCategory: CategorySignal[];
  axes: IqAxis[];
  speedAccuracy: SpeedAccuracy;
  fingerprint: Fingerprint;
  growthLevers: GrowthLever[];
  strongest: CategorySignal;
  weakest: CategorySignal;
}

export function buildIqReport(
  answers: AnswerWithMeta[],
  scores: CategoryScores,
  finalScore: number,
): IqReportSignals {
  const cats: Category[] = ['logic', 'pattern', 'spatial', 'speed', 'self'];
  const perCategory = cats.map(c => computeCategorySignal(c, answers, scores[c]));
  const axes = computeIqAxes(scores);
  const speedAccuracy = computeSpeedAccuracy(answers);
  const fingerprint = computeFingerprint(finalScore, axes);
  const growthLevers = computeGrowthLevers(perCategory);
  const strongest = [...perCategory].sort((a, b) => b.score01 - a.score01)[0];
  const weakest = [...perCategory].sort((a, b) => a.score01 - b.score01)[0];
  return { perCategory, axes, speedAccuracy, fingerprint, growthLevers, strongest, weakest };
}
