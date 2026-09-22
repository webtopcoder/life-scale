import type { Branch } from '@/lib/testCompletions';
import { SCALES, scaleFromSlug } from '@/config/scales';
import type { AddonDoc, AddonPayload } from '@/lib/addonBuilders/types';
import {
  buildIqWeaknessReport, buildIqAnswerBreakdown, buildIqSpeedAccuracy,
  buildIqWorkFit, buildIq30DayPlanner,
} from '@/lib/addonBuilders/iq';
import {
  buildBhSleepReport, buildBhStressReport, buildBhNutritionMovement,
  buildBhDayMap, buildBh30DayPlanner,
} from '@/lib/addonBuilders/bh';
import {
  buildHgArchetypeDeepDive, buildHgStrengthsBlindSpots, buildHgCollaborationReport,
  buildHgCreativeStyleGuide, buildHg30DayPlanner,
} from '@/lib/addonBuilders/hg';
import {
  buildBodyWeakArea, buildBodyDayPlan, buildBodyStrengthStarter, buildBodyEnergyAudit,
  buildBody30DayPlanner, buildSleepFirstWeek, buildSleepNightMap, buildSleepShiftGuide,
  buildSleepDaytimeReport, buildSleep30DayPlanner, buildAthleteDeepDive,
  buildAthleteTrainingBlueprint, buildAthleteRecoveryProtocol, buildAthleteBenchmarkPack,
  buildAthlete30DayPlanner,
} from '@/lib/addonBuilders/bodyCategory';

export type AddonTier = 'standard' | 'premium';

export interface Addon {
  /** Stable key stored in user_purchases.product_key and generated_reports.report_type. */
  key: string;
  /** URL slug (unique within a branch). */
  slug: string;
  branch: Branch;
  title: string;
  tagline: string;
  /** What the buyer gets, 3 bullets. */
  includes: string[];
  /** Catalog price shown on dashboards and reports. */
  priceCents: number;
  /** Discounted one-time-offer price used by the post-checkout funnel cards. */
  offerPriceCents: number;
  tier: AddonTier;
  build: (payload: AddonPayload) => AddonDoc;
}

export const ADDONS: Addon[] = [
  /* ------------------------------- IQ ------------------------------- */
  {
    key: 'addon_iq_weakness_report', slug: 'weakness-report', branch: 'iq',
    title: 'Weakness Report',
    tagline: 'The two categories dragging your score down, explained in full.',
    includes: ['Your two lowest categories in depth', 'Why each one costs you points', 'The fixes that move them fastest'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildIqWeaknessReport,
  },
  {
    key: 'addon_iq_answer_breakdown', slug: 'answer-breakdown', branch: 'iq',
    title: 'Answer Breakdown',
    tagline: 'Every item you answered, with your answer and your time on it.',
    includes: ['Item-by-item log of your test', 'Fast misses versus slow misses', 'Which items to re-attempt first'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildIqAnswerBreakdown,
  },
  {
    key: 'addon_iq_speed_accuracy_report', slug: 'speed-accuracy', branch: 'iq',
    title: 'Speed vs Accuracy Report',
    tagline: 'Whether slowing down actually helps you — measured, not guessed.',
    includes: ['Your pacing profile', 'Accuracy at speed versus at length', 'A pacing rule built for you'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildIqSpeedAccuracy,
  },
  {
    key: 'addon_iq_study_work_fit', slug: 'work-fit', branch: 'iq',
    title: 'Study & Work Fit Report',
    tagline: 'The environments and role families your strongest pair actually suits.',
    includes: ['Your working profile from your top two categories', 'Environments and role families to explore', 'How you should learn, and what to scaffold'],
    priceCents: 500, offerPriceCents: 300, tier: 'premium', build: buildIqWorkFit,
  },
  {
    key: 'addon_iq_30day_sharpening', slug: '30-day-planner', branch: 'iq',
    title: '30-Day Sharpening Planner',
    tagline: 'A precision practice plan for the exact category pair holding you back.',
    includes: ['Daily instructions beyond the dashboard prompt', 'Weekly checkpoints tied to weak categories', 'Review days that stop repeat mistakes'],
    priceCents: 800, offerPriceCents: 500, tier: 'premium', build: buildIq30DayPlanner,
  },

  /* --------------------------- Brain Health --------------------------- */
  {
    key: 'addon_brain_sleep_recovery', slug: 'sleep-recovery', branch: 'brain-health',
    title: 'Sleep & Recovery Report',
    tagline: 'The one area that changes everything else on your check-in.',
    includes: ['Where your sleep stands, in plain language', 'The four levers that actually work', 'A first week, day by day'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildBhSleepReport,
  },
  {
    key: 'addon_brain_stress_load', slug: 'stress-load', branch: 'brain-health',
    title: 'Stress Load Report',
    tagline: 'Where your load is coming from, and how to recover between episodes.',
    includes: ['What your answers showed about load', 'Where load hides in a normal week', 'Three recovery tools and when to use them'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildBhStressReport,
  },
  {
    key: 'addon_brain_nutrition_movement', slug: 'nutrition-movement', branch: 'brain-health',
    title: 'Nutrition & Movement Report',
    tagline: 'How circulation and food show up in how clearly you think.',
    includes: ['Your movement and circulation picture', 'Eating patterns with real support behind them', 'A repeatable week you can actually keep'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildBhNutritionMovement,
  },
  {
    key: 'addon_brain_focus_energy_map', slug: 'day-map', branch: 'brain-health',
    title: 'Focus & Energy Day Map',
    tagline: 'An hour-by-hour day built around your focus and your best hours.',
    includes: ['A full day map with the reasoning', 'Your non-negotiables', 'How to adapt it to shifts or caring duties'],
    priceCents: 500, offerPriceCents: 300, tier: 'premium', build: buildBhDayMap,
  },
  {
    key: 'addon_brain_30day_habit', slug: '30-day-planner', branch: 'brain-health',
    title: '30-Day Habit Planner',
    tagline: 'A guided habit protocol for the priority area your check-in surfaced.',
    includes: ['Exact cues, fallback rules, and recovery days', 'Weekly checkpoints you can verify', 'What to change when a habit slips'],
    priceCents: 800, offerPriceCents: 500, tier: 'premium', build: buildBh30DayPlanner,
  },

  /* --------------------------- Hidden Genius --------------------------- */
  {
    key: 'addon_genius_archetype_deep_dive', slug: 'archetype-deep-dive', branch: 'hidden-genius',
    title: 'Archetype Deep Dive',
    tagline: 'Your primary archetype at full length, with your secondary underneath it.',
    includes: ['The full thesis and how it shows up', 'Where you genuinely outperform', 'The cost of the same wiring'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildHgArchetypeDeepDive,
  },
  {
    key: 'addon_genius_strengths_blind', slug: 'strengths-blind-spots', branch: 'hidden-genius',
    title: 'Strengths & Blind Spots',
    tagline: 'Your four strongest traits and three weakest, with what each one costs.',
    includes: ['Four strengths and their trade-offs', 'Three blind spots with drills', 'The one to work on first'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildHgStrengthsBlindSpots,
  },
  {
    key: 'addon_genius_collaboration', slug: 'collaboration', branch: 'hidden-genius',
    title: 'Collaboration Report',
    tagline: 'How your profile behaves inside a team, and where friction starts.',
    includes: ['Conditions for your best work', 'Where friction usually begins', 'What to tell a new manager in week one'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildHgCollaborationReport,
  },
  {
    key: 'addon_genius_creative_style', slug: 'creative-style', branch: 'hidden-genius',
    title: 'Creative Style Guide',
    tagline: 'How you generate, develop, and finish work — and where you stall.',
    includes: ['Your creative signature', 'The four stages, done your way', 'Rituals and environment checklist'],
    priceCents: 500, offerPriceCents: 300, tier: 'premium', build: buildHgCreativeStyleGuide,
  },
  {
    key: 'addon_genius_30day_practice', slug: '30-day-planner', branch: 'hidden-genius',
    title: '30-Day Practice Planner',
    tagline: 'Thirty days of deliberate practice against your default thinking pattern.',
    includes: ['Daily prompts matched to your signature', 'A weekly arc with checkpoints', 'Rules that keep it uncomfortable enough to work'],
    priceCents: 800, offerPriceCents: 500, tier: 'premium', build: buildHg30DayPlanner,
  },

  /* ------------------------------ Body IQ ------------------------------ */
  {
    key: 'addon_body_weak_area_deep_dive', slug: 'weak-area', branch: 'body',
    title: 'Weak Area Deep Dive',
    tagline: 'The one area pulling your Body IQ down, in full, with the order to fix it in.',
    includes: ['Why this area and not another', 'A four-week sequence', 'How to tell it is working'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildBodyWeakArea,
  },
  {
    key: 'addon_body_energy_audit', slug: 'energy-audit', branch: 'body',
    title: 'Energy Audit',
    tagline: 'Where your day leaks energy, traced back to the areas producing it.',
    includes: ['Your seven areas as energy sources', 'The three leaks to plug first', 'A two-week measurement plan'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildBodyEnergyAudit,
  },
  {
    key: 'addon_body_strength_starter', slug: 'strength-starter', branch: 'body',
    title: 'Strength Starter',
    tagline: 'Twelve weeks of loading built on three movements, from wherever you are now.',
    includes: ['Three movements, twelve weeks', 'Exact sets, reps, and progression', 'The rules that stop it failing'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildBodyStrengthStarter,
  },
  {
    key: 'addon_body_your_day_rebuilt', slug: 'day-plan', branch: 'body',
    title: 'Your Day, Rebuilt',
    tagline: 'An hour-by-hour day built around the areas your score flagged.',
    includes: ['A full day map with the reasoning', 'Your two non-negotiables', 'How to adapt it to shifts and travel'],
    priceCents: 500, offerPriceCents: 300, tier: 'premium', build: buildBodyDayPlan,
  },
  {
    key: 'addon_body_30day_planner', slug: '30-day-planner', branch: 'body',
    title: '30-Day Body Planner',
    tagline: 'A guided month aimed squarely at your lowest area.',
    includes: ['One addition and one rule per week', 'Checkpoints you can verify', 'What to do when a week collapses'],
    priceCents: 800, offerPriceCents: 500, tier: 'premium', build: buildBody30DayPlanner,
  },

  /* ---------------------------- Sleep Health ---------------------------- */
  {
    key: 'addon_sleep_first_week', slug: 'first-week', branch: 'sleep-health',
    title: 'Your First Week of Better Sleep',
    tagline: 'Seven nights, one change, built around your most strained area.',
    includes: ['A night-by-night plan', 'What to log each morning', 'How to read the week honestly'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildSleepFirstWeek,
  },
  {
    key: 'addon_sleep_daytime_effects', slug: 'daytime-effects', branch: 'sleep-health',
    title: 'Daytime Effects Report',
    tagline: 'What your nights are actually costing you while you are awake.',
    includes: ['Each area linked to its daytime cost', 'The symptoms people misattribute', 'A two-week evidence log'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildSleepDaytimeReport,
  },
  {
    key: 'addon_sleep_irregular_hours', slug: 'irregular-hours', branch: 'sleep-health',
    title: 'Irregular Hours Guide',
    tagline: 'Sleeping well when shifts, travel, or caring duties break the usual advice.',
    includes: ['What you can and cannot control', 'Anchoring the sequence, not the clock', 'Recovering after a run of nights'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildSleepShiftGuide,
  },
  {
    key: 'addon_sleep_your_night_mapped', slug: 'night-map', branch: 'sleep-health',
    title: 'Your Night, Mapped',
    tagline: 'Your evening hour by hour, from the last coffee to lights out.',
    includes: ['The evening in the order that matters', 'The rule for bad nights', 'What to do the day after one'],
    priceCents: 500, offerPriceCents: 300, tier: 'premium', build: buildSleepNightMap,
  },
  {
    key: 'addon_sleep_30day_planner', slug: '30-day-planner', branch: 'sleep-health',
    title: '30-Day Sleep Planner',
    tagline: 'Thirty nights, four changes, each given long enough to prove itself.',
    includes: ['One change per week with a verdict', 'What holds from the week before', 'When to involve a doctor'],
    priceCents: 800, offerPriceCents: 500, tier: 'premium', build: buildSleep30DayPlanner,
  },

  /* --------------------------- Hidden Athlete --------------------------- */
  {
    key: 'addon_athlete_archetype_deep_dive', slug: 'archetype-deep-dive', branch: 'hidden-athlete',
    title: 'Archetype Deep Dive',
    tagline: 'Your athlete archetype at full length, with your secondary underneath it.',
    includes: ['The full profile taken further', 'Where you outperform, and the cost', 'How to borrow from your secondary'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildAthleteDeepDive,
  },
  {
    key: 'addon_athlete_recovery_protocol', slug: 'recovery-protocol', branch: 'hidden-athlete',
    title: 'Recovery Protocol',
    tagline: 'A ten-second readiness score and the three levers that actually matter.',
    includes: ['Your readiness rule, with thresholds', 'The three levers worth using', 'What soreness is telling you'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildAthleteRecoveryProtocol,
  },
  {
    key: 'addon_athlete_benchmark_pack', slug: 'benchmark-pack', branch: 'hidden-athlete',
    title: 'Benchmark Pack',
    tagline: 'Four repeatable tests you can run at home, and how to read them.',
    includes: ['Four benchmarks, no equipment', 'Exact repeat conditions', 'How to read a flat month'],
    priceCents: 200, offerPriceCents: 100, tier: 'standard', build: buildAthleteBenchmarkPack,
  },
  {
    key: 'addon_athlete_training_blueprint', slug: 'training-blueprint', branch: 'hidden-athlete',
    title: 'Training Blueprint',
    tagline: 'A twelve-week week-shape written for your archetype, not a generic one.',
    includes: ['Your week, day by day, with reasons', 'Three blocks with deloads', 'The cap or floor your type needs'],
    priceCents: 500, offerPriceCents: 300, tier: 'premium', build: buildAthleteTrainingBlueprint,
  },
  {
    key: 'addon_athlete_30day_training', slug: '30-day-planner', branch: 'hidden-athlete',
    title: '30-Day Training Planner',
    tagline: 'Thirty days that prove the shape survives a normal life.',
    includes: ['One addition and one rule per week', 'A verdict at the end of each week', 'Your specific failure mode, named'],
    priceCents: 800, offerPriceCents: 500, tier: 'premium', build: buildAthlete30DayPlanner,
  },
];

export const BRANCH_SLUG: Record<Branch, string> = Object.fromEntries(
  SCALES.map((s) => [s.key, s.slug]),
) as Record<Branch, string>;

export function branchFromSlug(slug?: string): Branch | null {
  return scaleFromSlug(slug)?.key ?? null;
}

export function addonsForBranch(branch: Branch): Addon[] {
  return ADDONS.filter((a) => a.branch === branch);
}

/** First standard add-on catalog key for a branch. */
export function defaultUpsellOfferIdForBranch(branch: Branch): string {
  const list = addonsForBranch(branch);
  const standard = list.find((a) => a.tier === 'standard');
  return (standard ?? list[0])?.key ?? 'addon_iq_weakness_report';
}

/**
 * Partner add-on offer id = catalog key (no `_upsell` / `_dashboard` suffix).
 * Same id for funnel widget, in-app widget, and future dashboard API.
 */
export function toPartnerAddonOfferId(catalogKey: string): string {
  return (
    normalizeAddonOfferId(catalogKey) ??
    catalogKey.trim().replace(/_upsell$|_dashboard$/, '')
  );
}

/** @deprecated Use toPartnerAddonOfferId — partner list has no `_upsell` suffix. */
export function toUpsellWidgetOfferId(catalogKey: string): string {
  return toPartnerAddonOfferId(catalogKey);
}

/** @deprecated Use toPartnerAddonOfferId — partner list has no `_dashboard` suffix. */
export function toDashboardOfferId(catalogKey: string): string {
  return toPartnerAddonOfferId(catalogKey);
}

/**
 * Strip legacy partner suffixes (`_upsell` / `_dashboard`) and return the catalog key
 * when it matches a known add-on; otherwise return the stripped string.
 */
export function normalizeAddonOfferId(offerId: string): string | null {
  const raw = offerId.trim();
  if (!raw) return null;
  const stripped = raw.replace(/_upsell$|_dashboard$/, '');
  if (addonByKey(stripped)) return stripped;
  if (raw.startsWith('addon_')) return stripped;
  return null;
}

export function findAddon(branchSlug?: string, slug?: string): Addon | null {
  const branch = branchFromSlug(branchSlug);
  if (!branch || !slug) return null;
  return ADDONS.find((a) => a.branch === branch && a.slug === slug) ?? null;
}

export function addonByKey(key: string): Addon | null {
  return ADDONS.find((a) => a.key === key) ?? null;
}

export function priceLabel(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export function addonCheckoutPath(a: Addon): string {
  return `/addons/${BRANCH_SLUG[a.branch]}/${a.slug}`;
}

export function addonViewPath(a: Addon): string {
  return `/addons/${BRANCH_SLUG[a.branch]}/${a.slug}/view`;
}

export const DASH_PATH: Record<Branch, string> = Object.fromEntries(
  SCALES.map((s) => [s.key, s.dashPath]),
) as Record<Branch, string>;
