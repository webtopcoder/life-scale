/**
 * Canonical IQ completion adapter.
 *
 * Any imported/onboarding funnel that produces an IQ-style result (score,
 * per-category scores, percentiles, raw answers, and the question set it
 * drew from) should route through this module before calling
 * `markCompleted('iq', ...)`. It guarantees a single, stable payload shape
 * so IqReportPage and every IQ add-on builder (weakness report, answer
 * breakdown, speed/accuracy, study & work fit, 30-day planner) can rely on
 * the same fields no matter which funnel produced the completion:
 *
 *   { score, scores, percentiles, answers, flowId, totalQuestions, questions }
 *
 * It also enriches each raw answer with the category/type/difficulty/
 * isScored metadata from the funnel's own question snapshot, which is what
 * lets `buildIqReport` (per-category signals) and `analyseIqItems` (add-on
 * item log, likert/self-report classification, skipped-item accounting)
 * work correctly regardless of which funnel generated the answers.
 */

import type { Answer, Question } from '@/types/funnel';
import { markCompleted } from '@/lib/testCompletions';

/** Question types that carry no correct/incorrect answer. */
const SELF_REPORT_TYPES = new Set([
  'likert',
  'personal',
  'self',
  'selfreport',
  'self_report',
  'opinion',
]);

function normaliseType(t?: string): string {
  return String(t ?? '').replace(/[\s_-]/g, '').toLowerCase();
}

/** True when a question type is self-report (never graded). */
export function isSelfReportType(type?: string): boolean {
  return SELF_REPORT_TYPES.has(normaliseType(type));
}

/** Minimal, serialisable snapshot of a funnel question, safe to persist. */
export interface IqQuestionSnapshot {
  id: number;
  type: string;
  prompt: string;
  category: string;
  options: string[];
  difficulty: number;
}

/** Raw funnel answer enriched with its question's metadata at completion time. */
export interface IqEnrichedAnswer extends Answer {
  category?: string;
  type?: string;
  difficulty?: number;
  /** false for likert/personal/self-report items; true for graded items. */
  isScored: boolean;
}

export interface IqCompletionPayload {
  score: number;
  scores: Record<string, number>;
  percentiles: Record<string, number>;
  answers: IqEnrichedAnswer[];
  flowId: string;
  totalQuestions: number;
  questions: IqQuestionSnapshot[];
}

export interface BuildIqCompletionInput {
  /** Raw answers as recorded by the funnel (questionId/selectedOption/timeSpent/isCorrect). */
  answers: Answer[];
  /** The full question set the funnel presented, in order. */
  questions: Question[];
  scores: Record<string, number>;
  percentiles: Record<string, number>;
  finalScore: number | null | undefined;
  flowId: string;
}

/** Snapshot the funnel's questions into the small, stable shape persisted with a completion. */
export function snapshotIqQuestions(questions: Question[]): IqQuestionSnapshot[] {
  return questions.map((q) => ({
    id: q.id,
    type: String(q.type ?? ''),
    prompt: q.prompt ?? '',
    category: String(q.category ?? ''),
    options: Array.isArray(q.options) ? q.options.slice() : [],
    difficulty: Number(q.difficulty ?? 0),
  }));
}

/**
 * Merge each raw answer with its question's category/type/difficulty and a
 * derived `isScored` flag. Falls back to the answer's own `isCorrect`
 * (`null` implies self-report) when the question is missing from the
 * snapshot (e.g. it was removed/reordered after the attempt).
 */
export function enrichIqAnswers(answers: Answer[], questions: Question[]): IqEnrichedAnswer[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return answers.map((a) => {
    const q = byId.get(a.questionId);
    const isScored = q ? !isSelfReportType(q.type) : a.isCorrect !== null;
    return {
      ...a,
      category: q ? String(q.category ?? '') : undefined,
      type: q ? String(q.type ?? '') : undefined,
      difficulty: q ? Number(q.difficulty ?? 0) : undefined,
      isScored,
    };
  });
}

/**
 * Build the canonical IQ completion payload from a funnel's raw result.
 * Pure function — no DB/network calls — so it can be reused by the report
 * page, add-on builders, and tests without side effects.
 */
export function buildIqCompletionPayload(input: BuildIqCompletionInput): IqCompletionPayload {
  const questions = snapshotIqQuestions(input.questions);
  const answers = enrichIqAnswers(input.answers, input.questions);
  return {
    score: Math.round(Number(input.finalScore ?? 0)),
    scores: { ...input.scores },
    percentiles: { ...input.percentiles },
    answers,
    flowId: input.flowId,
    totalQuestions: questions.length,
    questions,
  };
}

/**
 * Build the canonical payload and persist it via the existing
 * `markCompleted('iq', ...)` completion path. This is the single entry
 * point every imported IQ funnel should call at the end of its assessment.
 */
export async function completeIqAssessment(input: BuildIqCompletionInput): Promise<IqCompletionPayload> {
  const payload = buildIqCompletionPayload(input);
  await markCompleted('iq', payload as unknown as Record<string, unknown>);
  return payload;
}
