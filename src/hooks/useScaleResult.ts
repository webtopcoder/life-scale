import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { ScaleKey } from '@/config/scales';
import { getCompletionPayload, readLocalCompletionPayload } from '@/lib/testCompletions';
import { readScaleAnswers } from '@/components/scale/ScaleQuizFlow';
import type { ScaleAnswers } from '@/data/scaleQuiz';

export interface ScaleResultState {
  payload: Record<string, unknown> | null;
  answers: ScaleAnswers;
  loading: boolean;
}

/**
 * Reads a scale's stored completion payload (DB when signed in, local mirror
 * otherwise) plus the raw answers still held locally.
 */
export function useScaleResult(scale: ScaleKey): ScaleResultState {
  const { user } = useAuth();
  const [payload, setPayload] = useState<Record<string, unknown> | null>(
    () => readLocalCompletionPayload(scale),
  );
  const [loading, setLoading] = useState(true);
  const [answers] = useState<ScaleAnswers>(() => readScaleAnswers(scale));

  useEffect(() => {
    let active = true;
    if (!user) { setLoading(false); return; }
    getCompletionPayload(user.id, scale).then((p) => {
      if (!active) return;
      if (p) setPayload(p);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scale, user]);

  return { payload, answers, loading };
}
