import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, LogOut } from 'lucide-react';
import { BranchOrb } from '@/components/marketing/BranchOrb';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getEntitlements, type Entitlements } from '@/lib/entitlements';
import { listCompletions, syncLocalCompletions, type Branch } from '@/lib/testCompletions';
import AllAddonsSection from '@/components/dashboard/AllAddonsSection';
import MyCoachCard from '@/components/dashboard/MyCoachCard';
import {
  findCategory,
  scalesInCategory,
  type ScaleDef,
  type ScaleRole,
} from '@/config/scales';

const ROLE_LABEL: Record<ScaleRole, string> = {
  core: 'Core test',
  health: 'Health screen',
  hidden: 'Hidden strengths',
};

const BH_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

export default function CategoryHubPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const { user, signOut } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [completed, setCompleted] = useState<Set<Branch>>(new Set());
  const [loading, setLoading] = useState(true);

  const cat = findCategory(category);
  const scales = cat ? scalesInCategory(cat.key) : [];

  useEffect(() => {
    if (cat) document.title = `${cat.name} IQ — Life Scale`;
  }, [cat]);

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

  if (!cat) return null;

  const done = scales.filter((s) => completed.has(s.key)).length;
  const pct = Math.round((done / Math.max(scales.length, 1)) * 100);

  const openScale = (s: ScaleDef) => {
    if (completed.has(s.key)) navigate(s.dashPath);
    else navigate(s.startPath, { state: { from: `/dash/${cat.key}` } });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col" style={BH_THEME_STYLE}>
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
        <div className="w-full max-w-3xl mx-auto px-5 pt-6 pb-12">
          <button
            type="button"
            onClick={() => navigate('/main-dashboard')}
            className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All categories
          </button>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-2"
          >
            <h1 className="text-[26px] sm:text-[32px] font-bold leading-tight text-foreground">
              {cat.name} IQ
            </h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{cat.tagline}</p>
          </motion.div>

          {!loading && (
            <div className="mt-5 rounded-xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-foreground">
                  {done} of {scales.length} tests taken
                </span>
                <span className="text-[12px] text-muted-foreground">{pct}% complete</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {scales.map((s, i) => {
              const isDone = completed.has(s.key);
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
                >
                  <BranchOrb branch={s.key} size={72} className="h-14 w-14 shrink-0" />

                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {ROLE_LABEL[s.role]}
                    </span>
                    <h2 className="text-[17px] font-bold leading-tight text-foreground">{s.shortName}</h2>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{s.blurb}</p>
                    {!loading && (
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          isDone ? 'bg-primary/10 text-primary' : 'bg-warning/15 text-warning',
                        ].join(' ')}
                      >
                        {isDone ? 'Ready' : 'Not started'}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <button
                      type="button"
                      onClick={() => openScale(s)}
                      disabled={loading}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {isDone ? 'Open dashboard' : 'Start test'} <ArrowRight className="h-4 w-4" />
                    </button>
                    {isDone && (
                      <button
                        type="button"
                        onClick={() => navigate(s.reportPath)}
                        className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        View report
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6">
            <MyCoachCard />
          </div>

          <AllAddonsSection
            branches={scales
              .map((s) => s.key)
              .filter((b) => completed.has(b) && (entitlements?.entitledBranches ?? new Set<Branch>()).has(b))}
          />
        </div>
      </main>
    </div>
  );
}
