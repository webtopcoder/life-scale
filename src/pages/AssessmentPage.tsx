import { useState, useRef, useMemo, useEffect } from 'react';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { Button } from '@/components/ui/button';
import { getQuestion, getTotalQuestions, FLOW_IDS } from '@/engine/datasetLoader';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { getCachedPuzzle } from '@/engine/puzzleCache';
import { prefetchStaticSvgQuestion } from '@/engine/staticSvgCache';

import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { getFunnelTheme } from '@/constants/funnelThemes';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';

const AssessmentPage = () => {
  const posthog = usePostHog();
  const { state, dispatch } = useFunnel();
  const theme = getFunnelTheme(state.flowId);
  const questionStartRef = useRef(Date.now());
  const [direction, setDirection] = useState(1);

  const total = getTotalQuestions();
  const question = getQuestion(state.questionIndex);
  const hasVisualPuzzle = question?.image && (question.type === 'visualPuzzle' || question.type === 'spatial');

  // Memoize puzzle result for current question
  const puzzleResult = useMemo(() => {
    if (!hasVisualPuzzle || !question) return null;
    return getCachedPuzzle(question.image!, question.difficulty, question.id);
  }, [hasVisualPuzzle, question?.id, question?.image, question?.difficulty]);

  // Look-ahead: prefetch images for next 3 visual questions
  useEffect(() => {
    for (let offset = 1; offset <= 3; offset++) {
      const upcoming = getQuestion(state.questionIndex + offset);
      if (upcoming?.image?.startsWith('static_')) {
        prefetchStaticSvgQuestion(upcoming.image);
      }
    }
  }, [state.questionIndex]);

  if (!question) return null;

  const progress = ((state.questionIndex + 1) / total) * 100;

  const existingAnswer = state.answers.find(a => a.questionId === question.id);
  const selectedOption = existingAnswer?.selectedOption ?? null;

  const answeredIds = new Set(state.answers.map(a => a.questionId));
  const skippedIndices: number[] = [];
  for (let i = 0; i < state.questionIndex; i++) {
    const q = getQuestion(i);
    if (q && !answeredIds.has(q.id)) {
      skippedIndices.push(i);
    }
  }

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const maxQuestionReached = state.answers.length > 0
    ? Math.max(...state.answers.map(a => {
        for (let i = 0; i < total; i++) {
          const q = getQuestion(i);
          if (q && q.id === a.questionId) return i;
        }
        return 0;
      }))
    : -1;

  const advanceToNext = (nextIndex: number, answeredQuestion?: ReturnType<typeof getQuestion>) => {
    if (answeredQuestion?.hasReinforcement && nextIndex > maxQuestionReached) {
      const reinforcementNumber = Array.from({ length: state.questionIndex + 1 }, (_, i) => getQuestion(i))
        .filter(q => q?.hasReinforcement).length;
      dispatch({ type: 'SET_QUESTION_INDEX', index: nextIndex });
      dispatch({ type: 'SET_REINFORCEMENT_COUNT', count: reinforcementNumber });
      dispatch({ type: 'SET_STAGE', stage: 'reinforcement' });
      return;
    }
    if (nextIndex >= total) {
      dispatch({ type: 'STOP_TIMER' });
      dispatch({ type: 'SET_STAGE', stage: 'social-proof' });
      return;
    }
    dispatch({ type: 'SET_QUESTION_INDEX', index: nextIndex });
  };

  const handleAnswer = (optionIndex: number) => {
    if (!question) return;

    trackEvent(posthog, EVENTS.ASSESSMENT_QUESTION_ANSWERED, {
      question_number: state.questionIndex + 1,
      total_questions: total,
      is_skip: false,
      category: question.category,
    });

    const nextIndex = state.questionIndex + 1;
    if (nextIndex >= total) {
      trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'assessment', completed_questions: total });
    }

    let isCorrect: boolean | null = null;
    if (question.type !== 'likert' && question.type !== 'personal') {
      if (hasVisualPuzzle) {
        const pr = getCachedPuzzle(question.image!, question.difficulty, question.id);
        isCorrect = optionIndex === pr.correctAnswer;
      } else {
        isCorrect = question.correctAnswer !== undefined && question.correctAnswer !== null
          ? optionIndex === question.correctAnswer : null;
      }
    }

    dispatch({
      type: 'ADD_ANSWER',
      answer: {
        questionId: question.id,
        selectedOption: optionIndex,
        timeSpent: Date.now() - questionStartRef.current,
        isCorrect,
      },
    });

    setDirection(1);
    questionStartRef.current = Date.now();
    advanceToNext(nextIndex, question);
  };

  const handleSkip = () => {
    trackEvent(posthog, EVENTS.ASSESSMENT_QUESTION_ANSWERED, {
      question_number: state.questionIndex + 1,
      total_questions: total,
      is_skip: true,
    });

    const nextIndex = state.questionIndex + 1;
    if (nextIndex >= total) {
      trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'assessment', completed_questions: total });
    }

    setDirection(1);
    questionStartRef.current = Date.now();
    advanceToNext(nextIndex, question);
  };

  const handleBack = () => {
    if (state.questionIndex <= 0) return;
    setDirection(-1);
    questionStartRef.current = Date.now();
    dispatch({ type: 'SET_QUESTION_INDEX', index: state.questionIndex - 1 });
  };

  // Likert: softer colors, NO radio dots
  const likertCardBgs = [
    "bg-red-200/80 hover:bg-red-300/70",
    "bg-orange-200/70 hover:bg-orange-300/60",
    "bg-yellow-200/70 hover:bg-yellow-300/60",
    "bg-lime-200/70 hover:bg-lime-300/60",
    "bg-green-200/80 hover:bg-green-300/70",
  ];
  const likertTouchBgs = [
    "rgb(254 202 202 / 0.8)",
    "rgb(254 215 170 / 0.7)",
    "rgb(254 240 138 / 0.7)",
    "rgb(217 249 157 / 0.7)",
    "rgb(187 247 208 / 0.8)",
  ];
  const likertLabels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden" data-testid="assessment-root">
      {/* Header */}
      {state.flowId === FLOW_IDS.IQSCALE_V1 || state.flowId === FLOW_IDS.FIXED_V1_RVR2 ? (
        <LifeScaleHeader
          wordmark="IQ Scale"
          showHelp={false}
          right={
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(state.timer.elapsedTime)}
            </div>
          }
        />
      ) : (
        <header className="sticky top-0 z-50 bg-white border-b border-border/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold tracking-tight text-foreground">
              True<span className="text-foreground">IQ</span>
            </span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(state.timer.elapsedTime)}
            </div>
          </div>
        </header>
      )}

      {/* Progress bar */}
      <div>
        <div className="relative h-[5px] bg-border overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: 'hsl(145, 65%, 42%)' }}
          />
          {skippedIndices.map((idx) => {
            const pos = ((idx + 0.5) / total) * 100;
            return (
              <div
                key={idx}
                className="absolute top-0 w-[3px] h-full bg-warning"
                style={{ left: `${pos}%` }}
                title={`Question ${idx + 1} skipped`}
              />
            );
          })}
        </div>
      </div>

      {/* Question */}
      <main className="flex-1 min-h-0 px-4 pb-2 pt-8 overflow-hidden flex flex-col items-center md:justify-center">
          <div
            key={question.id}
            className={`max-w-3xl md:max-w-5xl w-full mx-auto min-h-0 ${hasVisualPuzzle ? 'flex-1 flex flex-col' : ''}`}
          >
            <div className={`${hasVisualPuzzle ? 'flex-1 min-h-0 flex flex-col gap-0' : 'space-y-7'} md:space-y-6`}>
                {!hasVisualPuzzle && (
                  <h2
                    data-testid="assessment-prompt"
                    className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed text-center whitespace-pre-line"
                  >
                    {question.prompt}
                  </h2>
                )}

                {/* Visual Puzzle mobile */}
                {hasVisualPuzzle && (
                  <div className="md:hidden flex items-center justify-center h-[40dvh] px-2 pb-2">
                    <div className="bg-card rounded-2xl border shadow-md p-2 w-[95%] mx-auto h-full">
                      <div className="flex items-center justify-center w-full h-full overflow-hidden">
                        {puzzleResult!.svg}
                      </div>
                    </div>
                  </div>
                )}

                {/* Answers */}
                {question.type === 'likert' ? (
                  /* Full-width stacked pills, reversed: Strongly Agree at top */
                  <div className="flex flex-col gap-3">
                    {[4, 3, 2, 1, 0].map((i) => (
                      <button
                        key={i}
                        type="button"
                        {...pointerSafeActivation(() => handleAnswer(i))}
                        style={touchFeedbackStyle(likertTouchBgs[i])}
                        className={`w-full flex items-center justify-start px-5 py-3.5 rounded-xl text-sm font-medium transition-all touch-no-hover ${likertCardBgs[i]} active:scale-[0.98] ${selectedOption === i ? 'ring-2 ring-primary/60 scale-[1.02]' : ''}`}
                      >
                        <span className="text-foreground/70 text-left">{likertLabels[i]}</span>
                      </button>
                    ))}
                  </div>
                ) : hasVisualPuzzle ? (
                  <>
                    {/* Mobile: stacked layout */}
                    <div className="md:hidden flex-shrink-0">
                      <p className="text-base font-light text-foreground text-center mb-4">Choose your answer:</p>
                      <div className="grid grid-cols-3 gap-1.5 mx-auto">
                        {puzzleResult!.answerOptions.map((optionSvg, i) => (
                          <button
                            key={i}
                            type="button"
                            {...pointerSafeActivation(() => handleAnswer(i))}
                            style={touchFeedbackStyle(selectedOption === i ? 'rgb(239 246 255)' : '#fafbfc')}
                            className={`p-0 rounded-xl overflow-hidden bg-[#fafbfc] hover:bg-[#f0f1f2] transition-all active:scale-[0.95] flex items-center justify-center aspect-[5/3] touch-no-hover ${selectedOption === i ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}
                          >
                            {optionSvg}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Desktop: centered flex row with tight gap */}
                    <div className="hidden md:flex md:flex-row md:items-center md:justify-center md:gap-6 flex-shrink-0">
                      <div className={`flex items-center justify-center overflow-hidden max-w-[380px] w-full ${question.image!.startsWith('static_') ? 'max-w-[420px]' : ''}`}>
                        {puzzleResult!.svg}
                      </div>
                      <div className="max-w-[320px] w-full">
                        <p className="text-base font-light text-foreground text-center mb-3">Choose your answer:</p>
                        <div className="grid grid-cols-2 gap-3 w-full">
                          {puzzleResult!.answerOptions.map((optionSvg, i) => (
                            <button
                              key={i}
                              type="button"
                              {...pointerSafeActivation(() => handleAnswer(i))}
                              style={touchFeedbackStyle(selectedOption === i ? 'rgb(239 246 255)' : '#fafbfc')}
                              className={`p-0 rounded-xl overflow-hidden bg-[#fafbfc] hover:bg-[#f0f1f2] transition-all active:scale-[0.95] flex items-center justify-center aspect-[5/3] touch-no-hover ${selectedOption === i ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}
                            >
                              {optionSvg}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Text options: single-column stacked */
                  <div className="flex flex-col gap-3">
                    {question.options.map((option, i) => (
                      <button
                        key={i}
                        type="button"
                        {...pointerSafeActivation(() => handleAnswer(i))}
                        style={touchFeedbackStyle(selectedOption === i ? theme.optionTouchSelected : theme.optionTouchDefault)}
                        className={`w-full p-3 text-sm font-medium text-left rounded-xl transition-all active:scale-[0.98] text-foreground/80 touch-no-hover ${selectedOption === i ? theme.optionSelected : theme.optionDefault}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
      </main>

      {/* Sticky Footer: arrows + question counter */}
      <div className="shrink-0 bg-card/90 backdrop-blur-sm border-t border-border/60 px-4 py-1.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={state.questionIndex === 0}
            className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-xs text-muted-foreground" data-testid="assessment-progress">
            <span className="font-bold text-foreground">{state.questionIndex + 1}</span> of <span className="text-foreground">{total}</span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
