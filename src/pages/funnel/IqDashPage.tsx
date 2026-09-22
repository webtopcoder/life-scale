import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Brain, CheckCircle2, Coffee, Lightbulb, Lock, LogOut,
  MapPin, NotebookPen, Sparkles, Star, Timer, Trophy, Activity,
} from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { useAuth } from '@/context/AuthContext';
import { useBrainScore } from '@/hooks/useBrainScore';
import { getEntitlements } from '@/lib/entitlements';
import {
  CHALLENGE_LENGTH, buildFullPlan, summarize, taskLabel, taskPath,
  isReflectionDone, markReflectionDone, ackRest, isRestAcked,
  type TaskType, type DayPlan,
} from '@/lib/iqChallenge';
import { hasSeenReport } from '@/lib/reportSeen';
import MyReportCard from '@/components/dashboard/MyReportCard';
import AddonsSection from '@/components/dashboard/AddonsSection';
import InlineAddonCard from '@/components/addons/InlineAddonCard';
import MyCoachCard from '@/components/dashboard/MyCoachCard';
import { api } from '@/integrations/api/client';
import { iqTaskGuidance } from '@/lib/guidedChallenge';

const IQ_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

function taskIcon(t: TaskType) {
  switch (t) {
    case 'brain_teaser': return Lightbulb;
    case 'maze': return MapPin;
    case 'timed_maze': return Timer;
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
        <circle
          cx="50" cy="50" r={r}
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-700"
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-bold leading-none text-foreground">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">complete</span>
      </div>
    </div>
  );
}

export default function IqDashPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, progress, loading: brainLoading } = useBrainScore();

  const [gateLoading, setGateLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [startIso, setStartIso] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => { document.title = 'IQ Challenge — IQ'; }, []);

  // Access gate: require iq entitlement + iq test completion.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const [ent, completions] = await Promise.all([
        getEntitlements(user.id),
        api.get<Array<{ branch?: string; completedAt?: string; completed_at?: string }>>(
          '/dashboard/test-completions?branch=iq',
        ),
      ]);
      if (cancelled) return;
      const hasIq = ent.entitledBranches.has('iq');
      const comp = completions[0];
      const done = !!comp;
      if (!hasIq || !done) {
        navigate('/main-dashboard', { replace: true });
        return;
      }
      if (!hasSeenReport('iq')) {
        navigate('/iq-report', { replace: true });
        return;
      }
      setStartIso(comp.completedAt ?? comp.completed_at ?? new Date().toISOString());
      setAllowed(true);
      setGateLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, navigate]);

  const summary = useMemo(() => {
    if (!allowed || !startIso || !user?.id) return null;
    return summarize(user.id, startIso, progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, startIso, user?.id, progress, refreshTick]);

  const plans = useMemo(() => user?.id ? buildFullPlan(user.id) : [], [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  if (gateLoading || brainLoading || !summary) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background" style={IQ_THEME_STYLE}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { currentDay, overallPct, completedTasks, totalTasks, todayPlan, perDayCompleted } = summary;
  const todayDone = todayPlan.isRest
    ? isRestAcked(user!.id, todayPlan.day)
    : perDayCompleted[currentDay - 1] >= todayPlan.tasks.length;


  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col" style={IQ_THEME_STYLE}>
      <LifeScaleHeader
        wordmark="IQ"
        showTagline={false}

        left={
          <button
            type="button"
            onClick={() => navigate('/main-dashboard')}
            className="text-[12px] font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            Home
          </button>
        }
        right={
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        }
      />

      <main className="flex-1">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 pt-6 pb-16 space-y-6">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-[22px] sm:text-[28px] font-bold leading-tight">
              Welcome back.
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1">
              Your IQ sharpening journey, one day at a time.
            </p>
          </motion.div>

          <MyReportCard branch="iq" />
          <MyCoachCard />

          {/* Challenge header */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-5">
              <ProgressRing pct={overallPct} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  90-Day IQ Sharpening Challenge
                </div>
                <h2 className="text-[18px] sm:text-[22px] font-bold leading-tight mt-1">
                  Day {currentDay} of {CHALLENGE_LENGTH}
                </h2>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  Phase: <span className="text-foreground font-semibold">{todayPlan.phase}</span>
                  <span className="mx-2 opacity-40">·</span>
                  {completedTasks} / {totalTasks} tasks done
                </div>
                {/* Brain points strip */}
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
                acked={isRestAcked(user!.id, todayPlan.day)}
                onAck={() => { ackRest(user!.id, todayPlan.day); setRefreshTick(t => t + 1); }}
              />
            ) : (
              <div className="space-y-2">
                {todayPlan.tasks.map((t, i) => {
                  const doneCountForType = countDoneOfType(todayPlan, i, perDayCompleted[currentDay - 1] ?? 0);
                  const isReflection = t === 'reflection';
                  const done = isReflection
                    ? isReflectionDone(user!.id, todayPlan.day)
                    : doneCountForType;
                  return (
                    <TaskRow
                      key={`${t}-${i}`}
                      type={t}
                      day={todayPlan.day}
                      phase={todayPlan.phase}
                      done={!!done}
                      onStart={() => {
                        if (isReflection) {
                          markReflectionDone(user!.id, todayPlan.day);
                          setRefreshTick(x => x + 1);
                        } else {
                          navigate(taskPath(t));
                        }
                      }}
                    />
                  );
                })}
                {todayPlan.isMilestone && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-[12.5px] text-warning">
                    <Star className="h-3.5 w-3.5" />
                    Milestone day — every 10th day pushes you further.
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
              addonKey="addon_iq_30day_sharpening"
              teaser="The dashboard gives the rep. The planner gives the exact weak-category sequence and review rules."
            />
          </section>

          <AddonsSection branch="iq" />

          {/* Explore more */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-[16px] font-bold mb-1">Practice library</h3>
            <p className="mb-3 text-[12.5px] text-muted-foreground">Browse extra reps outside today’s assigned plan.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <ShortcutTile icon={Lightbulb} title="Brain Teasers" path="/iq-dash/brain-teasers" />
              <ShortcutTile icon={MapPin} title="Mazes" path="/iq-dash/mazes" />
              <ShortcutTile icon={Brain} title="Lessons" path="/iq-dash/lessons" />
              <ShortcutTile icon={Trophy} title="Achievements" path="/iq-dash/achievements" />
            </div>
          </section>

          {/* Recent activity */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-[16px] font-bold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent activity
            </h3>
            {progress.filter(p => p.status === 'completed').length === 0 ? (
              <p className="text-[13.5px] text-muted-foreground">
                Nothing yet. Start with today's tasks above.
              </p>
            ) : (
              <div className="space-y-2">
                {progress
                  .filter(p => p.status === 'completed')
                  .slice(-6)
                  .reverse()
                  .map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <p className="text-[13.5px] font-medium capitalize">
                            {p.content_type.replace('_', ' ')}{p.mode === 'timed' ? ' · timed' : ''}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                      {p.score !== null && p.score !== undefined && (
                        <span className="text-[13px] font-semibold">{p.score}%</span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// --- Subcomponents ---

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[12px]">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function TaskRow({ type, day, phase, done, onStart }: { type: TaskType; day: number; phase: string; done: boolean; onStart: () => void }) {
  const Icon = taskIcon(type);
  const guidance = iqTaskGuidance(type, day, phase);
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
          {done ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[14px] font-semibold">{taskLabel(type)}</div>
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
        <button
          type="button"
          onClick={onStart}
          className="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          {type === 'reflection' ? 'Mark done' : 'Open'} <ArrowRight className="h-3.5 w-3.5" />
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
        Rest is part of getting sharper. Your brain consolidates what you learned. Come back tomorrow.
      </p>
      {!acked && (
        <button
          type="button"
          onClick={onAck}
          className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground hover:bg-primary/90"
        >
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

function ChallengeTrack({
  plans, perDayCompleted, currentDay,
}: { plans: DayPlan[]; perDayCompleted: number[]; currentDay: number }) {
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
          <div
            key={p.day}
            title={
              p.isRest
                ? `Day ${p.day}: Rest`
                : `Day ${p.day}${p.isMilestone ? ' (Milestone)' : ''}: ${done}/${target} · ${p.tasks.map(taskLabel).join(', ')}`
            }
            className={[
              'aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold relative',
              bg, ring,
            ].join(' ')}
          >
            {p.isMilestone ? <Star className="h-3 w-3" /> : p.isRest ? <span className="opacity-60">·</span> : p.day}
          </div>
        );
      })}
    </div>
  );
}

function ShortcutTile({ icon: Icon, title, path }: { icon: any; title: string; path: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="mt-2 text-[13.5px] font-semibold">{title}</div>
    </button>
  );
}

// Helper: given todayPlan and an index, whether the task at that index is
// covered by the aggregated day completion count. We credit tasks left-to-right
// so the UI reflects "N of M done" clearly.
function countDoneOfType(_plan: DayPlan, index: number, dayTotalDone: number): boolean {
  return index < dayTotalDone;
}
