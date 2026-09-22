import { api } from '@/integrations/api/client';
import { FLOW_IDS } from '@/engine/datasetLoader';
import type { Category, CategoryScores } from '@/types/funnel';
import { getArchetype } from '@/lib/archetypes';

export type KlaviyoFunnelVersion = 'v1' | 'v2' | 'v3';

export function getKlaviyoFunnelForFlowId(flowId: string): KlaviyoFunnelVersion {
  if (flowId === FLOW_IDS.PLANS_V1) return 'v3';
  return 'v1';
}

type KlaviyoTrackPayload = {
  eventName: string;
  amountCents: number;
  currency?: string;
  productKey: string;
  ffPaymentId?: string;
  ffSubscriptionId?: string;
  customerExternalId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
};

declare global {
  interface Window {
    klaviyo?: {
      push: (...args: unknown[]) => void;
    };
  }
}

export function trackKlaviyoPaymentSuccess(payload: KlaviyoTrackPayload): void {
  if (typeof window === 'undefined' || !window.klaviyo || typeof window.klaviyo.push !== 'function') {
    return;
  }

  const {
    eventName,
    amountCents,
    currency = 'USD',
    productKey,
    ffPaymentId,
    ffSubscriptionId,
    customerExternalId,
    userId,
    metadata = {},
  } = payload;

  const properties: Record<string, unknown> = {
    amount_cents: amountCents,
    currency,
    product_key: productKey,
    ff_payment_id: ffPaymentId,
    ff_subscription_id: ffSubscriptionId,
    customer_external_id: customerExternalId,
    user_id: userId,
    ...metadata,
  };

  window.klaviyo.push(['track', eventName, properties]);
}

/**
 * Subscribes email marketing via Klaviyo profile-subscription bulk job.
 */
export async function registerKlaviyoProfile(email: string): Promise<void> {
  const trimmed = email?.trim();
  if (!trimmed) return;

  await api.post('/marketing/klaviyo/register-profile', { email: trimmed }, false);
}

export async function trackKlaviyoQuizCompleted(input: {
  email: string;
  iqScore: number;
  scores: CategoryScores;
  strongestCategory: Category;
  funnel: KlaviyoFunnelVersion;
}): Promise<void> {
  const email = input.email?.trim();
  if (!email) return;

  const archetype = getArchetype(input.scores, input.iqScore);
  const trait = archetype.name;

  await api.post(
    '/marketing/klaviyo/track-event',
    {
      email,
      event: 'Quiz Completed',
      properties: {
        iq_score: input.iqScore,
        trait,
        funnel: input.funnel,
      },
    },
    false,
  );
}
