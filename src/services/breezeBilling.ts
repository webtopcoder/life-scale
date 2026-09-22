import { api } from '@/integrations/api/client';
import type { BreezePriceKey, CheckoutPlanId } from '@/services/breezeConfig';

export type BreezeTaxQuote = {
  taxRate: number;
  amountToCollect: number;
  ipInaccurate: boolean;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
};

export type BreezeBootstrapOneTime = {
  mode: 'one_time';
  pageId: string;
  checkoutUrl: string;
  clientReferenceId: string;
  taxQuote?: BreezeTaxQuote;
};

export type BreezeBootstrapSubscription = {
  pageId: string;
  mode: 'subscription';
  subscriptionId: string;
  invoiceUrl: string;
  clientReferenceId: string;
};

export type BreezeBootstrapResult = BreezeBootstrapOneTime | BreezeBootstrapSubscription;

export async function createBreezeCheckoutSession(params: {
  priceKey: BreezePriceKey;
  customerEmail?: string;
  externalId: string;
  sessionId?: string;
  successPath?: string;
  failPath?: string;
  paymentPageContext?: 'web' | 'one_click';
  taxAmountCents?: number;
  planId?: CheckoutPlanId | '3d';
  affiliateQuery?: string;
}): Promise<BreezeBootstrapResult> {
  const body: Record<string, unknown> = {
    priceKey: params.priceKey,
    externalId: params.externalId,
    returnOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    ...(params.sessionId ? { sessionId: params.sessionId } : {}),
    ...(params.successPath ? { successPath: params.successPath } : {}),
    ...(params.failPath ? { failPath: params.failPath } : {}),
    ...(params.paymentPageContext === 'one_click' ? { paymentPageContext: 'one_click' } : {}),
    ...(params.paymentPageContext === 'one_click' &&
    Number.isInteger(params.taxAmountCents) &&
    params.taxAmountCents! > 0
      ? { taxAmountCents: params.taxAmountCents }
      : {}),
    ...(params.planId ? { planId: params.planId } : {}),
    ...(params.affiliateQuery ? { affiliateQuery: params.affiliateQuery } : {}),
  };
  const em = params.customerEmail?.trim();
  if (em) {
    body.customerEmail = em;
    body.email = em;
  }

  const data = await api.post<Record<string, unknown>>('/billing/checkout-session', body, false);
  if (data.subscriptionId) {
    return {
      mode: 'subscription',
      pageId: String(data.breezePageId ?? data.subscriptionId ?? ''),
      subscriptionId: String(data.subscriptionId ?? ''),
      invoiceUrl: String(data.checkoutUrl ?? ''),
      clientReferenceId: params.externalId,
    };
  }
  return {
    mode: 'one_time',
    pageId: String(data.breezePageId ?? ''),
    checkoutUrl: String(data.checkoutUrl ?? ''),
    clientReferenceId: params.externalId,
  };
}

export type BreezeCheckoutStatusResponse = {
  status: string | null;
  subscriptionId?: string;
  lastSuccessfulPaymentId?: string | null;
  firstSuccessfulPaymentId?: string | null;
  pageId?: string;
  paymentId?: string | null;
};

async function fetchCheckoutStatus(body: {
  subscriptionId?: string;
  pageId?: string;
}): Promise<BreezeCheckoutStatusResponse> {
  const data = await api.post<{ status: string; raw?: Record<string, unknown> }>(
    '/billing/checkout-status',
    body,
    false,
  );
  return {
    status: data.status,
    lastSuccessfulPaymentId:
      (data.raw?.lastSuccessfulPaymentId as string) ??
      (data.raw?.paymentId as string) ??
      null,
    paymentId: (data.raw?.paymentId as string) ?? null,
  };
}

export async function pollBreezeSubscriptionUntilPayment(
  subscriptionId: string,
  opts?: { signal?: AbortSignal; maxAttempts?: number; intervalMs?: number },
): Promise<{ status: string; paymentId: string }> {
  const maxAttempts = opts?.maxAttempts ?? 450;
  const intervalMs = opts?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    opts?.signal?.throwIfAborted();
    const data = await fetchCheckoutStatus({ subscriptionId });
    if (data?.lastSuccessfulPaymentId) {
      return {
        status: data.status ?? 'UNKNOWN',
        paymentId: data.lastSuccessfulPaymentId,
      };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Timed out waiting for subscription payment confirmation');
}

export async function pollBreezePageUntilPaid(
  pageId: string,
  opts?: { signal?: AbortSignal; maxAttempts?: number; intervalMs?: number },
): Promise<{ status: string; paymentId?: string }> {
  const maxAttempts = opts?.maxAttempts ?? 450;
  const intervalMs = opts?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    opts?.signal?.throwIfAborted();
    const data = await fetchCheckoutStatus({ pageId });
    if (data?.status === 'PAID') {
      return {
        status: data.status,
        paymentId: data.paymentId ?? undefined,
      };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Timed out waiting for page payment confirmation');
}
