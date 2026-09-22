import { useState, useRef, useMemo, useEffect } from 'react';
import { usePostHog } from '@/lib/posthog';
import { useFunnel } from '@/context/ShortIqFunnelContext';
import { Button } from '@/components/ui/button';
import { getQuestion, getTotalQuestions } from '@/engine/datasetLoader';
import { getCachedPuzzle } from '@/engine/puzzleCache';
import { prefetchStaticSvgQuestion, warmAllVisualPuzzles } from '@/engine/staticSvgCache';
import { Clock, ChevronLeft } from 'lucide-react';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { getShortIqTheme } from '@/constants/shortIqCopy';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';
import MemorySequencePlayer from '@/components/short-iq/MemorySequencePlayer';
import ReactionTapTask from '@/components/short-iq/ReactionTapTask';

const AssessmentPage = () => {
  const posthog = usePostHog();
  const { state, dispatch } = useFunnel();
  const theme = getShortIqTheme();
  const questionStartRef = useRef(Date.now());
  const [, setDirection] = useState(1);

  const total = getTotalQuestions();
  const question = getQuestion(state.questionIndex);
  const hasVisualPuzzle = !!(question?.image && (question.type === 'visualPuzzle' || question.type === 'spatial'));
  const isImageTextChoice = !!(question?.image && question.type === 'imageMultipleChoice');
  const hasImageHeader = hasVisualPuzzle || isImageTextChoice;
  const isMemorySequence = question?.type === 'memorySequence';
  const isReactionTap = question?.type === 'reactionTap';
  const isOddOneOut = question?.type === 'oddOneOut';
  const oddOneOutTimeLimitMs = isOddOneOut ? question?.timeLimitMs ?? 0 : 0;
  const [oddOneOutRemainingMs, setOddOneOutRemainingMs] = useState(oddOneOutTimeLimitMs);
  const [memoryPhase, setMemoryPhase] = useState<'reveal' | 'answer'>('reveal');
  useEffect(() => { setMemoryPhase('reveal'); }, [question?.id]);

  const puzzleResult = useMemo(() => {
    if (!hasImageHeader || !question) return null;
    return getCachedPuzzle(question.image!, question.difficulty, question.id);
  }, [hasImageHeader, question?.id, question?.image, question?.difficulty]);

  useEffect(() => {
    const current = getQuestion(state.questionIndex);
    if (current?.image?.startsWith('static_')) prefetchStaticSvgQuestion(current.image);
    for (let offset = 1; offset <= 5; offset++) {
      const upcoming = getQuestion(state.questionIndex + offset);
      if (upcoming?.image?.startsWith('static_')) prefetchStaticSvgQuestion(upcoming.image);
    }
  }, [state.questionIndex]);

  useEffect(() => {
    const keys: string[] = [];
    for (let i = 0; i < total; i++) {
      const q = getQuestion(i);
      if (q?.image?.startsWith('static_')) keys.push(q.image);
    }
    warmAllVisualPuzzles(keys, 3);
  }, [total]);

  const [fadeKey, setFadeKey] = useState(question?.id);
  const [isSwapping, setIsSwapping] = useState(false);
  useEffect(() => {
    if (!question) return;
    if (fadeKey === question.id) return;
    setIsSwapping(true);
    setFadeKey(question.id);
    const t = window.setTimeout(() => setIsSwapping(false), 150);
    return () => window.clearTimeout(t);
  }, [question?.id, fadeKey]);

  useEffect(() => {
    if (!isOddOneOut || !oddOneOutTimeLimitMs) return;
    const startedAt = Date.now();
    setOddOneOutRemainingMs(oddOneOutTimeLimitMs);
    const tick = window.setInterval(() => {
      setOddOneOutRemainingMs(Math.max(0, oddOneOutTimeLimitMs - (Date.now() - startedAt)));
    }, 50);
    const timeout = window.setTimeout(() => { handleSkip(); }, oddOneOutTimeLimitMs);
    return () => { window.clearInterval(tick); window.clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, isOddOneOut, oddOneOutTimeLimitMs]);

  if (!question) return null;

  const progress = ((state.questionIndex + 1) / total) * 100;
  const existingAnswer = state.answers.find((a) => a.questionId === question.id);
  const selectedOption = existingAnswer?.selectedOption ?? null;

  const answeredIds = new Set(state.answers.map((a) => a.questionId));
  const skippedIndices: number[] = [];
  for (let i = 0; i < state.questionIndex; i++) {
    const q = getQuestion(i);
    if (q && !answeredIds.has(q.id)) skippedIndices.push(i);
  }

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const maxQuestionReached = state.answers.length > 0
    ? Math.max(...state.answers.map((a) => {
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
        .filter((q) => q?.hasReinforcement).length;
      dispatch({ type: 'SET_QUESTION_INDEX', index: nextIndex });
      dispatch({ type: 'SET_REINFORCEMENT_COUNT', count: reinforcementNumber });
      dispatch({ type: 'SET_STAGE', stage: 'reinforcement' });
      return;
    }
    if (nextIndex >= total) {
      dispatch({ type: 'STOP_TIMER' });
      dispatch({ type: 'SET_STAGE', stage: 'calculating' });
      return;
    }
    dispatch({ type: 'SET_QUESTION_INDEX', index: nextIndex });
  };

  const handleAnswer = (optionIndex: number) => {
    if (!question) return;
    trackEvent(posthog, EVENTS.ASSESSMENT_QUESTION_ANSWERED ?? 'assessment_question_answered', {
      question_number: state.questionIndex + 1,
      total_questions: total,
      is_skip: false,
      category: question.category,
    });

    const nextIndex = state.questionIndex + 1;
    if (nextIndex >= total) {
      trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED ?? 'funnel_step_completed', { step: 'assessment', completed_questions: total });
    }

    let isCorrect: boolean | null = null;
    if (question.type !== 'likert' && question.type !== 'personal') {
      if (hasVisualPuzzle) {
        const pr = getCachedPuzzle(question.image!, question.difficulty, question.id);
        isCorrect = optionIndex === pr.correctAnswer;
      } else {
        isCorrect = question.correctAnswer !== undefined && question.correctAnswer !== null
          ? optionIndex === question.correctAnswer
          : null;
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
    trackEvent(posthog, EVENTS.ASSESSMENT_QUESTION_ANSWERED ?? 'assessment_question_answered', {
      question_number: state.questionIndex + 1,
      total_questions: total,
      is_skip: true,
    });
    const nextIndex = state.questionIndex + 1;
    if (nextIndex >= total) {
      trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED ?? 'funnel_step_completed', { step: 'assessment', completed_questions: total });
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

  const likertCardBgs = [
    'bg-red-200/80 hover:bg-red-300/70',
    'bg-orange-200/70 hover:bg-orange-300/60',
    'bg-yellow-200/70 hover:bg-yellow-300/60',
    'bg-lime-200/70 hover:bg-lime-300/60',
    'bg-green-200/80 hover:bg-green-300/70',
  ];
  const likertTouchBgs = [
    'rgb(254 202 202 / 0.8)', 'rgb(254 215 170 / 0.7)', 'rgb(254 240 138 / 0.7)',
    'rgb(217 249 157 / 0.7)', 'rgb(187 247 208 / 0.8)',
  ];
  const likertLabels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

  return (
    <div className="h-screen overflow-hidden bg-[#F5FCFF] flex flex-col" data-testid="assessment-root">
      <header className="sticky top-0 z-50 bg-[#F5FCFF] border-b border-border/60 px-4 py-2">
        <div className="relative flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack} disabled={state.questionIndex === 0}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span
            className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-foreground"
            data-testid="assessment-progress"
          >
            {state.questionIndex + 1}/{total}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5">Skip</button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/60 rounded-full px-2.5 py-0.5">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(state.timer.elapsedTime)}
            </div>
          </div>
        </div>
      </header>

      <div>
        <div className="relative h-[5px] bg-border overflow-hidden">
          <div className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: '#09629B' }} />
          {skippedIndices.map((idx) => {
            const pos = ((idx + 0.5) / total) * 100;
            return <div key={idx} className="absolute top-0 w-[3px] h-full bg-warning" style={{ left: `${pos}%` }} />;
          })}
        </div>
      </div>

      <main className={`flex-1 min-h-0 px-4 pt-5 flex flex-col items-center md:justify-center ${hasImageHeader || isMemorySequence || isReactionTap ? 'pb-2' : 'overflow-y-auto pb-6'}`}>
        <div className={`max-w-3xl md:max-w-5xl w-full mx-auto min-h-0 ${hasImageHeader ? 'flex-1 flex flex-col' : ''} transition-opacity duration-150 ease-out ${isSwapping ? 'opacity-85' : 'opacity-100'}`}>
          <div className={`${hasImageHeader ? 'flex-1 min-h-0 flex flex-col gap-2 md:gap-0' : 'space-y-7'} md:space-y-6`}>
            {!hasImageHeader && !isMemorySequence && (
              <div className="space-y-3 min-h-[88px] flex flex-col justify-end">
                <h2
                  data-testid="assessment-prompt"
                  className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed text-center whitespace-pre-line"
                >
                  {question.prompt}
                </h2>
                {question.subtitle && (
                  <p className="text-base text-muted-foreground text-center">{question.subtitle}</p>
                )}
              </div>
            )}
            {isMemorySequence && (
              <div className="space-y-3 min-h-[88px] flex flex-col justify-end">
                {memoryPhase === 'reveal' && (
                  <>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed text-center whitespace-pre-line">
                      {question.prompt}
                    </h2>
                    {question.subtitle && (
                      <p className="text-base text-muted-foreground text-center">{question.subtitle}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {hasImageHeader && puzzleResult && (
              <div className="md:hidden flex items-center justify-center h-[40dvh] px-2 pb-2">
                <div className="bg-card rounded-2xl border shadow-md p-2 w-[95%] mx-auto h-full flex items-center justify-center">
                  <div className="flex items-center justify-center w-full h-full overflow-hidden [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:w-auto [&_svg]:h-auto [&_img]:max-h-full [&_img]:max-w-full [&_img]:w-auto [&_img]:h-auto [&_img]:object-contain">
                    {puzzleResult.svg}
                  </div>
                </div>
              </div>
            )}

            {question.type === 'likert' ? (
              <div className="flex flex-col gap-3">
                {[4, 3, 2, 1, 0].map((i) => (
                  <button key={i} type="button"
                    {...pointerSafeActivation(() => handleAnswer(i))}
                    style={touchFeedbackStyle(likertTouchBgs[i])}
                    className={`w-full flex items-center justify-start px-5 py-3.5 rounded-xl text-sm font-medium transition-all touch-no-hover ${likertCardBgs[i]} active:scale-[0.98] ${selectedOption === i ? 'ring-2 ring-primary/60 scale-[1.02]' : ''}`}>
                    <span className="text-foreground/70 text-left">{likertLabels[i]}</span>
                  </button>
                ))}
              </div>
            ) : isImageTextChoice ? (
              <div className="flex-shrink-0">
                <p className="text-sm font-medium text-foreground text-center mb-3">{question.prompt}</p>
                <div className="grid grid-cols-2 gap-2 mx-auto max-w-md">
                  {question.options.map((option, i) => (
                    <button key={i} type="button"
                      {...pointerSafeActivation(() => handleAnswer(i))}
                      style={touchFeedbackStyle(selectedOption === i ? 'rgb(239 246 255)' : 'hsl(var(--card))')}
                      className={`w-full px-3 py-4 text-sm font-medium rounded-xl bg-card border shadow-sm transition-all active:scale-[0.97] text-center text-foreground/80 touch-no-hover ${selectedOption === i ? 'border-primary border-2 shadow-md' : 'border-border/60'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : hasVisualPuzzle && puzzleResult ? (
              <>
                <div className="md:hidden flex-shrink-0">
                  <p className="text-sm font-normal text-muted-foreground text-center mb-2">Select the missing element.</p>
                  <div className="grid grid-cols-3 gap-1.5 mx-auto">
                    {puzzleResult.answerOptions.map((optionSvg, i) => (
                      <button key={i} type="button"
                        {...pointerSafeActivation(() => handleAnswer(i))}
                        style={touchFeedbackStyle(selectedOption === i ? 'rgb(239 246 255)' : '#fafbfc')}
                        className={`p-1.5 rounded-xl bg-[#fafbfc] transition-all active:scale-[0.95] flex items-center justify-center aspect-square touch-no-hover ${selectedOption === i ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}>
                        <div className="flex items-center justify-center w-full h-full [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:w-auto [&_svg]:h-auto [&_img]:max-h-full [&_img]:max-w-full [&_img]:w-auto [&_img]:h-auto [&_img]:object-contain">
                          {optionSvg}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hidden md:flex md:flex-row md:items-center md:justify-center md:gap-6 flex-shrink-0">
                  <div className="flex items-center justify-center overflow-hidden max-w-[420px] w-full">
                    {puzzleResult.svg}
                  </div>
                  <div className="max-w-[270px] w-full">
                    <p className="text-base font-light text-foreground text-center mb-3">Choose your answer:</p>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {puzzleResult.answerOptions.map((optionSvg, i) => (
                        <button key={i} type="button"
                          {...pointerSafeActivation(() => handleAnswer(i))}
                          style={touchFeedbackStyle(selectedOption === i ? 'rgb(239 246 255)' : '#fafbfc')}
                          className={`p-1.5 rounded-xl bg-[#fafbfc] hover:bg-[#f0f1f2] transition-all active:scale-[0.95] flex items-center justify-center aspect-square touch-no-hover ${selectedOption === i ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}>
                          <div className="flex items-center justify-center w-full h-full [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:w-auto [&_svg]:h-auto [&_img]:max-h-full [&_img]:max-w-full [&_img]:w-auto [&_img]:h-auto [&_img]:object-contain">
                            {optionSvg}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : isMemorySequence ? (
              <MemorySequencePlayer
                question={question}
                selectedOption={selectedOption}
                onAnswer={handleAnswer}
                onPhaseChange={setMemoryPhase}
                shuffleOptions={(() => {
                  let count = 0;
                  for (let i = 0; i <= state.questionIndex; i++) {
                    if (getQuestion(i)?.type === 'memorySequence') count++;
                  }
                  return count > 1;
                })()}
              />
            ) : isReactionTap ? (
              <ReactionTapTask question={question} onAnswer={handleAnswer} />
            ) : isOddOneOut ? (
              <div className="mx-auto max-w-[300px] space-y-3">
                {oddOneOutTimeLimitMs > 0 && (
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Be quick!</span>
                    <span className="tabular-nums text-foreground/80">
                      {(oddOneOutRemainingMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
                {oddOneOutTimeLimitMs > 0 && (() => {
                  const p = oddOneOutRemainingMs / oddOneOutTimeLimitMs;
                  const eased = Math.pow(p, 3);
                  return (
                    <div className="relative h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${eased * 100}%` }} />
                    </div>
                  );
                })()}
                <div className="grid grid-cols-3 gap-2">
                  {question.options.map((glyph, i) => (
                    <button key={i} type="button"
                      {...pointerSafeActivation(() => handleAnswer(i))}
                      style={touchFeedbackStyle(selectedOption === i ? 'rgb(239 246 255)' : 'hsl(var(--card))')}
                      className={`aspect-square rounded-xl bg-card border shadow-sm flex items-center justify-center transition-all active:scale-[0.95] touch-no-hover ${
                        selectedOption === i ? 'border-primary border-2 shadow-md' : 'border-border/60'
                      }`}>
                      <span className="text-4xl text-foreground leading-none">{glyph}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {question.options.map((option, i) => (
                  <button key={i} type="button"
                    {...pointerSafeActivation(() => handleAnswer(i))}
                    style={touchFeedbackStyle(selectedOption === i ? theme.optionTouchSelected : theme.optionTouchDefault)}
                    className={`w-full p-3 text-sm font-medium text-left rounded-xl transition-all active:scale-[0.98] text-foreground/80 touch-no-hover ${selectedOption === i ? theme.optionSelected : theme.optionDefault}`}>
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentPage;