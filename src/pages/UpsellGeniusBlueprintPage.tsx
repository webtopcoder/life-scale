import { STORAGE_KEYS } from '@/constants/storage';
import { LifeScaleWordmark } from '@/components/marketing/LifeScaleWordmark';
import { useState, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { Compass, Briefcase, BookOpen, TrendingUp, MessageCircle, Users, Shield, Star, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFunnel } from '@/context/FunnelContext';
import { recordDecline } from '@/lib/upsellPricing';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { verifyPayment } from '@/services/billingService';
import { getBillingExternalId, getSessionId } from '@/services/assessmentService';
import { toast } from 'sonner';
import { trackFunnelUpsellPurchase } from '@/lib/funnelPurchaseTracking';
import { BreezeCheckout } from '@/components/BreezeCheckout';
import type { BreezeCheckoutSuccessPayload } from '@/components/BreezeCheckout';
import { BREEZE_PRICE_KEYS } from '@/services/breezeConfig';
import { Button } from '@/components/ui/button';

const PRICE_CENTS = 100;

const VALUE_PROPS = [
  { icon: Briefcase, text: "Career matches — make sure you work on the right thing for your profile" },
  { icon: BookOpen, text: "Learning style — find out how your brain absorbs info best" },
  { icon: TrendingUp, text: "Business strengths — see if you're built for entrepreneurship" },
  { icon: MessageCircle, text: "Communication style — how your brain shapes the way you connect" },
  { icon: Compass, text: "Growth roadmap — what to focus on next to level up" },
  { icon: Users, text: "Famous minds with a similar score to yours" },
];

export default function UpsellGeniusBlueprintPage() {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { goToStage, state } = useFunnel();
  const [checkoutRemountKey, setCheckoutRemountKey] = useState(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const customerExternalId = getBillingExternalId();
  const customerEmail = (state.email?.trim() || user?.email?.trim() || '') as string;

  const handleCheckoutError = useCallback((msg: string) => {
    console.error('[UpsellGeniusBlueprint]', msg);
    setCheckoutError('We could not load the payment form. Please try again.');
  }, []);

  const handleBreezeSuccess = useCallback(
    async (result: BreezeCheckoutSuccessPayload) => {
      trackFunnelUpsellPurchase({
        amountCents: PRICE_CENTS,
        productKey: 'genius_blueprint',
        orderIdFallback: result.orderId,
        userId: user?.id,
      });
      trackEvent(posthog, EVENTS.UPSELL_PURCHASED, {
        product: 'genius_blueprint',
        price_cents: PRICE_CENTS,
        revenue_cents: PRICE_CENTS,
      });
      setProcessing(true);
      try {
        await verifyPayment({
          userId: user?.id,
          productKey: 'genius_blueprint',
          amountCents: PRICE_CENTS,
          customerExternalId,
          breezePageId: result.pageId,
          breezePaymentId: result.orderId,
          sessionId: getSessionId(),
        });
      } catch (err) {
        console.error(err);
        toast.error('Purchase went through but we could not confirm it. Please contact support if content is missing.');
      }
      sessionStorage.setItem(STORAGE_KEYS.FUNNEL_BLUEPRINT_PURCHASED, '1');
      goToStage('upsell-coach');
      navigate({ pathname: '/upsell/brain-coach', search: location.search });
      setProcessing(false);
    },
    [posthog, customerExternalId, user?.id, goToStage, navigate, location.search, searchParams],
  );

  const handleSkip = () => {
    trackEvent(posthog, EVENTS.UPSELL_SKIPPED, { product: 'genius_blueprint' });
    recordDecline('genius_blueprint');
    goToStage('upsell-coach');
    navigate({ pathname: '/upsell/brain-coach', search: location.search });
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-foreground font-semibold">Processing your purchase…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-card border-b border-border py-3 px-4 text-center">
        <LifeScaleWordmark className="justify-center" />
      </div>

      <div className="flex-1 max-w-lg mx-auto px-4 py-8 space-y-6 w-full">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
            <Clock className="w-3.5 h-3.5" /> One-Time Offer — This Page Only
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
            Why People With Your Same IQ<br /><span className="text-accent">Typically Outperform You</span>
          </h1>
        </motion.div>

        <div className="space-y-3">
          {VALUE_PROPS.map(({ icon: Icon, text }, i) => (
            <motion.div key={text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-accent" />
              </div>
              <span className="text-sm text-foreground">{text}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}</div>
          <span className="text-sm font-semibold text-foreground">4.9</span>
          <span className="text-xs text-muted-foreground">· 28,000+ purchased</span>
        </div>

        <div className="bg-muted/50 rounded-xl p-5 text-center space-y-1">
          <div className="text-sm text-muted-foreground">Regular price <span className="line-through">$34.99</span></div>
          <div className="flex items-baseline justify-center gap-2 flex-wrap">
            <span className="text-3xl font-extrabold text-foreground">$1.00</span>
          </div>
          <div className="text-xs text-muted-foreground">one-time payment (plus taxes)</div>
          <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full mt-1">97% Off</span>
        </div>

        <div className="max-w-5xl w-full mx-auto space-y-3">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm text-muted-foreground leading-snug">Complete your purchase below</p>
            <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider leading-none">or</span>
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors leading-snug"
            >
              Skip this offer →
            </button>
          </div>
          {checkoutError && (
            <div className="flex flex-col items-center gap-2 text-sm text-destructive">
              <span>{checkoutError}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCheckoutError(null);
                  setCheckoutRemountKey((k) => k + 1);
                }}
              >
                Try again
              </Button>
            </div>
          )}
          {!checkoutError && customerEmail && (
            <BreezeCheckout
              key={checkoutRemountKey}
              mode="one_time"
              priceKey={BREEZE_PRICE_KEYS.GENIUS_BLUEPRINT}
              customerEmail={customerEmail}
              externalId={customerExternalId}
              sessionId={getSessionId()}
              successPath="/upsell/genius-blueprint"
              failPath="/upsell/genius-blueprint"
              paymentPageContext="one_click"
              taxAmountCents={PRICE_CENTS}
              variant="embedded"
              onSuccess={handleBreezeSuccess}
              onError={handleCheckoutError}
            />
          )}
          {!checkoutError && !customerEmail && (
            <p className="text-sm text-destructive text-center">
              We need your email to continue. Go back to checkout or sign in.
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pb-4">
          <Shield className="w-4 h-4" />
          <span>30-Day Money-Back Guarantee</span>
        </div>
      </div>
    </div>
  );
}
