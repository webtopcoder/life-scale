import { useCallback, useState } from 'react';
import { FLOW_IDS } from '@/engine/datasetLoader';
import type { HgResponse } from '@/data/hiddenGeniusQuiz';

export function useHiddenGeniusOnboarding() {
  const [responses, setResponses] = useState<HgResponse[]>([]);
  const [gender, setGender] = useState<'male' | 'female' | undefined>(undefined);

  const addResponse = useCallback((r: HgResponse) => {
    setResponses(prev => {
      const filtered = prev.filter(p => p.questionId !== r.questionId);
      return [...filtered, r];
    });
  }, []);

  const reset = useCallback(() => {
    setResponses([]);
    setGender(undefined);
  }, []);

  return {
    flowId: FLOW_IDS.HIDDEN_GENIUS_V1,
    responses,
    gender,
    setGender,
    addResponse,
    reset,
  };
}
