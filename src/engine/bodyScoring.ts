// Scoring engines for the Body category.
//
//  - scoreBodyIq       : positive-weight domains -> 0-100 sub-scores + 100/15 headline
//  - scoreSleepHealth  : load-weight domains -> plain-language statuses
//  - scoreHiddenAthlete: signed axes -> one of eight archetypes

import type { ScaleAnswers, ScaleStep, ScaleQuestion } from '@/data/scaleQuiz';
import { BODY_DOMAIN_LABEL, BODY_QUIZ_STEPS, type BodyDomain } from '@/data/bodyIqQuiz';
import { SLEEP_DOMAIN_LABEL, SLEEP_QUIZ_STEPS, type SleepDomain } from '@/data/sleepHealthQuiz';
import { ATHLETE_QUIZ_STEPS, type AthleteAxis } from '@/data/hiddenAthleteQuiz';

const questions = (steps: ScaleStep[]) => steps.filter((s): s is ScaleQuestion => s.kind === 'q');

function ratiosByDomain(steps: ScaleStep[], answers: ScaleAnswers) {
  const got: Record<string, number> = {};
  const max: Record<string, number> = {};
  for (const q of questions(steps)) {
    if (!q.domain) continue;
    const weights = q.options.map((o) => o.weight ?? 0);
    const best = Math.max(...weights);
    if (best <= 0) continue;
    const picked = answers[q.id];
    max[q.domain] = (max[q.domain] ?? 0) + best;
    got[q.domain] = (got[q.domain] ?? 0) + (picked == null ? 0 : (weights[picked] ?? 0));
  }
  const out: Record<string, number> = {};
  for (const k of Object.keys(max)) out[k] = max[k] > 0 ? got[k] / max[k] : 0;
  return out;
}

/* ------------------------------- Body IQ -------------------------------- */

export interface BodyIqResult {
  score: number;
  /** 0-100 per domain, higher = healthier. */
  subScores: Record<BodyDomain, number>;
  strongest: BodyDomain;
  weakest: BodyDomain;
  ordered: { domain: BodyDomain; label: string; value: number }[];
  band: 'low' | 'below' | 'typical' | 'strong' | 'exceptional';
}

const BODY_DOMAINS = Object.keys(BODY_DOMAIN_LABEL) as BodyDomain[];

export function bodyBand(score: number): BodyIqResult['band'] {
  if (score >= 130) return 'exceptional';
  if (score >= 115) return 'strong';
  if (score >= 90) return 'typical';
  if (score >= 78) return 'below';
  return 'low';
}

export function scoreBodyIq(answers: ScaleAnswers): BodyIqResult {
  const ratios = ratiosByDomain(BODY_QUIZ_STEPS, answers);
  const subScores = {} as Record<BodyDomain, number>;
  for (const d of BODY_DOMAINS) subScores[d] = Math.round((ratios[d] ?? 0) * 100);

  // Domain weighting: movement and recovery carry the most signal.
  const W: Record<BodyDomain, number> = {
    movement: 0.22, recovery: 0.2, energy: 0.16, nutrition: 0.16,
    resilience: 0.12, load: 0.08, vitals: 0.06,
  };
  const weighted = BODY_DOMAINS.reduce((sum, d) => sum + (ratios[d] ?? 0) * W[d], 0);

  // Population anchoring: a 0.58 ratio sits at the middle of the range.
  const z = (weighted - 0.58) / 0.19;
  const score = Math.max(60, Math.min(145, Math.round(100 + 15 * z)));

  const ordered = BODY_DOMAINS
    .map((d) => ({ domain: d, label: BODY_DOMAIN_LABEL[d], value: subScores[d] }))
    .sort((a, b) => b.value - a.value);

  return {
    score,
    subScores,
    ordered,
    strongest: ordered[0].domain,
    weakest: ordered[ordered.length - 1].domain,
    band: bodyBand(score),
  };
}

/* ----------------------------- Sleep Health ----------------------------- */

export type SleepStatus = 'solid' | 'watch' | 'strained' | 'urgent';

export const SLEEP_STATUS_LABEL: Record<SleepStatus, string> = {
  solid: 'Working well',
  watch: 'Worth watching',
  strained: 'Under strain',
  urgent: 'Needs attention',
};

export interface SleepHealthResult {
  domains: { domain: SleepDomain; label: string; load: number; status: SleepStatus }[];
  flags: SleepDomain[];
  strongest: SleepDomain;
  weakest: SleepDomain;
  overall: 'settled' | 'mixed' | 'disrupted';
  /** Set when the snoring/pauses answer warrants a conversation with a clinician. */
  breathingFlag: boolean;
}

const SLEEP_DOMAINS = Object.keys(SLEEP_DOMAIN_LABEL) as SleepDomain[];

function sleepStatus(load: number): SleepStatus {
  if (load < 0.25) return 'solid';
  if (load < 0.45) return 'watch';
  if (load < 0.68) return 'strained';
  return 'urgent';
}

export function scoreSleepHealth(answers: ScaleAnswers): SleepHealthResult {
  const ratios = ratiosByDomain(SLEEP_QUIZ_STEPS, answers);
  const domains = SLEEP_DOMAINS.map((d) => {
    const load = ratios[d] ?? 0;
    return { domain: d, label: SLEEP_DOMAIN_LABEL[d], load, status: sleepStatus(load) };
  }).sort((a, b) => b.load - a.load);

  const flags = domains.filter((d) => d.status === 'strained' || d.status === 'urgent').map((d) => d.domain);
  const avg = domains.reduce((s, d) => s + d.load, 0) / domains.length;
  const overall = avg < 0.28 ? 'settled' : avg < 0.5 ? 'mixed' : 'disrupted';

  const breathing = answers[11];
  return {
    domains,
    flags,
    weakest: domains[0].domain,
    strongest: domains[domains.length - 1].domain,
    overall,
    breathingFlag: breathing === 2 || breathing === 3,
  };
}

/* ---------------------------- Hidden Athlete ---------------------------- */

export type AthleteArchetypeKey =
  | 'metronome' | 'wanderer' | 'technician' | 'rhythm'
  | 'foundation' | 'workhorse' | 'engineer' | 'spark';

export interface AthleteArchetype {
  key: AthleteArchetypeKey;
  name: string;
  tagline: string;
  /** How this body prefers to work. */
  summary: string;
  trainsBestWith: string[];
  breaksDownWhen: string[];
}

export const ATHLETE_ARCHETYPES: Record<AthleteArchetypeKey, AthleteArchetype> = {
  metronome: {
    key: 'metronome', name: 'The Metronome',
    tagline: 'Long, steady, and repeatable',
    summary: 'Your body rewards accumulation. You hold a pace others fade from, and you get stronger from turning up rather than from any single hard day. Given a plan and enough weeks, you compound.',
    trainsBestWith: ['Steady sessions you could extend by ten minutes', 'The same week repeated with small increases', 'One clear number to grow — minutes, distance, or total load'],
    breaksDownWhen: ['Everything becomes hard and nothing stays easy', 'The plan changes before a block finishes', 'Progress is judged weekly instead of monthly'],
  },
  wanderer: {
    key: 'wanderer', name: 'The Wanderer',
    tagline: 'Endless, but on your own terms',
    summary: 'You have real staying power and no appetite for being told how to use it. Long and open-ended suits you; prescribed and precise does not. Your consistency comes from enjoyment, not obligation.',
    trainsBestWith: ['Open-ended sessions with no target', 'New routes, new places, new activities', 'A weekly total to hit however you like'],
    breaksDownWhen: ['A rigid plan turns movement into admin', 'Every session has a number attached', 'The variety disappears'],
  },
  technician: {
    key: 'technician', name: 'The Interval Technician',
    tagline: 'Precise work, clean recovery',
    summary: 'You do your best work in defined pieces with defined rest. Structure is not a constraint for you, it is the thing that lets you go hard safely. You improve fastest when the session has edges.',
    trainsBestWith: ['Repeats with fixed work and rest', 'Sessions that end on time, not on feel', 'Measured progression week to week'],
    breaksDownWhen: ['Sessions blur into unbroken slogs', 'Rest gets cut to save time', 'Hard days stack without an easy one between'],
  },
  rhythm: {
    key: 'rhythm', name: 'The Rhythm Chaser',
    tagline: 'Sharp bursts, driven by feel',
    summary: 'You have a fast, responsive body that likes short, vivid effort and reads its own state well. You do not need a spreadsheet; you need something to react to. Given that, you show up.',
    trainsBestWith: ['Short sessions with a clear finish', 'Games, sprints, and anything with a reaction in it', 'Choosing the session on the day from a small menu'],
    breaksDownWhen: ['Long steady work becomes the whole diet', 'The plan removes all choice', 'Intensity runs several days in a row'],
  },
  foundation: {
    key: 'foundation', name: 'The Foundation Builder',
    tagline: 'Strength, built patiently',
    summary: 'Your body responds to load more than to duration, and to patience more than to peaks. You are not fragile — you are slow-adapting and durable, which is a long-term advantage almost nobody uses properly.',
    trainsBestWith: ['Two or three strength sessions with real rest', 'Slow, boring progression on a handful of movements', 'Easy aerobic work on the days between'],
    breaksDownWhen: ['Volume rises faster than recovery', 'Every session becomes a test', 'Strength work gets replaced by cardio for speed of results'],
  },
  workhorse: {
    key: 'workhorse', name: 'The Workhorse',
    tagline: 'High capacity, low ceremony',
    summary: 'You can absorb more work than most people and you do not need it packaged. The risk is not laziness — it is that you keep going past the point where the work stops paying, because you can.',
    trainsBestWith: ['Frequent moderate sessions rather than a few brutal ones', 'A hard cap on how much you do in a week', 'One genuinely easy day you are not allowed to upgrade'],
    breaksDownWhen: ['Nothing forces a deload', 'Soreness is treated as feedback to push harder', 'Sleep goes down while volume goes up'],
  },
  engineer: {
    key: 'engineer', name: 'The Power Engineer',
    tagline: 'Output, measured',
    summary: 'You are built for concentrated output and you like knowing the number. Short and heavy suits you, and you get more from precision than from adding hours. Your weak point is the aerobic base you keep skipping.',
    trainsBestWith: ['Heavy, low-rep work with long rests', 'Tracked numbers you can beat', 'One dull easy session a week that protects the rest'],
    breaksDownWhen: ['Rest is shortened to make sessions feel harder', 'Aerobic work is dropped entirely', 'Every week is a personal-best attempt'],
  },
  spark: {
    key: 'spark', name: 'The Spark',
    tagline: 'Fast, instinctive, all at once',
    summary: 'You have obvious natural output and an instinctive way of using it. You get fit quickly and lose it quickly, because your training follows enthusiasm rather than a curve. Consistency, not effort, is your lever.',
    trainsBestWith: ['Very short sessions you will actually repeat', 'A minimum weekly floor instead of a target', 'Skill-based activity that hides the repetition'],
    breaksDownWhen: ['A big burst of motivation sets an unsustainable baseline', 'Rest days only happen after something breaks', 'The first flat week is treated as failure'],
  },
};

export interface HiddenAthleteResult {
  archetype: AthleteArchetype;
  axes: Record<AthleteAxis, number>;
  /** -1..1 per axis, for the report's dial visuals. */
  normalized: Record<AthleteAxis, number>;
  secondary: AthleteArchetype;
}

const AXES: AthleteAxis[] = ['endurance', 'volume', 'structure'];

function archetypeFor(sign: Record<AthleteAxis, boolean>): AthleteArchetypeKey {
  const { endurance: e, volume: vol, structure: s } = sign;
  if (e && vol && s) return 'metronome';
  if (e && vol && !s) return 'wanderer';
  if (e && !vol && s) return 'technician';
  if (e && !vol && !s) return 'rhythm';
  if (!e && vol && s) return 'foundation';
  if (!e && vol && !s) return 'workhorse';
  if (!e && !vol && s) return 'engineer';
  return 'spark';
}

export function scoreHiddenAthlete(answers: ScaleAnswers): HiddenAthleteResult {
  const axes: Record<AthleteAxis, number> = { endurance: 0, volume: 0, structure: 0 };
  const maxima: Record<AthleteAxis, number> = { endurance: 0, volume: 0, structure: 0 };

  for (const q of questions(ATHLETE_QUIZ_STEPS)) {
    if (q.domain !== 'axis') continue;
    for (const a of AXES) {
      const best = Math.max(0, ...q.options.map((o) => Math.abs(o.vector?.[a] ?? 0)));
      maxima[a] += best;
    }
    const picked = answers[q.id];
    if (picked == null) continue;
    const vec = q.options[picked]?.vector;
    if (!vec) continue;
    for (const a of AXES) axes[a] += vec[a] ?? 0;
  }

  const normalized = {} as Record<AthleteAxis, number>;
  for (const a of AXES) {
    normalized[a] = maxima[a] > 0 ? Math.max(-1, Math.min(1, axes[a] / maxima[a])) : 0;
  }

  const sign = {
    endurance: normalized.endurance >= 0,
    volume: normalized.volume >= 0,
    structure: normalized.structure >= 0,
  };
  const key = archetypeFor(sign);

  // Secondary: flip the axis closest to the middle.
  const weakest = [...AXES].sort((a, b) => Math.abs(normalized[a]) - Math.abs(normalized[b]))[0];
  const flipped = { ...sign, [weakest]: !sign[weakest] };
  const secondaryKey = archetypeFor(flipped);

  return {
    archetype: ATHLETE_ARCHETYPES[key],
    secondary: ATHLETE_ARCHETYPES[secondaryKey === key ? 'spark' : secondaryKey],
    axes,
    normalized,
  };
}
