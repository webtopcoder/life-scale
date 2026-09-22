import { getAffiliateTransactionId } from '@/constants/analytics';

/** Affiliate / tracking postback on successful checkout or upsell (non-blocking). */
const CHECKOUT_SUCCESS_POSTBACK_URL = 'https://www.ho1bveqd9jq.com/?nid=3871';

export function postCheckoutSuccessPostback(orderIdFallback: string | undefined): void {
  const id = getAffiliateTransactionId() ?? orderIdFallback?.trim();
  if (!id) return;
  const url = `${CHECKOUT_SUCCESS_POSTBACK_URL}&transaction_id=${encodeURIComponent(id)}`;
  void fetch(url, { method: 'POST' }).catch((err) => {
    console.error('[affiliatePostback] Success postback failed:', err);
  });
}
