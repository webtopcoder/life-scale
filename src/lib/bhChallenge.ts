// 90-day Brain Health challenge. Cycle-aware; reshuffles every 90 days.
// Personalized by the user's Q29 answer (5 focus profiles).

import {
  CYCLE_LENGTH, hashSeed, mulberry32, dateKey, cyclePosition, cycleDayDateKey,
  daysInWeek, type CyclePosition,
} from '@/lib/challengeCycle';

export type BhTaskType =
  | 'habit_stack' | 'metric_logger' | 'movement_snack'
  | 'cognitive_drill' | 'focus_practice' | 'lesson'
  | 'reflection' | 'doctor_prompt';

export type BhFocusProfile = 'top3' | 'four_week' | 'metrics' | 'memory_focus' | 'doctor';

export interface BhDayPlan {
  day: number;
  phase: 'Foundations' | 'Build' | 'Mastery';
  isRest: boolean;
  isMilestone: boolean;
  tasks: BhTaskType[];
}

export const BH_CHALLENGE_LENGTH = CYCLE_LENGTH;

export function focusProfileFromQ29(optIdx: number | null | undefined): BhFocusProfile {
  switch (optIdx) {
    case 0: return 'top3';
    case 1: return 'four_week';
    case 2: return 'metrics';
    case 3: return 'memory_focus';
    case 4: return 'doctor';
    default: return 'top3';
  }
}

export const BH_FOCUS_LABEL: Record<BhFocusProfile, string> = {
  top3: 'Focus on your top 3 areas',
  four_week: 'A clear 4-week plan',
  metrics: 'Track sleep, movement, and heart',
  memory_focus: 'Small memory & focus practices',
  doctor: 'Ideas to bring up with your doctor',
};

function pickCount(rand: () => number): number {
  const r = rand();
  if (r < 0.15) return 0;
  if (r < 0.25) return 1;
  if (r < 0.70) return 2;
  if (r < 0.90) return 3;
  return 4;
}
function phaseOf(day: number): BhDayPlan['phase'] {
  if (day <= 30) return 'Foundations';
  if (day <= 60) return 'Build';
  return 'Mastery';
}

// Per-domain task affinities. Used to bias task selection toward the user's
// top-3 flagged areas from the check-in.
const DOMAIN_TASK_BIAS: Record<string, BhTaskType[]> = {
  cognitive: ['cognitive_drill', 'focus_practice', 'lesson'],
  vascular: ['metric_logger', 'movement_snack', 'doctor_prompt'],
  sleep: ['metric_logger', 'habit_stack', 'reflection'],
  movement: ['movement_snack', 'habit_stack'],
  sensory: ['doctor_prompt', 'metric_logger', 'lesson'],
  mood: ['reflection', 'habit_stack', 'focus_practice'],
  reserve: ['lesson', 'cognitive_drill', 'reflection'],
};

function typePool(
  phase: BhDayPlan['phase'],
  focus: BhFocusProfile,
  topDomains: string[] = [],
): BhTaskType[] {
  const base: Record<BhDayPlan['phase'], BhTaskType[]> = {
    Foundations: ['habit_stack','habit_stack','metric_logger','lesson','lesson','movement_snack','reflection'],
    Build: ['habit_stack','metric_logger','cognitive_drill','cognitive_drill','focus_practice','movement_snack','lesson','reflection'],
    Mastery: ['metric_logger','cognitive_drill','cognitive_drill','focus_practice','focus_practice','movement_snack','lesson','reflection'],
  };
  const pool = [...base[phase]];
  switch (focus) {
    case 'top3': pool.push('lesson','reflection','habit_stack'); break;
    case 'four_week':
      if (phase === 'Foundations') pool.push('habit_stack','habit_stack','lesson','lesson');
      else pool.push('habit_stack','lesson');
      break;
    case 'metrics': pool.push('metric_logger','metric_logger','metric_logger','movement_snack'); break;
    case 'memory_focus': pool.push('cognitive_drill','cognitive_drill','focus_practice','focus_practice'); break;
    case 'doctor': pool.push('lesson','reflection','habit_stack'); break;
  }
  // Weight the pool toward the user's top-3 flagged domains so the plan
  // targets what the check-in actually flagged.
  for (const d of topDomains.slice(0, 3)) {
    const bias = DOMAIN_TASK_BIAS[d];
    if (bias) pool.push(...bias);
  }
  return pool;
}
function pickType(rand: () => number, pool: BhTaskType[]): BhTaskType {
  return pool[Math.floor(rand() * pool.length)];
}

export function buildBhPlan(
  userId: string,
  focus: BhFocusProfile,
  cycleNumber: number = 1,
  topDomains: string[] = [],
): BhDayPlan[] {
  const domainKey = topDomains.slice(0, 3).join(',');
  const baseSeed = hashSeed(`bh-challenge::${focus}::${userId || 'anon'}::cycle::${cycleNumber}::top::${domainKey}`);
  const plans: BhDayPlan[] = [];
  let prevPush = false;
  for (let day = 1; day <= CYCLE_LENGTH; day++) {
    const rand = mulberry32(baseSeed ^ (day * 0x9E3779B1));
    const phase = phaseOf(day);
    const isMilestone = day % 10 === 0;
    const isDoctorWeek = focus === 'doctor' && (day % 7 === 0);
    let count = pickCount(rand);
    if (count === 4 && prevPush) count = 3;
    if (isMilestone) {
      const c = Math.max(count, 2);
      const tasks: BhTaskType[] = ['reflection', 'lesson'];
      if (focus === 'doctor') tasks.push('doctor_prompt');
      const pool = typePool(phase, focus, topDomains);
      for (let i = tasks.length; i < c; i++) tasks.push(pickType(rand, pool));
      plans.push({ day, phase, isRest: false, isMilestone: true, tasks });
      prevPush = tasks.length >= 4;
      continue;
    }
    if (count === 0) { plans.push({ day, phase, isRest: true, isMilestone: false, tasks: [] }); prevPush = false; continue; }
    const pool = typePool(phase, focus, topDomains);
    const tasks: BhTaskType[] = [];
    if (isDoctorWeek) tasks.push('doctor_prompt');
    for (let i = tasks.length; i < count; i++) tasks.push(pickType(rand, pool));
    plans.push({ day, phase, isRest: false, isMilestone: false, tasks });
    prevPush = count === 4;
  }
  return plans;
}

export interface BhProgressRow {
  content_type: string;
  mode?: string | null;
  completed_at?: string | null;
  status?: string | null;
}

const LSKEY = (k: string) => `iqscale.bhdash.${k}`;
function safeGet(k: string) { try { return localStorage.getItem(k) === '1'; } catch { return false; } }
function safeSet(k: string) { try { localStorage.setItem(k, '1'); } catch { /* noop */ } }

export const isBhTaskDone = (task: BhTaskType, u: string, d: number, c: number = 1) =>
  safeGet(LSKEY(`${task}.${u}::c${c}::${d}`));
export const markBhTaskDone = (task: BhTaskType, u: string, d: number, c: number = 1) =>
  safeSet(LSKEY(`${task}.${u}::c${c}::${d}`));
export const isBhRestAcked = (u: string, d: number, c: number = 1) =>
  safeGet(LSKEY(`rest.${u}::c${c}::${d}`));
export const ackBhRest = (u: string, d: number, c: number = 1) =>
  safeSet(LSKEY(`rest.${u}::c${c}::${d}`));

function toBhTaskType(row: BhProgressRow): BhTaskType | null {
  if (row.content_type === 'brain_teaser') return 'cognitive_drill';
  if (row.content_type === 'lesson') return 'lesson';
  return null;
}

const LOCAL_TASKS: BhTaskType[] = ['habit_stack','metric_logger','movement_snack','focus_practice','reflection','doctor_prompt'];

export function doneByTypeBh(
  userId: string, cycleNumber: number, plan: BhDayPlan, cycleStartIso: string, progress: BhProgressRow[],
): Partial<Record<BhTaskType, number>> {
  const done: Partial<Record<BhTaskType, number>> = {};
  if (plan.isRest) return done;
  const dKey = cycleDayDateKey(cycleStartIso, plan.day);
  const required: Partial<Record<BhTaskType, number>> = {};
  for (const t of plan.tasks) required[t] = (required[t] ?? 0) + 1;

  for (const row of progress) {
    if (row.status && row.status !== 'completed') continue;
    if (!row.completed_at) continue;
    if (dateKey(new Date(row.completed_at)) !== dKey) continue;
    const tt = toBhTaskType(row);
    if (!tt) continue;
    if ((done[tt] ?? 0) < (required[tt] ?? 0)) done[tt] = (done[tt] ?? 0) + 1;
  }
  for (const lt of LOCAL_TASKS) {
    if (required[lt] && isBhTaskDone(lt, userId, plan.day, cycleNumber)) done[lt] = required[lt];
  }
  return done;
}

export function countDoneOfTypeBh(plan: BhDayPlan, idx: number, doneByType: Partial<Record<BhTaskType, number>>): boolean {
  const t = plan.tasks[idx];
  let priorSameType = 0;
  for (let i = 0; i < idx; i++) if (plan.tasks[i] === t) priorSameType++;
  return (doneByType[t] ?? 0) > priorSameType;
}

export function completedBhTasksForDay(
  userId: string, cycleNumber: number, plan: BhDayPlan, cycleStartIso: string, progress: BhProgressRow[],
): number {
  if (plan.isRest) return 0;
  const target = plan.tasks.length;
  if (target === 0) return 0;
  const required: Partial<Record<BhTaskType, number>> = {};
  for (const t of plan.tasks) required[t] = (required[t] ?? 0) + 1;
  const done = doneByTypeBh(userId, cycleNumber, plan, cycleStartIso, progress);
  let sum = 0;
  for (const k of Object.keys(required) as BhTaskType[]) sum += Math.min(done[k] ?? 0, required[k] ?? 0);
  return Math.min(sum, target);
}

export interface BhChallengeSummary {
  pos: CyclePosition;
  plans: BhDayPlan[];
  todayPlan: BhDayPlan;
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

export function summarizeBh(
  userId: string, startIso: string, focus: BhFocusProfile, progress: BhProgressRow[], now: Date = new Date(),
): BhChallengeSummary {
  const pos = cyclePosition(startIso, now);
  const plans = buildBhPlan(userId, focus, pos.cycleNumber);
  const perDay: number[] = new Array(CYCLE_LENGTH).fill(0);
  let cycleTasksTotal = 0, cycleTasksDone = 0;
  for (const p of plans) {
    cycleTasksTotal += p.tasks.length;
    if (p.day <= pos.cycleDay) {
      const c = completedBhTasksForDay(userId, pos.cycleNumber, p, pos.cycleStartIso, progress);
      perDay[p.day - 1] = c; cycleTasksDone += c;
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

export function bhTaskLabel(t: BhTaskType): string {
  switch (t) {
    case 'habit_stack': return 'Habit Stack';
    case 'metric_logger': return 'Log a Metric';
    case 'movement_snack': return 'Movement Snack';
    case 'cognitive_drill': return 'Cognitive Drill';
    case 'focus_practice': return 'Focus Practice';
    case 'lesson': return 'Lesson';
    case 'reflection': return 'Reflection';
    case 'doctor_prompt': return 'Doctor Prompt';
  }
}
export function bhTaskBlurb(t: BhTaskType): string {
  switch (t) {
    case 'habit_stack': return 'Anchor a tiny brain-healthy habit to a routine you already do.';
    case 'metric_logger': return 'Note sleep, steps, or mood — one line is enough.';
    case 'movement_snack': return 'Take a 3–10 minute walk or stretch.';
    case 'cognitive_drill': return 'A short brain teaser to keep processing sharp.';
    case 'focus_practice': return '5 minutes of single-tasking. Phone in another room.';
    case 'lesson': return 'A quick, plain-English brain wellbeing lesson.';
    case 'reflection': return 'Two sentences on how one area felt today.';
    case 'doctor_prompt': return 'One question to bring to your next appointment.';
  }
}
export function bhTaskPath(t: BhTaskType): string {
  switch (t) {
    case 'habit_stack': return '/bh-dash/habits';
    case 'metric_logger': return '/bh-dash/daily-check';
    case 'cognitive_drill': return '/bh-dash/drills';
    case 'lesson': return '/bh-dash/lessons';
    default: return '';
  }
}
export { LOCAL_TASKS as BH_LOCAL_TASKS };
