import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { HgResponse } from '@/data/hiddenGeniusQuiz';
import { FLOW_IDS } from '@/engine/datasetLoader';

const STORAGE_KEY = 'iqscale.hgState';

export type HgStage = 'landing' | 'quiz-a' | 'social-proof' | 'quiz-b' | 'calculating';

interface State {
  responses: HgResponse[];
  gender?: 'male' | 'female';
  stage: HgStage;
}

const EMPTY: State = { responses: [], stage: 'landing' };

function load(): State {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.responses)) return EMPTY;
    // Never resume into the calculating screen — send them back to the quiz.
    const stage: HgStage = parsed.stage === 'calculating' ? 'quiz-b' : (parsed.stage ?? 'landing');
    return { responses: parsed.responses, gender: parsed.gender, stage };
  } catch { return EMPTY; }
}

interface Ctx {
  flowId: string;
  responses: HgResponse[];
  gender?: 'male' | 'female';
  stage: HgStage;
  setStage: (s: HgStage) => void;
  addResponse: (r: HgResponse) => void;
  setGender: (g: 'male' | 'female') => void;
  reset: () => void;
}

const HiddenGeniusContext = createContext<Ctx | null>(null);

export function HiddenGeniusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
  }, [state]);

  const addResponse = useCallback((r: HgResponse) => {
    setState(prev => {
      const filtered = prev.responses.filter(p => p.questionId !== r.questionId);
      return { ...prev, responses: [...filtered, r] };
    });
  }, []);

  const setStage = useCallback((stage: HgStage) => {
    setState(prev => ({ ...prev, stage }));
  }, []);

  const setGender = useCallback((g: 'male' | 'female') => {
    setState(prev => ({ ...prev, gender: g }));
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    }
    setState(EMPTY);
  }, []);

  const value = useMemo<Ctx>(() => ({
    flowId: FLOW_IDS.HIDDEN_GENIUS_V1,
    responses: state.responses,
    gender: state.gender,
    stage: state.stage,
    setStage,
    addResponse,
    setGender,
    reset,
  }), [state, setStage, addResponse, setGender, reset]);

  return <HiddenGeniusContext.Provider value={value}>{children}</HiddenGeniusContext.Provider>;
}

export function useHiddenGenius() {
  const ctx = useContext(HiddenGeniusContext);
  if (!ctx) throw new Error('useHiddenGenius must be used within HiddenGeniusProvider');
  return ctx;
}
