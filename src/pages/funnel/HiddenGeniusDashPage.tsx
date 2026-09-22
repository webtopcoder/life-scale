import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Brain, CheckCircle2, Coffee, Lightbulb, LogOut, MapPin,
  NotebookPen, RefreshCw, Sparkles, Star, Trophy, Activity, Zap,
} from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import MyReportCard from '@/components/dashboard/MyReportCard';
import AddonsSection from '@/components/dashboard/AddonsSection';
import InlineAddonCard from '@/components/addons/InlineAddonCard';
import MyCoachCard from '@/components/dashboard/MyCoachCard';
import { useAuth } from '@/context/AuthContext';
import { useHiddenGenius } from '@/context/HiddenGeniusContext';
import { useBrainScore } from '@/hooks/useBrainScore';
import { api } from '@/integrations/api/client';
import { getEntitlements } from '@/lib/entitlements';
import { hasSeenReport } from '@/lib/reportSeen';
import { loadHgResultSnapshot, resolveHgResult, ARCHETYPES } from '@/engine/hiddenGeniusScoring';
import { hgTaskGuidance } from '@/lib/guidedChallenge';
import {
  HG_CHALLENGE_LENGTH, buildHgPlan, summarizeHg,
  hgTaskLabel, hgTaskPath,
  isHgReflectionDone, markHgReflectionDone,
  isHgDivergentDone, markHgDivergentDone,
  isHgRestAcked, ackHgRest,
  type HgTaskType, type HgDayPlan,
} from '@/lib/hgChallenge';

const HG_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

function taskIcon(t: HgTaskType) {
  switch (t) {
    case 'pattern_puzzle': return MapPin;
    case 'analogy_drill': return Lightbulb;
    case 'divergent_prompt': return Zap;
    case 'lesson': return Brain;
    case 'reflection': return NotebookPen;
  }
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative h-[112px] w-[112px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="fill-none stroke-secondary" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} className="fill-none stroke-primary transition-[stroke-dashoffset] duration-700"
          strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-bold leading-none text-foreground">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">complete</span>
      </div>
    </div>
  );
}

export default function HiddenGeniusDashPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { reset } = useHiddenGenius();
  const { profile, progress, loading: brainLoading } = useBrainScore();

  const [gateLoading, setGateLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [startIso, setStartIso] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => { document.title = 'Genius Challenge — Genius'; }, []);

  useEffect(() => {
    if (!user?.id) {
      if (!hasSeenReport('hidden-genius') && loadHgResultSnapshot()) {
        navigate('/hg-report', { replace: true }); return;
      }
      // Anonymous fallback: use today as start
      setStartIso(new Date().toISOString());
      setAllowed(true); setGateLoading(false); return;
    }
    let cancelled = false;
    (async () => {
      const [ent, completions] = await Promise.all([
        getEntitlements(user.id),
        api.get<Array<{ branch: string; completedAt?: string; completed_at?: string }>>('/dashboard/test-completions'),
      ]);
      if (cancelled) return;
      const comp = completions?.find(c => c.branch === 'hidden-genius') ?? null;
      const ok = ent.entitledBranches.has('hidden-genius') && !!comp;
      if (!ok) { navigate('/main-dashboard', { replace: true }); return; }
      if (!hasSeenReport('hidden-genius')) { navigate('/hg-report', { replace: true }); return; }
      setStartIso(comp?.completedAt ?? comp?.completed_at ?? new Date().toISOString());
      setAllowed(true); setGateLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, navigate]);

  const result = resolveHgResult();
  const arch = result ? ARCHETYPES[result.primary] : null;

  const summary = useMemo(() => {
    if (!allowed || !startIso || !user?.id) return null;
    return summarizeHg(user.id, startIso, progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, startIso, user?.id, progress, tick]);

  const plans = useMemo(() => user?.id ? buildHgPlan(user.id) : [], [user?.id]);

  const handleSignOut = async () => { await signOut(); navigate('/', { replace: true }); };
  const handleRetake = () => { reset(); navigate('/hg-start'); };

  if (gateLoading || brainLoading || !summary) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background" style={HG_THEME_STYLE}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!allowed) return null;

  const { currentDay, overallPct, completedTasks, totalTasks, todayPlan, perDayCompleted } = summary;
  const todayDone = todayPlan.isRest
    ? isHgRestAcked(user!.id, todayPlan.day)
    : perDayCompleted[currentDay - 1] >= todayPlan.tasks.length;


  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col" style={HG_THEME_STYLE}>
      <LifeScaleHeader
        wordmark="Genius"
        showTagline={false}
        left={
          <button type="button" onClick={() => navigate('/main-dashboard')}
            className="text-[12px] font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-full hover:bg-secondary transition-colors">
            Home
          </button>
        }
        right={
          <button type="button" onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        }
      />

      <main className="flex-1">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 pt-6 pb-16 space-y-6">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h1 className="text-[22px] sm:text-[28px] font-bold leading-tight">Welcome back.</h1>
            <p className="text-[14px] text-muted-foreground mt-1">
              Your hidden genius, one day at a time.
            </p>
          </motion.div>

          <MyReportCard branch="hidden-genius" />
          <MyCoachCard />

          {arch && (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="text-[11px] uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Your genius signature
              </div>
              <h2 className="text-[18px] sm:text-[22px] font-bold mt-1">{arch.name}</h2>
              <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">{arch.thesis}</p>
              <InlineAddonCard
                addonKey="addon_genius_archetype_deep_dive"
                teaser="What your archetype is most often mistaken for, and why it matters."
              />
            </section>

          )}

          {/* Challenge header */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-5">
              <ProgressRing pct={overallPct} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  90-Day Genius Practice
                </div>
                <h2 className="text-[18px] sm:text-[22px] font-bold leading-tight mt-1">
                  Day {currentDay} of {HG_CHALLENGE_LENGTH}
                </h2>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  Phase: <span className="text-foreground font-semibold">{todayPlan.phase}</span>
                  <span className="mx-2 opacity-40">·</span>
                  {completedTasks} / {totalTasks} tasks done
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatChip icon={Sparkles} label="Brain Points" value={String(profile?.xp ?? 0)} />
                  <StatChip icon={Trophy} label="Level" value={String(profile?.level ?? 1)} />
                  <StatChip icon={Activity} label="Streak" value={`${profile?.current_streak ?? 0}d`} />
                </div>
              </div>
            </div>
          </section>

          {/* Today's tasks */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold">Today's tasks</h3>
              {todayDone && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <CheckCircle2 className="h-3 w-3" /> Day complete
                </span>
              )}
            </div>

            {todayPlan.isRest ? (
              <RestDayCard
                acked={isHgRestAcked(user!.id, todayPlan.day)}
                onAck={() => { ackHgRest(user!.id, todayPlan.day); setTick(t => t + 1); }}
              />
            ) : (
              <div className="space-y-2">
                {todayPlan.tasks.map((t, i) => {
                  const doneCountForType = i < (perDayCompleted[currentDay - 1] ?? 0);
                  const isReflection = t === 'reflection';
                  const isDivergent = t === 'divergent_prompt';
                  const done = isReflection
                    ? isHgReflectionDone(user!.id, todayPlan.day)
                    : isDivergent
                      ? isHgDivergentDone(user!.id, todayPlan.day)
                      : doneCountForType;
                  return (
                    <TaskRow
                      key={`${t}-${i}`}
                      type={t}
                      archetypeName={arch?.name}
                      done={!!done}
                      onStart={() => {
                        if (isReflection) { markHgReflectionDone(user!.id, todayPlan.day); setTick(x => x + 1); }
                        else if (isDivergent) { markHgDivergentDone(user!.id, todayPlan.day); setTick(x => x + 1); }
                        else navigate(hgTaskPath(t));
                      }}
                    />
                  );
                })}
                {todayPlan.isMilestone && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-[12.5px] text-warning">
                    <Star className="h-3.5 w-3.5" />
                    Archetype checkpoint — a milestone every 10 days.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 90-day track */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold">Your 90-day track</h3>
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                <LegendDot className="bg-primary" label="Done" />
                <LegendDot className="ring-2 ring-primary bg-transparent" label="Today" />
                <LegendDot className="bg-warning/60" label="Missed" />
                <LegendDot className="bg-secondary" label="Future" />
              </div>
            </div>
            <ChallengeTrack plans={plans} perDayCompleted={perDayCompleted} currentDay={currentDay} />
            <InlineAddonCard
              addonKey="addon_genius_30day_practice"
              teaser="The dashboard gives the rep. The planner turns your signature into a precise 30-day sequence."
            />
          </section>

          <AddonsSection branch="hidden-genius" />

          {/* Explore more */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-[16px] font-bold mb-1">Practice library</h3>
            <p className="mb-3 text-[12.5px] text-muted-foreground">Browse extra drills and labs that develop your signature outside today’s plan.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <HgTile icon={Lightbulb} title="Divergent Drills" to="/hg-dash/drills" />
              <HgTile icon={MapPin} title="Pattern Puzzles" to="/hg-dash/patterns" />
              <HgTile icon={Brain} title="Lessons" to="/hg-dash/lessons" />
              <HgTile icon={Sparkles} title="Archetype Lab" to="/hg-dash/archetype-lab" />
              <HgTile icon={Trophy} title="Achievements" to="/hg-dash/achievements" />
            </div>
          </section>


          <button
            onClick={handleRetake}
            className="w-full text-center text-[13px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 py-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retake the test
          </button>
        </div>
      </main>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[12px]">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function TaskRow({ type, done, onStart, archetypeName }:
  { type: HgTaskType; done: boolean; onStart: () => void; archetypeName?: string }) {
  const Icon = taskIcon(type);
  const guidance = hgTaskGuidance(type, archetypeName);
  return (
    <div className={[
      'flex flex-col gap-3 rounded-xl border p-3 transition-colors sm:flex-row sm:items-center',
      done ? 'border-primary/30 bg-primary/5' : 'border-border bg-background hover:border-primary/40',
    ].join(' ')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className={[
          'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
          done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
        ].join(' ')}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[14px] font-semibold">{hgTaskLabel(type)}</div>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">{guidance.time}</span>
          </div>
          <div className="mt-1 text-[12.5px] font-medium text-foreground">{done ? 'Completed today.' : guidance.goal}</div>
          {!done && <div className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{guidance.why} {guidance.action}</div>}
          {!done && guidance.prompt && (
            <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">{guidance.prompt}</div>
          )}
        </div>
      </div>
      {!done && (
        <button type="button" onClick={onStart}
          className="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto">
          {type === 'reflection' || type === 'divergent_prompt' ? 'Mark done' : 'Open'} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function RestDayCard({ acked, onAck }: { acked: boolean; onAck: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-5 text-center">
      <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Coffee className="h-5 w-5" />
      </div>
      <div className="mt-3 text-[15px] font-semibold">Rest day</div>
      <p className="mt-1 text-[12.5px] text-muted-foreground max-w-sm mx-auto">
        Your best ideas often show up when you stop pushing. Come back tomorrow.
      </p>
      {!acked && (
        <button type="button" onClick={onAck}
          className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground hover:bg-primary/90">
          Got it
        </button>
      )}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={['h-2.5 w-2.5 rounded-full inline-block', className].join(' ')} />
      {label}
    </span>
  );
}

function ChallengeTrack({ plans, perDayCompleted, currentDay }:
  { plans: HgDayPlan[]; perDayCompleted: number[]; currentDay: number }) {
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {plans.map((p, idx) => {
        const done = perDayCompleted[idx] ?? 0;
        const target = p.tasks.length;
        const isPast = p.day < currentDay;
        const isToday = p.day === currentDay;
        const fullyDone = !p.isRest && target > 0 && done >= target;
        const missed = isPast && !p.isRest && done < target;

        let bg = 'bg-secondary text-muted-foreground';
        if (fullyDone) bg = 'bg-primary text-primary-foreground';
        else if (p.isRest && isPast) bg = 'bg-muted text-muted-foreground';
        else if (missed) bg = 'bg-warning/50 text-foreground';

        const ring = isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : '';

        return (
          <div key={p.day}
            title={p.isRest ? `Day ${p.day}: Rest` : `Day ${p.day}${p.isMilestone ? ' (Milestone)' : ''}: ${done}/${target}`}
            className={['aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold relative', bg, ring].join(' ')}>
            {p.isMilestone ? <Star className="h-3 w-3" /> : p.isRest ? <span className="opacity-60">·</span> : p.day}
          </div>
        );
      })}
    </div>
  );
}

function HgTile({ icon: Icon, title, to }: { icon: any; title: string; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-background hover:bg-secondary transition-colors p-3 flex flex-col items-start gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-[12.5px] font-semibold">{title}</span>
    </Link>
  );
}
