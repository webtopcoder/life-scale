import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Answer, CategoryScores, FunnelStage, FunnelState } from '@/types/funnel';

/**
 * Isolated funnel context for the /onboarding-888 flow.
 * Fully self-contained: its own storage keys, its own reducer, no shared
 * dependency on FunnelContext. State is persisted to localStorage only —
 * this flow does not call any backend session/analytics API. Wire up a
 * dedicated persistence service here if/when this flow needs one.
 */

const STATE_KEY = 'lifescale_888_state';
const SESSION_KEY = 'lifescale_888_session_id';

// Local flow identifier for this isolated flow. Not registered with the
// shared question backend (see FLOW_IDS in @/engine/datasetLoader) — the
// assessment page in this module resolves its own local question bank.
export const FUNNEL_888_FLOW_ID = 'f0000000-0000-0000-0000-000000000006';

export type Funnel888State = FunnelState & {
  memoryIntroComplete: boolean;
  analysisProgress: number;
  analysisResponses: Record<string, string>;
};

const initialState: Funnel888State = {
  funnelStage: 'intro', questionIndex: 0, answers: [],
  scores: { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 },
  percentiles: { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 },
  timer: { startTime: null, elapsedTime: 0, completionTime: null },
  email: '', finalScore: null, gender: '', reinforcementCount: 0,
  adaptiveAbility: null, adaptiveProfile: null, isV2: false,
  flowId: FUNNEL_888_FLOW_ID, selectedPlanId: null,
  memoryIntroComplete: false, analysisProgress: 0, analysisResponses: {},
};

export type Funnel888Action =
  | { type: 'SET_STAGE'; stage: FunnelStage }
  | { type: 'SET_QUESTION_INDEX'; index: number }
  | { type: 'ADD_ANSWER'; answer: Answer }
  | { type: 'SET_SCORES'; scores: CategoryScores }
  | { type: 'SET_PERCENTILES'; percentiles: CategoryScores }
  | { type: 'START_TIMER' } | { type: 'UPDATE_ELAPSED'; elapsed: number } | { type: 'STOP_TIMER' }
  | { type: 'SET_EMAIL'; email: string } | { type: 'SET_FINAL_SCORE'; score: number }
  | { type: 'SET_GENDER'; gender: string } | { type: 'SET_REINFORCEMENT_COUNT'; count: number }
  | { type: 'SET_MEMORY_INTRO_COMPLETE'; complete: boolean }
  | { type: 'SET_ANALYSIS_PROGRESS'; progress: number }
  | { type: 'SET_ANALYSIS_RESPONSE'; key: string; value: string }
  | { type: 'RESET' };

function loadState(): Funnel888State {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    return saved ? { ...initialState, ...(JSON.parse(saved) as Partial<Funnel888State>), flowId: FUNNEL_888_FLOW_ID } : initialState;
  } catch { return initialState; }
}

function reducer(state: Funnel888State, action: Funnel888Action): Funnel888State {
  switch (action.type) {
    case 'SET_STAGE': return { ...state, funnelStage: action.stage };
    case 'SET_QUESTION_INDEX': return { ...state, questionIndex: action.index };
    case 'ADD_ANSWER': return { ...state, answers: [...state.answers.filter(answer => answer.questionId !== action.answer.questionId), action.answer] };
    case 'SET_SCORES': return { ...state, scores: action.scores };
    case 'SET_PERCENTILES': return { ...state, percentiles: action.percentiles };
    case 'START_TIMER': return { ...state, timer: { startTime: Date.now(), elapsedTime: 0, completionTime: null } };
    case 'UPDATE_ELAPSED': return { ...state, timer: { ...state.timer, elapsedTime: action.elapsed } };
    case 'STOP_TIMER': return { ...state, timer: { ...state.timer, completionTime: state.timer.elapsedTime } };
    case 'SET_EMAIL': return { ...state, email: action.email };
    case 'SET_FINAL_SCORE': return { ...state, finalScore: action.score };
    case 'SET_GENDER': return { ...state, gender: action.gender };
    case 'SET_REINFORCEMENT_COUNT': return { ...state, reinforcementCount: action.count };
    case 'SET_MEMORY_INTRO_COMPLETE': return { ...state, memoryIntroComplete: action.complete };
    case 'SET_ANALYSIS_PROGRESS': return { ...state, analysisProgress: action.progress };
    case 'SET_ANALYSIS_RESPONSE': return { ...state, analysisResponses: { ...state.analysisResponses, [action.key]: action.value } };
    case 'RESET': return initialState;
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export function get888SessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = makeId(); localStorage.setItem(SESSION_KEY, id); }
  return id;
}

type ContextValue = { state: Funnel888State; dispatch: React.Dispatch<Funnel888Action>; goToStage: (stage: FunnelStage) => void };
const Funnel888Context = createContext<ContextValue | null>(null);

export function Funnel888Provider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => {
    if (!state.timer.startTime || state.timer.completionTime != null) return;
    const started = state.timer.startTime;
    const id = window.setInterval(() => dispatch({ type: 'UPDATE_ELAPSED', elapsed: Date.now() - started }), 1000);
    return () => window.clearInterval(id);
  }, [state.timer.startTime, state.timer.completionTime]);

  const wrappedDispatch = useCallback((action: Funnel888Action) => {
    dispatch(action);
    if (action.type === 'RESET') { localStorage.removeItem(STATE_KEY); localStorage.removeItem(SESSION_KEY); }
  }, []);

  const goToStage = useCallback((stage: FunnelStage) => wrappedDispatch({ type: 'SET_STAGE', stage }), [wrappedDispatch]);
  const value = useMemo(() => ({ state, dispatch: wrappedDispatch, goToStage }), [state, wrappedDispatch, goToStage]);
  return <Funnel888Context.Provider value={value}>{children}</Funnel888Context.Provider>;
}

export function useFunnel888() {
  const context = useContext(Funnel888Context);
  if (!context) throw new Error('useFunnel888 must be used inside Funnel888Provider');
  return context;
}
