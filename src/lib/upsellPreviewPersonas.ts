/**
 * Sample personas for the /preview-upsells gallery.
 *
 * These are static frontend fixtures — nothing here is written to the
 * database. Each persona carries a mock completion payload in the SAME shape
 * the real funnels store in `test_completions.payload`, so the preview runs
 * through the real `buildTokens()` logic (including its fallbacks) rather
 * than hand-written tokens.
 */

import { TRAIT_LABEL, type HgResult } from '@/engine/hiddenGeniusScoring';
import type { Branch } from '@/lib/testCompletions';

type TraitKey = keyof typeof TRAIT_LABEL;

const TRAIT_KEYS = Object.keys(TRAIT_LABEL) as TraitKey[];

/** Fill every trait with a baseline, then apply the overrides we care about. */
function traits(base: number, overrides: Partial<Record<TraitKey, number>>): Record<TraitKey, number> {
  const out = {} as Record<TraitKey, number>;
  for (const k of TRAIT_KEYS) out[k] = base;
  return { ...out, ...overrides } as Record<TraitKey, number>;
}

interface IqAnswerSpec {
  category: string;
  correct: boolean;
  timeMs: number;
}

/** Build an IQ payload with question snapshot + answers, as the funnel saves it. */
function iqPayload(
  score: number,
  scores: Record<string, number>,
  answers: IqAnswerSpec[],
): Record<string, unknown> {
  return {
    score,
    scores,
    questions: answers.map((a, i) => ({
      id: i + 1,
      type: a.category === 'self' ? 'likert' : 'multiple_choice',
      prompt: `Sample question ${i + 1}`,
      category: a.category,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      difficulty: 2,
    })),
    answers: answers.map((a, i) => ({
      questionId: i + 1,
      selectedOption: a.correct ? 0 : 2,
      timeSpent: a.timeMs,
      isCorrect: a.category === 'self' ? null : a.correct,
      category: a.category,
      type: a.category === 'self' ? 'likert' : 'multiple_choice',
      isScored: a.category !== 'self',
    })),
  };
}

interface BhDomainSpec {
  domain: string;
  score: number;
  status: 'Strong' | 'Stable' | 'Watch';
}

function bhPayload(domains: BhDomainSpec[], focusLabel: string): Record<string, unknown> {
  const flagged = domains.filter((d) => d.status === 'Watch');
  const top3 = [...domains].sort((a, b) => a.score - b.score).slice(0, 3);
  return {
    result: { domains },
    top3,
    focus_label: focusLabel,
    flagged_count: flagged.length,
  };
}

function hgPayload(result: HgResult): Record<string, unknown> {
  return { result };
}

export interface UpsellPersona {
  id: string;
  label: string;
  blurb: string;
  payloads: Partial<Record<Branch, Record<string, unknown>>>;
}

/* ------------------------------- Personas ------------------------------- */

const HIGH: UpsellPersona = {
  id: 'high',
  label: 'High scorer',
  blurb: 'IQ 132 · strong pattern recognition, slow on speed · 1 health flag · Pattern Seer',
  payloads: {
    iq: iqPayload(
      132,
      { logic: 84, pattern: 92, spatial: 79, speed: 58, self: 74 },
      [
        { category: 'pattern', correct: true, timeMs: 9200 },
        { category: 'pattern', correct: true, timeMs: 8400 },
        { category: 'logic', correct: true, timeMs: 11800 },
        { category: 'logic', correct: true, timeMs: 12500 },
        { category: 'spatial', correct: true, timeMs: 14100 },
        { category: 'spatial', correct: false, timeMs: 26400 },
        { category: 'speed', correct: false, timeMs: 21900 },
        { category: 'speed', correct: false, timeMs: 24300 },
        { category: 'logic', correct: true, timeMs: 10700 },
        { category: 'self', correct: true, timeMs: 4200 },
      ],
    ),
    'brain-health': bhPayload(
      [
        { domain: 'cognitive', score: 86, status: 'Strong' },
        { domain: 'vascular', score: 81, status: 'Strong' },
        { domain: 'sleep', score: 54, status: 'Watch' },
        { domain: 'movement', score: 78, status: 'Stable' },
        { domain: 'sensory', score: 88, status: 'Strong' },
        { domain: 'mood', score: 72, status: 'Stable' },
        { domain: 'reserve', score: 84, status: 'Strong' },
      ],
      'Deeper sleep',
    ),
    'hidden-genius': hgPayload({
      traitScores: traits(58, {
        openness: 88,
        systemsOrientation: 84,
        learningVelocity: 81,
        conscientiousness: 41,
        peopleOrientation: 47,
      }),
      primary: 'pattern-seer',
      secondary: 'analytical-architect',
      weakestTrait: 'conscientiousness',
      topTraits: ['openness', 'systemsOrientation', 'learningVelocity', 'riskTolerance', 'autonomyNeed', 'creativityOrientation'],
    }),
  },
};

const AVERAGE: UpsellPersona = {
  id: 'average',
  label: 'Average',
  blurb: 'IQ 104 · weak spatial + verbal handling · 3 health flags · Adaptive Generalist',
  payloads: {
    iq: iqPayload(
      104,
      { logic: 62, pattern: 66, spatial: 44, speed: 59, self: 51 },
      [
        { category: 'pattern', correct: true, timeMs: 13400 },
        { category: 'pattern', correct: false, timeMs: 7100 },
        { category: 'logic', correct: true, timeMs: 15200 },
        { category: 'logic', correct: false, timeMs: 6800 },
        { category: 'spatial', correct: false, timeMs: 5900 },
        { category: 'spatial', correct: false, timeMs: 6400 },
        { category: 'speed', correct: true, timeMs: 9800 },
        { category: 'speed', correct: false, timeMs: 5200 },
        { category: 'logic', correct: true, timeMs: 14600 },
        { category: 'self', correct: true, timeMs: 3900 },
      ],
    ),
    'brain-health': bhPayload(
      [
        { domain: 'cognitive', score: 66, status: 'Stable' },
        { domain: 'vascular', score: 58, status: 'Watch' },
        { domain: 'sleep', score: 49, status: 'Watch' },
        { domain: 'movement', score: 52, status: 'Watch' },
        { domain: 'sensory', score: 74, status: 'Stable' },
        { domain: 'mood', score: 63, status: 'Stable' },
        { domain: 'reserve', score: 69, status: 'Stable' },
      ],
      'Steadier energy',
    ),
    'hidden-genius': hgPayload({
      traitScores: traits(55, {
        agreeableness: 74,
        detailOrientation: 68,
        conscientiousness: 63,
        riskTolerance: 38,
        persuasionComfort: 35,
      }),
      primary: 'adaptive-generalist',
      secondary: 'people-reader',
      weakestTrait: 'persuasionComfort',
      topTraits: ['agreeableness', 'detailOrientation', 'conscientiousness', 'peopleOrientation', 'structurePreference', 'learningVelocity'],
    }),
  },
};

const STRUGGLING: UpsellPersona = {
  id: 'struggling',
  label: 'Struggling',
  blurb: 'IQ 88 · weak logic + memory load · 5 health flags · Independent Explorer',
  payloads: {
    iq: iqPayload(
      88,
      { logic: 34, pattern: 47, spatial: 41, speed: 52, self: 38 },
      [
        { category: 'pattern', correct: false, timeMs: 4800 },
        { category: 'pattern', correct: true, timeMs: 16200 },
        { category: 'logic', correct: false, timeMs: 5100 },
        { category: 'logic', correct: false, timeMs: 4400 },
        { category: 'logic', correct: false, timeMs: 5600 },
        { category: 'spatial', correct: false, timeMs: 6200 },
        { category: 'spatial', correct: true, timeMs: 18700 },
        { category: 'speed', correct: false, timeMs: 4100 },
        { category: 'speed', correct: true, timeMs: 12900 },
        { category: 'self', correct: true, timeMs: 3600 },
      ],
    ),
    'brain-health': bhPayload(
      [
        { domain: 'cognitive', score: 46, status: 'Watch' },
        { domain: 'vascular', score: 44, status: 'Watch' },
        { domain: 'sleep', score: 38, status: 'Watch' },
        { domain: 'movement', score: 41, status: 'Watch' },
        { domain: 'sensory', score: 71, status: 'Stable' },
        { domain: 'mood', score: 35, status: 'Watch' },
        { domain: 'reserve', score: 64, status: 'Stable' },
      ],
      'Clearer thinking',
    ),
    'hidden-genius': hgPayload({
      traitScores: traits(50, {
        autonomyNeed: 86,
        openness: 72,
        structurePreference: 29,
        conscientiousness: 27,
        detailOrientation: 33,
      }),
      primary: 'independent-explorer',
      secondary: 'creative-synthesist',
      weakestTrait: 'conscientiousness',
      topTraits: ['autonomyNeed', 'openness', 'riskTolerance', 'creativityOrientation', 'learningVelocity', 'extraversion'],
    }),
  },
};

export const UPSELL_PERSONAS: UpsellPersona[] = [HIGH, AVERAGE, STRUGGLING];

/** Every token the offer copy can use, for the preview coverage note. */
export const KNOWN_TOKEN_KEYS = [
  'weakest1',
  'weakest2',
  'strongest',
  'lowestAccuracy',
  'score',
  'missedCount',
  'speedStyle',
  'bhTopRisk',
  'bhSecondRisk',
  'bhFocus',
  'flaggedCount',
  'sleepStatus',
  'stressStatus',
  'archetype',
  'secondaryArchetype',
  'weakestTrait',
  'strongestTrait',
];
