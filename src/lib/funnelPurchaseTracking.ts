import { STORAGE_KEYS } from '@/constants/storage';
import { postCheckoutSuccessPostback } from '@/lib/affiliatePostback';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { trackKlaviyoPaymentSuccess } from '@/services/klaviyoClient';

const TRIAL_AMOUNT_CENTS = 100;

type TrackPurchaseOnceOpts = {
  /** Affiliate / order id fallback for postback. */
  orderIdFallback?: string;
  /** Life Scale customer / subscription id when known. */
  ffSubscriptionId?: string;
  amountCents?: number;
  currency?: string;
  productKey?: string;
  userId?: string;
};

function hasTrackedPurchase(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.MARKETING_PURCHASE_TRACKED) === '1';
  } catch {
    return false;
  }
}

function markPurchaseTracked(): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.MARKETING_PURCHASE_TRACKED, '1');
  } catch {
    // ignore
  }
}

/**
 * Fire Meta + TikTok Purchase, Klaviyo Payment Succeeded, and affiliate postback
 * once per browser session for imported marketing funnel checkouts.
 */
export function trackImportedFunnelSubscriptionPurchaseOnce(
  opts: TrackPurchaseOnceOpts = {},
): boolean {
  if (typeof window === 'undefined') return false;
  if (hasTrackedPurchase()) return false;

  const amountCents = opts.amountCents ?? TRIAL_AMOUNT_CENTS;
  const currency = opts.currency ?? 'USD';
  const productKey = opts.productKey ?? 'iq_subscription';

  markPurchaseTracked();

  trackFacebookPixelEvent('Purchase', {
    page: 'checkout',
    value: amountCents / 100,
    currency,
  });
  trackTikTokEvent('Purchase', tikTokContentPayload());

  trackKlaviyoPaymentSuccess({
    eventName: 'Payment Succeeded',
    amountCents,
    currency,
    productKey,
    ffSubscriptionId: opts.ffSubscriptionId,
    userId: opts.userId,
  });

  postCheckoutSuccessPostback(opts.orderIdFallback ?? opts.ffSubscriptionId);
  return true;
}

/**
 * Upsell purchase tracking (Meta + TikTok + Klaviyo). No session dedupe —
 * each accepted upsell may fire once from the caller.
 */
export function trackFunnelUpsellPurchase(opts: {
  amountCents: number;
  productKey: string;
  orderIdFallback?: string;
  currency?: string;
  userId?: string;
}): void {
  const currency = opts.currency ?? 'USD';

  trackFacebookPixelEvent('Purchase', {
    page: 'upsell',
    value: opts.amountCents / 100,
    currency,
  });
  trackTikTokEvent('Purchase', tikTokContentPayload());

  trackKlaviyoPaymentSuccess({
    eventName: 'Upsell Payment Succeeded',
    amountCents: opts.amountCents,
    currency,
    productKey: opts.productKey,
    userId: opts.userId,
  });

  postCheckoutSuccessPostback(opts.orderIdFallback);
}
