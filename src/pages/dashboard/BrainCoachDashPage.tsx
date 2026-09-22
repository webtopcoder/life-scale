import { useCallback, useState } from "react";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { BrainCoachChat } from "@/components/dashboard/BrainCoachChat";
import { BrainCoachUpsell } from "@/components/upsells/BrainCoachUpsell";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { usePostHog } from "@posthog/react";
import { EVENTS, trackEvent } from "@/constants/analytics";
import { useAuth } from "@/context/AuthContext";
import { PRODUCT_PRICING } from "@/lib/upsellPricing";
import { verifyPayment } from "@/services/billingService";
import { BreezeCheckout } from "@/components/BreezeCheckout";
import type { BreezeCheckoutSuccessPayload } from "@/components/BreezeCheckout";
import { BREEZE_PRICE_KEYS } from "@/services/breezeConfig";
import { trackKlaviyoPaymentSuccess } from "@/services/klaviyoClient";
import { useBillingExternalId } from "@/hooks/useBillingExternalId";
import { toast } from "sonner";

export default function BrainCoachDashPage() {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { externalId: billingExternalId } = useBillingExternalId(user?.email);
  const { hasBrainCoach, declinedUpsells, loading: purchasesLoading } = useUserPurchases();
  const isWinBack = declinedUpsells.includes("brain_coach");
  const amountCents = PRODUCT_PRICING.brain_coach.originalCents;

  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckoutError = useCallback((msg: string) => {
    console.error("[BrainCoachDash]", msg);
  }, []);

  const handlePaymentSuccess = useCallback(
    async (result: BreezeCheckoutSuccessPayload) => {
      trackEvent(posthog, EVENTS.UPSELL_PURCHASED, {
        product: "brain_coach",
        price_cents: amountCents,
        revenue_cents: amountCents,
        location: "dashboard_brain_coach",
        is_win_back: isWinBack,
      });
      if (user) {
        await verifyPayment({
          userId: user.id,
          productKey: "brain_coach",
          amountCents,
          breezePageId: result.pageId,
          breezePaymentId: result.orderId,
          customerExternalId: billingExternalId,
        })
          .then(() => {
            trackKlaviyoPaymentSuccess({
              eventName: "Payment Succeeded",
              amountCents,
              currency: "USD",
              productKey: "brain_coach",
              ffPaymentId: result.orderId ?? result.pageId,
              customerExternalId: billingExternalId,
              userId: user.id,
              metadata: { is_win_back: isWinBack, location: "dashboard_brain_coach" },
            });
          })
          .catch(console.error);
      }
      toast.success("Purchase successful! Brain Coach is now available.");
      window.location.reload();
    },
    [posthog, amountCents, isWinBack, user, billingExternalId],
  );

  const handlePurchase = () => {
    if (!user) {
      navigate("/auth-gate");
      return;
    }
    trackEvent(posthog, EVENTS.CHECKOUT_CTA_CLICKED, {
      location: "dashboard_brain_coach",
      product: "brain_coach",
      price_cents: amountCents,
      is_win_back: isWinBack,
    });
    setShowCheckout(true);
  };

  if (purchasesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl p-5 md:p-6 mb-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">Brain Coach</h1>
            <p className="text-sm text-white/70">Your personal AI guide to sharper thinking</p>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
      </motion.div>

      {hasBrainCoach ? (
        <BrainCoachChat />
      ) : !showCheckout ? (
        <div className="max-w-2xl mx-auto">
          <BrainCoachUpsell
            onPurchase={handlePurchase}
            loading={false}
            isWinBack={isWinBack}
          />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto w-full min-h-[calc(100vh-185px)]">
          <div id="breeze-dashboard-coach-container" className="relative w-full h-full min-h-[calc(100vh-185px)]">
            {showCheckout && (
              <BreezeCheckout
                mode='one_time'
                priceKey={BREEZE_PRICE_KEYS.BRAIN_COACH}
                customerEmail={user?.email ?? ""}
                externalId={billingExternalId}
                successPath="/dashboard/brain-coach"
                failPath="/dashboard/brain-coach"
                onSuccess={handlePaymentSuccess}
                onError={handleCheckoutError}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
