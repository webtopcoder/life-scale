import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Lock, Sparkles } from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { LifeScaleUpsell } from '@/components/LifeScaleCheckout';
import { useAuth } from '@/context/AuthContext';
import {
  findAddon,
  priceLabel,
  addonCheckoutPath,
  addonViewPath,
  toPartnerAddonOfferId,
  DASH_PATH,
} from '@/lib/addons';
import { fetchOwnedAddonKeys } from '@/lib/addonPurchase';
import { listCompletions } from '@/lib/testCompletions';
import { api } from '@/integrations/api/client';
import { persistUpsellOffer } from '@/lib/lifeScaleOffers';

const THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
};

type PurchaseRow = {
  productKey?: string;
  product_key?: string;
  status?: string;
  ffSubscriptionId?: string | null;
  ff_subscription_id?: string | null;
};

async function resolveLifeScaleCustomerId(): Promise<string | null> {
  const purchases = await api.get<PurchaseRow[]>('/dashboard/purchases');
  const sub = (purchases ?? []).find(
    (p) =>
      (p.productKey ?? p.product_key) === 'iq_subscription' &&
      (p.status === 'active' || !p.status) &&
      (p.ffSubscriptionId || p.ff_subscription_id),
  );
  return (sub?.ffSubscriptionId ?? sub?.ff_subscription_id)?.trim() || null;
}

export default function AddonCheckoutPage() {
  const { branch: branchSlug, key: slug } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const addon = findAddon(branchSlug, slug);

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Partner offer ids are bare catalog keys (e.g. addon_iq_speed_accuracy_report).
  const widgetOfferId = useMemo(
    () => (addon ? toPartnerAddonOfferId(addon.key) : ''),
    [addon],
  );
  const customerIdFromUrl = params.get('customer_id')?.trim() || '';
  const offerIdFromUrl = params.get('offer_id')?.trim() || '';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth-gate', { replace: true });
      return;
    }
    if (!addon) return;
    let active = true;
    Promise.all([fetchOwnedAddonKeys(user.id), listCompletions(user.id)]).then(
      ([owned, done]) => {
        if (!active) return;
        if (owned.has(addon.key)) {
          navigate(addonViewPath(addon), { replace: true });
          return;
        }
        if (!done.has(addon.branch)) {
          navigate(DASH_PATH[addon.branch], { replace: true });
          return;
        }
        setReady(true);
        setChecking(false);
      },
    );
    return () => {
      active = false;
    };
  }, [user, authLoading, addon, navigate]);

  // Pin offer id so a leftover funnel session value cannot win.
  useEffect(() => {
    if (!widgetOfferId || !addon) return;
    persistUpsellOffer(widgetOfferId);
    void api
      .post('/billing/addon-intent', { addonKey: addon.key })
      .catch((err) => console.warn('[addon-checkout] addon-intent failed', err));
  }, [widgetOfferId, addon]);

  // Widget reads customer_id + offer_id from the page URL (same as /upsell).
  useEffect(() => {
    if (!ready || !addon || !user || !widgetOfferId) return;
    let cancelled = false;

    const ensureQuery = async () => {
      const next = new URLSearchParams(params);
      let changed = false;

      if (next.get('offer_id') !== widgetOfferId) {
        next.set('offer_id', widgetOfferId);
        changed = true;
      }

      if (!next.get('customer_id')) {
        try {
          const cust = await resolveLifeScaleCustomerId();
          if (cancelled) return;
          if (cust) {
            next.set('customer_id', cust);
            changed = true;
          } else {
            setCustomerError(
              'No saved payment method on file. Complete a subscription checkout first.',
            );
            setWidgetReady(true);
            return;
          }
        } catch {
          if (cancelled) return;
          setCustomerError('Could not load your payment method. Try again or contact support.');
          setWidgetReady(true);
          return;
        }
      }

      if (cancelled) return;
      if (changed) {
        navigate(`${addonCheckoutPath(addon)}?${next.toString()}`, { replace: true });
        return;
      }
      setCustomerError(null);
      setWidgetReady(true);
    };

    void ensureQuery();
    return () => {
      cancelled = true;
    };
  }, [ready, addon, user, widgetOfferId, params, navigate]);

  if (!addon) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background" style={THEME_STYLE}>
        <LifeScaleHeader wordmark="IQ" showTagline={false} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-[15px] font-semibold">That add-on does not exist.</p>
            <button
              onClick={() => navigate('/main-dashboard')}
              className="mt-3 text-[13px] font-semibold text-primary underline"
            >
              Back to your dashboards
            </button>
          </div>
        </main>
      </div>
    );
  }

  const dash = DASH_PATH[addon.branch];
  const successUrl = addonViewPath(addon);
  const declineUrl = dash;
  const showWidget = widgetReady && !!customerIdFromUrl && offerIdFromUrl === widgetOfferId;
  const price = priceLabel(addon.priceCents);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background" style={THEME_STYLE}>
      <LifeScaleHeader
        wordmark="IQ"
        showTagline={false}
        left={
          <button
            type="button"
            onClick={() => navigate(dash)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        }
      />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:px-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            One-time add-on
          </div>
          <h1 className="mt-1 text-[24px] font-bold leading-tight sm:text-[30px]">{addon.title}</h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{addon.tagline}</p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                What you get
              </span>
              <span className="text-[26px] font-bold leading-none">{price}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {addon.includes.map((inc) => (
                <li key={inc} className="flex items-start gap-2 text-[13.5px] leading-snug">
                  <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>

            {addon.tier === 'premium' && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/[0.06] px-3 py-2.5 text-[12.5px] text-foreground">
                <Sparkles className="mt-[2px] h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  Our most detailed add-on in this category — a full plan rather than a single read.
                </span>
              </div>
            )}

            {checking || !widgetReady ? (
              <p className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing checkout…
              </p>
            ) : customerError ? (
              <p className="mt-5 text-[12.5px] text-destructive">{customerError}</p>
            ) : showWidget ? (
              <div className="mt-5">
                <LifeScaleUpsell
                  offerId={widgetOfferId}
                  successUrl={successUrl}
                  declineUrl={declineUrl}
                />
              </div>
            ) : null}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
              <Lock className="h-3 w-3" /> One-time charge of {price}. Yours to keep in your dashboard.
            </p>
          </div>

          <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
            Your report is generated from your own answers after you buy it, then saved to your
            dashboard so it stays exactly as written.
          </p>
        </div>
      </main>
    </div>
  );
}
