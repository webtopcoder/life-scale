import { api } from '@/integrations/api/client';
import { getAccessToken } from '@/integrations/api/cognitoAuth';

const RETRIES = 4;
const RETRY_MS = 250;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isActiveIqSubscription(
  purchases: Array<{ productKey?: string; product_key?: string; status?: string }>,
): boolean {
  return purchases.some(
    (p) =>
      (p.productKey ?? p.product_key) === 'iq_subscription' &&
      (p.status === 'active' || !p.status),
  );
}

/**
 * Returns true if the given user has an active IQ subscription.
 * Retries briefly so first-login routing waits for a Cognito access token.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  void userId;
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const token = await getAccessToken();
      if (!token) {
        await sleep(RETRY_MS);
        continue;
      }
      const purchases = await api.get<
        Array<{ productKey?: string; product_key?: string; status?: string }>
      >('/dashboard/purchases');
      return isActiveIqSubscription(purchases);
    } catch (err) {
      lastError = err;
      await sleep(RETRY_MS);
    }
  }
  if (lastError) {
    console.warn('[hasActiveSubscription] failed after retries', lastError);
  }
  return false;
}
