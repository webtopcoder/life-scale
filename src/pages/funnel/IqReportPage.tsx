import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Lock, ArrowRight, Sprout, Gauge, Timer, Zap, Target,
} from 'lucide-react';
import InlineAddonCard from '@/components/addons/InlineAddonCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFunnel } from '@/context/FunnelContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import { getEntitlements } from '@/lib/entitlements';
import { getStrongestCategory, getSecondaryCategory, scoreToPercentile } from '@/engine/scoringEngine';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import ShareModal from '@/components/report/ShareModal';
import CertificateSection from '@/components/report/CertificateSection';
import GeographicSection from '@/components/report/GeographicSection';
import { markReportSeen } from '@/lib/reportSeen';
import { DescriptorAckNotice } from '@/components/DescriptorAckNotice';
import { useDescriptorAckNotice } from '@/lib/descriptorAckNotice';
import {
  CATEGORY_DEPTH, SIGNATURE_FRAMING, SPEED_FRAMING, weaknessFraming, growthFraming,
} from '@/engine/reportCopy/iqCopy';
import { buildIqReport, type IqReportSignals, type IqAxis, type GrowthLever, type CategorySignal, type SpeedAccuracy } from '@/engine/iqReport';
import type { Answer } from '@/types/funnel';
import DisclaimerNote from '@/components/legal/DisclaimerNote';
import {
  SECTIONS_CONFIG,
  ScoreRevealSection,
  CategoryBreakdownSection,
  DeepDiveStrengthSection,
  PopulationComparisonSection,
  CognitiveAgeSection,
  StrengthsProfileSection,
  CareerInsightsSection,
  MemoryProcessingSection,
} from '@/pages/ReportPage';

/* IQ report — pure cognitive-performance sections. Personality/archetype
   live in the Genius report; wellbeing lives in Brain Health. */
const IQ_SECTION_DEFS = [
  { id: 'score',        title: 'Your Score' },
  { id: 'breakdown',    title: 'Breakdown' },
  { id: 'signature',    title: 'Cognitive Signature' },
  { id: 'speed',        title: 'Speed vs. Accuracy' },
  { id: 'deepdive',     title: 'Strongest Category' },
  { id: 'weakness',     title: 'Weakest Category' },
  { id: 'comparison',   title: 'Population' },
  { id: 'geographic',   title: 'Geographic' },
  { id: 'cognitive-age', title: 'Cognitive Age' },
  { id: 'strengths',    title: 'Strengths Profile' },
  { id: 'career',       title: 'Career' },
  { id: 'growth',       title: 'Growth Levers' },
  { id: 'certificate',  title: 'Certificate' },
] as const;

const IQ_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

/* ------------------------------------------------------------------ */
/* New colocated section renderers                                    */
/* ------------------------------------------------------------------ */

function SignatureAxesSection({ signals, addon }: { signals: IqReportSignals; addon?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your cognitive signature</h3>
        <p className="text-sm text-muted-foreground mt-1">
          How you reason, not just what you scored.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{SIGNATURE_FRAMING}</p>
      </div>
      {signals.axes.map((axis: IqAxis, i) => {
        const pct = Math.round(50 + axis.value / 2);
        return (
          <motion.div key={axis.key}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{axis.leftLabel}</span>
              <span>{axis.rightLabel}</span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              <motion.div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-primary border-2 border-background shadow"
                initial={{ left: '50%' }}
                animate={{ left: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 + i * 0.1 }}
                style={{ transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-foreground">
              {axis.interpretation}
            </p>
          </motion.div>
        );
      })}

      {addon}

      <div className="rounded-xl border border-border bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="h-4 w-4 text-primary" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-primary">Fingerprint rarity</span>
        </div>
        <div className="text-[15px] font-bold text-foreground">{signals.fingerprint.headline}</div>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">{signals.fingerprint.body}</p>
      </div>
    </div>
  );
}

function SpeedAccuracySection({ sa, addon }: { sa: SpeedAccuracy; addon?: React.ReactNode }) {
  // Quadrant point: x=speed (0 fast..100 slow), y=accuracy (0 low..100 high)
  const x = Math.round(50 + sa.timeZ * 20);
  const y = 100 - Math.round(50 + sa.accuracyZ * 20);
  const hasData = sa.accuracyPct > 0 || sa.avgTimeSec > 0;
  if (!hasData) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold">Speed vs. accuracy</h3>
          <p className="text-sm text-muted-foreground mt-1">Where you land on the classic trade-off.</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center">
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Per-question timing wasn't captured for this attempt, so we can't plot your speed/accuracy quadrant yet. Retake the IQ test to unlock this section with your live pattern.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Speed vs. accuracy</h3>
        <p className="text-sm text-muted-foreground mt-1">Where you land on the classic trade-off.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-lg border border-border bg-muted/30">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
          <div className="absolute top-1 left-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Fast · precise</div>
          <div className="absolute top-1 right-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Deliberate</div>
          <div className="absolute bottom-1 left-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Rushed</div>
          <div className="absolute bottom-1 right-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Cautious</div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute h-5 w-5 rounded-full bg-primary border-2 border-background shadow-lg"
            style={{ left: `${Math.max(6, Math.min(94, x))}%`, top: `${Math.max(6, Math.min(94, y))}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3 w-3" /> Accuracy
            </div>
            <div className="mt-1 text-lg font-black text-primary">{sa.accuracyPct}%</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Timer className="h-3 w-3" /> Avg time
            </div>
            <div className="mt-1 text-lg font-black text-primary">{sa.avgTimeSec}s</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{SPEED_FRAMING}</p>
      </div>

      {addon}

      <div className="rounded-2xl border border-border bg-primary/5 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Your pattern</div>
        <div className="mt-1 text-[16px] font-bold text-primary">{sa.label}</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {sa.paragraph}
        </p>
      </div>

    </div>
  );
}

function WeaknessDeepDiveSection({ weakest, addon }: { weakest: CategorySignal; addon?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Deep dive: your weakest category</h3>
        <p className="text-sm text-muted-foreground mt-1">
Where the ceiling is.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Category</div>
            <div className="mt-1 text-lg font-bold text-primary">{weakest.label}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</div>
            <div className="text-lg font-black text-primary">{weakest.scorePct}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{weaknessFraming(weakest.label)}</p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
          {CATEGORY_DEPTH[weakest.category].whenLow}
        </p>
      </div>

      {addon}

      <div className="grid grid-cols-2 gap-2">
        {weakest.attempted > 0 && (
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Accuracy</div>
            <div className="mt-1 text-lg font-black text-primary">{weakest.correct}/{weakest.attempted}</div>
          </div>
        )}
        {weakest.avgTimeSec > 0 && (
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Avg time</div>
            <div className="mt-1 text-lg font-black text-primary">{weakest.avgTimeSec}s</div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">What this means</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {weakest.peakLoadDropPct >= 20
            ? `Your accuracy on ${weakest.label.toLowerCase()} holds up on easier items but drops as difficulty climbs. That is a ceiling signal.`
            : weakest.attempted > 0 && weakest.correct / weakest.attempted < 0.5
            ? `You are missing more than half of ${weakest.label.toLowerCase()} items. That points to a foundation gap rather than a ceiling problem.`
            : `Your ${weakest.label.toLowerCase()} score sits below your other categories.`}
        </p>
      </div>

    </div>
  );
}

function GrowthLeversSection({ levers, onDone, addon }: { levers: GrowthLever[]; onDone: () => void; addon?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your growth levers</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Two 30-day practices, aimed where you have most room to move.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          {growthFraming(levers[0]?.label ?? 'your weakest category')}
        </p>
      </div>

      {levers.map((lever, i) => (
        <motion.div key={lever.category}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {i + 1}
            </div>
            <div className="text-[15px] font-bold text-foreground">{lever.label}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Why this one</div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">{lever.why}</p>
          </div>
          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Zap className="h-3 w-3" /> The drill · {lever.cadence}
            </div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">{lever.drill}</p>
          </div>
        </motion.div>
      ))}

      {addon}

      <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sprout className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-[17px] font-bold">Turn insight into practice</h3>
        <p className="mt-1 text-[13.5px] text-muted-foreground max-w-md mx-auto">
          Your IQ Dashboard is where this becomes a routine.
        </p>
        <button type="button" onClick={onDone}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90">
          Back to IQ Dashboard <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const REPORT_ADDONS: Record<string, string> = {
  'breakdown': 'addon_iq_answer_breakdown',
  'speed': 'addon_iq_speed_accuracy_report',
  'weakness': 'addon_iq_weakness_report',
  'strengths': 'addon_iq_study_work_fit',
  'career': 'addon_iq_study_work_fit',
  'comparison': 'addon_iq_weakness_report',
  'growth': 'addon_iq_30day_sharpening',
};

/* Curiosity lines: name what the add-on answers, never restate a finding. */
const ADDON_TEASERS: Record<string, string> = {
  'breakdown': 'Every question you missed, logged one by one with the time you spent on it.',
  'speed': 'Your accuracy on the questions you rushed versus the ones you sat with.',
  'weakness': 'Your second weak category, the gap to your strongest, and three fixes for each.',
  'strengths': 'The role families and study methods your top two categories actually fit.',
  'career': 'Where minds with your shape advance fastest — and the environments that stall them.',
  'comparison': 'What separates your profile from the scores just above yours.',
  'growth': 'These two levers, broken into 30 dated days with checkpoints.',
};


export default function IqReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useFunnel();
  const { user } = useAuth();
  const isPreview = location.pathname.startsWith('/preview');
  const descriptorNotice = useDescriptorAckNotice(!isPreview);

  const [gateLoading, setGateLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [payloadAnswers, setPayloadAnswers] = useState<Answer[] | null>(null);
  const hydratedRef = React.useRef(false);

  const [currentSection, setCurrentSection] = useState(0);
  const [unlockedSections, setUnlockedSections] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    document.title = 'My IQ Report — IQ';
    markReportSeen('iq');
  }, []);

  useEffect(() => {
    if (!user?.id) { setGateLoading(false); setAllowed(true); return; }
    let cancelled = false;
    (async () => {
      const [ent, completions] = await Promise.all([
        getEntitlements(user.id),
        api.get<Array<{ branch: string; completedAt?: string; completed_at?: string; payload?: any }>>('/dashboard/test-completions'),
      ]);
      if (cancelled) return;
      const comp = completions?.find(c => c.branch === 'iq') ?? null;
      const ok = ent.entitledBranches.has('iq') && !!comp;
      if (!ok) { navigate('/main-dashboard', { replace: true }); return; }

      const payload = (comp?.payload ?? null) as {
        score?: number; scores?: Record<string, number>; percentiles?: Record<string, number>;
        answers?: Answer[];
        questions?: Array<{ id: number; category?: string; type?: string; difficulty?: number }>;
      } | null;
      if (!hydratedRef.current && payload && (state.finalScore == null || !state.finalScore)) {
        hydratedRef.current = true;
        if (payload.scores) dispatch({ type: 'SET_SCORES', scores: payload.scores as any });
        if (payload.percentiles) dispatch({ type: 'SET_PERCENTILES', percentiles: payload.percentiles as any });
        if (typeof payload.score === 'number') dispatch({ type: 'SET_FINAL_SCORE', score: payload.score });
      }
      if (Array.isArray(payload?.answers) && payload.answers.length > 0) {
        const metadata = new Map((payload.questions ?? []).map(question => [question.id, question]));
        setPayloadAnswers(payload.answers.map(answer => ({
          ...metadata.get(answer.questionId),
          ...answer,
        })) as Answer[]);
      }

      setAllowed(true);
      setGateLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, navigate, dispatch, state.finalScore]);

  const strongestCat = getStrongestCategory(state.scores);
  const secondaryCat = getSecondaryCategory(state.scores);
  const rawPercentile = state.finalScore ? scoreToPercentile(state.finalScore) : 0;
  const percentile = Math.max(rawPercentile, 92);
  const finalScore = state.finalScore || 0;

  const signals = useMemo<IqReportSignals>(() => {
    const answers = state.answers.length > 0 ? state.answers : (payloadAnswers ?? []);
    return buildIqReport(answers as any, state.scores, finalScore);
  }, [state.answers, payloadAnswers, state.scores, finalScore]);

  const goToNext = useCallback(() => {
    if (currentSection >= IQ_SECTION_DEFS.length - 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      const next = currentSection + 1;
      setCurrentSection(next);
      setUnlockedSections(s => Math.max(s, next + 1));
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, [currentSection]);

  const goToSection = (index: number) => {
    if (index >= unlockedSections) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSection(index);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const sharedSectionFor = (id: string) => SECTIONS_CONFIG.find(s => s.id === id);

  const renderSection = () => {
    const id = IQ_SECTION_DEFS[currentSection].id;
    const sectionAddon = REPORT_ADDONS[id] ? (
      <InlineAddonCard addonKey={REPORT_ADDONS[id]} teaser={ADDON_TEASERS[id]} />
    ) : null;
    switch (id) {
      case 'score': return <ScoreRevealSection finalScore={finalScore} />;
      case 'breakdown': return <CategoryBreakdownSection scores={state.scores} finalScore={finalScore} addon={sectionAddon} />;
      case 'signature': return <SignatureAxesSection signals={signals} addon={sectionAddon} />;
      case 'speed': return <SpeedAccuracySection sa={signals.speedAccuracy} addon={sectionAddon} />;
      case 'deepdive': return <DeepDiveStrengthSection strongest={strongestCat} scores={state.scores} finalScore={finalScore} addon={sectionAddon} />;
      case 'weakness': return <WeaknessDeepDiveSection weakest={signals.weakest} addon={sectionAddon} />;
      case 'comparison': return <PopulationComparisonSection finalScore={finalScore} percentile={percentile} addon={sectionAddon} />;
      case 'geographic': return <GeographicSection finalScore={finalScore} percentile={percentile} addon={sectionAddon} />;
      case 'cognitive-age': return <CognitiveAgeSection finalScore={finalScore} />;
      case 'strengths': return <StrengthsProfileSection scores={state.scores} strongest={strongestCat} secondary={secondaryCat} addon={sectionAddon} />;
      case 'career': return <CareerInsightsSection strongest={strongestCat} secondary={secondaryCat} addon={sectionAddon} />;
      case 'growth': return <GrowthLeversSection levers={signals.growthLevers} onDone={() => navigate('/iq-dash')} addon={sectionAddon} />;
      case 'certificate': return <CertificateSection finalScore={finalScore} percentile={percentile} strongest={strongestCat} />;
      default: return null;
    }
  };

  const progressPercent = ((currentSection + 1) / IQ_SECTION_DEFS.length) * 100;
  const isLast = currentSection === IQ_SECTION_DEFS.length - 1;

  if (gateLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background" style={IQ_THEME_STYLE}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-background text-foreground" style={IQ_THEME_STYLE}>
      <div className="sticky top-0 z-40 bg-background">
        <LifeScaleHeader wordmark="Life Scale" showTagline={false} />
        <div className="bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">
                Section {currentSection + 1} of {IQ_SECTION_DEFS.length}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-primary">
                  {IQ_SECTION_DEFS[currentSection].title}
                </div>
                <ShareModal finalScore={finalScore} />
              </div>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>
      </div>


      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
          {IQ_SECTION_DEFS.map((section, i) => {
            const shared = sharedSectionFor(section.id);
            const Icon = shared?.icon ?? Gauge;
            const isUnlocked = i < unlockedSections;
            const isCurrent = i === currentSection;
            return (
              <button key={section.id} onClick={() => goToSection(i)} disabled={!isUnlocked}
                className={`flex items-center gap-0.5 px-2 py-1.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                  isCurrent ? 'bg-primary text-primary-foreground shadow-sm' : isUnlocked ? 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer' : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                }`}>
                {isUnlocked ? <Icon className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span className="hidden lg:inline">{section.title}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? 20 : 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
        <DisclaimerNote kind="reportShort" category="mind" className="mt-8 text-center" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-2">
          {currentSection > 0 && (
            <Button variant="outline" onClick={() => goToSection(currentSection - 1)} className="h-12 px-4 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>
          )}
          {!isLast ? (
            <Button onClick={goToNext} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              {currentSection === 0 ? 'Reveal Your Breakdown' : `Next: ${IQ_SECTION_DEFS[currentSection + 1].title}`}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/iq-dash')}
              className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
            >
              Back to IQ Dashboard <ArrowRight className="w-5 h-5 ml-1" />
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
