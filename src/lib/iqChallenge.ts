// 90-day IQ Sharpening plan. Cycle-aware: on day 91 a fresh cycle starts and
// the plan reshuffles. Progress reads user_content_progress rows via useBrainScore.

import {
  CYCLE_LENGTH, WEEKS_PER_CYCLE, DAYS_PER_WEEK,
  hashSeed, mulberry32, dateKey, cyclePosition, cycleDayDateKey,
  weekOfCycleDay, daysInWeek, type CyclePosition,
} from '@/lib/challengeCycle';

export type TaskType = 'brain_teaser' | 'maze' | 'timed_maze' | 'lesson' | 'reflection';

export interface DayPlan {
  day: number;             // 1..90 (within the cycle)
  phase: 'Foundations' | 'Build' | 'Mastery';
  isRest: boolean;
  isMilestone: boolean;
  tasks: TaskType[];
}

export const CHALLENGE_LENGTH = CYCLE_LENGTH;

function pickCount(rand: () => number): number {
  const r = rand();
  if (r < 0.15) return 0;
  if (r < 0.25) return 1;
  if (r < 0.70) return 2;
  if (r < 0.90) return 3;
  return 4;
}

function phaseOf(day: number): DayPlan['phase'] {
  if (day <= 30) return 'Foundations';
  if (day <= 60) return 'Build';
  return 'Mastery';
}

function typePool(phase: DayPlan['phase']): TaskType[] {
  switch (phase) {
    case 'Foundations':
      return ['brain_teaser','brain_teaser','brain_teaser','lesson','lesson','maze','reflection','reflection'];
    case 'Build':
      return ['brain_teaser','brain_teaser','maze','maze','maze','timed_maze','lesson','lesson','reflection'];
    case 'Mastery':
      return ['brain_teaser','brain_teaser','maze','maze','timed_maze','timed_maze','timed_maze','lesson','lesson','reflection'];
  }
}

function pickType(rand: () => number, pool: TaskType[]): TaskType {
  return pool[Math.floor(rand() * pool.length)];
}

/** Build a full 90-day cycle plan. Deterministic per (user, cycle). */
export function buildFullPlan(userId: string, cycleNumber: number = 1): DayPlan[] {
  const baseSeed = hashSeed(`iq-challenge::${userId || 'anon'}::cycle::${cycleNumber}`);
  const plans: DayPlan[] = [];
  let prevWasPush = false;

  for (let day = 1; day <= CYCLE_LENGTH; day++) {
    const rand = mulberry32(baseSeed ^ (day * 0x9E3779B1));
    const phase = phaseOf(day);
    const isMilestone = day % 10 === 0;

    let count = pickCount(rand);
    if (count === 4 && prevWasPush) count = 3;

    if (isMilestone) {
      const c = Math.max(count, 2);
      const tasks: TaskType[] = ['timed_maze', 'lesson'];
      const pool = typePool(phase);
      for (let i = tasks.length; i < c; i++) tasks.push(pickType(rand, pool));
      plans.push({ day, phase, isRest: false, isMilestone: true, tasks });
      prevWasPush = tasks.length >= 4;
      continue;
    }
    if (count === 0) {
      plans.push({ day, phase, isRest: true, isMilestone: false, tasks: [] });
      prevWasPush = false;
      continue;
    }
    const pool = typePool(phase);
    const tasks: TaskType[] = [];
    for (let i = 0; i < count; i++) tasks.push(pickType(rand, pool));
    plans.push({ day, phase, isRest: false, isMilestone: false, tasks });
    prevWasPush = count === 4;
  }
  return plans;
}

export interface ProgressRow {
  content_type: string;
  mode?: string | null;
  completed_at?: string | null;
  status?: string | null;
}

// Local-only completion helpers (reflection + rest ack). Cycle defaults to 1
// when callers don't know it — good enough for a first cycle; on rollover
// state resets naturally with the new cycle number if the caller passes one.
const REFLECTION_KEY_PREFIX = 'iqscale.iqdash.reflection.';
const REST_KEY_PREFIX = 'iqscale.iqdash.rest.';
export const reflectionKey = (u: string, day: number, cycle: number = 1) =>
  `${REFLECTION_KEY_PREFIX}${u}::c${cycle}::${day}`;
export const isReflectionDone = (u: string, day: number, cycle: number = 1): boolean => {
  try { return localStorage.getItem(reflectionKey(u, day, cycle)) === '1'; } catch { return false; }
};
export const markReflectionDone = (u: string, day: number, cycle: number = 1) => {
  try { localStorage.setItem(reflectionKey(u, day, cycle), '1'); } catch { /* noop */ }
};
export const isRestAcked = (u: string, day: number, cycle: number = 1): boolean => {
  try { return localStorage.getItem(`${REST_KEY_PREFIX}${u}::c${cycle}::${day}`) === '1'; } catch { return false; }
};
export const ackRest = (u: string, day: number, cycle: number = 1) => {
  try { localStorage.setItem(`${REST_KEY_PREFIX}${u}::c${cycle}::${day}`, '1'); } catch { /* noop */ }
};

function toTaskType(row: ProgressRow): TaskType | null {
  const t = row.content_type;
  if (t === 'brain_teaser') return 'brain_teaser';
  if (t === 'lesson') return 'lesson';
  if (t === 'puzzle' || t === 'maze') return row.mode === 'timed' ? 'timed_maze' : 'maze';
  return null;
}

/** Simple index-vs-doneCount check used by the dash today-tasks list. */
export function countDoneOfType(plan: DayPlan, idx: number, doneCount: number): boolean {
  return idx < doneCount;
}

/** Per-type done counts for a given day within the current cycle. */
export function doneByTypeFor(
  userId: string,
  cycleNumber: number,
  plan: DayPlan,
  cycleStartIso: string,
  progress: ProgressRow[],
): Record<TaskType, number> {
  const done: Record<TaskType, number> = { brain_teaser: 0, maze: 0, timed_maze: 0, lesson: 0, reflection: 0 };
  if (plan.isRest) return done;
  const dKey = cycleDayDateKey(cycleStartIso, plan.day);
  const required: Record<TaskType, number> = { brain_teaser: 0, maze: 0, timed_maze: 0, lesson: 0, reflection: 0 };
  for (const t of plan.tasks) required[t]++;

  for (const row of progress) {
    if (row.status && row.status !== 'completed') continue;
    if (!row.completed_at) continue;
    if (dateKey(new Date(row.completed_at)) !== dKey) continue;
    const tt = toTaskType(row);
    if (!tt) continue;
    if (done[tt] < required[tt]) done[tt]++;
  }
  if (required.reflection > 0 && isReflectionDone(userId, plan.day, cycleNumber)) {
    done.reflection = required.reflection;
  }
  return done;
}

export function completedTasksForDay(
  userId: string,
  cycleNumber: number,
  plan: DayPlan,
  cycleStartIso: string,
  progress: ProgressRow[],
): number {
  if (plan.isRest) return 0;
  const target = plan.tasks.length;
  if (target === 0) return 0;
  const required: Record<TaskType, number> = { brain_teaser: 0, maze: 0, timed_maze: 0, lesson: 0, reflection: 0 };
  for (const t of plan.tasks) required[t]++;
  const done = doneByTypeFor(userId, cycleNumber, plan, cycleStartIso, progress);
  let sum = 0;
  (Object.keys(required) as TaskType[]).forEach(k => sum += Math.min(done[k], required[k]));
  return Math.min(sum, target);
}

export interface ChallengeSummary {
  pos: CyclePosition;
  plans: DayPlan[];
  todayPlan: DayPlan;
  perDayCompleted: number[];   // length 90, current cycle only
  // Weekly (primary)
  weekTasksTotal: number;
  weekTasksDone: number;
  weekPct: number;
  // Cycle (secondary)
  cycleTasksTotal: number;
  cycleTasksDone: number;
  cyclePct: number;
  // Back-compat aliases used by dash pages
  currentDay: number;
  overallPct: number;
  completedTasks: number;
  totalTasks: number;
}

export function summarize(
  userId: string,
  startIso: string,
  progress: ProgressRow[],
  now: Date = new Date(),
): ChallengeSummary {
  const pos = cyclePosition(startIso, now);
  const plans = buildFullPlan(userId, pos.cycleNumber);
  const perDay: number[] = new Array(CYCLE_LENGTH).fill(0);

  let cycleTasksTotal = 0;
  let cycleTasksDone = 0;
  for (const p of plans) {
    cycleTasksTotal += p.tasks.length;
    if (p.day <= pos.cycleDay) {
      const c = completedTasksForDay(userId, pos.cycleNumber, p, pos.cycleStartIso, progress);
      perDay[p.day - 1] = c;
      cycleTasksDone += c;
    }
  }

  const { first, last } = daysInWeek(pos.weekNumber);
  let weekTasksTotal = 0;
  let weekTasksDone = 0;
  for (let d = first; d <= last; d++) {
    const p = plans[d - 1];
    weekTasksTotal += p.tasks.length;
    if (d <= pos.cycleDay) weekTasksDone += perDay[d - 1];
  }

  const cyclePct = cycleTasksTotal === 0 ? 0 : Math.round((cycleTasksDone / cycleTasksTotal) * 100);
  const weekPct = weekTasksTotal === 0 ? 0 : Math.round((weekTasksDone / weekTasksTotal) * 100);

  return {
    pos, plans,
    todayPlan: plans[pos.cycleDay - 1],
    perDayCompleted: perDay,
    weekTasksTotal, weekTasksDone, weekPct,
    cycleTasksTotal, cycleTasksDone, cyclePct,
    currentDay: pos.cycleDay,
    overallPct: cyclePct,
    completedTasks: cycleTasksDone,
    totalTasks: cycleTasksTotal,
  };
}

export function taskLabel(t: TaskType): string {
  switch (t) {
    case 'brain_teaser': return 'Brain Teaser';
    case 'maze': return 'Maze';
    case 'timed_maze': return 'Timed Maze';
    case 'lesson': return 'Lesson';
    case 'reflection': return 'Reflection';
  }
}

export function taskPath(t: TaskType): string {
  switch (t) {
    case 'brain_teaser': return '/iq-dash/brain-teasers';
    case 'maze':
    case 'timed_maze': return '/iq-dash/mazes';
    case 'lesson': return '/iq-dash/lessons';
    case 'reflection': return '';
  }
}

export { WEEKS_PER_CYCLE, DAYS_PER_WEEK };
