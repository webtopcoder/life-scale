import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEntitlements, type Tier } from '@/lib/entitlements';
import { BrainCoachChat } from '@/components/dashboard/BrainCoachChat';

export default function CoachPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'AI Coach — Life Scale'; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) { navigate('/auth-gate', { replace: true }); return; }
    let cancelled = false;
    (async () => {
      const ent = await getEntitlements(user.id);
      if (cancelled) return;
      setTier(ent.tier);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [authLoading, user?.id, navigate]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[hsl(var(--iq-bg))]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--iq-cobalt))] border-t-transparent" />
      </div>
    );
  }

  const hasAccess = tier === 'complete' || tier === 'focus';

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--iq-bg))]">
      <div className="border-b border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/main-dashboard')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--iq-cobalt))]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {hasAccess ? (
        <div className="mx-auto max-w-5xl px-4 py-6">
          <BrainCoachChat />
        </div>
      ) : (
        <div className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-2xl border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] p-8 text-center shadow-[0_10px_30px_-15px_rgba(15,23,42,0.15)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--iq-mint-wash))]">
              <Lock className="h-5 w-5 text-[hsl(var(--iq-cobalt))]" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-[hsl(var(--iq-ink))]">AI Coach is on Focus and Complete</h1>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--iq-muted))]">
              A private coach that reads your reports and guides your weekly plan.
              Upgrade to Focus ($28.99/mo for one scale) or Complete to unlock unlimited chats.
            </p>
            <button
              onClick={() => navigate('/upgrade/iq')}
              className="iq-btn-primary mt-6 inline-flex h-11 w-full items-center justify-center gap-1.5 text-sm font-medium"
            >
              Upgrade my plan <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/main-dashboard')}
              className="mt-3 text-xs text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
