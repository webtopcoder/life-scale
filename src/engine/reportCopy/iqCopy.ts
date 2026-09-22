/**
 * Extended authored copy for the IQ report.
 *
 * iqReport.ts owns the measurement. This module owns the depth: how a
 * category shows up in real tasks, and what actually strengthens it.
 * Deterministic, authored, no AI at render.
 *
 * WORD BUDGET: the whole report targets ~1,470 rendered words. CATEGORY_DEPTH
 * renders five times over (once per category), so every word here costs five.
 * Keep each field to a single tight sentence.
 */

import type { Category } from '@/types/funnel';

interface CategoryDepth {
  /** How this capability shows up in real work, away from a test. */
  realTasks: string;
  /** What genuinely strengthens it, and what does not. */
  strengthens: string;
  /** What a low result here usually means — and what it does not mean. */
  whenLow: string;
}

export const CATEGORY_DEPTH: Record<Category, CategoryDepth> = {
  logic: {
    realTasks:
      'This runs when you test whether an argument holds, or trace a fault back to the assumption that was wrong.',
    strengthens:
      'A few hard problems worked slowly, writing down why each wrong option was wrong. Volume does almost nothing.',
    whenLow:
      'Usually not missing reasoning — usually answering fast and never going back to test it. Process habits are the fixable kind.',
  },
  pattern: {
    realTasks:
      'This runs when a dataset feels off before you can say why, or a new problem turns out to be an old one.',
    strengthens:
      'Variety beats drilling. Ask "what is this the same as?" every time you meet something new.',
    whenLow:
      'Often a preference for step-by-step work rather than an inability to see the shape.',
  },
  spatial: {
    realTasks:
      'This works when you rotate an object in your head or hold a diagram in mind while someone talks over it.',
    strengthens:
      'Physical manipulation, not screen practice. Build, sketch, navigate without a map — picture it, then check reality.',
    whenLow:
      'Not a weaker mind, a verbal one — solving spatial problems in words works, but costs time.',
  },
  speed: {
    realTasks:
      'Throughput: how fast you take information in, orient and respond — and how much a busy room costs you.',
    strengthens:
      'Conditions more than training. Sleep, stress and interruptions move it; so does making the work familiar.',
    whenLow:
      'Read this one with the most caution — it is the most state-dependent of the five, and the conditions you tested under matter.',
  },
  self: {
    realTasks:
      'Calibration: how closely your sense of your own performance tracks the real thing, moment to moment.',
    strengthens:
      'Predict, then check. Estimate the score before you see it. Reflection without scoring just confirms what you believed.',
    whenLow:
      'Confidence and accuracy have drifted apart — over-confidence is the expensive version.',
  },
};

export function breakdownFraming(strongestLabel: string, weakestLabel: string): string {
  return (
    `One number hides the interesting part. Your shape runs from ${strongestLabel} at the top to ` +
    `${weakestLabel} at the bottom, and that spread predicts what work feels effortless.`
  );
}

export const SIGNATURE_FRAMING =
  'Categories tell you what you scored; axes tell you how you got there — the processing style behind the result.';

export const SPEED_FRAMING =
  'Speed and accuracy trade against each other, and where you sit is stable. Every quadrant contains people who ' +
  'perform well — what matters is whether yours is the one your work rewards.';

export function weaknessFraming(label: string): string {
  return (
    `Weakest is relative to you, not to anyone else. Gains at the bottom of a profile come cheaper than at the ` +
    `top, so ${label} is where your next real improvement lives.`
  );
}

export function comparisonFraming(): string {
  return (
    'Comparison is good for calibration and nothing else — the distribution is general, your situations are not.'
  );
}

export function strengthsFraming(topLabel: string): string {
  return (
    `Return on effort is highest where you already have traction. ${topLabel} is your strongest measured ` +
    `capability — the real question is whether your week actually uses it.`
  );
}

export function growthFraming(firstLever: string): string {
  return (
    `Two levers, not five — plans fail on how much is attempted at once. ${firstLever} goes first because ` +
    `progress there lifts the second as a side effect.`
  );
}

export const CERTIFICATE_FRAMING =
  'A snapshot taken under your own conditions, not a verdict. Retaking it after deliberate practice is the point.';

export function careerFraming(topLabel: string, secondLabel: string): string {
  return `A profile cannot pick your career; it explains why some work has felt easy. Yours leads with ` +
    `${topLabel.toLowerCase()}, backed by ${secondLabel.toLowerCase()} — read the roles for the shape of the day.`;
}
