import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, LogOut } from 'lucide-react';
import { BranchOrb } from '@/components/marketing/BranchOrb';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getEntitlements, type Entitlements } from '@/lib/entitlements';
import { listCompletions, syncLocalCompletions, type Branch } from '@/lib/testCompletions';
import AllAddonsSection from '@/components/dashboard/AllAddonsSection';
import {
  CATEGORIES,
  coreScaleOfCategory,
  scalesInCategory,
  scalesInLiveCategories,
  type CategoryDef,
} from '@/config/scales';

const BH_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

const LIVE_CATEGORIES = CATEGORIES.filter((c) => c.status === 'live');
const COMING_CATEGORIES = CATEGORIES.filter((c) => c.status !== 'live');

export default function MainDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [completed, setCompleted] = useState<Set<Branch>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Your categories — Life Scale';
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      await syncLocalCompletions(user.id);
      const [ent, done] = await Promise.all([
        getEntitlements(user.id),
        listCompletions(user.id),
      ]);
      if (cancelled) return;
      setEntitlements(ent);
      setCompleted(done);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const owned = entitlements?.entitledCategories ?? new Set<string>();
  const hasPlan = Boolean(entitlements?.hasSubscription) && owned.size > 0;

  const openCategory = (cat: CategoryDef, isOwned: boolean) => {
    if (isOwned) navigate(`/dash/${cat.key}`);
    else navigate(`/upgrade/${coreScaleOfCategory(cat.key).key}`);
  };

  return (
    <div
      className="min-h-[100dvh] bg-background text-foreground flex flex-col"
      style={BH_THEME_STYLE}
    >
      <LifeScaleHeader
        wordmark="Life Scale"
        showTagline={false}
        right={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 rounded-full px-3 text-[12px] text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        }
      />

      <main className="flex-1">
        <div className="w-full max-w-5xl mx-auto px-5 pt-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8 space-y-2"
          >
            <h1 className="text-[26px] sm:text-[32px] font-bold leading-tight text-foreground">
              Welcome back.
            </h1>
            <p className="text-[15px] text-muted-foreground">
              Pick a category to open. Each one holds three tests.
            </p>
          </motion.div>

          {!loading && !hasPlan && (
            <button
              type="button"
              onClick={() => navigate('/choose-tier')}
              className="mb-6 flex w-full items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:border-primary/60"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-foreground">Choose a plan to unlock a category.</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  One plan covers all three tests inside the category you pick.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
            </button>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {LIVE_CATEGORIES.map((cat, i) => {
              const scales = scalesInCategory(cat.key);
              const isOwned = !loading && owned.has(cat.key);
              const done = scales.filter((s) => completed.has(s.key)).length;

              return (
                <motion.button
                  key={cat.key}
                  type="button"
                  onClick={() => !loading && openCategory(cat, isOwned)}
                  disabled={loading}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 * i }}
                  className={[
                    'relative flex w-full flex-col gap-4 rounded-xl border p-5 text-left transition-all sm:flex-row sm:items-center sm:gap-6 sm:p-6',
                    isOwned
                      ? 'bg-card border-border hover:border-primary/50 hover:shadow-md'
                      : 'bg-card border-border opacity-70 hover:opacity-90',
                    loading ? 'cursor-wait' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <div className="flex shrink-0 items-center -space-x-3">
                    {scales.map((s) => (
                      <BranchOrb
                        key={s.key}
                        branch={s.key}
                        size={72}
                        className={isOwned ? 'h-14 w-14' : 'h-14 w-14 grayscale'}
                      />
                    ))}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] font-bold leading-tight text-foreground">
                        {cat.name} IQ
                      </h2>
                      {!isOwned && !loading && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{cat.tagline}</p>
                    <p className="text-[12px] font-semibold text-muted-foreground">
                      {scales.map((s) => s.shortName).join(' · ')}
                    </p>
                    {!loading && (
                      <span
                        className={[
                          'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          isOwned ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground',
                        ].join(' ')}
                      >
                        {isOwned
                          ? `Included in your plan · ${done} of ${scales.length} tests taken`
                          : 'Unlock this category'}
                      </span>
                    )}
                  </div>

                  <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
                </motion.button>
              );
            })}

            {COMING_CATEGORIES.length > 0 && (
              <p className="rounded-lg border border-dashed border-border px-4 py-3 text-center text-[13px] text-muted-foreground">
                Coming soon: {COMING_CATEGORIES.map((c) => `${c.name} IQ`).join(', ')}.
              </p>
            )}
          </div>

          <AllAddonsSection
            branches={scalesInLiveCategories()
              .map((s) => s.key)
              .filter((b) => (entitlements?.entitledBranches ?? new Set<Branch>()).has(b) && completed.has(b))}
          />
        </div>
      </main>
    </div>
  );
}
