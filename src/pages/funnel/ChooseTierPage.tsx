import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, FileText, Bot, Sparkles, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import LifeScaleMarketingLayout from '@/components/marketing/LifeScaleMarketingLayout';
import { setFunnelValue, getFunnelValue, type SelectedTier } from '@/lib/funnelState';
import { useAuth } from '@/context/AuthContext';
import { getEntitlements } from '@/lib/entitlements';
import { api } from '@/integrations/api/client';
import { BranchOrb } from '@/components/marketing/BranchOrb';
import type { Branch } from '@/lib/testCompletions';
import {
  SCALES,
  isScaleKey,
  isCategoryKey,
  liveCategories,
  scalesInCategory,
  coreScaleOfCategory,
  getScale,
  categoryFromScale,
  getCategory,
  type CategoryKey,
} from '@/config/scales';

type Tier = {
  id: SelectedTier;
  name: string;
  tagline: string;
  icon: typeof FileText;
  benefits: string[];
  highlighted?: boolean;
};

const TIERS: Tier[] = [
  {
    id: 'complete',
    name: 'Complete',
    tagline: 'Every scale, every category.',
    icon: Sparkles,
    highlighted: true,
    benefits: [
      'Full reports from every live scale',
      'A dashboard for each scale you take',
      'A personalized AI coach trained on your results, 24/7',
    ],
  },
  {
    id: 'focus',
    name: 'Focus',
    tagline: 'One category, with your AI coach.',
    icon: MessageCircle,
    benefits: [
      'All three tests in one category',
      'A dashboard for each test you take',
      'A personalized AI coach trained on your results, 24/7',
    ],
  },
  {
    id: 'guide',
    name: 'Guide',
    tagline: 'One category, with coaching built in.',
    icon: Bot,
    benefits: ['All three tests in one category', 'A dashboard for each test you take', 'Static coaching kit for your plan'],
  },
  {
    id: 'insight',
    name: 'Insight',
    tagline: 'One category, the essentials.',
    icon: FileText,
    benefits: ['All three tests in one category', 'A dashboard for each test you take', 'Access on any device'],
  },
];


const CATEGORY_OPTIONS = liveCategories().map((c) => ({
  id: c.key,
  title: `${c.name} IQ`,
  tagline: c.tagline,
  scales: scalesInCategory(c.key),
}));

const BRANCH_LABEL: Record<Branch, string> = Object.fromEntries(
  SCALES.map((s) => [s.key, s.name]),
) as Record<Branch, string>;

function isBranch(v: string | undefined): v is Branch {
  return isScaleKey(v);
}

/** The route param may be a scale key or a category key. */
function resolveParamBranch(v: string | undefined): Branch | null {
  if (isBranch(v)) return v;
  if (isCategoryKey(v)) return coreScaleOfCategory(v).key;
  return null;
}

export default function ChooseTierPage({ previewMode = false }: { previewMode?: boolean }) {
  const navigate = useNavigate();
  const params = useParams<{ branch?: string }>();
  const { user } = useAuth();

  const upgradeBranch: Branch | null = previewMode ? null : resolveParamBranch(params.branch);
  const isUpgradeMode = upgradeBranch !== null;

  const [checking, setChecking] = useState(!previewMode);
  const [showDeltaUpgrade, setShowDeltaUpgrade] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<SelectedTier | null>(null);
  const [preselectedTier] = useState<SelectedTier | null>(
    () => (getFunnelValue('selectedTier') as SelectedTier | null) ?? null,
  );
  const [submitting, setSubmitting] = useState(false);

  // Scroll to top when the category picker appears after selecting a non-Complete plan.
  useEffect(() => {
    if (selectedTier && selectedTier !== 'complete') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedTier]);


  // On mount: verify auth, read has_used_trial, and — in upgrade mode — check entitlements.
  useEffect(() => {
    if (previewMode) return;
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        // In homepage-funnel mode we need to be signed in first.
        if (!isUpgradeMode) navigate('/auth-gate', { replace: true });
        return;
      }
      const [ent, profile] = await Promise.all([
        getEntitlements(user.id),
        api.get<{ hasUsedTrial?: boolean; has_used_trial?: boolean }>('/dashboard/profile'),
      ]);
      if (cancelled) return;

      // Homepage-funnel: if user already has an active subscription, send them to the dash.
      if (!isUpgradeMode && ent.hasSubscription) {
        navigate('/main-dashboard', { replace: true });
        return;
      }

      // Upgrade mode branch checks.
      if (isUpgradeMode && upgradeBranch) {
        if (ent.entitledBranches.has(upgradeBranch)) {
          navigate(getScale(upgradeBranch).startPath, { replace: true });
          return;
        }
        setShowDeltaUpgrade(ent.hasSubscription);
      }

      setHasUsedTrial(Boolean(profile?.hasUsedTrial ?? profile?.has_used_trial));
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [isUpgradeMode, upgradeBranch, user?.id, navigate, previewMode]);


  const grantAndGoCategory = (tier: SelectedTier, category: CategoryKey) =>
    grantAndGo(tier, coreScaleOfCategory(category).key);

  const grantAndGo = async (tier: SelectedTier, branch: Branch | null) => {
    if (previewMode) {
      setFunnelValue('selectedTier', tier);
      if (branch) setFunnelValue('selectedTest', branch);
      navigate('/preview-signup/trial-offer');
      return;
    }
    if (!user?.id) {
      toast.error('Please sign in first.');
      navigate('/auth-gate');
      return;
    }
    setSubmitting(true);
    setFunnelValue('selectedTier', tier);
    if (branch) setFunnelValue('selectedTest', branch);
    navigate('/trial-offer');
  };

  const handleTierSelect = (t: Tier) => {
    if (isUpgradeMode && upgradeBranch) {
      // Existing upgrade flow — pick tier, then hop to trial page (unchanged).
      setFunnelValue('selectedTier', t.id);
      navigate(`/upgrade/${upgradeBranch}/trial`);
      return;
    }
    if (t.id === 'complete') {
      if (previewMode) {
        setFunnelValue('selectedTier', 'complete');
        navigate('/preview-signup/trial-offer');
        return;
      }
      // No branch pick needed — straight to the trial step.
      void grantAndGo('complete', null);
      return;
    }

    // Insight / Guide need a branch pick.
    setSelectedTier(t.id);
  };

  const handleDeltaUpgrade = () => {
    if (!user?.id || !upgradeBranch) return;
    setFunnelValue('selectedTier', 'complete');
    navigate(`/upgrade/${upgradeBranch}/trial`);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Delta-upgrade card: existing subscriber unlocking another branch.
  if (isUpgradeMode && showDeltaUpgrade && upgradeBranch) {
    return (
      <LifeScaleMarketingLayout onStart={() => navigate('/main-dashboard')}>
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
              Unlock the {BRANCH_LABEL[upgradeBranch]}.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
              Upgrade to Complete to add the {getCategory(categoryFromScale(upgradeBranch)).name} IQ category
              — and every other category — to your plan. You keep everything you already have.
            </p>

          </div>

          <article
            className="iq-card relative mx-auto mt-10 flex max-w-md flex-col p-7"
            style={{ boxShadow: '0 24px 48px -20px hsl(var(--iq-cobalt) / 0.4)', borderColor: 'hsl(var(--iq-cobalt))' }}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(var(--iq-emerald))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Upgrade to Complete
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[hsl(var(--iq-mint-wash))] text-[hsl(var(--iq-cobalt))]">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-[hsl(var(--iq-ink))]">Complete</h3>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--iq-muted))]">
              Every scale, every category, all coaching.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-[hsl(var(--iq-ink-soft))]">
              {['Full reports from every live scale', 'A dashboard for each scale you take', 'A personalized AI coach trained on your results, 24/7'].map((b) => (

                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--iq-emerald))]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <button
                onClick={handleDeltaUpgrade}
                className="iq-btn-primary inline-flex h-10 w-full items-center justify-center gap-1.5 px-4 text-sm disabled:opacity-60"
              >
                <>Continue to payment <ArrowRight className="h-4 w-4" /></>
              </button>
            </div>
            <button
              onClick={() => navigate('/main-dashboard')}
              className="mt-3 text-xs text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
            >
              Not now
            </button>
          </article>
        </section>
      </LifeScaleMarketingLayout>
    );
  }

  // Branch picker for Insight / Guide (homepage-funnel mode only).
  if (!isUpgradeMode && selectedTier && selectedTier !== 'complete') {
    return (
      <LifeScaleMarketingLayout onStart={() => navigate('/main-dashboard')}>
        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 md:py-20">
          <button
            onClick={() => setSelectedTier(null)}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
              Which category do you want?
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
              Your {selectedTier === 'focus' ? 'Focus' : selectedTier === 'guide' ? 'Guide' : 'Insight'} plan covers one
              category — all three tests inside it. Pick the one that fits you best.
            </p>

          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => grantAndGoCategory(selectedTier, c.id)}
                disabled={submitting}
                className="iq-card flex flex-col items-center gap-3 p-6 text-center transition-all hover:border-[hsl(var(--iq-cobalt))] hover:shadow-md disabled:opacity-60"
              >
                <div className="flex items-center -space-x-3">
                  {c.scales.map((s) => (
                    <BranchOrb key={s.key} branch={s.key} size={72} className="h-14 w-14" />
                  ))}
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--iq-ink))]">{c.title}</h3>
                <p className="text-xs leading-relaxed text-[hsl(var(--iq-muted))]">{c.tagline}</p>
                <ul className="mt-1 space-y-1 text-xs text-[hsl(var(--iq-ink-soft))]">
                  {c.scales.map((s) => (
                    <li key={s.key}>{s.shortName}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </section>
      </LifeScaleMarketingLayout>
    );
  }

  // Full tier picker.
  const heading = hasUsedTrial ? 'Choose your plan.' : 'Pick what fits you best.';
  const sub = hasUsedTrial
    ? 'Pick the option that matches how much support you want.'
    : 'Choose the option that matches how much support you want after your test.';

  return (
    <LifeScaleMarketingLayout onStart={() => navigate(isUpgradeMode ? '/main-dashboard' : '/auth-gate')}>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">{heading}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">{sub}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => {
            const Icon = t.icon;
            const isPreselected = !isUpgradeMode && preselectedTier === t.id;
            return (
              <article
                key={t.id}
                className="iq-card relative flex flex-col p-7"
                style={
                  isPreselected || t.highlighted
                    ? { boxShadow: '0 24px 48px -20px hsl(var(--iq-cobalt) / 0.4)', borderColor: 'hsl(var(--iq-cobalt))' }
                    : {}
                }
              >
                {isPreselected ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(var(--iq-cobalt))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Your pick
                  </span>
                ) : t.highlighted ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(var(--iq-emerald))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                ) : null}
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[hsl(var(--iq-mint-wash))] text-[hsl(var(--iq-cobalt))]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-[hsl(var(--iq-ink))]">{t.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--iq-muted))]">{t.tagline}</p>

                <ul className="mt-5 space-y-2.5 text-sm text-[hsl(var(--iq-ink-soft))]">
                  {t.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--iq-emerald))]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <button
                    onClick={() => handleTierSelect(t)}
                    disabled={submitting}
                    className={
                      (t.highlighted ? 'iq-btn-primary' : 'iq-btn-outline') +
                      ' inline-flex h-10 w-full items-center justify-center gap-1.5 px-4 text-sm disabled:opacity-60'
                    }
                  >
                    {submitting ? 'One moment…' : (<>Choose {t.name} <ArrowRight className="h-4 w-4" /></>)}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </LifeScaleMarketingLayout>
  );
}
