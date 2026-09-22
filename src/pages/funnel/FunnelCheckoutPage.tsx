import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LifeScaleCheckout } from '@/components/LifeScaleCheckout';
import LifeScaleMarketingLayout from '@/components/marketing/LifeScaleMarketingLayout';
import { getFunnelValue, type SelectedTier, type SelectedTrial } from '@/lib/funnelState';
import { findTrial } from '@/lib/trialPricing';
import { offerIdFor } from '@/lib/lifeScaleOffers';
import { defaultUpsellOfferIdForBranch, toPartnerAddonOfferId } from '@/lib/addons';
import type { Branch } from '@/lib/testCompletions';
import { isScaleKey } from '@/config/scales';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import { PRICING_MAY_VARY } from '@/content/legalCopy';

function isBranch(v: string | undefined | null): v is Branch {
  return isScaleKey(v ?? undefined);
}

/**
 * Funnel checkout embed (compact panel + post-pay upsell hop).
 * Prefills email/name from query; upsell offer from ?upsellOffer= or branch default.
 */
export default function FunnelCheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [intentReady, setIntentReady] = useState(false);

  const tier = ((getFunnelValue('selectedTier') as SelectedTier | null) ?? 'complete') as SelectedTier;
  const storedTrial = getFunnelValue('selectedTrial') as SelectedTrial | null;
  const trial = findTrial(tier, storedTrial) ?? findTrial(tier, '3-day');

  const funnelBranch = getFunnelValue('selectedTest');
  const branchParam = params.get('branch');
  const branch: Branch = isBranch(branchParam)
    ? branchParam
    : isBranch(funnelBranch)
      ? funnelBranch
      : 'iq';

  const offerId = useMemo(
    () => (trial ? offerIdFor(tier, trial.id) : offerIdFor('complete', '3-day')),
    [tier, trial],
  );

  const entitledBranch = tier === 'complete' ? null : branch;
  const upsellFromQuery = params.get('upsellOffer')?.trim() || undefined;
  const upsellOfferId = toPartnerAddonOfferId(
    upsellFromQuery || defaultUpsellOfferIdForBranch(branch),
  );
  const email = params.get('email')?.trim() || undefined;
  const name = params.get('name')?.trim() || undefined;

  useEffect(() => {
    if (!offerId || !user?.id) {
      setIntentReady(true);
      return;
    }
    let cancelled = false;
    setIntentReady(false);
    api
      .post('/billing/checkout-intent', {
        offerId,
        subscriptionTier: tier,
        entitledBranch,
      })
      .then(() => {
        if (!cancelled) setIntentReady(true);
      })
      .catch((err) => {
        console.warn('[funnel-checkout] checkout-intent failed', err);
        if (!cancelled) setIntentReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [offerId, user?.id, tier, entitledBranch]);

  return (
    <LifeScaleMarketingLayout onStart={() => navigate('/choose-test')}>
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
            Complete your order
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
            Secure checkout — then one optional upgrade.
          </p>
        </div>

        <div className="not-prose mt-10" key={`${offerId}:${upsellOfferId}`}>
          {intentReady ? (
            <LifeScaleCheckout
              offerId={offerId}
              variant="funnel-iframe"
              upsellOfferId={upsellOfferId}
              upsellUrl="/upsell"
              successUrl="/thank-you"
              email={email}
              name={name}
              className="min-h-[400px] w-full"
            />
          ) : (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-[hsl(var(--iq-muted))]">
              Preparing secure checkout…
            </div>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-[hsl(var(--iq-muted))]">
          By confirming you agree to our{' '}
          <Link to="/terms" className="underline">
            Terms
          </Link>
          ,{' '}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link to="/refund-policy" className="underline">
            Refund Policy
          </Link>
          . {PRICING_MAY_VARY}
        </p>
      </section>
    </LifeScaleMarketingLayout>
  );
}
