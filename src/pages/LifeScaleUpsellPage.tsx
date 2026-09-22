import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LifeScaleMarketingLayout from '@/components/marketing/LifeScaleMarketingLayout';
import { LifeScaleUpsell } from '@/components/LifeScaleCheckout';
import { lifeScaleApiBaseUrl, readCheckoutOffer } from '@/lib/lifeScaleOffers';
import {
  defaultUpsellOfferIdForBranch,
  toPartnerAddonOfferId,
  normalizeAddonOfferId,
} from '@/lib/addons';
import { STORAGE_KEYS } from '@/constants/storage';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import {
  IQ_UPSELL_SEQUENCE,
  checkLifeScaleCustomerReadiness,
  IMPORTED_FUNNEL_WIDGET_API_BASE_URL,
  iqUpsellOfferId,
  iqUpsellPath,
} from '@/lib/importedFunnelCheckout';
import { trackImportedFunnelSubscriptionPurchaseOnce } from '@/lib/funnelPurchaseTracking';
import { Button } from '@/components/ui/button';

const CUSTOMER_READINESS_DELAYS_MS = [0, 600, 1200, 2000, 3000] as const;

type ReadinessState = 'resolving' | 'checking' | 'ready' | 'failed';

function storedLifeScaleCustomerId(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.LIFESCALE_CUSTOMER_ID)?.trim() || '';
  } catch {
    return '';
  }
}

function resolveCatalogOfferFromParams(params: URLSearchParams): string {
  const fromQuery =
    params.get('offer_id')?.trim() ||
    params.get('offer')?.trim() ||
    '';
  if (fromQuery) {
    return normalizeAddonOfferId(fromQuery) || fromQuery.replace(/_upsell$|_dashboard$/, '');
  }
  try {
    const fromUpsellStorage = sessionStorage.getItem(STORAGE_KEYS.LIFESCALE_UPSELL_OFFER_ID);
    if (fromUpsellStorage) {
      return normalizeAddonOfferId(fromUpsellStorage) || fromUpsellStorage.replace(/_upsell$|_dashboard$/, '');
    }
  } catch {
    /* noop */
  }
  const stored = readCheckoutOffer().upsellOfferId;
  if (stored) {
    return normalizeAddonOfferId(stored) || stored.replace(/_upsell$|_dashboard$/, '');
  }
  return defaultUpsellOfferIdForBranch('iq');
}

export default function LifeScaleUpsellPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [readiness, setReadiness] = useState<ReadinessState>('resolving');
  const [retryKey, setRetryKey] = useState(0);

  const requestedStep = Number.parseInt(params.get('step') ?? '', 10);
  const isSequencedIqUpsell = Number.isInteger(requestedStep) && requestedStep >= 0;
  const step = isSequencedIqUpsell ? Math.min(requestedStep, IQ_UPSELL_SEQUENCE.length - 1) : 0;
  const catalogKey = useMemo(
    () => (isSequencedIqUpsell ? IQ_UPSELL_SEQUENCE[step] : resolveCatalogOfferFromParams(params)),
    [isSequencedIqUpsell, params, step],
  );
  const widgetOfferId = useMemo(
    () => (isSequencedIqUpsell ? iqUpsellOfferId(step) : toPartnerAddonOfferId(catalogKey)),
    [catalogKey, isSequencedIqUpsell, step],
  );
  const customerIdFromUrl = params.get('customer_id')?.trim() || '';
  const nextUrl = isSequencedIqUpsell ? iqUpsellPath(step + 1, params) : '/thank-you';
  const apiBaseUrl = params.get('source') === 'imported-funnel'
    ? IMPORTED_FUNNEL_WIDGET_API_BASE_URL
    : lifeScaleApiBaseUrl();

  useEffect(() => {
    if (!customerIdFromUrl) return;
    trackImportedFunnelSubscriptionPurchaseOnce({
      ffSubscriptionId: customerIdFromUrl,
      orderIdFallback: customerIdFromUrl,
      userId: user?.id,
    });
  }, [customerIdFromUrl, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const ensureQuery = async () => {
      const next = new URLSearchParams(params);
      let changed = false;

      const currentOffer = next.get('offer_id')?.trim() || next.get('offer')?.trim() || '';
      if (widgetOfferId && currentOffer !== widgetOfferId) {
        next.set('offer_id', widgetOfferId);
        next.delete('offer');
        changed = true;
      }

      if (!next.get('customer_id')) {
        const storedCustomerId = storedLifeScaleCustomerId();
        if (storedCustomerId) {
          next.set('customer_id', storedCustomerId);
          changed = true;
        }
      }

      if (!next.get('customer_id') && user?.id) {
        try {
          const purchases = await api.get<
            Array<{
              productKey?: string;
              product_key?: string;
              status?: string;
              ffSubscriptionId?: string | null;
              ff_subscription_id?: string | null;
            }>
          >('/dashboard/purchases');
          const sub = (purchases ?? []).find(
            (p) =>
              (p.productKey ?? p.product_key) === 'iq_subscription' &&
              (p.status === 'active' || !p.status) &&
              (p.ffSubscriptionId || p.ff_subscription_id),
          );
          const cust = (sub?.ffSubscriptionId ?? sub?.ff_subscription_id)?.trim();
          if (cust) {
            next.set('customer_id', cust);
            changed = true;
          }
        } catch (err) {
          console.warn('[upsell] could not resolve customer_id', err);
        }
      }

      if (cancelled) return;
      if (changed) {
        navigate(`/upsell?${next.toString()}`, { replace: true });
        return;
      }
      if (!next.get('customer_id')) setReadiness('failed');
    };

    void ensureQuery();
    return () => {
      cancelled = true;
    };
  }, [params, widgetOfferId, user?.id, navigate]);

  useEffect(() => {
    if (!customerIdFromUrl) return;

    const controller = new AbortController();
    const timers = new Set<number>();
    let cancelled = false;

    const wait = (delay: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, delay);
        timers.add(timer);
      });

    const checkCustomer = async () => {
      setReadiness('checking');
      for (const delay of CUSTOMER_READINESS_DELAYS_MS) {
        if (delay > 0) await wait(delay);
        if (cancelled) return;
        try {
          const result = await checkLifeScaleCustomerReadiness(
            apiBaseUrl,
            customerIdFromUrl,
            controller.signal,
          );
          if (cancelled) return;
          if (result === 'ready' || result === 'unknown') {
            setReadiness('ready');
            return;
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setReadiness('ready');
          return;
        }
      }
      if (!cancelled) setReadiness('failed');
    };

    void checkCustomer();
    return () => {
      cancelled = true;
      controller.abort();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [apiBaseUrl, customerIdFromUrl, retryKey]);

  return (
    <LifeScaleMarketingLayout onStart={() => navigate('/choose-test')}>
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
            One more thing.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
            Add this optional upgrade now, or continue to your membership.
          </p>
        </div>
        <div className="mt-10">
          {readiness === 'ready' && customerIdFromUrl && widgetOfferId ? (
            <LifeScaleUpsell
              offerId={widgetOfferId}
              successUrl={nextUrl}
              declineUrl={nextUrl}
              checkoutUrl="/thank-you"
              upsellSequence={isSequencedIqUpsell ? IQ_UPSELL_SEQUENCE : undefined}
              apiBaseUrl={apiBaseUrl}
            />
          ) : readiness === 'failed' ? (
            <div className="mx-auto max-w-md text-center">
              <p className="text-sm text-[hsl(var(--iq-muted))]">
                Your payment was received, but your saved card is still being prepared for this offer.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Button type="button" onClick={() => setRetryKey((value) => value + 1)}>
                  Retry offer
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/thank-you')}>
                  Continue without offer
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--iq-muted))]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Preparing offer…
            </div>
          )}
        </div>
      </section>
    </LifeScaleMarketingLayout>
  );
}
