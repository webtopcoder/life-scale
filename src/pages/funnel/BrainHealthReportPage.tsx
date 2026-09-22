import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ChevronLeft, ChevronRight, Sparkles, Heart, Brain, Moon,
  Footprints, Ear, Smile, BookOpen, Lock, ShieldCheck, Compass, Sprout,
  TrendingUp, Stethoscope, Layers, CheckCircle2,
} from 'lucide-react';
import InlineAddonCard from '@/components/addons/InlineAddonCard';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useBrainHealth } from '@/context/BrainHealthContext';
import { scoreQuiz, ageBaselineFor, type Answers } from '@/engine/brainHealthScoring';
import { DOMAIN_LABEL, type Domain } from '@/data/brainHealthQuiz';
import {
  overallBand, levelFor, bandForDomain, DOMAIN_NARRATIVE, DOMAIN_HABITS,
  DOMAIN_HEADLINE, DOMAIN_DASHBOARD_HOOK,

  concernHighlightsFor, strengthHighlightsFor, topConcernAcrossDomains,
  signatureAxes, riskFactors, doctorPrompts,
  type AnswerHighlight, type DomainBand,
} from '@/engine/brainHealthReport';
import {
  DOMAIN_DEPTH, focusFraming, trajectoryFraming, workingFraming,
  FACTORS_FRAMING, MOMENTUM_FRAMING, DOCTOR_FRAMING,
} from '@/engine/reportCopy/brainHealthCopy';
import { markReportSeen } from '@/lib/reportSeen';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import { disclaimer } from '@/content/legalCopy';
import { DescriptorAckNotice } from '@/components/DescriptorAckNotice';
import { useDescriptorAckNotice } from '@/lib/descriptorAckNotice';

const BH_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

const DOMAIN_ICON: Record<Domain, typeof Brain> = {
  cognitive: Brain,
  vascular: Heart,
  sleep: Moon,
  movement: Footprints,
  sensory: Ear,
  mood: Smile,
  reserve: BookOpen,
};

const DOMAIN_ORDER: Domain[] = ['cognitive', 'vascular', 'sleep', 'movement', 'sensory', 'mood', 'reserve'];

const SECTIONS = [
  { id: 'reveal',        title: 'Your Check-in',       icon: Sparkles },
  { id: 'snapshot',      title: 'Seven Areas',         icon: Brain },
  { id: 'signature',     title: 'What Your Answers Say', icon: Layers },
  { id: 'focus',         title: 'Where To Focus',      icon: Compass },
  { id: 'working',       title: 'Already Working',     icon: ShieldCheck },
  { id: 'factors',       title: 'Context',             icon: BookOpen },
  { id: 'momentum',      title: 'Daily Practice',      icon: Sprout },
  { id: 'trajectory',    title: 'Direction of Travel', icon: TrendingUp },
  { id: 'doctor',        title: 'For Your Doctor',     icon: Stethoscope },
  { id: 'professional',  title: 'When To Get Support', icon: Heart },
] as const;

/* ---------- bits ---------- */

function BandChip({ band }: { band: DomainBand }) {
  const cls =
    band === 'Steady'   ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  : band === 'Building' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-primary/10 text-primary border-primary/20';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${cls}`}>
      {band}
    </span>
  );
}

function AnswerCite({ h }: { h: AnswerHighlight }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">You told us</div>
      <p className="mt-0.5 text-[12.5px] text-muted-foreground leading-snug italic">"{h.prompt}"</p>
      <p className="mt-1 text-[13.5px] font-semibold text-foreground leading-snug">→ {h.chosen}</p>
    </div>
  );
}

function DomainRadar({ scores }: { scores: Record<Domain, number> }) {
  const domains = DOMAIN_ORDER;
  const strength = domains.map(d => 1 - scores[d]);
  const center = 110;
  const radius = 75;
  const step = (2 * Math.PI) / domains.length;
  const points = domains.map((_, i) => {
    const a = step * i - Math.PI / 2;
    const r = radius * strength[i];
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) };
  });
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  return (
    <div className="flex justify-center my-4">
      <svg viewBox="0 0 220 220" className="w-64 h-64">
        {[0.25, 0.5, 0.75, 1.0].map((lvl) => {
          const gp = domains.map((_, i) => {
            const a = step * i - Math.PI / 2;
            return { x: 110 + radius * lvl * Math.cos(a), y: 110 + radius * lvl * Math.sin(a) };
          });
          const gd = gp.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return <path key={lvl} d={gd} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />;
        })}
        {domains.map((dom, i) => {
          const a = step * i - Math.PI / 2;
          const end = { x: 110 + radius * Math.cos(a), y: 110 + radius * Math.sin(a) };
          const lp = { x: 110 + (radius + 22) * Math.cos(a), y: 110 + (radius + 22) * Math.sin(a) };
          return (
            <g key={dom}>
              <line x1={110} y1={110} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--primary))" fontSize="7" fontWeight="bold">
                {DOMAIN_HEADLINE[dom]}
              </text>
            </g>
          );
        })}
        <motion.path d={d} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2"
          initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }} style={{ transformOrigin: '110px 110px' }} />
        {points.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }} />
        ))}
      </svg>
    </div>
  );
}

/* ---------- sections ---------- */

function RevealSection({
  riskIndex, answers, top3, answered,
}: {
  riskIndex: number; answers: Answers;
  top3: { domain: Domain; score: number }[]; answered: number;
}) {
  const band = overallBand(riskIndex);
  const headline =
    band === 'Strong' ? 'Your everyday habits are quietly doing compounding work for your brain.'
  : band === 'Solid'  ? 'You have a healthy foundation with a couple of clear places to sharpen.'
                      : 'A few areas are asking for attention — nothing alarming, and the kind of thing that responds fast.';

  const topConcern = useMemo(() => topConcernAcrossDomains(answers), [answers]);
  const firstFocus = top3[0];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="text-center space-y-3">
        <div className="text-sm uppercase tracking-widest text-muted-foreground">Your check-in is ready</div>
        <h2 className="text-2xl font-bold text-foreground max-w-md mx-auto leading-tight">{headline}</h2>
        <div className="text-[12px] text-muted-foreground">
          Built from your {answered} answers across seven areas of brain health.
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-5 space-y-3 max-w-md mx-auto">
        <div className="text-[11px] uppercase tracking-wider text-primary font-bold">What this report is</div>
        <p className="text-[14px] leading-relaxed text-foreground">
          This isn't a score. Brain health is the shape of seven areas that support each other — what follows is a
          plain-English read of each one, and the daily habit that moves it.
        </p>

      </motion.div>

      {firstFocus && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-primary/30 bg-primary/5 p-5 max-w-md mx-auto">
          <div className="text-[11px] uppercase tracking-wider text-primary font-bold mb-1">Where you'll want to start</div>
          <div className="text-[16px] font-bold text-foreground">{DOMAIN_LABEL[firstFocus.domain]}</div>
          {topConcern && topConcern.domain === firstFocus.domain ? (
            <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
              You told us: <span className="italic">"{topConcern.chosen}"</span> — the thread we pull on next.
            </p>
          ) : (
            <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
              This is where consistent attention will move the most.
            </p>
          )}
        </motion.div>
      )}

      <p className="text-[11.5px] text-muted-foreground max-w-md mx-auto italic text-center">
        {disclaimer('reportShort', 'mind')}
      </p>
    </div>
  );
}

function SnapshotSection({ domainMap, answers, addon }: { domainMap: Record<Domain, number>; answers: Answers; addon?: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your seven areas at a glance</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          The bigger the shape, the more each area is pulling its weight for you.
        </p>

      </div>
      <DomainRadar scores={domainMap} />

      {addon}

      <div className="space-y-2">
        {DOMAIN_ORDER.map((d, i) => {
          const Icon = DOMAIN_ICON[d];
          const lvl = levelFor(domainMap[d]);
          const band = bandForDomain(domainMap[d]);
          const highlights = lvl === 'high'
            ? strengthHighlightsFor(d, answers, 1)
            : concernHighlightsFor(d, answers, 1);
          const oneLine =
            band === 'Steady'   ? 'This area is currently supporting you well.'
          : band === 'Building' ? 'A few threads to tidy up here.'
                                : 'A clear area to give some attention.';
          return (
            <motion.div key={d} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-sm font-semibold">{DOMAIN_LABEL[d]}</span>
                    <BandChip band={band} />
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">{oneLine}</p>
                  {highlights[0] && (
                    <p className="mt-1.5 text-[11.5px] text-muted-foreground/90 italic">
                      Your answer: "{highlights[0].chosen}"
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SignatureSection({ domainMap, addon }: { domainMap: Record<Domain, number>; addon?: ReactNode }) {
  const axes = signatureAxes(domainMap);
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">What your answers say together</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Three ways of reading the whole picture.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          Seven separate answers are hard to act on. These three readings group them the way the biology does.
        </p>
      </div>

      {addon}

      {axes.map((ax, i) => (
        <motion.div key={ax.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="text-[15px] font-bold">{ax.label}</div>
            <BandChip band={ax.band} />
          </div>
          <p className="text-[14px] text-foreground leading-relaxed">{ax.interpretation}</p>
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="text-[11px] uppercase tracking-wider text-primary font-bold mb-1">Why this matters</div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{ax.teaches}</p>
          </div>
        </motion.div>
      ))}

      <p className="text-[12px] text-muted-foreground text-center italic">
        None of these is a score or a diagnosis.
      </p>

    </div>
  );
}

function FocusSection({
  top3, answers,
}: {
  top3: { domain: Domain; score: number }[]; answers: Answers;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Where to focus your attention</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          The three areas where steady work returns the most.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          {focusFraming(top3.map(t => DOMAIN_LABEL[t.domain]))}
        </p>
      </div>
      {top3.map((d, i) => {
        const Icon = DOMAIN_ICON[d.domain];
        const lvl = levelFor(d.score);
        const cites = concernHighlightsFor(d.domain, answers, 1);
        const habit = DOMAIN_HABITS[d.domain][0];
        const hook = DOMAIN_DASHBOARD_HOOK[d.domain];
        const addon = DOMAIN_ADDON[d.domain];
        const full = i === 0;
        return (
          <motion.div key={d.domain} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-primary">Focus #{i + 1}</div>
                <div className="text-[16px] font-bold">{DOMAIN_LABEL[d.domain]}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">What this actually means</div>
                <p className="mt-1 text-[14px] leading-relaxed text-foreground">{DOMAIN_NARRATIVE[d.domain][lvl]}</p>
              </div>

              {addon && <InlineAddonCard addonKey={addon.key} teaser={addon.teaser} />}

              {full && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Why this area matters</div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">{DOMAIN_DEPTH[d.domain].whyItMatters}</p>
                </div>
              )}
              {cites.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                    What flagged this — in your own words
                  </div>
                  <div className="space-y-2">
                    {cites.map((c) => <AnswerCite key={c.qid} h={c} />)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">What changes if you act</div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">{DOMAIN_DEPTH[d.domain].whatChanges[lvl]}</p>
              </div>
              {full && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">What people get wrong here</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{DOMAIN_DEPTH[d.domain].commonMistake}</p>
                </div>
              )}
              <div className="rounded-lg bg-primary/8 border border-primary/20 p-3">
                <div className="text-[11px] uppercase tracking-wider text-primary font-bold">Start with this today</div>
                <p className="mt-1 text-[13.5px] font-semibold text-foreground">{habit.action}</p>
                {full && <p className="mt-1 text-[12.5px] text-muted-foreground leading-snug">{habit.why}</p>}
              </div>
              <div className="rounded-lg border-l-4 border-primary bg-primary/5 pl-3 pr-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-primary font-bold">On your dashboard</div>
                <p className="mt-0.5 text-[13px] text-foreground leading-snug">{hook}</p>
              </div>

            </div>

          </motion.div>
        );
      })}

    </div>
  );
}

function WorkingSection({
  domainMap, answers, addon,
}: {
  domainMap: Record<Domain, number>; answers: Answers; addon?: ReactNode;
}) {
  const strengths = DOMAIN_ORDER
    .map(d => ({ domain: d, score: domainMap[d] }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">What's already working</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Two areas doing quiet work for you — the platform the rest is built on.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          {workingFraming(strengths.map(s => DOMAIN_LABEL[s.domain]))}
        </p>
      </div>

      {addon}


      {strengths.map((s, i) => {
        const Icon = DOMAIN_ICON[s.domain];
        const cites = strengthHighlightsFor(s.domain, answers, 2);
        return (
          <motion.div key={s.domain} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-primary/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[15px] font-bold">{DOMAIN_LABEL[s.domain]}</div>
                <div className="text-[11px] text-primary font-semibold">Already supporting you</div>
              </div>
            </div>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              {DOMAIN_NARRATIVE[s.domain].high}
            </p>
            {cites.length > 0 && (
              <div className="mt-3 space-y-2">
                {cites.map((c) => <AnswerCite key={c.qid} h={c} />)}
              </div>
            )}
            {i === 0 && (
              <div className="mt-3 pt-3 border-t border-border/60 text-[12.5px] text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">Keep it going: </span>
                protect this before you optimise anything else.
              </div>
            )}

          </motion.div>
        );
      })}
    </div>
  );
}

function FactorsSection({ answers, addon }: { answers: Answers; addon?: ReactNode }) {
  const factors = riskFactors(answers);
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">The context around your brain</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Age, family history, and a few signals from your answers — without alarm.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{FACTORS_FRAMING}</p>
      </div>

      {addon}


      <div className="grid grid-cols-1 gap-2.5">
        {factors.map((f, i) => (
          <motion.div key={f.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-xl border p-4 ${
              f.tone === 'protective' ? 'border-emerald-500/30 bg-emerald-500/5'
              : f.tone === 'watch'    ? 'border-amber-500/30 bg-amber-500/5'
                                      : 'border-rose-500/30 bg-rose-500/5'
            }`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-[13px] font-bold text-foreground">{f.label}</div>
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${
                f.tone === 'protective' ? 'text-emerald-600 dark:text-emerald-400'
                : f.tone === 'watch'    ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-rose-600 dark:text-rose-400'
              }`}>{f.tone === 'protective' ? 'Protective' : f.tone === 'watch' ? 'Worth a look' : 'Worth attention'}</div>
            </div>
            <div className="text-[13px] font-semibold text-foreground/90 mb-1">{f.value}</div>
            <p className="text-[12.5px] text-muted-foreground leading-relaxed">{f.detail}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MomentumSection({
  top3, answers, addon,
}: {
  top3: { domain: Domain; score: number }[]; answers: Answers; addon?: ReactNode;
}) {
  const habits: { domain: Domain; action: string; why: string; answerCite?: AnswerHighlight }[] = [];
  for (const t of top3) {
    const cites = concernHighlightsFor(t.domain, answers, 3);
    DOMAIN_HABITS[t.domain].forEach((h, idx) => {
      habits.push({ domain: t.domain, action: h.action, why: h.why, answerCite: cites[idx] });
    });
  }
  const week1 = habits.slice(0, 3);
  const week234 = habits.slice(3, 6);

  const renderHabit = (h: typeof habits[number], n: number) => (
    <div key={n} className="rounded-xl border border-border bg-background p-3">
      <div className="flex gap-3">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
          {n}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-foreground leading-snug">{h.action}</div>
          <div className="text-[11px] text-primary/80 mt-0.5 font-semibold uppercase tracking-wider">{DOMAIN_LABEL[h.domain]}</div>
          {n <= 3 && <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-snug">{h.why}</p>}
          {h.answerCite && n <= 3 && (
            <div className="mt-2 text-[11.5px] text-muted-foreground/90 italic border-l-2 border-primary/30 pl-2">
              Addresses your answer: "{h.answerCite.chosen}"
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your daily practice</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Small, specific, and tied to your focus areas.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{MOMENTUM_FRAMING}</p>
      </div>

      {addon}


      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">Start here — this week</div>
        <div className="space-y-2">{week1.map((h, i) => renderHabit(h, i + 1))}</div>
      </div>
      {week234.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">Layer these in — weeks 2 to 4</div>
          <div className="space-y-2">{week234.map((h, i) => renderHabit(h, week1.length + i + 1))}</div>
        </div>
      )}
    </div>
  );
}

function TrajectorySection({ top3, addon }: { top3: { domain: Domain }[]; addon?: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Direction of travel</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          What three months of steady work actually looks like.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          {trajectoryFraming(top3.map(t => t.domain))}
        </p>
      </div>

      {addon}


      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-primary font-bold">Weeks 1 – 2</div>
          <p className="mt-1 text-[13.5px] text-foreground leading-relaxed">
            The changes feel small. Nothing dramatic — that's right.
          </p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-primary font-bold">Weeks 3 – 6</div>
          <p className="mt-1 text-[13.5px] text-foreground leading-relaxed">
            Focus and mood shift first. This is where most people quit — don't.
          </p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-primary font-bold">Weeks 7 – 12</div>
          <p className="mt-1 text-[13.5px] text-foreground leading-relaxed">
            The habits become how you live, and the long-term payoff starts.
          </p>
        </div>
        <div className="pt-3 border-t border-border/60">
          <p className="text-[12.5px] text-muted-foreground leading-relaxed">
            This cycle: <span className="font-semibold text-foreground">
              {top3.map(t => DOMAIN_LABEL[t.domain]).join(' · ')}
            </span>. Progress is uneven — direction matters, not any single week.
          </p>
        </div>

      </div>
    </div>
  );
}

function DoctorSection({ answers, addon }: { answers: Answers; addon?: ReactNode }) {
  const prompts = doctorPrompts(answers);
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">For your next doctor visit</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Questions to bring, built from your answers. Not diagnostic.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{DOCTOR_FRAMING}</p>
      </div>

      {addon}


      {prompts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-[14px] text-foreground">Nothing in your answers is asking for a doctor visit right now.</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">A normal yearly check-in still applies.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map((p, i) => (
            <motion.div key={p.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4">
              <div className="flex gap-3">
                <div className="h-7 w-7 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-foreground leading-snug">"{p.ask}"</div>
                  <div className="mt-1 text-[11.5px] text-muted-foreground italic">{p.because}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfessionalSection({ onDone }: { onDone: () => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">When to talk to a professional</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          When a check-in makes sense, and where this goes next.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14.5px] leading-relaxed text-foreground">
          Talking to a doctor isn't a red flag — it's maintenance. Worth a check-in when something is new: memory
          feels harder, sleep hasn't returned after two weeks, mood is heavier, or hearing and vision are tiring.
        </p>
        <p className="mt-3 text-[13.5px] text-muted-foreground leading-relaxed">
          {disclaimer('reportShort', 'mind')}
        </p>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="text-[11px] uppercase tracking-wider text-primary font-bold">What happens next</div>
        <h4 className="mt-1 text-[17px] font-bold text-foreground">Your dashboard is where this becomes real</h4>
        <p className="mt-2 text-[13.5px] text-foreground leading-relaxed">
          Your focus areas and daily habits are already loaded into your Brain Dashboard, with a daily check-in,
          habit streaks and a weekly reflection.
        </p>

        <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
          The report shows where to look; the dashboard is how you get there.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sprout className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-[17px] font-bold">Ready to start?</h3>
        <p className="mt-1 text-[13.5px] text-muted-foreground max-w-md mx-auto">
          Your focus areas and daily practice are already waiting there.
        </p>
        <button type="button" onClick={onDone}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90">
          Open Brain Dashboard <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */

/* Section-level add-ons. The three domain reports are teased contextually
   inside "Where To Focus" instead, next to the domain they actually deepen. */
const REPORT_ADDONS: Record<string, string> = {
  'momentum': 'addon_brain_focus_energy_map',
  'factors': 'addon_brain_nutrition_movement',
  'trajectory': 'addon_brain_30day_habit',
};

/* Curiosity lines: name what the add-on answers, never restate a finding. */
const ADDON_TEASERS: Record<string, string> = {
  'momentum': 'Your day rebuilt hour by hour, around when your brain is actually sharp.',
  'factors': 'A full week of movement and meals mapped to what you told us.',
  'trajectory': 'Thirty dated days that turn this direction into an actual habit.',
};

/* Domain report teasers shown inside the focus section. */
const DOMAIN_ADDON: Partial<Record<Domain, { key: string; teaser: string }>> = {
  sleep: {
    key: 'addon_brain_sleep_recovery',
    teaser: 'Four levers for your sleep pattern, a 7-day reset, and what to do when it slips.',
  },
  mood: {
    key: 'addon_brain_stress_load',
    teaser: 'A two-week stress audit and the recovery tools that fit your load.',
  },
  movement: {
    key: 'addon_brain_nutrition_movement',
    teaser: 'A full week of movement and meals built around your answers.',
  },
  vascular: {
    key: 'addon_brain_nutrition_movement',
    teaser: 'A full week of movement and meals built around your answers.',
  },
};


export default function BrainHealthReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useBrainHealth();
  const { user } = useAuth();
  const isPreview = location.pathname.startsWith('/preview');
  const descriptorNotice = useDescriptorAckNotice(!isPreview);
  const answered = Object.keys(state.answers).length;

  const [currentSection, setCurrentSection] = useState(0);
  const [unlocked, setUnlocked] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [payloadResult, setPayloadResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);
  const [payloadAnswers, setPayloadAnswers] = useState<Answers | null>(null);
  const [payloadBaseline, setPayloadBaseline] = useState<number | null>(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    document.title = 'My Brain Report — Brain';
    markReportSeen('brain-health');
  }, []);

  useEffect(() => {
    if (!user?.id) { setHydrating(false); return; }
    let cancelled = false;
    (async () => {
      const completions = await api.get<
        Array<{ payload?: unknown; branch?: string }>
      >('/dashboard/test-completions?branch=brain-health');
      if (cancelled) return;
      const data = completions[0];
      const p = (data?.payload ?? null) as {
        result?: ReturnType<typeof scoreQuiz>;
        answers?: Answers;
        risk_index?: number;
      } | null;
      if (p?.answers && Object.keys(p.answers).length > 0) {
        setPayloadAnswers(p.answers);
        setPayloadResult(scoreQuiz(p.answers));
        setPayloadBaseline(ageBaselineFor(p.answers));
      } else if (p?.result?.domains) {
        setPayloadResult(p.result);
        setPayloadBaseline(35);
      }
      setHydrating(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (hydrating) return;
    if (answered === 0 && !payloadResult) navigate('/bh-start', { replace: true });
  }, [answered, navigate, hydrating, payloadResult]);

  const answers: Answers = useMemo(() => {
    if (answered > 0) return state.answers;
    return payloadAnswers ?? {};
  }, [state.answers, answered, payloadAnswers]);

  const answersCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );

  const result = useMemo(() => {
    if (answered > 0) return scoreQuiz(state.answers);
    return payloadResult;
  }, [state.answers, answered, payloadResult]);

  // Baseline retained for compatibility though no longer surfaced as a number.
  useMemo(() => {
    if (answered > 0) return ageBaselineFor(state.answers);
    return payloadBaseline ?? 35;
  }, [state.answers, answered, payloadBaseline]);

  const domainMap = useMemo(() => {
    const m: Record<Domain, number> = {} as Record<Domain, number>;
    if (result) for (const dr of result.domains) m[dr.domain] = dr.score;
    return m;
  }, [result]);

  const goNext = useCallback(() => {
    if (currentSection >= SECTIONS.length - 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      const next = currentSection + 1;
      setCurrentSection(next);
      setUnlocked(u => Math.max(u, next + 1));
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, [currentSection]);

  const goTo = (i: number) => {
    if (i >= unlocked) return;
    setIsTransitioning(true);
    setTimeout(() => { setCurrentSection(i); setIsTransitioning(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 300);
  };

  const isLast = currentSection === SECTIONS.length - 1;
  const progressPercent = ((currentSection + 1) / SECTIONS.length) * 100;

  

  const renderSection = () => {
    if (!result) return null;
    const id = SECTIONS[currentSection].id;
    const sectionAddon = REPORT_ADDONS[id] ? (
      <InlineAddonCard addonKey={REPORT_ADDONS[id]} teaser={ADDON_TEASERS[id]} />
    ) : null;
    switch (id) {
      case 'reveal':       return <RevealSection riskIndex={result.riskIndex} answers={answers} top3={result.top3} answered={answersCount} />;
      case 'snapshot':     return <SnapshotSection domainMap={domainMap} answers={answers} addon={sectionAddon} />;
      case 'signature':    return <SignatureSection domainMap={domainMap} addon={sectionAddon} />;
      case 'focus':        return <FocusSection top3={result.top3} answers={answers} />;
      case 'working':      return <WorkingSection domainMap={domainMap} answers={answers} addon={sectionAddon} />;
      case 'factors':      return <FactorsSection answers={answers} addon={sectionAddon} />;
      case 'momentum':     return <MomentumSection top3={result.top3} answers={answers} addon={sectionAddon} />;
      case 'trajectory':   return <TrajectorySection top3={result.top3} addon={sectionAddon} />;
      case 'doctor':       return <DoctorSection answers={answers} addon={sectionAddon} />;
      case 'professional': return <ProfessionalSection onDone={() => navigate('/bh-dash')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={BH_THEME_STYLE}>
      <div className="sticky top-0 z-40 bg-background">
        <LifeScaleHeader wordmark="Brain Health" showTagline={false} />
        <div className="bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">
                Section {currentSection + 1} of {SECTIONS.length}
              </div>
              <div className="text-xs font-medium text-primary">{SECTIONS[currentSection].title}</div>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>
      </div>


      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            const isUnlocked = i < unlocked;
            const isCurrent = i === currentSection;
            return (
              <button key={s.id} onClick={() => goTo(i)} disabled={!isUnlocked}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                  isCurrent ? 'bg-primary text-primary-foreground shadow-sm'
                    : isUnlocked ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                }`}>
                {isUnlocked ? <Icon className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                <span className="hidden md:inline">{s.title}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? 20 : 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-2">
          {currentSection > 0 && (
            <Button variant="outline" onClick={() => goTo(currentSection - 1)} className="h-12 px-4 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>
          )}
          {!isLast ? (
            <Button onClick={goNext} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              Next: {SECTIONS[currentSection + 1].title}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => navigate('/bh-dash')} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              Back to Brain Dashboard <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {!isPreview && (
        <DescriptorAckNotice
          open={descriptorNotice.open}
          onDismiss={descriptorNotice.dismiss}
        />
      )}
    </div>
  );
}
