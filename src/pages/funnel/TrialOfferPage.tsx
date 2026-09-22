import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import LifeScaleMarketingLayout from '@/components/marketing/LifeScaleMarketingLayout';
import { getFunnelValue, setFunnelValue, type SelectedTrial, type SelectedTier } from '@/lib/funnelState';
import { useAuth } from '@/context/AuthContext';
import type { Branch } from '@/lib/testCompletions';
import { PRICING_MAY_VARY } from '@/content/legalCopy';
import { isScaleKey } from '@/config/scales';

import { trialsForTier, renewalPrice, type TrialOffer } from '@/lib/trialPricing';

type Trial = TrialOffer;

function isBranch(v: string | undefined | null): v is Branch {
  return isScaleKey(v ?? undefined);
}

export default function TrialOfferPage({ previewMode = false }: { previewMode?: boolean }) {
  const navigate = useNavigate();
  const params = useParams<{ branch?: string }>();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState<SelectedTrial | null>(null);

  const tier = (getFunnelValue('selectedTier') as SelectedTier | null) ?? 'complete';
  const renewal = renewalPrice(tier);
  const trials = trialsForTier(tier);

  // Branch source of truth for the checkout URL: the /upgrade/:branch/trial param.
  const branchFromUrl = isBranch(params.branch) ? params.branch : null;

  const handleSelect = (t: Trial) => {
    setFunnelValue('selectedTrial', t.id);

    if (previewMode) {
      navigate('/preview-signup/checkout');
      return;
    }

    if (!user?.id || !user?.email) {
      toast.error('Please sign in to start your trial.');
      navigate('/auth-gate');
      return;
    }

    setSubmitting(t.id);
    navigate(branchFromUrl ? `/upgrade/${branchFromUrl}/checkout` : '/checkout-summary');
  };

  return (
    <LifeScaleMarketingLayout onStart={() => navigate('/choose-test')}>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
            Start your trial.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
            Pick a trial length. All trials renew at {renewal}/month after they end. Cancel any time.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {trials.map((t) => (
            <article
              key={t.id}
              className="iq-card relative flex flex-col p-7"
              style={t.best ? { boxShadow: '0 24px 48px -20px hsl(var(--iq-cobalt) / 0.4)', borderColor: 'hsl(var(--iq-cobalt))' } : {}}
            >
              {t.best && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(var(--iq-emerald))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Best value
                </span>
              )}
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--iq-muted))]">
                {t.duration}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-[hsl(var(--iq-ink))]">{t.price}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--iq-muted))]">{t.headline}</p>
              <p className="mt-3 text-xs text-[hsl(var(--iq-muted))]">Then {renewal}/month. Cancel any time.</p>

              <div className="mt-7">
                <button
                  onClick={() => handleSelect(t)}
                  disabled={submitting !== null}
                  className={
                    (t.best ? 'iq-btn-primary' : 'iq-btn-outline') +
                    ' inline-flex h-10 w-full items-center justify-center gap-1.5 px-4 text-sm disabled:opacity-60'
                  }
                >
                  {submitting === t.id ? 'One moment…' : (<>Continue with {t.duration} <ArrowRight className="h-4 w-4" /></>)}
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-[hsl(var(--iq-muted))]">
          {PRICING_MAY_VARY}
        </p>
      </section>
    </LifeScaleMarketingLayout>
  );
}
