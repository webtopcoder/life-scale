import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Lock, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFunnel888Tt } from '@/context/Funnel888TtContext';
import { fetchQuestions } from '@/engine/datasetLoader';
import { calculateCategoryScores, calculateFinalScore, calculatePercentiles } from '@/engine/scoringEngine';
import { EVENTS, trackEvent } from '@/constants/analytics';
import avatarCara from '@/assets/quiz-888-tt/avatars/avatar-cara.jpg';
import { completeIqAssessment } from '@/lib/iqCompletionAdapter';

const MEASURES = ['Memory', 'Speed', 'Reaction', 'Concentration', 'Logic'];
const STOPS = [10, 23, 30, 41, 50, 61, 70, 81, 90, 99];
const PROMPTS: Record<number, { key: string; title: string; options: string[]; warning?: boolean; icon?: 'lock' | 'sparkles' }> = {
  10: { key: 'warning', title: 'Your report may reveal unexpected strengths and growth areas.', options: ['I understand'], warning: true, icon: 'lock' },
  30: { key: 'above-average', title: 'Do you think your IQ is above average?', options: ['No', 'Yes'], icon: 'sparkles' },
  50: { key: 'first-test', title: 'Is this your first IQ test?', options: ['No', 'Yes'], icon: 'sparkles' },
  81: { key: 'number-recall', title: 'The number you memorized was…', options: ['7315', '5831'] },
  90: { key: 'word-recall', title: 'The second word you memorized was…', options: ['Falcon', 'Tiger'] },
};

export default function CalculatingPage888Tt() {
  const reduceMotion = useReducedMotion();
  const { state, dispatch } = useFunnel888Tt();
  const [step, setStep] = useState(() => Math.max(0, STOPS.findIndex(stop => stop >= state.analysisProgress)));
  const [displayedPercent, setDisplayedPercent] = useState(() => Math.min(state.analysisProgress, 99));
  const [openPrompt, setOpenPrompt] = useState<number | null>(null);
  const [answeredPrompts, setAnsweredPrompts] = useState<string[]>([]);
  const targetPercent = STOPS[step] ?? 99;
  const prompt = openPrompt === null ? null : PROMPTS[openPrompt];
  const completedMeasures = Math.min(5, Math.floor((displayedPercent + 10) / 20));

  const accuracy = useMemo(() => {
    const scored = state.answers.filter(answer => answer.isCorrect !== null);
    return scored.length ? Math.round((scored.filter(answer => answer.isCorrect).length / scored.length) * 100) : 0;
  }, [state.answers]);

  useEffect(() => {
    if (displayedPercent >= targetPercent || openPrompt !== null) return;

    const id = window.setTimeout(() => {
      setDisplayedPercent(value => Math.min(value + (reduceMotion ? 3 : 1), targetPercent));
    }, reduceMotion ? 35 : 72);
    return () => window.clearTimeout(id);
  }, [displayedPercent, targetPercent, openPrompt, reduceMotion]);

  useEffect(() => {
    if (displayedPercent !== targetPercent || openPrompt !== null) return;

    dispatch({ type: 'SET_ANALYSIS_PROGRESS', progress: targetPercent });
    const requiredPrompt = PROMPTS[targetPercent];
    const promptAnswered = requiredPrompt && (
      Boolean(state.analysisResponses[requiredPrompt.key]) || answeredPrompts.includes(requiredPrompt.key)
    );

    if (requiredPrompt && !promptAnswered) {
      const id = window.setTimeout(() => setOpenPrompt(targetPercent), 450);
      return () => window.clearTimeout(id);
    }

    if (targetPercent === 99) {
      const id = window.setTimeout(async () => {
        const questions = await fetchQuestions(state.flowId);
        const scores = calculateCategoryScores(state.answers, questions);
        const percentiles = calculatePercentiles(scores);
        const finalScore = calculateFinalScore(scores);
        dispatch({ type: 'SET_SCORES', scores });
        dispatch({ type: 'SET_PERCENTILES', percentiles });
        dispatch({ type: 'SET_FINAL_SCORE', score: finalScore });
        await completeIqAssessment({ answers: state.answers, questions, scores: { ...scores }, percentiles: { ...percentiles }, finalScore, flowId: state.flowId });
        trackEvent(undefined, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'calculating', accuracy });
        dispatch({ type: 'SET_STAGE', stage: 'email' });
      }, 900);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => setStep(value => Math.min(value + 1, STOPS.length - 1)), 350);
    return () => window.clearTimeout(id);
  }, [displayedPercent, targetPercent, openPrompt, state.analysisResponses, state.answers, state.flowId, answeredPrompts, dispatch, accuracy]);

  const answerPrompt = (value: string) => {
    if (!prompt) return;
    setAnsweredPrompts(values => values.includes(prompt.key) ? values : [...values, prompt.key]);
    dispatch({ type: 'SET_ANALYSIS_RESPONSE', key: prompt.key, value });
    setOpenPrompt(null);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background via-background to-secondary [--primary:216_100%_47%] [--cta:175_79%_29%] [--cta-hover:175_79%_25%]">
      <header className="border-b-4 border-[hsl(var(--cta))] bg-background px-4 py-4">
        <div className="mx-auto max-w-md text-xl font-bold text-foreground">Life Scale</div>
      </header>

      <main className="px-5 pb-12 pt-8">
        <div className="mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h1 className="text-3xl font-bold leading-tight text-foreground">Calculating your<br /><span className="text-primary">IQ score...</span></h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">Hang tight while we analyze your answers against the 5 key measures of intelligence...</p>
          </motion.div>

          <div className="mt-6 h-5 overflow-hidden rounded-full bg-muted" aria-label={`Analysis ${displayedPercent}% complete`}>
            <motion.div
              className="relative h-full rounded-full bg-primary"
              animate={{ width: `${displayedPercent}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.12, ease: 'linear' }}
            >
              <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-primary-foreground">{displayedPercent}%</span>
            </motion.div>
          </div>

          <div className="mt-5 space-y-3 border-t border-border pt-4">
            {MEASURES.map((measure, index) => {
              const complete = index < completedMeasures;
              return (
                <div key={measure} className="flex items-center gap-2.5 text-lg text-foreground">
                  <motion.span
                    animate={complete ? { scale: [0.9, 1.08, 1] } : { scale: 1 }}
                    className={`flex h-6 w-6 items-center justify-center rounded-md border ${complete ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}
                  >
                    {complete && <Check className="h-4 w-4" />}
                  </motion.span>
                  {measure}
                </div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-10 border-t border-border pt-6">
            <div className="flex items-center gap-3">
              <img src={avatarCara} alt="Cara Mitchell" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">Cara Mitchell</p>
                <div className="mt-0.5 flex gap-0.5" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-warning text-warning" />)}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">“It helped me understand myself better!”</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The results felt accurate and gave me a fresh view of my strengths.</p>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {prompt && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/25 px-4 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="analysis-prompt-title"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[354px] rounded-2xl bg-background px-4 pb-4 pt-6 text-center shadow-elevated"
            >
              {prompt.icon === 'lock' && <Lock className="mx-auto mb-5 h-14 w-14 text-primary" strokeWidth={1.7} />}
              {prompt.icon === 'sparkles' && <Sparkles className="mx-auto mb-5 h-14 w-14 text-primary" strokeWidth={1.7} />}
              <h2 id="analysis-prompt-title" className="text-lg font-medium leading-snug text-foreground">{prompt.title}</h2>
              {prompt.warning && (
                <div className="mt-4 rounded-lg bg-secondary p-3 text-left text-sm text-muted-foreground">
                  Your results remain private and personally yours.
                </div>
              )}
              <div className={`mt-5 ${prompt.options.length > 1 ? 'grid grid-cols-2 gap-2.5' : ''}`}>
                {prompt.options.map(option => (
                  <Button
                    key={option}
                    onClick={() => answerPrompt(option)}
                    className="h-12 w-full rounded-xl bg-[hsl(var(--cta))] text-base font-bold text-primary-foreground hover:bg-[hsl(var(--cta-hover))]"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}