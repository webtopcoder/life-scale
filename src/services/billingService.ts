/**
 * Breeze payment verification — Nest API.
 */
import { api } from '@/integrations/api/client';

export interface VerifyPaymentParams {
  userId?: string;
  productKey: string;
  amountCents: number;
  ffPaymentId?: string;
  ffSubscriptionId?: string;
  breezePageId?: string;
  breezeSubscriptionId?: string;
  breezePaymentId?: string;
  customerExternalId: string;
  email?: string;
  sessionId?: string;
  reportData?: {
    finalScore: number | null;
    percentile: number | null;
    strongestCategory: string | null;
    scores: Record<string, number> | null;
    percentiles: Record<string, number> | null;
  };
}

export async function verifyPayment(
  params: VerifyPaymentParams,
): Promise<{ success: boolean; autoPassword?: string }> {
  const data = await api.post<{ ok: boolean; autoPassword?: string }>(
    '/billing/verify-payment',
    {
      breezePageId: params.breezePageId,
      breezeSubscriptionId: params.breezeSubscriptionId ?? params.ffSubscriptionId,
      email: params.email,
      sessionId: params.sessionId,
      funnelSessionId: params.customerExternalId,
      productKey: params.productKey,
    },
    false,
  );
  return { success: !!data.ok, autoPassword: data.autoPassword };
}
