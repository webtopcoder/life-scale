/**
 * Breeze price keys — must match server env in `breeze-create-page` (BREEZE_*_PRODUCT_ID / PRICE_ID).
 * Create products and prices in the Breeze dashboard, then set API secrets
 * (Secrets Manager `brainwave/api/{stage}` — see docs/BREEZE_SETUP.md).
 */
export const BREEZE_PRICE_KEYS = {
  IQ_SUBSCRIPTION: 'IQ_SUBSCRIPTION',
  IQ_SUBSCRIPTION_ALT: 'IQ_SUBSCRIPTION_ALT',
  IQ_SUBSCRIPTION_BOA: 'IQ_SUBSCRIPTION_BOA',
  IQ_SUBSCRIPTION_RVR: 'IQ_SUBSCRIPTION_RVR',
  WEAKNESS_REPORT: 'WEAKNESS_REPORT',
  GENIUS_BLUEPRINT: 'GENIUS_BLUEPRINT',
  BRAIN_COACH: 'BRAIN_COACH',
} as const;

export type BreezePriceKey = (typeof BREEZE_PRICE_KEYS)[keyof typeof BREEZE_PRICE_KEYS];

export type CheckoutPlanId = '1w' | '4w' | '12w';

export const CHECKOUT_PLANS: Record<
  CheckoutPlanId,
  { label: string; trialCents: number; priceKey: typeof BREEZE_PRICE_KEYS.IQ_SUBSCRIPTION_ALT; planId: CheckoutPlanId }
> = {
  '1w': { label: '1-Week Plan', trialCents: 499, priceKey: BREEZE_PRICE_KEYS.IQ_SUBSCRIPTION_ALT, planId: '1w' },
  '4w': { label: '4-Week Plan', trialCents: 1499, priceKey: BREEZE_PRICE_KEYS.IQ_SUBSCRIPTION_ALT, planId: '4w' },
  '12w': { label: '12-Week Plan', trialCents: 2999, priceKey: BREEZE_PRICE_KEYS.IQ_SUBSCRIPTION_ALT, planId: '12w' },
};

export const IQ_SUBSCRIPTION_MONTHLY_CENTS = 2999;
export const IQ_SUBSCRIPTION_BOA_MONTHLY_CENTS = 2998;
export const IQ_SUBSCRIPTION_RVR_MONTHLY_CENTS = 2997;

export const SHORT_IQ_TRIAL_DUE_CENTS = 100;
export const SHORT_IQ_SUBSCRIPTION_MONTHLY_CENTS = 2999;
export const SHORT_IQ_PROMO_PERCENT = 88;
