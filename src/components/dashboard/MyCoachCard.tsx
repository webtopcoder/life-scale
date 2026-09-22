import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEntitlements, type Tier } from '@/lib/entitlements';

/**
 * Dashboard entry card for the AI Coach.
 * Visible on all three test dashboards — shows an upgrade path for users without coach access.
 */
export default function MyCoachCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getEntitlements(user.id).then((ent) => {
      if (!cancelled) setTier(ent.tier);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const hasCoach = tier === 'complete' || tier === 'focus';

  return (
    <button
      type="button"
      onClick={() => navigate('/coach')}
      className="group relative w-full text-left rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {hasCoach ? <Sparkles className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {hasCoach ? 'Your coach' : 'On Focus & Complete'}
          </div>
          <h3 className="mt-0.5 text-[16px] sm:text-[18px] font-bold text-foreground leading-tight">
            AI Coach
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {hasCoach
              ? 'A private coach that guides your weekly plan and answers anything about your results.'
              : 'Upgrade to Focus or Complete to unlock a private coach that guides your plan and reads your reports.'}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
