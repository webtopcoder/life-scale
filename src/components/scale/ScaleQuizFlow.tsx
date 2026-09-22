// Generic, registry-driven quiz flow used by every scale that follows the
// standard format (landing -> questions with interstitial cards -> calculating).
// Progress uses absolute question numbers so an interstitial can never reset the
// counter.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import DashboardBackLink from '@/components/funnel/DashboardBackLink';
import { Button } from '@/components/ui/button';
import { getScale, scaleThemeStyle, type ScaleKey } from '@/config/scales';
import {
  absoluteQuestionNumbers, questionCount,
  type ScaleAnswers, type ScaleQuestion, type ScaleStep,
} from '@/data/scaleQuiz';
import { markCompleted } from '@/lib/testCompletions';
import { disclaimer } from '@/content/legalCopy';

export interface ScaleFlowConfig {
  scale: ScaleKey;
  steps: ScaleStep[];
  /** Landing copy. */
  eyebrow: string;
  headline: string;
  intro: string;
  /** Tiles shown on the landing screen. */
  areas: string[];
  startLabel: string;
  /** Optional override. Defaults to the shared disclaimer for the scale's category. */
  disclaimer?: string;
  /** Calculating screen. */
  calculatingTitle: string;
  calculatingLines: string[];
  /** Extra fields stored with the completion (score, statuses, archetype…). */
  buildPayload: (answers: ScaleAnswers) => Record<string, unknown>;
  /** Where to land after the flow. Defaults to the scale's dashboard. */
  destination?: string;
}

const STORAGE_PREFIX = 'iqscale.scaleflow.';

function loadAnswers(scale: ScaleKey): ScaleAnswers {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + scale);
    return raw ? (JSON.parse(raw) as ScaleAnswers) : {};
  } catch { return {}; }
}
function saveAnswers(scale: ScaleKey, answers: ScaleAnswers) {
  try { localStorage.setItem(STORAGE_PREFIX + scale, JSON.stringify(answers)); } catch { /* noop */ }
}
/** Answers for a completed scale flow, for dashboards and reports. */
export function readScaleAnswers(scale: ScaleKey): ScaleAnswers {
  return loadAnswers(scale);
}

/* -------------------------------- Landing -------------------------------- */

function Landing({ cfg, onStart }: { cfg: ScaleFlowConfig; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col px-5 pt-10 pb-8 w-full max-w-[520px] mx-auto"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {cfg.eyebrow}
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-bold leading-[1.15] text-foreground">
            {cfg.headline}
          </h1>
        </div>

        <p className="text-[15px] leading-relaxed text-muted-foreground">{cfg.intro}</p>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-primary/5 p-3">
          {cfg.areas.map((area) => (
            <div key={area} className="rounded-lg bg-card flex items-center justify-center p-3 shadow-sm">
              <span className="text-[12.5px] font-semibold text-foreground text-center leading-tight">{area}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onStart}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors"
        >
          {cfg.startLabel} <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card p-3">
        <ShieldCheck className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
        <p className="text-[12px] leading-snug text-muted-foreground">{cfg.disclaimer ?? disclaimer('assessmentShort', getScale(cfg.scale).category)}</p>
      </div>
    </motion.div>
  );
}

/* ------------------------------- Question -------------------------------- */

function QuestionView({
  q, selected, onSelect,
}: { q: ScaleQuestion; selected: number | undefined; onSelect: (i: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="px-5 pt-4 pb-8 space-y-5 w-full max-w-[520px] mx-auto"
    >
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {q.section}
        </span>
        <h2 className="text-[22px] sm:text-2xl font-bold text-foreground leading-snug">{q.prompt}</h2>
        {q.micro && <p className="text-sm text-muted-foreground leading-relaxed">{q.micro}</p>}
      </div>
      <div className="space-y-2.5">
        {q.options.map((opt, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(idx)}
              className={[
                'w-full text-left rounded-2xl px-4 py-4 border transition-all flex items-center justify-between gap-3',
                isSelected
                  ? 'bg-primary/10 border-primary ring-2 ring-primary/30 text-foreground'
                  : 'bg-card border-border hover:bg-primary/5 hover:border-primary/40 text-foreground',
              ].join(' ')}
            >
              <span className="text-[15px] font-medium">{opt.label}</span>
              <span className={[
                'w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center',
                isSelected ? 'bg-primary border-primary' : 'border-border',
              ].join(' ')}>
                {isSelected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function CardView({ title, body, onContinue }: { title: string; body: string; onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="px-5 pt-4 pb-8 flex flex-col space-y-5 w-full max-w-[520px] mx-auto"
    >
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-[22px] font-bold leading-snug text-foreground">{title}</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <button
        onClick={onContinue}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors"
      >
        Continue <ArrowRight className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

/* ------------------------------ Calculating ------------------------------ */

function Calculating({ cfg, answers }: { cfg: ScaleFlowConfig; answers: ScaleAnswers }) {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const scale = getScale(cfg.scale);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const navRef = useRef(navigate);
  navRef.current = navigate;
  useEffect(() => {
    const t = setTimeout(() => {
      const questions = cfg.steps
        .filter((s): s is ScaleQuestion => s.kind === 'q')
        .map((q) => ({
          id: q.id,
          prompt: q.prompt,
          domain: q.domain ?? null,
          options: q.options.map((o) => o.label),
        }));
      void markCompleted(cfg.scale, {
        questions,
        totalQuestions: questions.length,
        answers,
        ...cfg.buildPayload(answers),
      });
      navRef.current(cfg.destination ?? scale.dashPath);
    }, 4200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center px-6 text-center space-y-6"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center"
      >
        <Sparkles className="h-9 w-9 text-primary" />
      </motion.div>
      <h2 className="text-2xl font-bold text-foreground leading-tight">{cfg.calculatingTitle}</h2>
      <ul className="space-y-2.5 text-left w-full max-w-xs">
        {cfg.calculatingLines.map((l, i) => {
          const reached = i <= tick;
          return (
            <li key={l} className="flex items-start gap-2 text-sm">
              {reached
                ? <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                : <div className="h-4 w-4 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />}
              <span className={reached ? 'text-foreground' : 'text-muted-foreground'}>{l}</span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

/* --------------------------------- Shell --------------------------------- */

export default function ScaleQuizFlow({ config }: { config: ScaleFlowConfig }) {
  const scale = getScale(config.scale);
  const [stage, setStage] = useState<'landing' | 'quiz' | 'calculating'>('landing');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<ScaleAnswers>(() => loadAnswers(config.scale));
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const absNumbers = useMemo(() => absoluteQuestionNumbers(config.steps), [config.steps]);
  const total = useMemo(() => questionCount(config.steps), [config.steps]);

  useEffect(() => { document.title = `${scale.name} — Life Scale`; }, [scale.name]);
  useEffect(() => { saveAnswers(config.scale, answers); }, [config.scale, answers]);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });
    return () => cancelAnimationFrame(id);
  }, [stepIndex]);

  const step = config.steps[stepIndex];
  const absoluteNumber = absNumbers[stepIndex] ?? 0;
  const progress = total > 0 ? (absoluteNumber / total) * 100 : 0;

  const skipped = useMemo(() => {
    const out: number[] = [];
    let seen = 0;
    for (const s of config.steps) {
      if (s.kind !== 'q') continue;
      seen++;
      if (seen >= absoluteNumber) break;
      if (answers[s.id] == null) out.push(seen);
    }
    return out;
  }, [absoluteNumber, answers, config.steps]);

  const advance = () => {
    const next = stepIndex + 1;
    if (next >= config.steps.length) setStage('calculating');
    else setStepIndex(next);
  };

  const goBack = () => {
    for (let i = stepIndex - 1; i >= 0; i--) {
      if (config.steps[i].kind === 'q') { setStepIndex(i); return; }
    }
  };
  const canGoBack = stepIndex > 0 && config.steps.slice(0, stepIndex).some((s) => s.kind === 'q');

  const select = (q: ScaleQuestion, idx: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
    setTimeout(advance, 200);
  };

  const startQuiz = () => {
    setAnswers({});
    setStepIndex(0);
    setStage('quiz');
  };

  return (
    <div
      className="h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden"
      style={scaleThemeStyle(config.scale)}
    >
      <LifeScaleHeader
        showHelp={false}
        wordmark={scale.shortName}
        left={<DashboardBackLink confirmBeforeLeave={stage === 'quiz'} />}
      />

      <main className="flex-1 min-h-0 overflow-hidden">
        {stage === 'landing' && (
          <div className="h-full overflow-y-auto">
            <Landing cfg={config} onStart={startQuiz} />
          </div>
        )}

        {stage === 'quiz' && step && (
          <div className="flex h-full min-h-0 flex-col bg-background">
            <div className="shrink-0">
              <div className="relative h-[5px] bg-border overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
                {skipped.map((n) => (
                  <div
                    key={n}
                    className="absolute top-0 w-[3px] h-full bg-warning"
                    style={{ left: `${((n - 0.5) / total) * 100}%` }}
                    title={`Question ${n} skipped`}
                  />
                ))}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step.kind === 'q' ? (
                  <QuestionView
                    key={`q-${step.id}`}
                    q={step}
                    selected={answers[step.id]}
                    onSelect={(i) => select(step, i)}
                  />
                ) : (
                  <CardView key={step.id} title={step.title} body={step.body} onContinue={advance} />
                )}
              </AnimatePresence>
            </div>

            {step.kind === 'q' && (
              <div className="shrink-0 bg-card/90 backdrop-blur-sm border-t border-border/60 px-4 py-1.5">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                  <Button
                    variant="ghost" size="icon" onClick={goBack} disabled={!canGoBack}
                    className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{absoluteNumber}</span> of{' '}
                    <span className="text-foreground">{total}</span>
                  </span>
                  <Button
                    variant="ghost" size="icon" onClick={advance}
                    className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {stage === 'calculating' && <Calculating cfg={config} answers={answers} />}
      </main>
    </div>
  );
}
