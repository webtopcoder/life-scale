import { useCallback, useState } from "react";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { WeaknessReportView } from "@/components/dashboard/WeaknessReportView";
import { WeaknessReportUpsell } from "@/components/upsells/WeaknessReportUpsell";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { usePostHog } from "@posthog/react";
import { EVENTS, trackEvent } from "@/constants/analytics";
import { useAuth } from "@/context/AuthContext";
import { PRODUCT_PRICING, clearDecline } from "@/lib/upsellPricing";
import { verifyPayment } from "@/services/billingService";
import { BreezeCheckout } from "@/components/BreezeCheckout";
import type { BreezeCheckoutSuccessPayload } from "@/components/BreezeCheckout";
import { BREEZE_PRICE_KEYS } from "@/services/breezeConfig";
import { trackKlaviyoPaymentSuccess } from "@/services/klaviyoClient";
import { useBillingExternalId } from "@/hooks/useBillingExternalId";
import { toast } from "sonner";

export default function WeaknessReportDashPage() {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { externalId: billingExternalId } = useBillingExternalId(user?.email);
  const { hasWeaknessReport, declinedUpsells, loading: purchasesLoading } = useUserPurchases();
  const isWinBack = declinedUpsells.includes("weakness_report");
  const amountCents = PRODUCT_PRICING.weakness_report.originalCents;

  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckoutError = useCallback((msg: string) => {
    console.error("[WeaknessReportDash]", msg);
  }, []);

  const handlePaymentSuccess = useCallback(
    async (result: BreezeCheckoutSuccessPayload) => {
      trackEvent(posthog, EVENTS.UPSELL_PURCHASED, {
        product: "weakness_report",
        price_cents: amountCents,
        revenue_cents: amountCents,
        location: "dashboard_weakness_report",
        is_win_back: isWinBack,
      });
      if (user) {
        try {
          await verifyPayment({
            userId: user.id,
            productKey: "weakness_report",
            amountCents,
            breezePageId: result.pageId,
            breezePaymentId: result.orderId,
            customerExternalId: billingExternalId,
          });

          clearDecline("weakness_report");

          trackKlaviyoPaymentSuccess({
            eventName: "Payment Succeeded",
            amountCents,
            currency: "USD",
            productKey: "weakness_report",
            ffPaymentId: result.orderId ?? result.pageId,
            customerExternalId: billingExternalId,
            userId: user.id,
            metadata: { is_win_back: isWinBack, location: "dashboard_weakness_report" },
          });
        } catch (err) {
          console.error(err);
        }
      }
      toast.success("Purchase successful! Your report is now available.");
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
      location: "dashboard_weakness_report",
      product: "weakness_report",
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
        style={{ background: "var(--gradient-warm)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-primary-foreground">Weakness Report</h1>
            <p className="text-sm text-primary-foreground/70">Uncover hidden blind spots and get a plan to overcome them</p>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-primary-foreground/5" />
      </motion.div>

      {hasWeaknessReport ? (
        <WeaknessReportView />
      ) : !showCheckout ? (
        <div className="max-w-2xl mx-auto">
          <WeaknessReportUpsell
            onPurchase={handlePurchase}
            loading={false}
            isWinBack={isWinBack}
          />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto w-full min-h-[calc(100vh-185px)]">
          <div id="breeze-dashboard-weakness-container" className="relative w-full h-full min-h-[calc(100vh-220px)]">
            {showCheckout && (
              <BreezeCheckout
                mode='one_time'
                priceKey={BREEZE_PRICE_KEYS.WEAKNESS_REPORT}
                customerEmail={user?.email ?? ''}
                externalId={billingExternalId}
                successPath="/dashboard/weakness-report"
                failPath="/dashboard/weakness-report"
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
