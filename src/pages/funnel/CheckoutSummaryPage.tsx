import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, CreditCard } from "lucide-react";
import { LifeScaleCheckout } from "@/components/LifeScaleCheckout";
import LifeScaleMarketingLayout from "@/components/marketing/LifeScaleMarketingLayout";
import { getFunnelValue, type SelectedTier, type SelectedTrial } from "@/lib/funnelState";
import { findTrial, formatTrialDate, renewalPrice, trialEndDate } from "@/lib/trialPricing";
import { offerIdFor } from "@/lib/lifeScaleOffers";
import type { Branch } from "@/lib/testCompletions";
import { getScale, isScaleKey } from "@/config/scales";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/integrations/api/client";
import {
  AUTO_RENEW_NOTICE,
  CANCEL_ANYTIME,
  REFUND_GUARANTEE,
  statementDescriptorNote,
} from "@/content/legalCopy";

const TIER_NAME: Record<SelectedTier, string> = {
  complete: "Complete",
  focus: "Focus",
  guide: "Guide",
  insight: "Insight",
};

const TIER_SCOPE: Record<SelectedTier, string> = {
  complete: "Every scale, in every category.",
  focus: "One category — all three tests — plus your AI coach, 24/7.",
  guide: "One category — all three tests — plus your coaching kit.",
  insight: "One category — all three tests — and the essentials.",
};

function isBranch(v: string | undefined | null): v is Branch {
  return isScaleKey(v ?? undefined);
}

export default function CheckoutSummaryPage({ previewMode = false }: { previewMode?: boolean }) {
  const navigate = useNavigate();
  const params = useParams<{ branch?: string }>();
  const { user } = useAuth();
  const [intentReady, setIntentReady] = useState(previewMode);

  const upgradeBranch = isBranch(params.branch) ? params.branch : null;
  const isUpgradeMode = !previewMode && upgradeBranch !== null;

  const tier = ((getFunnelValue("selectedTier") as SelectedTier | null) ?? "complete") as SelectedTier;
  const storedTrial = getFunnelValue("selectedTrial") as SelectedTrial | null;
  const trial = findTrial(tier, storedTrial) ?? (previewMode ? findTrial(tier, "7-day") : null);

  const funnelBranch = getFunnelValue("selectedTest");
  const branch: Branch = upgradeBranch ?? (isBranch(funnelBranch) ? funnelBranch : "iq");
  const scale = getScale(branch);
  const renewal = renewalPrice(tier);
  const chargeDate = trial ? trialEndDate(trial.id) : null;
  const chargeDateLong = chargeDate ? formatTrialDate(chargeDate, "long") : "";
  const chargeDateShort = chargeDate ? formatTrialDate(chargeDate, "short") : "";

  const trialPath = isUpgradeMode ? `/upgrade/${upgradeBranch}/trial` : "/trial-offer";
  const offerId = useMemo(() => (trial ? offerIdFor(tier, trial.id) : null), [tier, trial]);
  const entitledBranch = tier === "complete" ? null : branch;

  useEffect(() => {
    if (!trial || !offerId) {
      navigate(trialPath, { replace: true });
    }
  }, [trial, offerId, navigate, trialPath]);

  useEffect(() => {
    if (previewMode || !offerId || !user?.id) {
      setIntentReady(true);
      return;
    }
    let cancelled = false;
    setIntentReady(false);
    api
      .post("/billing/checkout-intent", {
        offerId,
        subscriptionTier: tier,
        entitledBranch,
      })
      .then(() => {
        if (!cancelled) setIntentReady(true);
      })
      .catch((err) => {
        console.warn("[checkout-summary] checkout-intent failed", err);
        // Still show the widget — confirm-checkout / webhook may recover.
        if (!cancelled) setIntentReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [previewMode, offerId, user?.id, tier, entitledBranch]);

  if (!trial || !offerId) return null;

  return (
    <LifeScaleMarketingLayout onStart={() => navigate("/choose-test")}>
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <button
          onClick={() => navigate(previewMode ? "/preview-signup/trial-offer" : trialPath)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">Review and confirm.</h1>
        </div>

        <article className="iq-card mt-10 p-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--iq-muted))]">
            Order summary
          </h2>

          <dl className="mt-5 divide-y divide-[hsl(var(--iq-border))] text-sm">
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-[hsl(var(--iq-muted))]">Starting with</dt>
              <dd className="text-right font-medium text-[hsl(var(--iq-ink))]">{scale.name}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-[hsl(var(--iq-muted))]">Plan</dt>
              <dd className="text-right font-medium text-[hsl(var(--iq-ink))]">
                {TIER_NAME[tier]}
                <span className="block text-xs font-normal text-[hsl(var(--iq-muted))]">{TIER_SCOPE[tier]}</span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-[hsl(var(--iq-muted))]">Trial length</dt>
              <dd className="text-right font-medium text-[hsl(var(--iq-ink))]">{trial.lengthLabel}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-[hsl(var(--iq-muted))]">Then</dt>
              <dd className="text-right font-medium text-[hsl(var(--iq-ink))]">
                {renewal}/month
                <span className="block text-xs font-normal text-[hsl(var(--iq-muted))]">
                  starting {chargeDateShort}
                </span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-base font-semibold text-[hsl(var(--iq-ink))]">Due today</dt>
              <dd className="text-3xl font-semibold text-[hsl(var(--iq-ink))]">{trial.price}</dd>
            </div>
          </dl>
        </article>

        <article className="iq-card mt-6 p-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--iq-muted))]">
            Your membership terms
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[hsl(var(--iq-ink-soft))]">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--iq-emerald))]" />
              <span>
                You are charged <strong>{trial.price}</strong> today for {trial.lengthLabel} of full {TIER_NAME[tier]}{" "}
                access — your test, your report, your dashboard and everything your plan includes.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--iq-emerald))]" />
              <span>
                Your trial ends on <strong>{chargeDateLong}</strong>. On that date your plan renews at{" "}
                <strong>{renewal}/month</strong>. {AUTO_RENEW_NOTICE}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--iq-emerald))]" />
              <span>{CANCEL_ANYTIME}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--iq-emerald))]" />
              <span>{REFUND_GUARANTEE}</span>
            </li>
          </ul>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-[hsl(var(--iq-paper))] p-4 text-sm text-[hsl(var(--iq-ink-soft))]">
            <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--iq-cobalt))]" />
            <span>{statementDescriptorNote()}</span>
          </div>
        </article>

        <div className="not-prose mt-5" key={offerId}>
          {intentReady ? (
            <LifeScaleCheckout
              offerId={offerId}
              variant="home-iframe"
              successUrl="/thank-you"
              successPath={isUpgradeMode ? `/upgrade/${upgradeBranch}` : undefined}
              email={user?.email}
              className="min-h-[400px] w-full"
            />
          ) : (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-[hsl(var(--iq-muted))]">
              Preparing secure checkout…
            </div>
          )}
        </div>

      </section>
    </LifeScaleMarketingLayout>
  );
}
