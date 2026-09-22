import { useCallback, useState } from "react";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { GeniusBlueprintView } from "@/components/dashboard/GeniusBlueprintView";
import { GeniusBlueprintUpsell } from "@/components/upsells/GeniusBlueprintUpsell";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
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

export default function GeniusBlueprintDashPage() {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { externalId: billingExternalId } = useBillingExternalId(user?.email);
  const { hasGeniusBlueprint, declinedUpsells, loading: purchasesLoading } = useUserPurchases();
  const isWinBack = declinedUpsells.includes("genius_blueprint");
  const amountCents = PRODUCT_PRICING.genius_blueprint.originalCents;

  const [showCheckout, setShowCheckout] = useState(false);

  const breezePriceKey = BREEZE_PRICE_KEYS.GENIUS_BLUEPRINT;

  const handleCheckoutError = useCallback((msg: string) => {
    console.error("[GeniusBlueprintDash]", msg);
  }, []);

  const handlePaymentSuccess = useCallback(
    async (result: BreezeCheckoutSuccessPayload) => {
      trackEvent(posthog, EVENTS.UPSELL_PURCHASED, {
        product: "genius_blueprint",
        price_cents: amountCents,
        revenue_cents: amountCents,
        location: "dashboard_genius_blueprint",
        is_win_back: isWinBack,
      });
      if (user) {
        await verifyPayment({
          userId: user.id,
          productKey: "genius_blueprint",
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
              productKey: "genius_blueprint",
              ffPaymentId: result.orderId ?? result.pageId,
              customerExternalId: billingExternalId,
              userId: user.id,
              metadata: { is_win_back: isWinBack, location: "dashboard_genius_blueprint" },
            });
          })
          .catch(console.error);
      }
      toast.success("Purchase successful! Your Genius Blueprint is now available.");
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
      location: "dashboard_genius_blueprint",
      product: "genius_blueprint",
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl p-5 md:p-6 mb-6"
        style={{ background: "var(--gradient-cool)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-primary-foreground">Genius Blueprint</h1>
            <p className="text-sm text-primary-foreground/70">Your personalized success map based on your cognitive profile</p>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-primary-foreground/5" />
      </motion.div>

      {hasGeniusBlueprint ? (
        <GeniusBlueprintView />
      ) : !showCheckout ? (
        <div className="max-w-2xl mx-auto">
          <GeniusBlueprintUpsell
            onPurchase={handlePurchase}
            loading={false}
            isWinBack={isWinBack}
          />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto w-full min-h-[calc(100vh-185px)]">
          <div id="breeze-dashboard-blueprint-container" className="relative w-full h-full min-h-[calc(100vh-185px)]">
            {showCheckout && (
              <BreezeCheckout
                mode='one_time'
                priceKey={breezePriceKey}
                customerEmail={user?.email ?? ""}
                externalId={billingExternalId}
                successPath="/dashboard/genius-blueprint"
                failPath="/dashboard/genius-blueprint"
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
