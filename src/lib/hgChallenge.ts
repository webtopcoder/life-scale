// 90-day Hidden Genius challenge. Cycle-aware; reshuffles every 90 days.
// pattern_puzzle → puzzle rows, analogy_drill → brain_teaser, lesson → lesson.
// divergent_prompt + reflection are locally acknowledged (per cycle).

import {
  CYCLE_LENGTH, hashSeed, mulberry32, dateKey, cyclePosition, cycleDayDateKey,
  daysInWeek, type CyclePosition,
} from '@/lib/challengeCycle';

export type HgTaskType = 'pattern_puzzle' | 'analogy_drill' | 'divergent_prompt' | 'lesson' | 'reflection';

export interface HgDayPlan {
  day: number;
  phase: 'Foundations' | 'Build' | 'Mastery';
  isRest: boolean;
  isMilestone: boolean;
  tasks: HgTaskType[];
}

export const HG_CHALLENGE_LENGTH = CYCLE_LENGTH;

function pickCount(rand: () => number): number {
  const r = rand();
  if (r < 0.15) return 0;
  if (r < 0.25) return 1;
  if (r < 0.70) return 2;
  if (r < 0.90) return 3;
  return 4;
}
function phaseOf(day: number): HgDayPlan['phase'] {
  if (day <= 30) return 'Foundations';
  if (day <= 60) return 'Build';
  return 'Mastery';
}
function typePool(phase: HgDayPlan['phase']): HgTaskType[] {
  switch (phase) {
    case 'Foundations':
      return ['analogy_drill','analogy_drill','analogy_drill','lesson','lesson','reflection','reflection','divergent_prompt','pattern_puzzle'];
    case 'Build':
      return ['analogy_drill','pattern_puzzle','pattern_puzzle','pattern_puzzle','divergent_prompt','divergent_prompt','lesson','lesson','reflection'];
    case 'Mastery':
      return ['analogy_drill','pattern_puzzle','pattern_puzzle','divergent_prompt','divergent_prompt','divergent_prompt','lesson','lesson','reflection'];
  }
}
function pickType(rand: () => number, pool: HgTaskType[]): HgTaskType {
  return pool[Math.floor(rand() * pool.length)];
}

export function buildHgPlan(userId: string, cycleNumber: number = 1): HgDayPlan[] {
  const baseSeed = hashSeed(`hg-challenge::${userId || 'anon'}::cycle::${cycleNumber}`);
  const plans: HgDayPlan[] = [];
  let prevPush = false;
  for (let day = 1; day <= CYCLE_LENGTH; day++) {
    const rand = mulberry32(baseSeed ^ (day * 0x9E3779B1));
    const phase = phaseOf(day);
    const isMilestone = day % 10 === 0;
    let count = pickCount(rand);
    if (count === 4 && prevPush) count = 3;
    if (isMilestone) {
      const c = Math.max(count, 2);
      const tasks: HgTaskType[] = ['reflection', 'lesson'];
      const pool = typePool(phase);
      for (let i = tasks.length; i < c; i++) tasks.push(pickType(rand, pool));
      plans.push({ day, phase, isRest: false, isMilestone: true, tasks });
      prevPush = tasks.length >= 4;
      continue;
    }
    if (count === 0) { plans.push({ day, phase, isRest: true, isMilestone: false, tasks: [] }); prevPush = false; continue; }
    const pool = typePool(phase);
    const tasks: HgTaskType[] = [];
    for (let i = 0; i < count; i++) tasks.push(pickType(rand, pool));
    plans.push({ day, phase, isRest: false, isMilestone: false, tasks });
    prevPush = count === 4;
  }
  return plans;
}

export interface HgProgressRow {
  content_type: string;
  mode?: string | null;
  completed_at?: string | null;
  status?: string | null;
}

const REFLECTION_KEY = 'iqscale.hgdash.reflection.';
const DIVERGENT_KEY = 'iqscale.hgdash.divergent.';
const REST_KEY = 'iqscale.hgdash.rest.';

export const isHgReflectionDone = (u: string, d: number, c: number = 1) =>
  safeGet(`${REFLECTION_KEY}${u}::c${c}::${d}`);
export const markHgReflectionDone = (u: string, d: number, c: number = 1) =>
  safeSet(`${REFLECTION_KEY}${u}::c${c}::${d}`);
export const isHgDivergentDone = (u: string, d: number, c: number = 1) =>
  safeGet(`${DIVERGENT_KEY}${u}::c${c}::${d}`);
export const markHgDivergentDone = (u: string, d: number, c: number = 1) =>
  safeSet(`${DIVERGENT_KEY}${u}::c${c}::${d}`);
export const isHgRestAcked = (u: string, d: number, c: number = 1) =>
  safeGet(`${REST_KEY}${u}::c${c}::${d}`);
export const ackHgRest = (u: string, d: number, c: number = 1) =>
  safeSet(`${REST_KEY}${u}::c${c}::${d}`);

function safeGet(k: string) { try { return localStorage.getItem(k) === '1'; } catch { return false; } }
function safeSet(k: string) { try { localStorage.setItem(k, '1'); } catch { /* noop */ } }

function toHgTaskType(row: HgProgressRow): HgTaskType | null {
  const t = row.content_type;
  if (t === 'puzzle' || t === 'maze') return 'pattern_puzzle';
  if (t === 'brain_teaser') return 'analogy_drill';
  if (t === 'lesson') return 'lesson';
  return null;
}

export function doneByTypeHg(
  userId: string,
  cycleNumber: number,
  plan: HgDayPlan,
  cycleStartIso: string,
  progress: HgProgressRow[],
): Record<HgTaskType, number> {
  const done: Record<HgTaskType, number> = { pattern_puzzle:0, analogy_drill:0, divergent_prompt:0, lesson:0, reflection:0 };
  if (plan.isRest) return done;
  const dKey = cycleDayDateKey(cycleStartIso, plan.day);
  const required: Record<HgTaskType, number> = { pattern_puzzle:0, analogy_drill:0, divergent_prompt:0, lesson:0, reflection:0 };
  for (const t of plan.tasks) required[t]++;

  for (const row of progress) {
    if (row.status && row.status !== 'completed') continue;
    if (!row.completed_at) continue;
    if (dateKey(new Date(row.completed_at)) !== dKey) continue;
    const tt = toHgTaskType(row);
    if (!tt) continue;
    if (done[tt] < required[tt]) done[tt]++;
  }
  if (required.reflection > 0 && isHgReflectionDone(userId, plan.day, cycleNumber)) done.reflection = required.reflection;
  if (required.divergent_prompt > 0 && isHgDivergentDone(userId, plan.day, cycleNumber)) done.divergent_prompt = required.divergent_prompt;
  return done;
}

export function countDoneOfTypeHg(plan: HgDayPlan, idx: number, doneByType: Record<HgTaskType, number>): boolean {
  const t = plan.tasks[idx];
  let priorSameType = 0;
  for (let i = 0; i < idx; i++) if (plan.tasks[i] === t) priorSameType++;
  return doneByType[t] > priorSameType;
}

export function completedHgTasksForDay(
  userId: string, cycleNumber: number, plan: HgDayPlan, cycleStartIso: string, progress: HgProgressRow[],
): number {
  if (plan.isRest) return 0;
  const target = plan.tasks.length;
  if (target === 0) return 0;
  const required: Record<HgTaskType, number> = { pattern_puzzle:0, analogy_drill:0, divergent_prompt:0, lesson:0, reflection:0 };
  for (const t of plan.tasks) required[t]++;
  const done = doneByTypeHg(userId, cycleNumber, plan, cycleStartIso, progress);
  let sum = 0;
  (Object.keys(required) as HgTaskType[]).forEach(k => sum += Math.min(done[k], required[k]));
  return Math.min(sum, target);
}

export interface HgChallengeSummary {
  pos: CyclePosition;
  plans: HgDayPlan[];
  todayPlan: HgDayPlan;
  perDayCompleted: number[];
  weekTasksTotal: number;
  weekTasksDone: number;
  weekPct: number;
  cycleTasksTotal: number;
  cycleTasksDone: number;
  cyclePct: number;
  currentDay: number;
  overallPct: number;
  completedTasks: number;
  totalTasks: number;
}

export function summarizeHg(
  userId: string, startIso: string, progress: HgProgressRow[], now: Date = new Date(),
): HgChallengeSummary {
  const pos = cyclePosition(startIso, now);
  const plans = buildHgPlan(userId, pos.cycleNumber);
  const perDay: number[] = new Array(CYCLE_LENGTH).fill(0);
  let cycleTasksTotal = 0, cycleTasksDone = 0;
  for (const p of plans) {
    cycleTasksTotal += p.tasks.length;
    if (p.day <= pos.cycleDay) {
      const c = completedHgTasksForDay(userId, pos.cycleNumber, p, pos.cycleStartIso, progress);
      perDay[p.day - 1] = c;
      cycleTasksDone += c;
    }
  }
  const { first, last } = daysInWeek(pos.weekNumber);
  let weekTasksTotal = 0, weekTasksDone = 0;
  for (let d = first; d <= last; d++) {
    const p = plans[d - 1];
    weekTasksTotal += p.tasks.length;
    if (d <= pos.cycleDay) weekTasksDone += perDay[d - 1];
  }
  const cyclePct = cycleTasksTotal === 0 ? 0 : Math.round((cycleTasksDone / cycleTasksTotal) * 100);
  const weekPct = weekTasksTotal === 0 ? 0 : Math.round((weekTasksDone / weekTasksTotal) * 100);
  return {
    pos, plans, todayPlan: plans[pos.cycleDay - 1], perDayCompleted: perDay,
    weekTasksTotal, weekTasksDone, weekPct, cycleTasksTotal, cycleTasksDone, cyclePct,
    currentDay: pos.cycleDay, overallPct: cyclePct,
    completedTasks: cycleTasksDone, totalTasks: cycleTasksTotal,
  };
}

export function hgTaskLabel(t: HgTaskType): string {
  switch (t) {
    case 'pattern_puzzle': return 'Pattern Puzzle';
    case 'analogy_drill': return 'Analogy Drill';
    case 'divergent_prompt': return 'Divergent Prompt';
    case 'lesson': return 'Lesson';
    case 'reflection': return 'Archetype Reflection';
  }
}
export function hgTaskPath(t: HgTaskType): string {
  switch (t) {
    case 'pattern_puzzle': return '/hg-dash/patterns';
    case 'analogy_drill': return '/hg-dash/drills';
    case 'lesson': return '/hg-dash/lessons';
    case 'divergent_prompt':
    case 'reflection': return '';
  }
}
