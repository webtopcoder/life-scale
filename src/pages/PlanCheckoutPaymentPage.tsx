import { useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { usePostHog } from '@posthog/react';
import { ArrowLeft } from 'lucide-react';
import { useFunnel } from '@/context/FunnelContext';
import { LifeScaleCheckout } from '@/components/LifeScaleCheckout';
import { LEGACY_PLAN_OFFER_IDS } from '@/lib/lifeScaleOffers';
import { CHECKOUT_PLANS, type CheckoutPlanId } from '@/services/breezeConfig';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { formatUsdFromCents } from '@/lib/money';

const PlanCheckoutPaymentPage = () => {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, goToStage } = useFunnel();

  const planId: CheckoutPlanId | null = state.selectedPlanId;
  const plan = planId ? CHECKOUT_PLANS[planId] : null;
  const offerId =
    planId && planId in LEGACY_PLAN_OFFER_IDS
      ? LEGACY_PLAN_OFFER_IDS[planId as keyof typeof LEGACY_PLAN_OFFER_IDS]
      : LEGACY_PLAN_OFFER_IDS['1w'];

  useEffect(() => {
    if (planId) {
      goToStage('checkout-plans-pay');
    }
  }, [planId, goToStage]);

  useEffect(() => {
    if (!planId || !plan) return;

    trackFacebookPixelEvent('ViewContent', {
      page: 'checkout_plans_pay',
    });

    trackFacebookPixelEvent('InitiateCheckout', {
      page: 'checkout_plans_pay',
      value: plan.trialCents / 100,
      currency: 'USD',
      checkout_trigger: 'page_view',
      plan_id: planId,
    });

    trackEvent(posthog, EVENTS.CHECKOUT_CTA_CLICKED, {
      step: 'checkout_plans',
      plan_id: planId,
    });
  }, [plan, planId, posthog]);

  const handleChangePlan = () => {
    goToStage('checkout-plans');
    navigate({
      pathname: '/onboarding-plans',
      search: searchParams.toString(),
    });
  };

  if (!planId || !plan) {
    return (
      <Navigate
        to={{ pathname: '/onboarding-plans', search: searchParams.toString() }}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6">
        <button
          type="button"
          onClick={handleChangePlan}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Change plan
        </button>

        <div className="flex items-baseline justify-between gap-4 px-1">
          <span className="text-xl font-bold text-foreground">Due Today:</span>
          <span className="text-xl font-bold text-foreground">
            {formatUsdFromCents(plan.trialCents)}
          </span>
        </div>

        <div id="lifescale-checkout-container" className="relative min-h-[200px]">
          <LifeScaleCheckout offerId={offerId} successPath="/main-dashboard" />
        </div>
      </div>
    </div>
  );
};

export default PlanCheckoutPaymentPage;
