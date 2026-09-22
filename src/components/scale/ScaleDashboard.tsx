// Generic branch dashboard for registry-driven scales.
// Hero content is supplied per scale; everything else (90-day arc, daily tasks,
// progress, report card, add-ons) is shared.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Flame, Target } from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import MyReportCard from '@/components/dashboard/MyReportCard';
import AddonsSection from '@/components/dashboard/AddonsSection';
import { addonsForBranch } from '@/lib/addons';
import InlineAddonCard from '@/components/addons/InlineAddonCard';
import { useAuth } from '@/context/AuthContext';
import { getScale, scaleThemeStyle, type ScaleKey } from '@/config/scales';
import {
  buildScalePlan, summarizeScaleChallenge, cycleDayDateKey,
  isTaskDone, markTaskDone, PHASE_BLURB, CHALLENGE_LENGTH,
  type Phase, type ScaleTask,
} from '@/lib/scaleChallenge';
import { showXpToast } from '@/lib/xpToast';

const START_PREFIX = 'iqscale.scalestart.';

function startIsoFor(scale: ScaleKey): string {
  const key = START_PREFIX + scale;
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const iso = new Date().toISOString();
    localStorage.setItem(key, iso);
    return iso;
  } catch {
    return new Date().toISOString();
  }
}

const PHASES: Phase[] = ['Foundations', 'Build', 'Mastery'];

export interface ScaleDashboardProps {
  scale: ScaleKey;
  /** Hero block: score, statuses, or archetype. */
  hero: React.ReactNode;
  /** Priority areas from the user's result — biases the daily tasks. */
  priorityAreas: string[];
  /** One line naming what the plan is working on. */
  focusLine: string;
  /** Optional extra sections rendered under the daily tasks. */
  children?: React.ReactNode;
}

export default function ScaleDashboard({
  scale, hero, priorityAreas, focusLine, children,
}: ScaleDashboardProps) {
  const def = getScale(scale);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);

  useEffect(() => { document.title = `${def.shortName} Dashboard — Life Scale`; }, [def.shortName]);

  const startIso = useMemo(() => startIsoFor(scale), [scale]);
  const plan = useMemo(
    () => buildScalePlan(scale, user?.id ?? 'anon', priorityAreas),
    [scale, user?.id, priorityAreas],
  );
  const summary = useMemo(
    () => summarizeScaleChallenge(scale, plan, startIso),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scale, plan, startIso],
  );

  const teaserAddon = useMemo(() => addonsForBranch(scale)[0] ?? null, [scale]);

  const todayKey = cycleDayDateKey(summary.position.cycleStartIso, summary.position.cycleDay);

  const complete = (t: ScaleTask) => {
    if (isTaskDone(scale, todayKey, t.key)) return;
    markTaskDone(scale, todayKey, t.key);
    showXpToast({ amount: t.xp, label: t.label });
    setRefresh((n) => n + 1);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={scaleThemeStyle(scale)}>
      <LifeScaleHeader
        wordmark={def.shortName}
        left={
          <Link to="/main-dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Home
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back.</h1>
          <p className="text-sm text-muted-foreground mt-1">{focusLine}</p>
        </div>

        {hero}

        <MyReportCard branch={scale} />

        {/* 90-day arc */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Your 90-day plan</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Day {summary.position.cycleDay} of {CHALLENGE_LENGTH} · {summary.phase}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{summary.percentComplete}%</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Complete</div>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${summary.percentComplete}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PHASES.map((p) => {
              const active = p === summary.phase;
              return (
                <div
                  key={p}
                  className={[
                    'rounded-xl border p-3',
                    active ? 'border-primary bg-primary/5' : 'border-border bg-background',
                  ].join(' ')}
                >
                  <div className={['text-[13px] font-semibold', active ? 'text-primary' : 'text-foreground'].join(' ')}>
                    {p}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{PHASE_BLURB[p]}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-primary" /> {summary.streak}-day streak
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" /> {summary.tasksDone} of {summary.tasksTotal} tasks done
            </span>
          </div>
        </section>

        {/* Today */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-lg font-bold">Today</h2>
          {summary.today.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Recovery day. Nothing is scheduled — that is deliberate, and it counts toward your plan.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {summary.today.tasks.map((t) => {
                const done = isTaskDone(scale, todayKey, t.key);
                return (
                  <li key={t.key} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold">{t.label}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
                            +{t.xp}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{t.blurb}</p>
                        <ul className="mt-2 space-y-1">
                          {t.howTo.map((h) => (
                            <li key={h} className="flex gap-2 text-[12.5px] text-muted-foreground">
                              <span className="text-primary">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => complete(t)}
                        disabled={done}
                        className={[
                          'shrink-0 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors',
                          done
                            ? 'bg-primary/10 text-primary'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90',
                        ].join(' ')}
                      >
                        {done ? <><Check className="h-4 w-4" /> Done</> : 'Mark done'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {children}

        {teaserAddon && (
          <InlineAddonCard
            addonKey={teaserAddon.key}
            teaser={`${teaserAddon.tagline} Built from the answers you already gave.`}
          />
        )}

        <AddonsSection branch={scale} />

        <button
          type="button"
          onClick={() => navigate(def.startPath)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Re-take the {def.shortName} test <ChevronRight className="h-4 w-4" />
        </button>
      </main>
    </div>
  );
}
