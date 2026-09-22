import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFunnel888 } from '@/context/Funnel888Context';
import { getQuestion, getTotalQuestions } from '@/engine/datasetLoader';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { getVisualQuestionAssets, preloadVisualQuestion } from '@/assets/quiz-888/visualQuestionAssets';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';

const LIKERT_ORDER = [4, 3, 2, 1, 0];
const LIKERT_COLORS = [
  'bg-[hsl(var(--likert-strong-disagree))] hover:bg-[hsl(var(--likert-strong-disagree-active))]',
  'bg-[hsl(var(--likert-disagree))] hover:bg-[hsl(var(--likert-disagree-active))]',
  'bg-[hsl(var(--likert-neutral))] hover:bg-[hsl(var(--likert-neutral-active))]',
  'bg-[hsl(var(--likert-agree))] hover:bg-[hsl(var(--likert-agree-active))]',
  'bg-[hsl(var(--likert-strong-agree))] hover:bg-[hsl(var(--likert-strong-agree-active))]',
];
const LIKERT_TOUCH_COLORS = [
  'hsl(var(--likert-strong-disagree))',
  'hsl(var(--likert-disagree))',
  'hsl(var(--likert-neutral))',
  'hsl(var(--likert-agree))',
  'hsl(var(--likert-strong-agree))',
];

export default function AssessmentPage888() {
  const { state, dispatch } = useFunnel888();
  const question = getQuestion(state.questionIndex);
  const total = getTotalQuestions();
  const startedRef = useRef(Date.now());
  const answersRef = useRef(state.answers);
  const confirmationRef = useRef<HTMLDivElement>(null);
  answersRef.current = state.answers;
  const [selection, setSelection] = useState<{ questionId: number; optionIndex: number } | null>(null);
  const [memoryVisible, setMemoryVisible] = useState(true);
  const [countdown, setCountdown] = useState(4);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  useEffect(() => {
    const nextQuestion = getQuestion(state.questionIndex + 1);
    if (nextQuestion?.subskill === 'visual-placeholder') {
      preloadVisualQuestion(state.questionIndex + 2, nextQuestion.correctAnswer ?? 0);
    }
  }, [state.questionIndex]);

  useLayoutEffect(() => {
    const savedOption = answersRef.current.find(answer => answer.questionId === question?.id)?.selectedOption;
    setSelection(question && savedOption !== undefined ? { questionId: question.id, optionIndex: savedOption } : null);
    setAwaitingConfirmation(false);
    startedRef.current = Date.now();
    if (question?.type !== 'memorySequence') { setMemoryVisible(false); return; }
    setMemoryVisible(true);
    setCountdown(4);
    const tick = window.setInterval(() => setCountdown(value => Math.max(0, value - 1)), 1000);
    const reveal = window.setTimeout(() => { setMemoryVisible(false); window.clearInterval(tick); }, question.displayMs ?? 4000);
    return () => { window.clearInterval(tick); window.clearTimeout(reveal); };
  }, [question?.id, question?.type, question?.displayMs]);

  useEffect(() => {
    if (!awaitingConfirmation) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.requestAnimationFrame(() => {
      confirmationRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    });
  }, [awaitingConfirmation]);

  if (!question) return null;
  const isVisual = question.subskill === 'visual-placeholder';
  const visualAssets = isVisual ? getVisualQuestionAssets(state.questionIndex + 1, question.correctAnswer ?? 0) : null;
  const isTimed = question.type === 'memorySequence';
  const selected = selection?.questionId === question.id ? selection.optionIndex : null;
  const isFinal = state.questionIndex === total - 1;
  const progress = ((state.questionIndex + 1) / total) * 100;
  const seconds = Math.floor(state.timer.elapsedTime / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const finishOrAdvance = () => {
    if (isFinal) { setAwaitingConfirmation(true); return; }
    setSelection(null);
    const nextIndex = state.questionIndex + 1;
    if (question.hasReinforcement) {
      const count = Array.from({ length: state.questionIndex + 1 }, (_, index) => getQuestion(index)).filter(item => item?.hasReinforcement).length;
      dispatch({ type: 'SET_QUESTION_INDEX', index: nextIndex });
      dispatch({ type: 'SET_REINFORCEMENT_COUNT', count });
      dispatch({ type: 'SET_STAGE', stage: 'reinforcement' });
    } else {
      dispatch({ type: 'SET_QUESTION_INDEX', index: nextIndex });
    }
  };

  const answer = (optionIndex: number) => {
    if (selected !== null && !isFinal) return;
    setSelection({ questionId: question.id, optionIndex });
    const isCorrect = question.type === 'likert' || question.type === 'personal'
      ? null
      : optionIndex === question.correctAnswer;
    dispatch({ type: 'ADD_ANSWER', answer: { questionId: question.id, selectedOption: optionIndex, timeSpent: Date.now() - startedRef.current, isCorrect } });
    trackEvent(undefined, EVENTS.ASSESSMENT_QUESTION_ANSWERED, { question_number: state.questionIndex + 1, total_questions: total, category: question.category });
    window.setTimeout(finishOrAdvance, isFinal ? 100 : 350);
  };

  const confirm = () => {
    trackEvent(undefined, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'assessment', completed_questions: total });
    dispatch({ type: 'STOP_TIMER' });
    dispatch({ type: 'SET_STAGE', stage: 'social-proof' });
  };

  return (
    <div data-testid="assessment-root" className="h-[100dvh] bg-background flex flex-col overflow-hidden [--primary:216_100%_47%] [--cta:175_79%_29%] [--cta-hover:175_79%_25%] [--visual-answer:210_20%_98%] [--likert-strong-agree:143_34%_86%] [--likert-strong-agree-active:143_34%_81%] [--likert-agree:143_30%_93%] [--likert-agree-active:143_30%_88%] [--likert-neutral:43_100%_92%] [--likert-neutral-active:43_100%_86%] [--likert-disagree:354_48%_93%] [--likert-disagree-active:354_48%_88%] [--likert-strong-disagree:358_58%_89%] [--likert-strong-disagree-active:358_58%_84%]">
      <header className="shrink-0 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-foreground">IQ Scale</span>
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm font-semibold tabular-nums text-foreground"><Clock className="h-4 w-4" />{time}</span>
        </div>
      </header>
      <div className="h-1 shrink-0 bg-secondary"><div className="h-full bg-[hsl(var(--cta))] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>

        <motion.main key={`${question.id}-${memoryVisible}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className={`flex-1 min-h-0 overflow-y-auto px-4 ${isVisual ? 'pt-3' : 'pt-7'}`}>
          <div className="mx-auto w-full max-w-md">
            <div className="min-h-[calc(100dvh-77px)]">
              {isTimed && memoryVisible ? (
              <div className="space-y-7 text-center pt-5">
                <h1 className="text-2xl font-semibold text-foreground">Memorize this number sequence</h1>
                <div className="rounded-xl border border-border bg-card py-8 text-4xl font-bold tracking-widest text-foreground">{question.sequence?.join('')}</div>
                <p className="text-sm text-muted-foreground">Disappears in {countdown} seconds</p>
              </div>
            ) : (
              <div className={isVisual ? 'space-y-3' : 'space-y-7'}>
                {!isVisual && <h1 className="whitespace-pre-line text-center text-2xl font-semibold leading-tight text-foreground">{question.prompt}</h1>}
                {isVisual && visualAssets && (
                  <div className="flex h-64 items-center justify-center overflow-hidden rounded-xl bg-background">
                    <img src={visualAssets.question} alt={`Visual question ${state.questionIndex + 1}`} className="h-full w-full object-contain" fetchPriority="high" />
                  </div>
                )}
                {isVisual && <p className="text-center text-base text-foreground">Choose your answer:</p>}
                <div className={isVisual ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-3'}>
                  {(question.type === 'likert' ? LIKERT_ORDER : question.options.map((_, index) => index)).map(optionIndex => (
                    <Button
                      key={`${question.id}-${optionIndex}`}
                      type="button"
                      variant="ghost"
                      {...pointerSafeActivation(() => answer(optionIndex))}
                      style={touchFeedbackStyle(question.type === 'likert' ? LIKERT_TOUCH_COLORS[optionIndex] : isVisual ? 'hsl(var(--visual-answer))' : 'hsl(var(--success) / 0.1)')}
                      className={`${isVisual ? 'h-20 justify-center bg-[hsl(var(--visual-answer))] hover:bg-[hsl(var(--visual-answer))]' : 'min-h-[58px] h-auto justify-start px-5 py-3 text-left'} touch-no-hover rounded-xl text-base font-normal text-foreground hover:text-foreground ${question.type === 'likert' ? LIKERT_COLORS[optionIndex] : isVisual ? '' : 'bg-success/10 hover:bg-success/15'} ${selected === optionIndex ? 'ring-2 ring-[hsl(var(--cta))] text-foreground' : ''}`}
                    >
                      {isVisual && visualAssets ? (
                        <>
                          <img src={visualAssets.answers[optionIndex]} alt="" className="h-full w-full object-contain" loading="eager" />
                          <span className="sr-only">Answer {optionIndex + 1}</span>
                        </>
                      ) : isVisual ? <span className="sr-only">Answer {optionIndex + 1}</span> : question.options[optionIndex]}
                    </Button>
                  ))}
                </div>
                {isFinal && awaitingConfirmation && (
                  <motion.div ref={confirmationRef} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2 text-center">
                    <Button onClick={confirm} className="touch-no-hover h-14 w-full rounded-xl bg-[hsl(var(--cta))] text-base font-bold text-primary-foreground hover:bg-[hsl(var(--cta-hover))]">Get My Results</Button>
                    <p className="text-sm text-muted-foreground">Do you want to confirm your answers?<br />You will not be able to edit them after validation.</p>
                  </motion.div>
                )}
              </div>
              )}
            </div>
            <div data-testid="assessment-progress" className="mt-7 border-t border-border py-5 text-center text-base text-foreground"><strong>{state.questionIndex + 1}</strong> of {total}</div>
          </div>
        </motion.main>
    </div>
  );
}