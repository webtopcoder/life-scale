import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import LifeScaleMarketingLayout from '@/components/marketing/LifeScaleMarketingLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import { clearFunnelState, getFunnelValue } from '@/lib/funnelState';
import { getScale, isScaleKey } from '@/config/scales';
import { readCheckoutOffer } from '@/lib/lifeScaleOffers';
import { STORAGE_KEYS } from '@/constants/storage';
import type { Branch } from '@/lib/testCompletions';
import { trackImportedFunnelSubscriptionPurchaseOnce } from '@/lib/funnelPurchaseTracking';
import { markDescriptorAckPending } from '@/lib/descriptorAckNotice';

function resolveSuccessPath(): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.LIFESCALE_SUCCESS_PATH);
    if (stored?.startsWith('/')) return stored;
  } catch {
    /* noop */
  }
  const fromOffer = readCheckoutOffer().successPath;
  if (fromOffer?.startsWith('/')) return fromOffer;

  const funnelBranch = getFunnelValue('selectedTest');
  if (isScaleKey(funnelBranch ?? undefined)) {
    return getScale(funnelBranch as Branch).startPath;
  }
  return '/main-dashboard';
}

function isActiveSubscription(
  purchases: Array<{
    productKey?: string;
    product_key?: string;
    status?: string;
    ffSubscriptionId?: string | null;
    ff_subscription_id?: string | null;
  }>,
): boolean {
  return purchases.some(
    (p) =>
      (p.productKey ?? p.product_key) === 'iq_subscription' &&
      (p.status === 'active' || !p.status),
  );
}

function subscriptionCustomerId(
  purchases: Array<{
    productKey?: string;
    product_key?: string;
    status?: string;
    ffSubscriptionId?: string | null;
    ff_subscription_id?: string | null;
  }>,
): string | undefined {
  const sub = purchases.find(
    (p) =>
      (p.productKey ?? p.product_key) === 'iq_subscription' &&
      (p.status === 'active' || !p.status),
  );
  return (sub?.ffSubscriptionId ?? sub?.ff_subscription_id)?.trim() || undefined;
}

export default function ThankYouPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [polling, setPolling] = useState(true);
  const [failed, setFailed] = useState(false);
  const successPath = useMemo(() => resolveSuccessPath(), []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const tick = async () => {
      if (!user?.id) {
        setPolling(false);
        setReady(true);
        return;
      }

      // Prefer confirming from the pre-pay checkout intent (covers missing webhooks).
      if (attempts === 0 || attempts === 2) {
        try {
          const offerId = readCheckoutOffer().offerId;
          await api.post('/billing/confirm-checkout', offerId ? { offerId } : {});
        } catch (err) {
          console.warn('[thank-you] confirm-checkout failed', err);
        }
      }

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
        if (isActiveSubscription(purchases)) {
          if (!cancelled) {
            const customerId = subscriptionCustomerId(purchases);
            trackImportedFunnelSubscriptionPurchaseOnce({
              ffSubscriptionId: customerId,
              orderIdFallback: customerId,
              userId: user.id,
            });
            markDescriptorAckPending();
            setReady(true);
            setPolling(false);
            setFailed(false);
            clearFunnelState();
          }
          return;
        }
      } catch (err) {
        console.warn('[thank-you] purchase poll failed', err);
      }

      attempts += 1;
      if (attempts >= 16) {
        if (!cancelled) {
          setPolling(false);
          setFailed(true);
          setReady(false);
        }
        return;
      }
      if (!cancelled) window.setTimeout(tick, 2000);
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <LifeScaleMarketingLayout onStart={() => navigate('/choose-test')}>
      <section className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 md:py-20">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--iq-emerald)/0.15)]">
          {polling ? (
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--iq-cobalt))]" />
          ) : (
            <Check className="h-6 w-6 text-[hsl(var(--iq-emerald))]" />
          )}
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
          {failed ? 'Payment received — activating…' : "You're in."}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
          {polling
            ? 'Confirming your membership…'
            : failed
              ? 'We have not finished activating your plan yet. Wait a moment and retry, or contact support with the email you used at checkout.'
              : user
                ? 'Your membership is ready. Continue to your first scale.'
                : 'Your payment went through. Sign in with the email you used at checkout to open your dashboard.'}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          {user && !failed ? (
            <button
              type="button"
              disabled={!ready && polling}
              onClick={() => {
                clearFunnelState();
                navigate(successPath, { replace: true });
              }}
              className="iq-btn-primary inline-flex h-12 items-center justify-center gap-1.5 px-6 text-sm disabled:opacity-60"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
          {user && failed ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="iq-btn-primary inline-flex h-12 items-center justify-center gap-1.5 px-6 text-sm"
            >
              Retry activation
            </button>
          ) : null}
          {!user ? (
            <Link
              to="/auth-gate"
              className="iq-btn-primary inline-flex h-12 items-center justify-center gap-1.5 px-6 text-sm"
            >
              Sign in to continue <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <Link
            to="/help"
            className="text-sm text-[hsl(var(--iq-muted))] underline hover:text-[hsl(var(--iq-ink))]"
          >
            Need help?
          </Link>
        </div>
      </section>
    </LifeScaleMarketingLayout>
  );
}
