// ---------------------------------------------------------------------------
// Single source of truth for disclaimer and billing-legal copy.
//
// Every report, preview, quiz, checkout and legal surface must import its
// wording from here. Do not re-type these sentences in a page — add or extend
// an entry instead. `src/test/legalCopy.test.ts` fails the build if the banned
// fragments reappear elsewhere in the tree.
// ---------------------------------------------------------------------------

import type { CategoryKey } from '@/config/scales';
import type { SelectedTier } from '@/lib/funnelState';

/* ─────────────────────────── Assessment disclaimers ─────────────────────── */

export type DisclaimerKind =
  | 'assessmentShort'
  | 'reportShort'
  | 'reportLong'
  | 'productLong'
  | 'addonShort';

const BASE: Record<DisclaimerKind, string> = {
  assessmentShort: 'Educational check-in. Not a medical, clinical, or diagnostic test.',
  reportShort:
    'This report is a self-directed check-in for personal interest — not medical advice, diagnosis, or treatment.',
  reportLong:
    'One last note on limits. This is an educational assessment, not a medical test. It cannot see your bloods, your blood pressure, or anything a clinician would find, and a result here — high or low — is not a substitute for that. If something feels wrong, that is a conversation to have with a doctor, and this report is a useful thing to bring to it.',
  productLong:
    'Life Scale displays an in-product session result based on your responses. It is provided for personal interest and general reflection, and it is not a clinical, diagnostic, medical, psychological, educational, or standardized psychometric assessment. Do not use it as a basis for medical, educational, employment, or other important decisions.',
  addonShort:
    'Built from your own answers, for personal interest — not medical, psychological, or professional advice.',
};

/** Per-category tone overrides. Anything absent falls back to BASE. */
const BY_CATEGORY: Partial<Record<CategoryKey, Partial<Record<DisclaimerKind, string>>>> = {
  mind: {
    assessmentShort: 'Educational cognitive check-in. Not a medical, clinical, or diagnostic test.',
  },
  body: {
    assessmentShort: 'Educational wellbeing check-in. Not a medical, clinical, or diagnostic test.',
  },
};

/** The one place any surface reads disclaimer wording from. */
export function disclaimer(kind: DisclaimerKind, category?: CategoryKey): string {
  return (category && BY_CATEGORY[category]?.[kind]) || BASE[kind];
}

/** Short line for the FAQ answer "is this a real medical/clinical test?". */
export const NOT_CLINICAL_FAQ =
  'No. Nothing on Life Scale is a medical, school, or clinical test. It is built for personal interest and general reflection.';

/** Short qualifier appended to product descriptions. */
export const PERSONAL_INTEREST_NOTE =
  'It is built for personal interest and general reflection.';

/* ───────────────────────────── Billing legal copy ───────────────────────── */

export const TIER_MONTHLY_USD: Record<SelectedTier, number> = {
  complete: 38.99,
  focus: 28.99,
  guide: 13.99,
  insight: 7.99,
};

const DESCRIPTOR_ROOT = 'LIFE SCALE';

/** Card-statement paragraph. Used at checkout, in Terms and in the Help Center. */
export function statementDescriptorNote(): string {
  return `Charges appear on your card statement as ${DESCRIPTOR_ROOT}.`;
}

export const INTRO_TERMS_LIST = '3, 7, 14, 28, or 84 days';

/** Display a monthly price: whole dollars stay whole, cents keep two decimals. */
export function formatMonthlyUsd(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

/** All recurring prices, ordered low to high, as a display string. */
export function monthlyPriceList(): string {
  const prices = Object.values(TIER_MONTHLY_USD)
    .slice()
    .sort((a, b) => a - b)
    .map(formatMonthlyUsd);
  return `${prices.slice(0, -1).join(', ')} or ${prices[prices.length - 1]}`;
}

/** Generic renewal sentence covering every tier. */
export function renewalTermsAll(): string {
  return `Introductory terms run ${INTRO_TERMS_LIST}. Unless cancelled, the plan then renews monthly at ${monthlyPriceList()} depending on the tier you selected.`;
}

/** Renewal sentence for one known tier. */
export function renewalTerms(tier: SelectedTier): string {
  return `Unless you cancel first, your plan renews monthly at ${formatMonthlyUsd(TIER_MONTHLY_USD[tier])} after the introductory term ends.`;
}


export const AUTO_RENEW_NOTICE =
  'All subscriptions auto-renew until cancelled.';

export const CANCEL_ANYTIME =
  'Cancel any time. Cancellation stops future billing and you keep access until the end of the current billing period.';

export const REFUND_GUARANTEE =
  'Your introductory purchase is covered by a 30-day refund guarantee — request a full refund within 30 days of that first charge, no questions asked.';

export const PRICING_MAY_VARY =
  'Different prices and promotions may be offered at different times.';
