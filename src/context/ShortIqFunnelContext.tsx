import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { FunnelState, FunnelStage, Answer, CategoryScores, AdaptiveProfile } from '@/types/funnel';
import { STORAGE_KEYS } from '@/constants/storage';
import { FLOW_IDS } from '@/engine/datasetLoader';
import { scoreToPercentile } from '@/engine/scoringEngine';
import {
  createSession,
  saveAnswer,
  updateSessionResults,
  createUserProfile,
  clearFunnelPersistedStateAfterEmail,
} from '@/services/assessmentService';

const createInitialState = (flowId: string = FLOW_IDS.SHORT_IQ_V1): FunnelState => ({
  funnelStage: 'intro',
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
  flowId,
  selectedPlanId: null,
});

const scopedStorageKey = (flowId: string) => `${STORAGE_KEYS.FUNNEL_STATE}:${flowId}`;

function isPersistableState(value: unknown): value is FunnelState {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<FunnelState>;
  return typeof c.flowId === 'string'
    && typeof c.funnelStage === 'string'
    && typeof c.questionIndex === 'number'
    && Array.isArray(c.answers)
    && !!c.timer
    && typeof c.timer === 'object';
}

function saveSession(state: FunnelState): void {
  if (typeof window === 'undefined') return;
  if (state.funnelStage === 'intro' && state.answers.length === 0) return;
  try {
    localStorage.setItem(scopedStorageKey(state.flowId), JSON.stringify(state));
  } catch { /* ignore */ }
}

function loadSession(flowId: string): FunnelState {
  if (typeof window === 'undefined') return createInitialState(flowId);
  try {
    const raw = localStorage.getItem(scopedStorageKey(flowId));
    if (!raw) return createInitialState(flowId);
    const parsed = JSON.parse(raw);
    if (!isPersistableState(parsed) || parsed.flowId !== flowId) return createInitialState(flowId);
    return { ...createInitialState(flowId), ...parsed, flowId };
  } catch {
    return createInitialState(flowId);
  }
}

function clearSession(flowId: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(scopedStorageKey(flowId)); } catch { /* ignore */ }
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
  | { type: 'RESET' }
  | { type: 'RESTORE_SESSION'; payload: FunnelState };

function funnelReducer(state: FunnelState, action: Action): FunnelState {
  switch (action.type) {
    case 'SET_STAGE': return { ...state, funnelStage: action.stage };
    case 'SET_QUESTION_INDEX': return { ...state, questionIndex: action.index };
    case 'ADD_ANSWER': {
      const existing = state.answers.findIndex((a) => a.questionId === action.answer.questionId);
      if (existing >= 0) {
        const updated = [...state.answers];
        updated[existing] = action.answer;
        return { ...state, answers: updated };
      }
      return { ...state, answers: [...state.answers, action.answer] };
    }
    case 'SET_SCORES': return { ...state, scores: action.scores };
    case 'SET_PERCENTILES': return { ...state, percentiles: action.percentiles };
    case 'START_TIMER': return { ...state, timer: { ...state.timer, startTime: Date.now(), elapsedTime: 0 } };
    case 'UPDATE_ELAPSED': return { ...state, timer: { ...state.timer, elapsedTime: action.elapsed } };
    case 'STOP_TIMER': return { ...state, timer: { ...state.timer, completionTime: state.timer.elapsedTime } };
    case 'SET_EMAIL': return { ...state, email: action.email };
    case 'SET_FINAL_SCORE': return { ...state, finalScore: action.score };
    case 'SET_GENDER': return { ...state, gender: action.gender };
    case 'SET_REINFORCEMENT_COUNT': return { ...state, reinforcementCount: action.count };
    case 'SET_ADAPTIVE_DATA': return { ...state, adaptiveAbility: action.ability, adaptiveProfile: action.profile };
    case 'SET_V2': return { ...state, isV2: action.isV2 };
    case 'SET_FLOW_ID': return state.flowId === action.flowId ? state : { ...state, flowId: action.flowId };
    case 'RESET': clearSession(state.flowId); return createInitialState(state.flowId);
    case 'RESTORE_SESSION': return action.payload;
    default: return state;
  }
}

interface ShortIqFunnelContextType {
  state: FunnelState;
  dispatch: React.Dispatch<Action>;
  goToStage: (stage: FunnelStage) => void;
}

const Ctx = createContext<ShortIqFunnelContextType | null>(null);

export function ShortIqFunnelProvider({ children, flowId = FLOW_IDS.SHORT_IQ_V1 }: { children: React.ReactNode; flowId?: string }) {
  const [state, rawDispatch] = useReducer(funnelReducer, flowId, loadSession);
  const stateRef = useRef(state);
  stateRef.current = state;
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionCreatedRef = useRef(false);
  const sessionCreatePromiseRef = useRef<Promise<void> | null>(null);

  const dispatch: React.Dispatch<Action> = useCallback((action: Action) => {
    rawDispatch(action);
    const currentState = stateRef.current;

    switch (action.type) {
      case 'SET_GENDER':
        if (!sessionCreatedRef.current) {
          sessionCreatedRef.current = true;
          sessionCreatePromiseRef.current = createSession(action.gender, currentState.isV2).then(({ error }) => {
            if (error) toast.error('Failed to save session. Your progress may not be saved.');
          });
        }
        break;

      case 'ADD_ANSWER':
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
        sessionCreatedRef.current = false;
        sessionCreatePromiseRef.current = null;
        break;
    }
  }, []);

  useEffect(() => {
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => saveSession(state), 300);
    return () => { if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current); };
  }, [
    state.funnelStage, state.questionIndex, state.answers, state.email, state.finalScore,
    state.gender, state.reinforcementCount, state.adaptiveAbility, state.adaptiveProfile,
    state.flowId, state.scores, state.percentiles, state.timer.startTime, state.timer.completionTime,
  ]);

  const goToStage = useCallback((stage: FunnelStage) => dispatch({ type: 'SET_STAGE', stage }), [dispatch]);

  useEffect(() => {
    if (!state.timer.startTime || state.timer.completionTime != null) return;
    const startTime = state.timer.startTime;
    const id = setInterval(() => {
      dispatch({ type: 'UPDATE_ELAPSED', elapsed: Date.now() - startTime });
    }, 1000);
    return () => clearInterval(id);
  }, [state.timer.startTime, state.timer.completionTime, dispatch]);

  useEffect(() => {
    if (state.funnelStage !== 'intro' && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      sessionCreatePromiseRef.current = createSession(state.gender || '', state.isV2).then(({ error }) => {
        if (error) toast.error('Failed to save session. Your progress may not be saved.');
      });
    }
  }, [state.funnelStage, state.gender, state.isV2]);

  const value = useMemo(() => ({ state, dispatch, goToStage }), [state, goToStage, dispatch]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFunnel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFunnel must be used within ShortIqFunnelProvider');
  return ctx;
}