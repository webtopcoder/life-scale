import { Question } from '@/types/funnel';
import { IMPORTED_ANSWER_KEYS } from '@/engine/importedAnswerKeys';
import { IMPORTED_QUESTION_BANKS } from '@/engine/importedQuestionBanks';

// Cache per flow_id
const cache: Record<string, Question[]> = {};

/** Flow IDs for direct reference */
export const FLOW_IDS = {
  ADAPTIVE_V2: 'a0000000-0000-0000-0000-000000000001',
  FIXED_V1: 'b0000000-0000-0000-0000-000000000001',
  ALT_V1: 'c0000000-0000-0000-0000-000000000001', // replace after DB seed
  PLANS_V1: 'd0000000-0000-0000-0000-000000000001',
  SHORT_IQ_V1: 'e0000000-0000-0000-0000-000000000001',
  IQSCALE_V1: 'f0000000-0000-0000-0000-000000000001',
  FIXED_V1_FF: 'f0000000-0000-0000-0000-000000000005',
  FIXED_V1_888: 'f0000000-0000-0000-0000-000000000006',
  FIXED_V1_888_TT: 'f0000000-0000-0000-0000-000000000007',
  FIXED_V1_RVR2: 'f0000000-0000-0000-0000-000000000008',
  HIDDEN_GENIUS_V1: '10000000-0000-0000-0000-000000000001',
} as const;

function resolveQuestionFlowId(flowId?: string): string | undefined {
  if (!flowId) return undefined;
  if (
    flowId === FLOW_IDS.ALT_V1 ||
    flowId === FLOW_IDS.PLANS_V1
  ) return FLOW_IDS.FIXED_V1;
  // RVR2 intentionally has its own completion identity, but uses the exact
  // source-backed 36-question catalog already served by IQ Scale.
  if (flowId === FLOW_IDS.FIXED_V1_RVR2) return FLOW_IDS.IQSCALE_V1;
  return flowId;
}

/**
 * Fetch questions from the backend for a given flow.
 * Throws on failure — no local JSON fallback.
 */
export async function fetchQuestions(flowId?: string): Promise<Question[]> {
  const cacheKey = flowId || '__active__';
  if (cache[cacheKey]) return cache[cacheKey];

  const flow = resolveQuestionFlowId(flowId);
  const qs = flow ? `?flow=${encodeURIComponent(flow)}` : '';
  const { api } = await import('@/integrations/api/client');
  let result: { questions: Array<Question & { questionId?: number }> };
  try {
    result = await api.get<{ questions: Array<Question & { questionId?: number }> }>(
      `/onboarding/questions${qs}`,
      false,
    );
  } catch (error) {
    const fallback = flow ? IMPORTED_QUESTION_BANKS[flow] : undefined;
    if (!fallback) throw error;
    result = { questions: fallback };
  }
  if (result.questions.length === 0 && flow && IMPORTED_QUESTION_BANKS[flow]) {
    result = { questions: IMPORTED_QUESTION_BANKS[flow] };
  }
  // Prefer catalog questionId (int). Row UUID must not be used as Answer.questionId.
  const questions = (result.questions ?? []).map((q) => ({
    ...q,
    id: typeof q.questionId === 'number' ? q.questionId : Number(q.id),
    correctAnswer: IMPORTED_ANSWER_KEYS[flowId ?? flow ?? '']?.[
      typeof q.questionId === 'number' ? q.questionId : Number(q.id)
    ] ?? q.correctAnswer,
  }));
  cache[cacheKey] = questions;
  return questions;
}

// ---- Synchronous legacy API (updated by preload) ----

let legacyCache: Question[] = [];

/** Pre-load questions from backend into the synchronous cache. */
export async function preloadQuestions(flowId?: string): Promise<Question[]> {
  legacyCache = await fetchQuestions(flowId);
  return legacyCache;
}

/** Synchronous access — returns empty array until preloadQuestions() completes. */
export function loadQuestions(): Question[] {
  return legacyCache;
}

export function getQuestion(index: number): Question | undefined {
  return legacyCache[index];
}

export function getTotalQuestions(): number {
  return legacyCache.length;
}
