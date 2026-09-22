import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Brain, Check, ShieldCheck, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import DashboardBackLink from '@/components/funnel/DashboardBackLink';
import { Button } from '@/components/ui/button';
import {
  QUIZ_STEPS_V2, QUIZ_QUESTION_COUNT_V2,
  SECTION_REINFORCEMENTS, OPENING_LINES,
  type QuizQuestion, type QuizInterrupt, type QuizReinforcement, type QuizStep,
} from '@/data/brainHealthQuizV2';
import { scoreQuiz } from '@/engine/brainHealthScoring';
import { useBrainHealth } from '@/context/BrainHealthContext';
import { markCompleted } from '@/lib/testCompletions';
import { focusProfileFromQ29, BH_FOCUS_LABEL } from '@/lib/bhChallenge';
import { disclaimer } from '@/content/legalCopy';

// ---------------------------------------------------------------------------
// Absolute-progress model (guardrail against the /hg-start drift bug):
// Precompute, for every step in QUIZ_STEPS_V2, the absolute question number
// it belongs to (1-based). Non-question steps inherit the number of the
// question that immediately precedes them, so the counter never resets when
// an interstitial appears.
// ---------------------------------------------------------------------------

const ABS_Q_NUMBER: number[] = (() => {
  const out: number[] = [];
  let n = 0;
  for (const s of QUIZ_STEPS_V2) {
    if (s.kind === 'q') n++;
    out.push(n);
  }
  return out;
})();

const TOTAL_QUESTIONS = QUIZ_QUESTION_COUNT_V2;

// Deep Life Scale blue override (matches /hg-start theme)
const BH_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

// ---------------------------------------------------------------------------
// Landing
// ---------------------------------------------------------------------------

function Landing({ onStart }: { onStart: () => void }) {
  const areas = ['Memory & focus', 'Sleep', 'Heart', 'Movement', 'Hearing & vision', 'Stress & connection', 'Learning'];
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
            <Sparkles className="h-3.5 w-3.5" /> Brain Health Check-in
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-bold leading-[1.15] text-foreground">
            A 5-minute check-in on how your brain is doing.
          </h1>
        </div>

        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Seven everyday areas shape long-term brain wellbeing. This quick check-in shows which ones matter most for you.
        </p>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-primary/5 p-3">
          {areas.map((area) => (
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
          Start my check-in <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card p-3">
        <ShieldCheck className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
        <p className="text-[12px] leading-snug text-muted-foreground">
          {disclaimer('assessmentShort', 'mind')}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Question / Card / Interrupt / Reinforcement views
// ---------------------------------------------------------------------------

function QuestionView({
  q, selected, onSelect,
}: { q: QuizQuestion; selected: number | undefined; onSelect: (idx: number) => void; }) {
  return (
    <motion.div
      key={`q-${q.id}`}
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
              <span className="text-[15px] font-medium">{opt}</span>
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

function CardView({
  card, onContinue,
}: { card: Extract<QuizStep, { kind: 'card' }>; onContinue: () => void; }) {
  return (
    <motion.div
      key={card.id}
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
        <h2 className="text-[22px] font-bold leading-snug text-foreground">{card.title}</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{card.body}</p>
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

function InterruptView({ step, onContinue }: { step: QuizInterrupt; onContinue: () => void }) {
  const { state, dispatch } = useBrainHealth();
  const flagged = useMemo(
    () => Math.max(scoreQuiz(state.answers).flaggedCount, 3),
    [state.answers],
  );

  useEffect(() => {
    dispatch({ type: 'SET_INTERRUPT_FLAGGED', count: flagged });
  }, [dispatch, flagged]);

  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;
  useEffect(() => {
    const advance = setTimeout(() => onContinueRef.current(), step.durationMs);
    return () => clearTimeout(advance);
  }, [step.durationMs]);

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="px-5 pt-10 pb-8 space-y-5 w-full max-w-[520px] mx-auto"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-[24px] sm:text-[26px] font-bold text-foreground leading-snug text-center">
          A quick note on your answers
        </h2>
      </div>
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="w-full rounded-2xl border border-primary/40 bg-primary/10 px-4 py-4"
      >
        <span className="text-[15px] font-semibold text-primary">
          {flagged} of your answers {step.headline}
        </span>
      </motion.div>
      <p className="text-[13px] text-center text-muted-foreground">{step.subline}</p>
    </motion.div>
  );
}

function ReinforcementCardView({
  step, onContinue,
}: { step: QuizReinforcement; onContinue: () => void }) {
  const { state } = useBrainHealth();
  const config = SECTION_REINFORCEMENTS[step.sectionKey];

  const picked = useMemo(() => {
    if (step.sectionKey === 'opening') {
      const fam = state.answers[2];
      if (fam === 1 || fam === 2 || fam === 3) return OPENING_LINES.family[fam];
      const intent = state.answers[3];
      if (intent != null && OPENING_LINES.intent[intent]) return OPENING_LINES.intent[intent];
      return { headline: config.neutral.headline, body: config.neutral.body };
    }
    let bestQid: number | null = null;
    let bestWeight = 0;
    let bestAnswerIdx = -1;
    for (const qid of config.questionIds) {
      const stepDef = QUIZ_STEPS_V2.find((s) => s.kind === 'q' && (s as QuizQuestion).id === qid) as QuizQuestion | undefined;
      if (!stepDef || !stepDef.weights) continue;
      const answerIdx = state.answers[qid];
      if (answerIdx == null) continue;
      const w = stepDef.weights[answerIdx] ?? 0;
      if (w > bestWeight) {
        bestWeight = w;
        bestQid = qid;
        bestAnswerIdx = answerIdx;
      }
    }
    if (bestQid != null && bestAnswerIdx >= 0) {
      const perQ = config.lines[bestQid];
      const candidate = perQ?.[bestAnswerIdx];
      if (candidate) return { headline: candidate.headline, body: candidate.body };
    }
    return { headline: config.neutral.headline, body: config.neutral.body };
  }, [config, step.sectionKey, state.answers]);

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="px-5 pt-6 pb-8 flex flex-col space-y-5 w-full max-w-[520px] mx-auto"
    >
      <div className="rounded-2xl border border-border bg-primary/5 p-6 space-y-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          {config.label}
        </span>
        <h2 className="text-[19px] font-bold leading-snug text-foreground">{picked.headline}</h2>
        <p className="text-[14px] leading-relaxed text-muted-foreground">{picked.body}</p>
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

// ---------------------------------------------------------------------------
// Quiz shell — /hg-start style header progress bar + sticky footer
// ---------------------------------------------------------------------------

function Quiz() {
  const { state, dispatch } = useBrainHealth();
  const step = QUIZ_STEPS_V2[state.stepIndex];
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });
    return () => cancelAnimationFrame(id);
  }, [state.stepIndex]);

  const absoluteNumber = ABS_Q_NUMBER[state.stepIndex] ?? 0;
  const progress = (absoluteNumber / TOTAL_QUESTIONS) * 100;

  // Skipped ticks: any absolute question number strictly less than the current
  // one that has no answer recorded in state.answers.
  const skippedAbsoluteNumbers = useMemo(() => {
    const skipped: number[] = [];
    let seen = 0;
    for (let i = 0; i < QUIZ_STEPS_V2.length; i++) {
      const s = QUIZ_STEPS_V2[i];
      if (s.kind !== 'q') continue;
      seen++;
      if (seen >= absoluteNumber) break;
      if (state.answers[(s as QuizQuestion).id] == null) skipped.push(seen);
    }
    return skipped;
  }, [absoluteNumber, state.answers]);

  const advance = () => {
    const next = state.stepIndex + 1;
    if (next >= QUIZ_STEPS_V2.length) {
      dispatch({ type: 'SET_STAGE', stage: 'calculating' });
    } else {
      dispatch({ type: 'SET_STEP', step: next });
    }
  };

  const handleSelect = (q: QuizQuestion, idx: number) => {
    dispatch({ type: 'ANSWER', qId: q.id, optionIndex: idx });
    if (q.id === 29) dispatch({ type: 'SET_INTENT', intent: q.options[idx] });
    setTimeout(advance, 220);
  };

  // Back: walk to the previous question step (skip interstitials).
  const goBack = () => {
    for (let i = state.stepIndex - 1; i >= 0; i--) {
      if (QUIZ_STEPS_V2[i].kind === 'q') {
        dispatch({ type: 'SET_STEP', step: i });
        return;
      }
    }
  };

  const canGoBack = state.stepIndex > 0 &&
    QUIZ_STEPS_V2.slice(0, state.stepIndex).some((s) => s.kind === 'q');

  const isQuestion = step?.kind === 'q';

  if (!step) return null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Slim progress bar under the header */}
      <div className="shrink-0">
        <div className="relative h-[5px] bg-border overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: 'hsl(218, 90%, 26%)' }}
          />
          {skippedAbsoluteNumbers.map((n) => {
            const pos = ((n - 0.5) / TOTAL_QUESTIONS) * 100;
            return (
              <div
                key={n}
                className="absolute top-0 w-[3px] h-full bg-warning"
                style={{ left: `${pos}%` }}
                title={`Question ${n} skipped`}
              />
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step.kind === 'q' ? (() => {
            const baseQ = step as QuizQuestion;
            let q = baseQ;
            if (baseQ.id === 29) {
              const flagged = Math.max(
                scoreQuiz(state.answers).flaggedCount,
                state.interruptFlaggedShown,
                3,
              );
              q = {
                ...baseQ,
                options: baseQ.options.map((opt, i) =>
                  i === 0 ? `Knowing my top ${flagged} areas to focus on` : opt,
                ),
              };
            }
            return (
              <QuestionView
                key={`q-${q.id}`}
                q={q}
                selected={state.answers[q.id]}
                onSelect={(i) => handleSelect(q, i)}
              />
            );
          })() : step.kind === 'interrupt' ? (
            <InterruptView key={step.id} step={step as QuizInterrupt} onContinue={advance} />
          ) : step.kind === 'reinforcement' ? (
            <ReinforcementCardView key={step.id} step={step as QuizReinforcement} onContinue={advance} />
          ) : (
            <CardView key={step.id} card={step as Extract<QuizStep, { kind: 'card' }>} onContinue={advance} />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky footer: back + counter + skip (only on question steps) */}
      {isQuestion && (
        <div className="shrink-0 bg-card/90 backdrop-blur-sm border-t border-border/60 px-4 py-1.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              disabled={!canGoBack}
              className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{absoluteNumber}</span> of <span className="text-foreground">{TOTAL_QUESTIONS}</span>
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={advance}
              className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculating
// ---------------------------------------------------------------------------

function Calculating() {
  const navigate = useNavigate();
  const { state } = useBrainHealth();
  const result = useMemo(() => scoreQuiz(state.answers), [state.answers]);
  const flagged = Math.max(result.flaggedCount, state.interruptFlaggedShown, 3);

  const labels = useMemo(() => ([
    'Looking at your answers…',
    `Spotted ${flagged} areas you can shift.`,
    'Sorting what to focus on first…',
    'Putting your check-in together.',
  ]), [flagged]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(() => {
    const t = setTimeout(() => {
      const scored = scoreQuiz(state.answers);
      const focus = focusProfileFromQ29(state.answers[29]);
      // Snapshot the funnel questions with the answers so add-on reports stay
      // accurate (item counts, prompts, option labels) if the funnel changes.
      const questions = QUIZ_STEPS_V2
        .filter((st): st is QuizQuestion => st.kind === 'q')
        .map((q) => ({
          id: q.id,
          prompt: q.prompt,
          domain: q.domain ?? null,
          options: Array.isArray(q.options) ? [...q.options] : [],
        }));
      void markCompleted('brain-health', {
        questions,
        totalQuestions: questions.length,
        answers: state.answers,
        focus,
        focus_label: BH_FOCUS_LABEL[focus],
        top3: scored.top3.map(d => ({ domain: d.domain, score: d.score, status: d.status })),
        risk_index: scored.riskIndex,
        flagged_count: scored.flaggedCount,
        result: scored,
      });
      navigateRef.current('/bh-dash');
    }, 4500);
    return () => clearTimeout(t);
  }, [state.answers]);

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
        <Brain className="h-10 w-10 text-primary" />
      </motion.div>
      <h2 className="text-2xl font-bold text-foreground leading-tight">
        Building your brain check-in…
      </h2>
      <ul className="space-y-2.5 text-left w-full max-w-xs">
        {labels.map((l, i) => {
          const reached = i <= tick;
          return (
            <li key={l} className="flex items-start gap-2 text-sm">
              {reached ? (
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />
              )}
              <span className={reached ? 'text-foreground' : 'text-muted-foreground'}>
                {l}
              </span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export default function BrainHealthFlow() {
  const { state, dispatch } = useBrainHealth();

  useEffect(() => {
    document.title = 'Brain Health Check-in — Life Scale';
  }, []);

  const startQuiz = () => {
    dispatch({ type: 'SET_STAGE', stage: 'quiz' });
    dispatch({ type: 'SET_STEP', step: 0 });
  };

  return (
    <div
      className="bh-theme h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden"
      style={BH_THEME_STYLE}
    >
      <LifeScaleHeader
        showHelp={false}
        wordmark="Brain Health"
        left={<DashboardBackLink confirmBeforeLeave={state.stage === 'quiz'} />}
      />

      <main className="flex-1 min-h-0 overflow-hidden">
        {state.stage === 'landing' && (
          <div className="h-full overflow-y-auto">
            <Landing onStart={startQuiz} />
          </div>
        )}
        {state.stage === 'quiz' && <Quiz />}
        {state.stage === 'calculating' && <Calculating />}
        {state.stage === 'done' && <Calculating />}
      </main>
    </div>
  );
}
