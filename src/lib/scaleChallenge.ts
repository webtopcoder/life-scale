// Generic 90-day guided challenge used by the Body category dashboards.
// Three phases (Foundations / Build / Mastery), deterministic per user + cycle,
// personalised by the priority areas each scale's result surfaced.

import {
  CYCLE_LENGTH, cyclePosition, cycleDayDateKey, hashSeed, mulberry32,
  daysInWeek, type CyclePosition,
} from '@/lib/challengeCycle';
import type { ScaleKey } from '@/config/scales';

export type Phase = 'Foundations' | 'Build' | 'Mastery';

export interface ScaleTask {
  key: string;
  label: string;
  /** One line on the card. */
  blurb: string;
  /** What to actually do, shown when the task is opened. */
  howTo: string[];
  /** Areas this task serves, matched against the user's priority areas. */
  areas: string[];
  /** Phases this task is available in. */
  phases: Phase[];
  xp: number;
}

export interface DayPlan {
  day: number;
  phase: Phase;
  isRest: boolean;
  isMilestone: boolean;
  tasks: ScaleTask[];
}

export const CHALLENGE_LENGTH = CYCLE_LENGTH;

export function phaseOf(day: number): Phase {
  if (day <= 30) return 'Foundations';
  if (day <= 60) return 'Build';
  return 'Mastery';
}

export const PHASE_BLURB: Record<Phase, string> = {
  Foundations: 'Make the basics automatic. Small, repeatable, hard to skip.',
  Build: 'Add load and precision now that the habit holds.',
  Mastery: 'Hold the standard without thinking about it, and stress-test it.',
};

/* ------------------------------ Task catalogs ----------------------------- */

const BODY_TASKS: ScaleTask[] = [
  {
    key: 'body_walk', label: 'Movement snack', xp: 10, areas: ['movement', 'energy'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Ten minutes of unbroken walking, at a pace you could hold a conversation at.',
    howTo: ['Set a timer for ten minutes.', 'Walk without stopping — pace you could talk at.', 'No phone in your hand if you can manage it.'],
  },
  {
    key: 'body_strength', label: 'Strength set', xp: 15, areas: ['movement'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Three sets of a squat, a push, and a carry. No equipment needed.',
    howTo: ['Squat: 8–12 reps, slow down, controlled up.', 'Push: press-ups on the floor or against a wall, same rep range.', 'Carry: hold something heavy and walk 30 seconds each side.'],
  },
  {
    key: 'body_hydrate', label: 'Hydration check', xp: 5, areas: ['nutrition', 'energy'],
    phases: ['Foundations', 'Build'],
    blurb: 'A full glass of water before your first coffee, and one with each meal.',
    howTo: ['Water before caffeine, every time.', 'One glass with each meal.', 'Log whether it changed your afternoon.'],
  },
  {
    key: 'body_plate', label: 'Plate build', xp: 10, areas: ['nutrition'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Build one meal today around protein and vegetables first, everything else after.',
    howTo: ['Choose the protein first.', 'Fill half the plate with vegetables or fruit.', 'Add the carbohydrate last, and eat it last too.'],
  },
  {
    key: 'body_sleep_anchor', label: 'Sleep anchor', xp: 10, areas: ['recovery'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Same wake time as yesterday, within fifteen minutes.',
    howTo: ['Set the alarm for the same time as yesterday.', 'Get up on the first alarm.', 'Get outside light within an hour.'],
  },
  {
    key: 'body_mobility', label: 'Mobility five', xp: 10, areas: ['recovery', 'resilience'],
    phases: ['Build', 'Mastery'],
    blurb: 'Five minutes on the joints that complain most.',
    howTo: ['Pick the two areas that ache: hips, shoulders, back, ankles.', 'Move each slowly through its range for two minutes.', 'Stop short of pain, every time.'],
  },
  {
    key: 'body_log', label: 'Log the number', xp: 5, areas: ['vitals', 'energy'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Record one number: energy out of ten, steps, sleep hours, or weight.',
    howTo: ['Pick one number and keep it the same all cycle.', 'Log it at the same time of day.', 'Do not judge it — collect it.'],
  },
  {
    key: 'body_load_break', label: 'Load break', xp: 5, areas: ['load'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Two minutes of nothing, halfway through the day, before you feel you need it.',
    howTo: ['Set a reminder for midday.', 'Stand up, breathe slowly for two minutes.', 'No screen for those two minutes.'],
  },
  {
    key: 'body_intervals', label: 'Hard minutes', xp: 20, areas: ['movement', 'resilience'],
    phases: ['Build', 'Mastery'],
    blurb: 'Six rounds of one hard minute, one easy minute. Hills, stairs, or a bike.',
    howTo: ['Warm up for five easy minutes.', 'One minute hard, one minute easy, six times.', 'Finish able to speak in sentences.'],
  },
  {
    key: 'body_lesson', label: 'Two-minute lesson', xp: 5, areas: ['vitals', 'resilience'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'One short read on why the area you flagged actually matters.',
    howTo: ['Read the lesson attached to your weakest area.', 'Write down the one line you want to remember.', 'Apply it once today.'],
  },
  {
    key: 'body_review', label: 'Weekly review', xp: 15, areas: ['load', 'energy'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Three lines: what held, what slipped, what changes next week.',
    howTo: ['What held this week?', 'What slipped, and what caused it?', 'One change for next week. One only.'],
  },
];

const SLEEP_TASKS: ScaleTask[] = [
  {
    key: 'sleep_wake_anchor', label: 'Fixed wake time', xp: 10, areas: ['rhythm', 'duration'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Up at the same time as yesterday, weekend included.',
    howTo: ['One alarm, same time.', 'Feet on the floor on the first alarm.', 'Daylight within an hour, even through a window.'],
  },
  {
    key: 'sleep_wind_down', label: 'Wind-down hour', xp: 15, areas: ['environment', 'latency'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'The last hour gets dimmer, slower, and screen-free where you can manage it.',
    howTo: ['Drop the lights an hour before bed.', 'Nothing that needs a decision or a reply.', 'Same three actions in the same order, every night.'],
  },
  {
    key: 'sleep_caffeine_cut', label: 'Caffeine cut-off', xp: 10, areas: ['stimulants'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Last caffeine before 2pm today.',
    howTo: ['Set a hard cut-off at 2pm.', 'Swap the late one for water or something without caffeine.', 'Note tonight how long it took to fall asleep.'],
  },
  {
    key: 'sleep_room_fix', label: 'Room fix', xp: 10, areas: ['environment'],
    phases: ['Foundations', 'Build'],
    blurb: 'One change to darkness, noise, or temperature — and keep it.',
    howTo: ['Pick the loudest problem: light, noise, or heat.', 'Make one physical change tonight.', 'Keep it for a week before judging it.'],
  },
  {
    key: 'sleep_log', label: 'Sleep log', xp: 5, areas: ['duration', 'daytime'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Time in bed, time asleep, and how you felt out of ten.',
    howTo: ['Log it within ten minutes of waking.', 'Guess the numbers, do not measure them.', 'Look for the pattern weekly, not daily.'],
  },
  {
    key: 'sleep_bed_rule', label: 'The 20-minute rule', xp: 15, areas: ['latency', 'continuity'],
    phases: ['Build', 'Mastery'],
    blurb: 'Awake for twenty minutes? Get up, low light, come back when sleepy.',
    howTo: ['No clock-watching — estimate.', 'Get out of bed, sit somewhere dim, no screen.', 'Return only when your eyes are heavy.'],
  },
  {
    key: 'sleep_light', label: 'Morning light', xp: 10, areas: ['rhythm', 'daytime'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Ten minutes of outdoor light within an hour of waking.',
    howTo: ['Outside, not through glass, if possible.', 'Ten minutes is enough. No sunglasses.', 'Pair it with something you already do.'],
  },
  {
    key: 'sleep_alcohol', label: 'Dry night', xp: 10, areas: ['stimulants', 'continuity'],
    phases: ['Build', 'Mastery'],
    blurb: 'No alcohol tonight, then check what your night did differently.',
    howTo: ['Decide before the evening starts.', 'Have the replacement drink ready.', 'Log your wake-ups and compare.'],
  },
  {
    key: 'sleep_worry_park', label: 'Park the head', xp: 10, areas: ['latency'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Five minutes, on paper, before the wind-down starts.',
    howTo: ['Write tomorrow\'s three things down.', 'Write anything unresolved next to them.', 'Close the notebook. That is the signal.'],
  },
  {
    key: 'sleep_day_check', label: 'Daytime check', xp: 5, areas: ['daytime'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Rate your afternoon energy out of ten and note what the night looked like.',
    howTo: ['Score the afternoon, not the morning.', 'Note last night\'s length beside it.', 'Two weeks of this shows you the link.'],
  },
  {
    key: 'sleep_review', label: 'Weekly review', xp: 15, areas: ['rhythm', 'duration'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Look at the week: which nights worked, and what they had in common.',
    howTo: ['Find your best two nights.', 'Write what they shared.', 'Repeat that one thing deliberately next week.'],
  },
];

const ATHLETE_TASKS: ScaleTask[] = [
  {
    key: 'ha_easy_base', label: 'Easy base session', xp: 10, areas: ['endurance'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Twenty to forty minutes at a pace you could hold all day.',
    howTo: ['Nose-breathing pace, or able to talk in full sentences.', 'Finish feeling you could do it again.', 'Do not race it. That is the whole point.'],
  },
  {
    key: 'ha_strength_base', label: 'Strength base', xp: 15, areas: ['power'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Three movements, three sets, real rest between them.',
    howTo: ['One push, one pull, one leg movement.', 'Three sets of 5–8, leaving two reps in reserve.', 'Two minutes rest. Actually two minutes.'],
  },
  {
    key: 'ha_intervals', label: 'Defined intervals', xp: 20, areas: ['power', 'intensity'],
    phases: ['Build', 'Mastery'],
    blurb: 'Work and rest with edges — hard, rest, repeat, then stop on time.',
    howTo: ['Warm up properly first.', 'Six rounds: 40 seconds hard, 80 seconds easy.', 'Stop when the plan says, not when you are empty.'],
  },
  {
    key: 'ha_skill', label: 'Skill block', xp: 10, areas: ['skill'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Fifteen minutes on one movement you want to own.',
    howTo: ['Pick one movement and stay with it all cycle.', 'Quality over quantity — stop when form drops.', 'Film one set every couple of weeks.'],
  },
  {
    key: 'ha_recovery', label: 'Recovery day, on purpose', xp: 5, areas: ['recovery'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Easy movement only. This one counts as much as the hard days.',
    howTo: ['Walk, stretch, or nothing at all.', 'No upgrading it into a session.', 'Note how tomorrow feels because of it.'],
  },
  {
    key: 'ha_capacity', label: 'Capacity builder', xp: 20, areas: ['volume'],
    phases: ['Build', 'Mastery'],
    blurb: 'Add ten percent to your longest effort of the week — no more.',
    howTo: ['Take last week\'s longest session.', 'Add ten percent of the time, not the intensity.', 'If it hurt to finish, do not add anything next week.'],
  },
  {
    key: 'ha_readiness', label: 'Readiness check', xp: 5, areas: ['recovery', 'structure'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Score sleep, soreness, and appetite out of ten before you train.',
    howTo: ['Three scores, ten seconds.', 'Under 15 total: do the easy version.', 'Over 24: this is the day to push.'],
  },
  {
    key: 'ha_fuel', label: 'Fuel the session', xp: 5, areas: ['recovery'],
    phases: ['Foundations', 'Build'],
    blurb: 'Something with protein within an hour of finishing.',
    howTo: ['Have it decided before you train.', 'Protein plus a carbohydrate.', 'Water alongside it, not instead of it.'],
  },
  {
    key: 'ha_test', label: 'Benchmark', xp: 20, areas: ['structure', 'intensity'],
    phases: ['Build', 'Mastery'],
    blurb: 'Repeat the same test you did last month and compare it honestly.',
    howTo: ['Same test, same conditions, same warm-up.', 'Record the number.', 'No changes to the plan on one bad test.'],
  },
  {
    key: 'ha_review', label: 'Weekly review', xp: 15, areas: ['structure'],
    phases: ['Foundations', 'Build', 'Mastery'],
    blurb: 'Sessions done, sessions missed, and the reason for each miss.',
    howTo: ['Count what you actually did.', 'Write the real reason for each miss.', 'Fix the reason, not the plan.'],
  },
];

export const TASK_CATALOG: Partial<Record<ScaleKey, ScaleTask[]>> = {
  body: BODY_TASKS,
  'sleep-health': SLEEP_TASKS,
  'hidden-athlete': ATHLETE_TASKS,
};

export function tasksFor(scale: ScaleKey): ScaleTask[] {
  return TASK_CATALOG[scale] ?? [];
}

export function findTask(scale: ScaleKey, key: string): ScaleTask | null {
  return tasksFor(scale).find((t) => t.key === key) ?? null;
}

/* ------------------------------ Plan building ----------------------------- */

function pickCount(rand: () => number): number {
  const r = rand();
  if (r < 0.12) return 0;
  if (r < 0.30) return 1;
  if (r < 0.75) return 2;
  return 3;
}

/**
 * Deterministic 90-day plan. Tasks are biased toward the user's priority areas
 * so the plan targets what their result actually surfaced.
 */
export function buildScalePlan(
  scale: ScaleKey,
  userId: string,
  priorityAreas: string[] = [],
  cycleNumber = 1,
): DayPlan[] {
  const catalog = tasksFor(scale);
  const areaKey = priorityAreas.slice(0, 3).join(',');
  const base = hashSeed(`${scale}::${userId || 'anon'}::${cycleNumber}::${areaKey}`);
  const plans: DayPlan[] = [];

  for (let day = 1; day <= CYCLE_LENGTH; day++) {
    const rand = mulberry32(base ^ (day * 0x9e3779b1));
    const phase = phaseOf(day);
    const available = catalog.filter((t) => t.phases.includes(phase));
    const pool: ScaleTask[] = [...available];
    // Weight toward priority areas.
    for (const area of priorityAreas.slice(0, 3)) {
      for (const t of available) if (t.areas.includes(area)) pool.push(t, t);
    }

    const count = day % 7 === 0 ? Math.min(1, pickCount(rand)) : pickCount(rand);
    const chosen: ScaleTask[] = [];
    let guard = 0;
    while (chosen.length < count && guard++ < 40 && pool.length > 0) {
      const t = pool[Math.floor(rand() * pool.length)];
      if (!chosen.some((c) => c.key === t.key)) chosen.push(t);
    }

    plans.push({
      day,
      phase,
      isRest: chosen.length === 0,
      isMilestone: day % 10 === 0,
      tasks: chosen,
    });
  }
  return plans;
}

/* ------------------------------- Completion ------------------------------- */

const DONE_PREFIX = 'iqscale.scaletask.';

function doneKey(scale: ScaleKey, dateStr: string, taskKey: string) {
  return `${DONE_PREFIX}${scale}.${dateStr}.${taskKey}`;
}

export function isTaskDone(scale: ScaleKey, dateStr: string, taskKey: string): boolean {
  try { return localStorage.getItem(doneKey(scale, dateStr, taskKey)) === '1'; } catch { return false; }
}
export function markTaskDone(scale: ScaleKey, dateStr: string, taskKey: string) {
  try { localStorage.setItem(doneKey(scale, dateStr, taskKey), '1'); } catch { /* noop */ }
}

export interface ChallengeSummary {
  position: CyclePosition;
  today: DayPlan;
  /** Percentage of tasks completed across days up to and including today. */
  percentComplete: number;
  tasksDone: number;
  tasksTotal: number;
  /** Consecutive days (up to today) with every task done. */
  streak: number;
  phase: Phase;
  weekRange: { first: number; last: number };
}

export function summarizeScaleChallenge(
  scale: ScaleKey,
  plan: DayPlan[],
  startIso: string | null | undefined,
  now: Date = new Date(),
): ChallengeSummary {
  const position = cyclePosition(startIso, now);
  const today = plan[position.cycleDay - 1] ?? plan[0];

  let done = 0;
  let total = 0;
  for (let d = 1; d <= position.cycleDay; d++) {
    const day = plan[d - 1];
    if (!day) continue;
    const dateStr = cycleDayDateKey(position.cycleStartIso, d);
    for (const t of day.tasks) {
      total++;
      if (isTaskDone(scale, dateStr, t.key)) done++;
    }
  }

  let streak = 0;
  for (let d = position.cycleDay; d >= 1; d--) {
    const day = plan[d - 1];
    if (!day) break;
    const dateStr = cycleDayDateKey(position.cycleStartIso, d);
    const complete = day.tasks.length === 0 || day.tasks.every((t) => isTaskDone(scale, dateStr, t.key));
    if (!complete) break;
    streak++;
  }

  return {
    position,
    today,
    percentComplete: total === 0 ? 0 : Math.round((done / total) * 100),
    tasksDone: done,
    tasksTotal: total,
    streak,
    phase: phaseOf(position.cycleDay),
    weekRange: daysInWeek(position.weekNumber),
  };
}

export { cycleDayDateKey };
