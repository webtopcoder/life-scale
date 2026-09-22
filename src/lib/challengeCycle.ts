// Shared cycle + weekly math for the 90-day dashboards.
// Every branch runs a 90-day plan. On day 91 a new cycle starts and the
// content reshuffles (deterministic per user + cycle).

export const CYCLE_LENGTH = 90;
export const DAYS_PER_WEEK = 7;
export const WEEKS_PER_CYCLE = Math.ceil(CYCLE_LENGTH / DAYS_PER_WEEK); // 13

// ---- Deterministic PRNG (mulberry32) ----
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Date helpers ----
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localMidnight(d: Date): Date {
  const c = new Date(d.getTime());
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Absolute day since startIso (1-based). Never mutates the input. */
export function absoluteDayFor(startIso: string | null | undefined, now: Date = new Date()): number {
  if (!startIso) return 1;
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return 1;
  const ms = localMidnight(now).getTime() - localMidnight(start).getTime();
  const d = Math.floor(ms / 86400000) + 1;
  return Math.max(1, d);
}

export interface CyclePosition {
  cycleNumber: number;  // 1-based
  cycleDay: number;     // 1..90
  weekNumber: number;   // 1..13 within the cycle
  dayOfWeek: number;    // 1..7 within the current week
  cycleStartIso: string;  // ISO of local-midnight of this cycle's day 1
}

/** Compute the user's current cycle position. */
export function cyclePosition(startIso: string | null | undefined, now: Date = new Date()): CyclePosition {
  const abs = absoluteDayFor(startIso, now);
  const cycleNumber = Math.floor((abs - 1) / CYCLE_LENGTH) + 1;
  const cycleDay = ((abs - 1) % CYCLE_LENGTH) + 1;
  const weekNumber = Math.floor((cycleDay - 1) / DAYS_PER_WEEK) + 1;
  const dayOfWeek = ((cycleDay - 1) % DAYS_PER_WEEK) + 1;

  // cycleStart = start + (cycleNumber - 1) * 90 days, at local midnight
  const start = startIso ? localMidnight(new Date(startIso)) : localMidnight(now);
  const cycleStart = new Date(start.getTime() + (cycleNumber - 1) * CYCLE_LENGTH * 86400000);
  return {
    cycleNumber,
    cycleDay,
    weekNumber,
    dayOfWeek,
    cycleStartIso: cycleStart.toISOString(),
  };
}

/** yyyy-mm-dd for the Nth day (1-based) of the given cycle start. */
export function cycleDayDateKey(cycleStartIso: string, cycleDay: number): string {
  const s = localMidnight(new Date(cycleStartIso));
  return dateKey(new Date(s.getTime() + (cycleDay - 1) * 86400000));
}

/** Which week (1..13) does a given cycleDay (1..90) belong to. */
export function weekOfCycleDay(cycleDay: number): number {
  return Math.floor((cycleDay - 1) / DAYS_PER_WEEK) + 1;
}

/** Range [firstDay, lastDay] of cycle days that belong to `weekNumber`. */
export function daysInWeek(weekNumber: number): { first: number; last: number } {
  const first = (weekNumber - 1) * DAYS_PER_WEEK + 1;
  const last = Math.min(weekNumber * DAYS_PER_WEEK, CYCLE_LENGTH);
  return { first, last };
}

/** Milestone banner: user just crossed into a new cycle (cycleDay 1, cycle > 1). */
export function isCycleRollover(pos: CyclePosition): boolean {
  return pos.cycleNumber > 1 && pos.cycleDay === 1;
}
