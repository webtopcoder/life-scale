import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostHog } from '@posthog/react';
import { toast } from 'sonner';
import { FunnelState, FunnelStage, Answer, CategoryScores, AdaptiveProfile, STAGE_ROUTES } from '@/types/funnel';
import { EVENTS, trackEvent } from '@/constants/analytics';
import {
  createSession,
  saveAnswer,
  updateSessionResults,
  createUserProfile,
  getStoredSessionId,
  getSessionProgress,
  hydrateFunnelState,
  clearFunnelSession,
  clearFunnelPersistedStateAfterEmail,
  type SessionProgressRow,
  type AnswerRow,
} from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { scoreToPercentile } from '@/engine/scoringEngine';
import { STORAGE_KEYS } from '@/constants/storage';
import { FLOW_IDS, preloadQuestions } from '@/engine/datasetLoader';

const initialState: FunnelState = {
  funnelStage: 'landing',
  questionIndex: 0,
  answers: [],
  scores: { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 },
  percentiles: { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 },
  timer: { startTime: null, elapsedTime: 0, completionTime: null },
  email: '',
  finalScore: null,
  gender: '',
  reinforcementCount: 0,
  adaptiveAbility: null,
  adaptiveProfile: null,
  isV2: false,
  flowId: FLOW_IDS.FIXED_V1,
  selectedPlanId: null,
};

function loadState(): FunnelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FUNNEL_STATE);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<FunnelState>;
    return {
      ...initialState,
      ...parsed,
      flowId: parsed.flowId ?? FLOW_IDS.FIXED_V1,
    };
  } catch {
    return initialState;
  }
}

function saveState(state: FunnelState) {
  try {
    localStorage.setItem(STORAGE_KEYS.FUNNEL_STATE, JSON.stringify(state));
  } catch {
    // storage full or unavailable
  }
}

type Action =
  | { type: 'SET_STAGE'; stage: FunnelStage }
  | { type: 'SET_QUESTION_INDEX'; index: number }
  | { type: 'ADD_ANSWER'; answer: Answer }
  | { type: 'SET_SCORES'; scores: CategoryScores }
  | { type: 'SET_PERCENTILES'; percentiles: CategoryScores }
  | { type: 'START_TIMER' }
  | { type: 'UPDATE_ELAPSED'; elapsed: number }
  | { type: 'STOP_TIMER' }
  | { type: 'SET_EMAIL'; email: string }
  | { type: 'SET_FINAL_SCORE'; score: number }
  | { type: 'SET_GENDER'; gender: string }
  | { type: 'SET_REINFORCEMENT_COUNT'; count: number }
  | { type: 'SET_ADAPTIVE_DATA'; ability: number; profile: AdaptiveProfile }
  | { type: 'SET_V2'; isV2: boolean }
  | { type: 'SET_FLOW_ID'; flowId: string }
  | { type: 'SET_SELECTED_PLAN'; planId: FunnelState['selectedPlanId'] }
  | { type: 'RESET' }
  | { type: 'RESTORE_SESSION'; payload: FunnelState };

function funnelReducer(state: FunnelState, action: Action): FunnelState {
  switch (action.type) {
    case 'SET_STAGE':
      return { ...state, funnelStage: action.stage };
    case 'SET_QUESTION_INDEX':
      return { ...state, questionIndex: action.index };
    case 'ADD_ANSWER': {
      const existing = state.answers.findIndex(a => a.questionId === action.answer.questionId);
      if (existing >= 0) {
        const updated = [...state.answers];
        updated[existing] = action.answer;
        return { ...state, answers: updated };
      }
      return { ...state, answers: [...state.answers, action.answer] };
    }
    case 'SET_SCORES':
      return { ...state, scores: action.scores };
    case 'SET_PERCENTILES':
      return { ...state, percentiles: action.percentiles };
    case 'START_TIMER':
      return { ...state, timer: { ...state.timer, startTime: Date.now(), elapsedTime: 0 } };
    case 'UPDATE_ELAPSED':
      return { ...state, timer: { ...state.timer, elapsedTime: action.elapsed } };
    case 'STOP_TIMER':
      return { ...state, timer: { ...state.timer, completionTime: state.timer.elapsedTime } };
    case 'SET_EMAIL':
      return { ...state, email: action.email };
    case 'SET_FINAL_SCORE':
      return { ...state, finalScore: action.score };
    case 'SET_GENDER':
      return { ...state, gender: action.gender };
    case 'SET_REINFORCEMENT_COUNT':
      return { ...state, reinforcementCount: action.count };
    case 'SET_ADAPTIVE_DATA':
      return { ...state, adaptiveAbility: action.ability, adaptiveProfile: action.profile };
    case 'SET_V2':
      return { ...state, isV2: action.isV2 };
    case 'SET_FLOW_ID':
      return { ...state, flowId: action.flowId };
    case 'SET_SELECTED_PLAN':
      return { ...state, selectedPlanId: action.planId };
    case 'RESET':
      localStorage.removeItem(STORAGE_KEYS.FUNNEL_STATE);
      localStorage.removeItem(STORAGE_KEYS.FUNNEL_SESSION_ID);
      return initialState;
    case 'RESTORE_SESSION':
      return action.payload;
    default:
      return state;
  }
}

interface FunnelContextType {
  state: FunnelState;
  dispatch: React.Dispatch<Action>;
  goToStage: (stage: FunnelStage) => void;
  pendingResume: PendingResume | null;
  /** False while we're still checking for an incomplete session (so UI can show loading instead of flashing content). */
  resumeCheckComplete: boolean;
  onResume: (hydrated: FunnelState) => void;
  onStartOver: () => void;
}

const FunnelContext = createContext<FunnelContextType | null>(null);

type PendingResume = {
  session: SessionProgressRow;
  answers: AnswerRow[];
  profileEmail: string;
};

export function ResumeSessionGate({
  pendingResume,
  onResume,
  onStartOver,
}: {
  pendingResume: PendingResume;
  onResume: (hydrated: FunnelState) => void;
  onStartOver: () => void;
}) {
  const posthog = usePostHog();
  const navigate = useNavigate();

  const handleResume = async () => {
    trackEvent(posthog, EVENTS.FUNNEL_SESSION_RESUMED, {});
    const flowId = loadState().flowId ?? FLOW_IDS.FIXED_V1;
    await preloadQuestions(flowId);
    const hydrated = hydrateFunnelState(
      pendingResume.session,
      pendingResume.answers,
      pendingResume.profileEmail,
      flowId,
    );
    onResume(hydrated);
    navigate(STAGE_ROUTES[hydrated.funnelStage]);
  };

  const handleStartOver = () => {
    trackEvent(posthog, EVENTS.FUNNEL_SESSION_STARTED_OVER, {});
    onStartOver();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4 text-center">
        <h2 className="text-xl font-semibold text-foreground">You have a previous session in progress</h2>
        <p className="text-muted-foreground">
          Do you want to resume where you left off or start over?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={handleResume} size="lg" className="flex-1">
            Resume
          </Button>
          <Button onClick={handleStartOver} variant="outline" size="lg" className="flex-1">
            Start over
          </Button>
        </div>
      </div>
    </div>
  );
}

/** True when we're not in "might need to show resume gate" scenario (so no need to block UI). */
function isResumeCheckNeeded(state: FunnelState): boolean {
  return state.funnelStage === 'landing' && state.answers.length === 0;
}

export function FunnelProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(funnelReducer, undefined, loadState);
  const [pendingResume, setPendingResume] = useState<PendingResume | null>(null);
  const [resumeCheckComplete, setResumeCheckComplete] = useState(() => !isResumeCheckNeeded(loadState()));
  const resumeCheckDoneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionCreatedRef = useRef(false);
  const sessionCreatePromiseRef = useRef<Promise<unknown> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Check for incomplete session before showing onboarding UI (avoids flash of content then dialog)
  useEffect(() => {
    if (!isResumeCheckNeeded(state)) {
      setResumeCheckComplete(true);
      return;
    }
    if (resumeCheckDoneRef.current) return;
    resumeCheckDoneRef.current = true;
    const storedId = getStoredSessionId();
    if (!storedId) {
      setResumeCheckComplete(true);
      return;
    }
    getSessionProgress(storedId)
      .then((result) => {
        if (result) setPendingResume(result);
        setResumeCheckComplete(true);
      })
      .catch(() => setResumeCheckComplete(true));
  }, [state.funnelStage, state.answers.length]);

  const handleResume = useCallback((hydrated: FunnelState) => {
    rawDispatch({ type: 'RESTORE_SESSION', payload: hydrated });
    setPendingResume(null);
  }, []);

  const handleStartOver = useCallback(() => {
    clearFunnelSession();
    rawDispatch({ type: 'RESET' });
     // Ensure a fresh session row will be created next time the user starts the funnel
     sessionCreatedRef.current = false;
     sessionCreatePromiseRef.current = null;
    setPendingResume(null);
  }, []);

  // Persist to sessionStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Wrapped dispatch that also persists to database
  const dispatch: React.Dispatch<Action> = useCallback((action: Action) => {
    rawDispatch(action);

    // Fire-and-forget DB persistence for key actions
    const currentState = stateRef.current;

    switch (action.type) {
      case 'SET_GENDER':
        // Create/update session when gender is selected (start of funnel)
        if (!sessionCreatedRef.current) {
          sessionCreatedRef.current = true;
          sessionCreatePromiseRef.current = createSession(action.gender, currentState.isV2).then(({ error }) => {
            if (error) toast.error('Failed to save session. Your progress may not be saved.');
          });
        }
        break;

      case 'ADD_ANSWER':
        // Save each answer to the database — await the in-flight create-session
        // so the parent assessment_sessions row exists before the FK insert.
        (async () => {
          try {
            if (sessionCreatePromiseRef.current) await sessionCreatePromiseRef.current;
          } catch { /* createSession surfaces its own toast */ }
          const { error } = await saveAnswer(
            action.answer.questionId,
            action.answer.selectedOption,
            action.answer.timeSpent,
            action.answer.isCorrect,
          );
          if (error) toast.error('Failed to save answer.');
        })();
        break;

      case 'SET_FINAL_SCORE':
        // Update session with final results
        // Use a microtask to read the state AFTER the reducer has processed
        // SET_SCORES and SET_PERCENTILES (which are dispatched right before this)
        queueMicrotask(() => {
          const freshState = stateRef.current;
          updateSessionResults({
            finalScore: action.score,
            completionTimeMs: freshState.timer.completionTime ?? freshState.timer.elapsedTime,
            adaptiveAbility: freshState.adaptiveAbility,
            strongestCategory: freshState.adaptiveProfile?.strongest ?? null,
            secondaryCategory: freshState.adaptiveProfile?.secondary ?? null,
            trajectory: freshState.adaptiveProfile?.trajectory ?? null,
            scores: { ...freshState.scores } as Record<string, number>,
            percentiles: { ...freshState.percentiles } as Record<string, number>,
          }).then(({ error }) => {
            if (error) toast.error('Failed to save results.');
          });
        });
        break;

      case 'SET_EMAIL':
        // Create user profile when email is provided
        createUserProfile(action.email, {
          finalScore: currentState.finalScore,
          strongestCategory: currentState.adaptiveProfile?.strongest ?? null,
          adaptiveAbility: currentState.adaptiveAbility,
          percentile: currentState.finalScore ? Math.round(scoreToPercentile(currentState.finalScore)) : null,
        }).then(({ error }) => {
          if (error) toast.error('Failed to save profile.');
          else clearFunnelPersistedStateAfterEmail();
        });
        break;

      case 'RESET':
        // New funnel session should create a fresh assessment_sessions row
        sessionCreatedRef.current = false;
        sessionCreatePromiseRef.current = null;
        break;
    }
  }, []);

  const goToStage = useCallback((stage: FunnelStage) => {
    dispatch({ type: 'SET_STAGE', stage });
  }, [dispatch]);

  // Also create session if user starts V2 flow without gender selection
  useEffect(() => {
    if (state.funnelStage !== 'landing' && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      sessionCreatePromiseRef.current = createSession(state.gender || '', state.isV2).then(({ error }) => {
        if (error) toast.error('Failed to save session. Your progress may not be saved.');
      });
    }
  }, [state.funnelStage, state.gender, state.isV2]);

  // Timer effect: clear interval on completion or unmount so no interval is left running
  useEffect(() => {
    if (!state.timer.startTime || state.timer.completionTime != null) {
      return;
    }
    const startTime = state.timer.startTime;
    const id = setInterval(() => {
      rawDispatch({ type: 'UPDATE_ELAPSED', elapsed: Date.now() - startTime });
    }, 1000);
    timerRef.current = id;
    return () => {
      clearInterval(id);
      timerRef.current = null;
    };
  }, [state.timer.startTime, state.timer.completionTime]);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      goToStage,
      pendingResume,
      resumeCheckComplete,
      onResume: handleResume,
      onStartOver: handleStartOver,
    }),
    [state, dispatch, goToStage, pendingResume, resumeCheckComplete, handleResume, handleStartOver],
  );

  return (
    <FunnelContext.Provider value={contextValue}>
      {children}
    </FunnelContext.Provider>
  );
}

export function useFunnel() {
  const ctx = useContext(FunnelContext);
  if (!ctx) throw new Error('useFunnel must be used within FunnelProvider');
  return ctx;
}
