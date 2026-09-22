/**
 * Shared item-level analysis for IQ add-ons.
 *
 * Everything here is derived from the funnel snapshot stored with the
 * completion (question count, per-question type, category, option labels) so
 * that changing the onboarding funnel automatically changes the reports.
 * Nothing is hardcoded to a question count or a question id.
 */

export type IqItemKind = 'scored' | 'self-report';

export interface IqRawAnswer {
  questionId: number;
  selectedOption: number;
  timeSpent: number;
  isCorrect: boolean | null;
  /** Present on completions saved with per-answer funnel metadata. */
  category?: string;
  type?: string;
  isScored?: boolean;
}

/** Snapshot of a funnel question, persisted at completion time. */
export interface IqQuestionMeta {
  id: number;
  type?: string;
  prompt?: string;
  category?: string;
  options?: string[];
  difficulty?: number;
}

export interface IqItem {
  /** 1-based position in the funnel. */
  position: number;
  questionId: number;
  kind: IqItemKind;
  /** Question types that are never right/wrong are 'self-report'. */
  type: string;
  category: string;
  prompt: string;
  answered: boolean;
  /** null for self-report items and for skipped items. */
  isCorrect: boolean | null;
  answerLabel: string;
  timeMs: number;
}

export interface IqItemAnalysis {
  items: IqItem[];
  /** Every question the funnel presented (snapshot length when available). */
  total: number;
  scoredTotal: number;
  selfReportTotal: number;
  answeredTotal: number;
  skippedTotal: number;
  /** Scored items that were actually answered. */
  scoredAnswered: number;
  correct: number;
  missed: number;
  accuracyPct: number;
  /** Average time across answered SCORED items only. */
  avgScoredMs: number;
  hasItemData: boolean;
  hasQuestionMeta: boolean;
}

/**
 * Question types that carry no correct answer. Anything ending up here is
 * excluded from every accuracy statistic. Unknown/new types default to
 * scored-if-graded, self-report otherwise (see classify below).
 */
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

const TYPE_LABEL: Record<string, string> = {
  likert: 'Self-report',
  personal: 'Self-report',
  multiplechoice: 'Multiple choice',
  sequence: 'Sequence',
  analogy: 'Analogy',
  visualpuzzle: 'Visual puzzle',
  spatial: 'Spatial',
  pattern: 'Pattern',
  imagemultiplechoice: 'Visual multiple choice',
  memorysequence: 'Memory sequence',
  reactiontap: 'Reaction',
  oddoneout: 'Odd one out',
};

export function typeLabel(type?: string): string {
  const n = normaliseType(type);
  return TYPE_LABEL[n] ?? (type ? String(type) : 'Item');
}

const CATEGORY_LABEL: Record<string, string> = {
  logic: 'Logical Reasoning',
  pattern: 'Pattern Recognition',
  spatial: 'Spatial Intelligence',
  speed: 'Processing Speed',
  self: 'Self-Awareness',
};

export function categoryLabel(cat?: string): string {
  const key = String(cat ?? '').toLowerCase();
  return CATEGORY_LABEL[key] ?? (cat ? String(cat) : 'General');
}

/**
 * Decide whether an item is graded. The funnel's question type is the
 * authority; the recorded answer is a fallback for older completions that
 * were saved before question snapshots existed.
 */
function classify(meta: IqQuestionMeta | undefined, answer: IqRawAnswer | undefined): IqItemKind {
  const n = normaliseType(meta?.type) || normaliseType(answer?.type);
  if (n && SELF_REPORT_TYPES.has(n)) return 'self-report';
  if (n) return 'scored';
  // No snapshot: fall back to whatever the funnel recorded on the answer.
  if (answer && answer.isScored === false) return 'self-report';
  if (answer && answer.isScored === true) return 'scored';
  if (answer && answer.isCorrect === null) return 'self-report';
  return 'scored';
}

/** An option string is only useful as a label if it is short human text. */
function usableOptionText(opt?: string): boolean {
  if (!opt) return false;
  const s = opt.trim();
  if (!s || s.length > 80) return false;
  if (s.startsWith('<') || s.startsWith('data:') || s.startsWith('http')) return false;
  if (s.includes('svg') && s.includes('<')) return false;
  return true;
}

function optionLabel(meta: IqQuestionMeta | undefined, index: number): string {
  const raw = meta?.options?.[index];
  if (usableOptionText(raw)) return String(raw).trim();
  return `Choice ${index + 1}`;
}

function truncate(s: string, max = 90): string {
  const clean = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function readQuestionMeta(payload: Record<string, unknown>): IqQuestionMeta[] {
  const raw = payload.questions;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((q): q is Record<string, unknown> => !!q && typeof q === 'object')
    .map((q) => ({
      id: Number(q.id ?? 0),
      type: q.type ? String(q.type) : undefined,
      prompt: q.prompt ? String(q.prompt) : undefined,
      category: q.category ? String(q.category) : undefined,
      options: Array.isArray(q.options) ? (q.options as unknown[]).map((o) => String(o ?? '')) : undefined,
      difficulty: q.difficulty != null ? Number(q.difficulty) : undefined,
    }));
}

/**
 * Build the full item picture for a completion. Works with or without the
 * question snapshot, and always reports honest denominators.
 */
export function analyseIqItems(payload: Record<string, unknown>): IqItemAnalysis {
  const answers: IqRawAnswer[] = Array.isArray(payload.answers)
    ? (payload.answers as unknown[])
        .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
        .map((a) => ({
          questionId: Number(a.questionId ?? 0),
          selectedOption: Number(a.selectedOption ?? -1),
          timeSpent: Number(a.timeSpent ?? 0),
          isCorrect: a.isCorrect === true ? true : a.isCorrect === false ? false : null,
          category: a.category ? String(a.category) : undefined,
          type: a.type ? String(a.type) : undefined,
          isScored: typeof a.isScored === 'boolean' ? a.isScored : undefined,
        }))
    : [];

  const meta = readQuestionMeta(payload);
  const byId = new Map<number, IqQuestionMeta>();
  for (const m of meta) if (m.id) byId.set(m.id, m);
  const answerById = new Map<number, IqRawAnswer>();
  for (const a of answers) answerById.set(a.questionId, a);

  // The funnel snapshot is the source of truth for the item list and its
  // order. Without it we fall back to whatever answers were recorded.
  const items: IqItem[] = [];

  if (meta.length > 0) {
    meta.forEach((m, i) => {
      const answer = answerById.get(m.id);
      const kind = classify(m, answer);
      items.push({
        position: i + 1,
        questionId: m.id,
        kind,
        type: String(m.type ?? answer?.type ?? ''),
        category: String(m.category ?? answer?.category ?? ''),
        prompt: truncate(m.prompt ?? ''),
        answered: !!answer,
        isCorrect: kind === 'scored' && answer ? answer.isCorrect === true : null,
        answerLabel: answer ? optionLabel(m, answer.selectedOption) : 'Not answered',
        timeMs: answer ? Math.max(0, answer.timeSpent || 0) : 0,
      });
    });
    // Any answer whose question is no longer in the funnel (question removed
    // or reordered after the test) is still the buyer's data — keep it.
    for (const a of answers) {
      if (byId.has(a.questionId)) continue;
      const kind = classify(undefined, a);
      items.push({
        position: items.length + 1,
        questionId: a.questionId,
        kind,
        type: String(a.type ?? ''),
        category: String(a.category ?? ''),
        prompt: '',
        answered: true,
        isCorrect: kind === 'scored' ? a.isCorrect === true : null,
        answerLabel: optionLabel(undefined, a.selectedOption),
        timeMs: Math.max(0, a.timeSpent || 0),
      });
    }
  } else {
    answers.forEach((a, i) => {
      const kind = classify(undefined, a);
      items.push({
        position: i + 1,
        questionId: a.questionId,
        kind,
        type: String(a.type ?? ''),
        category: String(a.category ?? ''),
        prompt: '',
        answered: true,
        isCorrect: kind === 'scored' ? a.isCorrect === true : null,
        answerLabel: optionLabel(undefined, a.selectedOption),
        timeMs: Math.max(0, a.timeSpent || 0),
      });
    });
  }

  const scored = items.filter((i) => i.kind === 'scored');
  const scoredAnsweredItems = scored.filter((i) => i.answered);
  const correct = scoredAnsweredItems.filter((i) => i.isCorrect === true).length;
  const times = scoredAnsweredItems.map((i) => i.timeMs).filter((t) => t > 0);

  return {
    items,
    total: items.length,
    scoredTotal: scored.length,
    selfReportTotal: items.length - scored.length,
    answeredTotal: items.filter((i) => i.answered).length,
    skippedTotal: items.filter((i) => !i.answered).length,
    scoredAnswered: scoredAnsweredItems.length,
    correct,
    missed: scoredAnsweredItems.length - correct,
    accuracyPct: scoredAnsweredItems.length
      ? Math.round((correct / scoredAnsweredItems.length) * 100)
      : 0,
    avgScoredMs: times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : 0,
    hasItemData: items.length > 0,
    hasQuestionMeta: meta.length > 0,
  };
}

/** Accuracy per funnel category, computed only from graded items. */
export function accuracyByCategory(
  analysis: IqItemAnalysis,
): { category: string; label: string; correct: number; total: number; pct: number }[] {
  const buckets = new Map<string, { correct: number; total: number }>();
  for (const item of analysis.items) {
    if (item.kind !== 'scored' || !item.answered) continue;
    const key = item.category || 'other';
    const b = buckets.get(key) ?? { correct: 0, total: 0 };
    b.total += 1;
    if (item.isCorrect) b.correct += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .map(([category, b]) => ({
      category,
      label: categoryLabel(category),
      correct: b.correct,
      total: b.total,
      pct: b.total ? Math.round((b.correct / b.total) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);
}

export function secondsLabel(ms: number): string {
  return `${Math.max(0, Math.round(ms / 1000))}s`;
}
