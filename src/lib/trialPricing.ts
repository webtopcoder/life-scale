import type { SelectedTier, SelectedTrial } from '@/lib/funnelState';
import { TIER_MONTHLY_USD, formatMonthlyUsd } from '@/content/legalCopy';

// Single source of truth for the trial (introductory) offers shown on the
// trial-length step and echoed back on the checkout summary. Do not re-type
// these prices in a page — read them from here so the two cannot drift.

export type TrialOffer = {
  id: SelectedTrial;
  /** e.g. "3-day trial" */
  duration: string;
  /** Display price charged today, e.g. "$1". */
  price: string;
  headline: string;
  /** Plain-language length used in terms copy, e.g. "3 days". */
  lengthLabel: string;
  best?: boolean;
};

const LENGTH_LABEL: Record<SelectedTrial, string> = {
  '3-day': '3 days',
  '7-day': '7 days',
  '14-day': '14 days',
  '28-day': '28 days',
  '84-day': '84 days',
};

/** Exact day counts for each trial (matches Life-Scale offer IDs). */
const LENGTH_DAYS: Record<SelectedTrial, number> = {
  '3-day': 3,
  '7-day': 7,
  '14-day': 14,
  '28-day': 28,
  '84-day': 84,
};

/** The date the trial ends and the first monthly charge occurs. */
export function trialEndDate(trial: SelectedTrial, from: Date = new Date()): Date {
  const days = LENGTH_DAYS[trial] ?? LENGTH_DAYS['7-day'];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** "September 1, 2026" (long) or "Sep 1, 2026" (short). */
export function formatTrialDate(date: Date, style: 'long' | 'short' = 'long'): string {
  return date.toLocaleDateString('en-US', {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type TierIntroPrices = {
  '3-day': string;
  '7-day': string;
  '14-day': string;
  '28-day': string;
  '84-day': string;
};

const HEADLINES: Record<SelectedTrial, string> = {
  '3-day': 'Try it for a few days.',
  '7-day': 'A full week to explore.',
  '14-day': 'Two weeks to dig in.',
  '28-day': 'A full billing cycle to decide.',
  '84-day': 'Three months at an intro rate.',
};

function offersFor(prices: TierIntroPrices, best: SelectedTrial = '7-day'): TrialOffer[] {
  const ids: SelectedTrial[] = ['3-day', '7-day', '14-day', '28-day', '84-day'];
  return ids.map((id) => ({
    id,
    duration: `${id} trial`,
    price: prices[id],
    headline: HEADLINES[id],
    lengthLabel: LENGTH_LABEL[id],
    best: id === best,
  }));
}

export const TIER_TRIALS: Record<SelectedTier, TrialOffer[]> = {
  complete: offersFor({
    '3-day': '$1',
    '7-day': '$10',
    '14-day': '$21.44',
    '28-day': '$38.99',
    '84-day': '$77.98',
  }),
  focus: offersFor({
    '3-day': '$1',
    '7-day': '$8',
    '14-day': '$15.94',
    '28-day': '$28.99',
    '84-day': '$57.98',
  }),
  guide: offersFor({
    '3-day': '$1',
    '7-day': '$4',
    '14-day': '$7.69',
    '28-day': '$13.99',
    '84-day': '$27.98',
  }),
  insight: offersFor({
    '3-day': '$1',
    '7-day': '$2',
    '14-day': '$4.39',
    '28-day': '$7.99',
    '84-day': '$15.98',
  }),
};

export function trialsForTier(tier: SelectedTier): TrialOffer[] {
  return TIER_TRIALS[tier] ?? TIER_TRIALS.complete;
}

export function findTrial(tier: SelectedTier, trial: string | null): TrialOffer | null {
  if (!trial) return null;
  // Migrate legacy localStorage values from the 3-option UI.
  const normalized: SelectedTrial =
    trial === '1-week' ? '7-day' : trial === '1-month' ? '28-day' : (trial as SelectedTrial);
  return trialsForTier(tier).find((t) => t.id === normalized) ?? null;
}

/** Monthly renewal price for a tier, formatted for display. */
export function renewalPrice(tier: SelectedTier): string {
  return formatMonthlyUsd(TIER_MONTHLY_USD[tier] ?? TIER_MONTHLY_USD.complete);
}
