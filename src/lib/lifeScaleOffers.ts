import type { SelectedTier, SelectedTrial } from '@/lib/funnelState';

/** Life-Scale offer IDs for all 20 tier × trial combinations. */
export const LIFE_SCALE_OFFERS: Record<SelectedTier, Record<SelectedTrial, string>> = {
  complete: {
    '3-day': 'complete_1.00_3d_38.99_28d',
    '7-day': 'complete_10.00_7d_38.99_28d',
    '14-day': 'complete_21.44_14d_38.99_28d',
    '28-day': 'complete_38.99_28d_38.99_28d',
    '84-day': 'complete_77.98_84d_38.99_28d',
  },
  focus: {
    '3-day': 'focus_1.00_3d_28.99_28d',
    '7-day': 'focus_8.00_7d_28.99_28d',
    '14-day': 'focus_15.94_14d_28.99_28d',
    '28-day': 'focus_28.99_28d_28.99_28d',
    '84-day': 'focus_57.98_84d_28.99_28d',
  },
  guide: {
    '3-day': 'guide_1.00_3d_13.99_28d',
    '7-day': 'guide_4.00_7d_13.99_28d',
    '14-day': 'guide_7.69_14d_13.99_28d',
    '28-day': 'guide_13.99_28d_13.99_28d',
    '84-day': 'guide_27.98_84d_13.99_28d',
  },
  insight: {
    '3-day': 'insight_1.00_3d_7.99_28d',
    '7-day': 'insight_2.00_7d_7.99_28d',
    '14-day': 'insight_4.39_14d_7.99_28d',
    '28-day': 'insight_7.99_28d_7.99_28d',
    '84-day': 'insight_15.98_84d_7.99_28d',
  },
};

/** Default offer for legacy IQ funnels (~$29.99/mo → Focus). */
export const LEGACY_DEFAULT_OFFER_ID = LIFE_SCALE_OFFERS.focus['3-day'];

/** Multi-plan funnel → Focus trial length. */
export const LEGACY_PLAN_OFFER_IDS: Record<'1w' | '4w' | '12w', string> = {
  '1w': LIFE_SCALE_OFFERS.focus['7-day'],
  '4w': LIFE_SCALE_OFFERS.focus['28-day'],
  '12w': LIFE_SCALE_OFFERS.focus['84-day'],
};

export type ParsedOffer = {
  offerId: string;
  tier: SelectedTier;
  trialDays: number;
  introCents: number;
  rebillCents: number;
};

const TIER_SET = new Set<SelectedTier>(['complete', 'focus', 'guide', 'insight']);

function dollarsToCents(raw: string): number {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Parse `complete_1.00_3d_38.99_28d` → structured fields.
 * Format: {tier}_{intro}_{trialDays}d_{rebill}_{rebillPeriod}d
 */
export function parseOfferId(offerId: string): ParsedOffer | null {
  const m = offerId.trim().match(
    /^(complete|focus|guide|insight)_(\d+(?:\.\d+)?)_(\d+)d_(\d+(?:\.\d+)?)_(\d+)d$/,
  );
  if (!m) return null;
  const tier = m[1] as SelectedTier;
  if (!TIER_SET.has(tier)) return null;
  return {
    offerId,
    tier,
    introCents: dollarsToCents(m[2]),
    trialDays: Number.parseInt(m[3], 10),
    rebillCents: dollarsToCents(m[4]),
  };
}

export function offerIdFor(tier: SelectedTier, trial: SelectedTrial): string {
  return LIFE_SCALE_OFFERS[tier][trial];
}

export function tierFromOfferId(offerId: string): SelectedTier | null {
  return parseOfferId(offerId)?.tier ?? null;
}

const DEFAULT_API_BASE = 'https://sirius.bigdog.app';

export function lifeScaleApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_LIFESCALE_API_BASE_URL as string | undefined)?.trim();
  return fromEnv || DEFAULT_API_BASE;
}

/** Session keys for post-checkout Life-Scale flow. */
export const LS_CHECKOUT_KEYS = {
  offerId: 'iqscale.lifescale.offerId',
  upsellOfferId: 'iqscale.lifescale.upsellOfferId',
  successPath: 'iqscale.lifescale.successPath',
} as const;

export function persistCheckoutOffer(offerId: string, successPath?: string): void {
  try {
    sessionStorage.setItem(LS_CHECKOUT_KEYS.offerId, offerId);
    if (successPath) sessionStorage.setItem(LS_CHECKOUT_KEYS.successPath, successPath);
  } catch {
    /* noop */
  }
}

export function persistUpsellOffer(upsellOfferId: string): void {
  try {
    sessionStorage.setItem(LS_CHECKOUT_KEYS.upsellOfferId, upsellOfferId);
  } catch {
    /* noop */
  }
}

export function readCheckoutOffer(): {
  offerId: string | null;
  upsellOfferId: string | null;
  successPath: string | null;
} {
  try {
    return {
      offerId: sessionStorage.getItem(LS_CHECKOUT_KEYS.offerId),
      upsellOfferId: sessionStorage.getItem(LS_CHECKOUT_KEYS.upsellOfferId),
      successPath: sessionStorage.getItem(LS_CHECKOUT_KEYS.successPath),
    };
  } catch {
    return { offerId: null, upsellOfferId: null, successPath: null };
  }
}
