// Shared quiz format for registry-driven scales (Body IQ, Sleep Health,
// Hidden Athlete). Options can carry either a numeric weight (scored scales)
// or a directional vector (archetype scales).

export interface ScaleOption {
  label: string;
  /** Scored scales: contribution for this option. */
  weight?: number;
  /** Archetype scales: signed contribution per axis. */
  vector?: Record<string, number>;
  /** Private interpretation note. Never rendered in a report. */
  reading?: string;
}

export interface ScaleQuestion {
  kind: 'q';
  id: number;
  section: string;
  prompt: string;
  micro?: string;
  /** Domain this question feeds, or null for context-only questions. */
  domain?: string | null;
  options: ScaleOption[];
}

export interface ScaleCard {
  kind: 'card';
  id: string;
  title: string;
  body: string;
}

export type ScaleStep = ScaleQuestion | ScaleCard;

export type ScaleAnswers = Record<number, number>;

export const Q = (q: ScaleQuestion): ScaleQuestion => q;
export const C = (c: ScaleCard): ScaleCard => c;

/** Options from labels + weights, in order. */
export function opts(labels: string[], weights?: number[]): ScaleOption[] {
  return labels.map((label, i) => ({ label, weight: weights?.[i] }));
}

export function questionCount(steps: ScaleStep[]): number {
  return steps.filter((s) => s.kind === 'q').length;
}

/**
 * Absolute question number for every step (1-based). Non-question steps inherit
 * the number of the preceding question so a progress counter never resets when
 * an interstitial appears.
 */
export function absoluteQuestionNumbers(steps: ScaleStep[]): number[] {
  const out: number[] = [];
  let n = 0;
  for (const s of steps) {
    if (s.kind === 'q') n++;
    out.push(n);
  }
  return out;
}
