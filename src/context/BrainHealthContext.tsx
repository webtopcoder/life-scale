import React, { createContext, useContext, useReducer, useMemo, useEffect, useCallback } from 'react';
import type { Answers } from '@/engine/brainHealthScoring';

export type Stage = 'landing' | 'quiz' | 'calculating' | 'done';

interface State {
  stage: Stage;
  stepIndex: number;
  answers: Answers;
  intent: string | null;
  interruptFlaggedShown: number;
}

const STORAGE_KEY = 'brainhealth:v1';

const initialState: State = {
  stage: 'landing',
  stepIndex: 0,
  answers: {},
  intent: null,
  interruptFlaggedShown: 0,
};

function load(): State {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || !parsed) return initialState;
    return { ...initialState, ...parsed, answers: { ...(parsed.answers ?? {}) } };
  } catch {
    return initialState;
  }
}

type Action =
  | { type: 'SET_STAGE'; stage: Stage }
  | { type: 'SET_STEP'; step: number }
  | { type: 'ANSWER'; qId: number; optionIndex: number }
  | { type: 'SET_INTENT'; intent: string }
  | { type: 'SET_INTERRUPT_FLAGGED'; count: number }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STAGE': return { ...state, stage: action.stage };
    case 'SET_STEP': return { ...state, stepIndex: action.step };
    case 'ANSWER': return { ...state, answers: { ...state.answers, [action.qId]: action.optionIndex } };
    case 'SET_INTENT': return { ...state, intent: action.intent };
    case 'SET_INTERRUPT_FLAGGED':
      return { ...state, interruptFlaggedShown: Math.max(state.interruptFlaggedShown, action.count) };
    case 'RESET': return initialState;
  }
}

interface Ctx {
  state: State;
  dispatch: React.Dispatch<Action>;
  reset: () => void;
}

const BrainHealthContext = createContext<Ctx | null>(null);

export function BrainHealthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore quota */ }
  }, [state]);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<Ctx>(() => ({ state, dispatch, reset }), [state, reset]);
  return <BrainHealthContext.Provider value={value}>{children}</BrainHealthContext.Provider>;
}

export function useBrainHealth() {
  const ctx = useContext(BrainHealthContext);
  if (!ctx) throw new Error('useBrainHealth must be used within BrainHealthProvider');
  return ctx;
}
