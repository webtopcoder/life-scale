import { z } from 'zod';
import { api } from '@/integrations/api/client';
import { STORAGE_KEYS } from '@/constants/storage';
import type { FunnelState, FunnelStage, Answer, CategoryScores, Category, AdaptiveProfile } from '@/types/funnel';
import { loadQuestions, FLOW_IDS } from '@/engine/datasetLoader';
import {
  calculateCategoryScores,
  calculateFinalScore,
  calculatePercentiles,
  getStrongestCategory,
  getSecondaryCategory,
} from '@/engine/scoringEngine';

const emailSchema = z.string().min(1, 'Email is required').email('Invalid email format');
const userIdSchema = z.string().min(1, 'User ID is required');

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) id += '-';
    else if (i === 14) id += '4';
    else id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.FUNNEL_SESSION_ID);
  if (!id) {
    id = generateSessionId();
    localStorage.setItem(STORAGE_KEYS.FUNNEL_SESSION_ID, id);
  }
  return id;
}

/** Returns current session ID (creates one if missing). Use after clearFunnelSession() to get a new ID. */
export function getSessionId(): string {
  return getOrCreateSessionId();
}

/**
 * FunnelFox / Primer customer.externalId for the whole onboarding purchase chain.
 * Matches `user_profiles.session_id` and assessment `session_id` rows.
 */
export function getBillingExternalId(): string {
  return getSessionId();
}

/** Reads session ID from localStorage only (for resume check). Does not create. */
export function getStoredSessionId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.FUNNEL_SESSION_ID);
}

/**
 * After email + profile creation: drop persisted funnel UI state only.
 * Keeps `FUNNEL_SESSION_ID` so checkout and upsells use the same FunnelFox externalId as `user_profiles.session_id`.
 */
export function clearFunnelPersistedStateAfterEmail(): void {
  localStorage.removeItem(STORAGE_KEYS.FUNNEL_STATE);
}

/** Clears all funnel-related state from sessionStorage and localStorage so the next visit starts fresh. */
export function clearFunnelSession(): void {
  localStorage.removeItem(STORAGE_KEYS.FUNNEL_STATE);
  localStorage.removeItem(STORAGE_KEYS.FUNNEL_SESSION_ID);
}

export interface SessionProgressRow {
  session_id: string;
  gender: string | null;
  is_v2: boolean;
  started_at: string;
  completed_at: string | null;
  completion_time_ms: number | null;
  final_score: number | null;
  adaptive_ability: number | null;
  strongest_category: string | null;
  secondary_category: string | null;
  trajectory: string | null;
  scores: Record<string, number> | null;
  percentiles: Record<string, number> | null;
  email: string | null;
}

export interface AnswerRow {
  question_id: number;
  selected_option: number;
  time_spent_ms: number;
  is_correct: boolean | null;
}

/** Fetches incomplete session and answers from DB. Returns null if not found or already completed. */
export async function getSessionProgress(sessionId: string): Promise<{
  session: SessionProgressRow;
  answers: AnswerRow[];
  profileEmail: string;
} | null> {
  try {
    const data = await api.get<{
      session: SessionProgressRow;
      answers: AnswerRow[];
      profileEmail: string;
    }>(`/funnel/sessions/${sessionId}`);
    if (!data?.session) return null;
    return {
      session: data.session,
      answers: data.answers ?? [],
      profileEmail: data.profileEmail ?? '',
    };
  } catch (error) {
    console.error('getSessionProgress error:', error);
    return null;
  }
}

const DEFAULT_SCORES: CategoryScores = { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 };

/** Builds FunnelState from DB session + answers for resume. */
export function hydrateFunnelState(
  session: SessionProgressRow,
  answers: AnswerRow[],
  profileEmail: string,
  flowId: string = FLOW_IDS.FIXED_V1,
): FunnelState {
  const isV2 = session.is_v2;
  const questions = loadQuestions();
  const answerList: Answer[] = answers.map((a) => ({
    questionId: a.question_id,
    selectedOption: a.selected_option,
    timeSpent: a.time_spent_ms,
    isCorrect: a.is_correct,
  }));

  let scores: CategoryScores = DEFAULT_SCORES;
  let percentiles: CategoryScores = DEFAULT_SCORES;
  let finalScore: number | null = null;
  let adaptiveAbility: number | null = null;
  let adaptiveProfile: AdaptiveProfile | null = null;

  if (session.final_score != null && session.scores && session.percentiles) {
    scores = { ...DEFAULT_SCORES, ...session.scores } as CategoryScores;
    percentiles = { ...DEFAULT_SCORES, ...session.percentiles } as CategoryScores;
    finalScore = session.final_score;
    adaptiveAbility = session.adaptive_ability;
    if (session.strongest_category && session.secondary_category && session.trajectory) {
      adaptiveProfile = {
        strongest: session.strongest_category as Category,
        secondary: session.secondary_category as Category,
        trajectory: session.trajectory as 'improving' | 'stable' | 'declining',
      };
    }
  } else if (answerList.length > 0) {
    scores = calculateCategoryScores(answerList, questions);
    percentiles = calculatePercentiles(scores);
    finalScore = calculateFinalScore(scores);
    adaptiveAbility = finalScore;
    adaptiveProfile = {
      strongest: getStrongestCategory(scores),
      secondary: getSecondaryCategory(scores),
      trajectory: 'stable',
    };
  }

  const startedAt = session.started_at ? new Date(session.started_at).getTime() : null;
  const elapsedFromAnswers = answerList.reduce((sum, a) => sum + a.timeSpent, 0);
  const elapsedMs = startedAt ? Math.min(Date.now() - startedAt, elapsedFromAnswers || Date.now() - startedAt) : 0;

  let funnelStage: FunnelStage;
  const totalQuestions = questions.length;
  if (answerList.length === 0) {
    funnelStage = 'intro';
  } else if (answerList.length < totalQuestions) {
    funnelStage = 'assessment';
  } else if (session.final_score == null) {
    funnelStage = isV2 ? 'calculating-2' : 'calculating';
  } else if (profileEmail) {
    funnelStage = flowId === FLOW_IDS.PLANS_V1 ? 'checkout-plans' : isV2 ? 'checkout-2' : 'checkout';
  } else {
    funnelStage = flowId === FLOW_IDS.PLANS_V1 ? 'checkout-plans' : isV2 ? 'checkout-2' : 'checkout';
  }

  // Determine which question index to resume from.
  // For the original (non-v2) funnel, resume at the last answered question index,
  // derived from the actual question IDs in the dataset. For v2 we keep the simpler
  // behavior (based on answer count) since questions come from a different pool.
  let questionIndex = 0;
  if (!isV2 && answerList.length > 0) {
    // Build a mapping from questionId -> index in the questions array
    const idToIndex = new Map<number, number>();
    questions.forEach((q, idx) => {
      idToIndex.set(q.id, idx);
    });

    let maxIndex = 0;
    for (const a of answerList) {
      const idx = idToIndex.get(a.questionId);
      if (typeof idx === 'number' && idx > maxIndex) {
        maxIndex = idx;
      }
    }

    questionIndex = Math.min(maxIndex, questions.length - 1);
  } else {
    // Fallback: resume based on number of answers
    questionIndex = answerList.length;
  }

  return {
    funnelStage,
    questionIndex,
    answers: answerList,
    scores,
    percentiles,
    timer: {
      startTime: Date.now() - elapsedMs,
      elapsedTime: elapsedMs,
      completionTime: session.completion_time_ms ?? null,
    },
    email: profileEmail,
    finalScore,
    gender: session.gender ?? '',
    reinforcementCount: 0,
    adaptiveAbility,
    adaptiveProfile,
    isV2,
    flowId,
    selectedPlanId: null,
  };
}

export async function createSession(gender: string, isV2: boolean): Promise<{ error?: Error }> {
  try {
    await api.post('/funnel/sessions', {
      sessionId: getSessionId(),
      gender,
      isV2,
    });
    return {};
  } catch (error) {
    console.error('createSession error:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function saveAnswer(
  questionId: number,
  selectedOption: number,
  timeSpentMs: number,
  isCorrect: boolean | null,
): Promise<{ error?: Error }> {
  try {
    await api.post('/funnel/answers', {
      sessionId: getSessionId(),
      questionId,
      selectedOption,
      timeSpentMs,
      isCorrect,
    });
    return {};
  } catch (error) {
    console.error('saveAnswer error:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function updateSessionResults(data: {
  finalScore: number | null;
  completionTimeMs: number | null;
  adaptiveAbility: number | null;
  strongestCategory: string | null;
  secondaryCategory: string | null;
  trajectory: string | null;
  scores: Record<string, number> | null;
  percentiles: Record<string, number> | null;
}): Promise<{ error?: Error }> {
  try {
    await api.patch(`/funnel/sessions/${getSessionId()}`, data);
    return {};
  } catch (error) {
    console.error('updateSessionResults error:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function createUserProfile(email: string, data: {
  finalScore: number | null;
  strongestCategory: string | null;
  adaptiveAbility: number | null;
  percentile: number | null;
}): Promise<{ error?: Error }> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join('; ');
    return { error: new Error(msg) };
  }
  try {
    await api.post('/funnel/user-profiles', {
      sessionId: getSessionId(),
      email: parsed.data,
      ...data,
    });
    return {};
  } catch (error) {
    console.error('createUserProfile error:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

