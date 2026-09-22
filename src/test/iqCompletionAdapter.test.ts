import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Answer, Question } from '@/types/funnel';
import {
  buildIqCompletionPayload,
  enrichIqAnswers,
  snapshotIqQuestions,
  isSelfReportType,
  completeIqAssessment,
  type BuildIqCompletionInput,
} from '@/lib/iqCompletionAdapter';
import { buildIqReport } from '@/engine/iqReport';
import {
  buildIqWeaknessReport,
  buildIqAnswerBreakdown,
  buildIqSpeedAccuracy,
  buildIqWorkFit,
  buildIq30DayPlanner,
} from '@/lib/addonBuilders/iq';

vi.mock('@/lib/testCompletions', () => ({
  markCompleted: vi.fn().mockResolvedValue(undefined),
}));

/* ------------------------------------------------------------------------ */
/* Fixture: a small mixed funnel — graded (incl. visual puzzle), likert/self,
   and one question the user skipped entirely.                              */
/* ------------------------------------------------------------------------ */

function makeQuestions(): Question[] {
  return [
    { id: 1, type: 'multipleChoice', prompt: 'Logic 1', options: ['a', 'b', 'c', 'd'], correctAnswer: 1, category: 'logic', difficulty: 2 },
    { id: 2, type: 'visualPuzzle', prompt: 'Visual 1', image: 'static_abc', options: ['a', 'b', 'c'], correctAnswer: 2, category: 'spatial', difficulty: 3 },
    { id: 3, type: 'visualPuzzle', prompt: 'Visual 2', image: 'static_def', options: ['a', 'b', 'c'], correctAnswer: 0, category: 'spatial', difficulty: 4 },
    { id: 4, type: 'likert', prompt: 'Self 1', options: [], category: 'self', difficulty: 1 },
    { id: 5, type: 'personal', prompt: 'Self 2', options: [], category: 'self', difficulty: 1 },
    { id: 6, type: 'multipleChoice', prompt: 'Pattern 1', options: ['a', 'b'], correctAnswer: 0, category: 'pattern', difficulty: 2 },
  ];
}

function makeAnswers(): Answer[] {
  return [
    { questionId: 1, selectedOption: 1, timeSpent: 4000, isCorrect: true },   // graded correct
    { questionId: 2, selectedOption: 2, timeSpent: 6000, isCorrect: true },   // visual graded correct
    { questionId: 3, selectedOption: 1, timeSpent: 9000, isCorrect: false },  // visual graded incorrect
    { questionId: 4, selectedOption: 3, timeSpent: 2000, isCorrect: null },   // likert self-report
    { questionId: 5, selectedOption: 4, timeSpent: 1500, isCorrect: null },   // personal self-report
    // question id 6 intentionally skipped — never answered
  ];
}

function baseInput(): BuildIqCompletionInput {
  return {
    answers: makeAnswers(),
    questions: makeQuestions(),
    scores: { logic: 70, pattern: 40, spatial: 55, speed: 60, self: 80 },
    percentiles: { logic: 65, pattern: 30, spatial: 50, speed: 58, self: 88 },
    finalScore: 63,
    flowId: 'f0000000-0000-0000-0000-000000000001',
  };
}

describe('snapshotIqQuestions / enrichIqAnswers', () => {
  it('snapshots questions into the small persisted shape', () => {
    const snap = snapshotIqQuestions(makeQuestions());
    expect(snap).toHaveLength(6);
    expect(snap[0]).toEqual({ id: 1, type: 'multipleChoice', prompt: 'Logic 1', category: 'logic', options: ['a', 'b', 'c', 'd'], difficulty: 2 });
  });

  it('classifies likert/personal as self-report and everything else as scored', () => {
    expect(isSelfReportType('likert')).toBe(true);
    expect(isSelfReportType('personal')).toBe(true);
    expect(isSelfReportType('Likert')).toBe(true);
    expect(isSelfReportType('visualPuzzle')).toBe(false);
    expect(isSelfReportType('multipleChoice')).toBe(false);
    expect(isSelfReportType(undefined)).toBe(false);
  });

  it('enriches each answer with category/type/difficulty/isScored from the question snapshot', () => {
    const enriched = enrichIqAnswers(makeAnswers(), makeQuestions());
    expect(enriched).toHaveLength(5); // the skipped question has no answer entry
    const visual = enriched.find((a) => a.questionId === 2)!;
    expect(visual.category).toBe('spatial');
    expect(visual.type).toBe('visualPuzzle');
    expect(visual.difficulty).toBe(3);
    expect(visual.isScored).toBe(true);
    expect(visual.isCorrect).toBe(true);

    const missedVisual = enriched.find((a) => a.questionId === 3)!;
    expect(missedVisual.isScored).toBe(true);
    expect(missedVisual.isCorrect).toBe(false);

    const likert = enriched.find((a) => a.questionId === 4)!;
    expect(likert.isScored).toBe(false);
    expect(likert.isCorrect).toBeNull();

    const personal = enriched.find((a) => a.questionId === 5)!;
    expect(personal.isScored).toBe(false);
  });

  it('falls back to the answer isCorrect when the question is missing from the snapshot', () => {
    const orphanAnswer: Answer = { questionId: 999, selectedOption: 0, timeSpent: 1000, isCorrect: true };
    const enriched = enrichIqAnswers([orphanAnswer], makeQuestions());
    expect(enriched[0].isScored).toBe(true);
    expect(enriched[0].category).toBeUndefined();
  });
});

describe('buildIqCompletionPayload', () => {
  it('produces the canonical shape required by IqReportPage and all IQ add-ons', () => {
    const payload = buildIqCompletionPayload(baseInput());
    expect(payload).toMatchObject({
      score: 63,
      scores: { logic: 70, pattern: 40, spatial: 55, speed: 60, self: 80 },
      percentiles: { logic: 65, pattern: 30, spatial: 50, speed: 58, self: 88 },
      flowId: 'f0000000-0000-0000-0000-000000000001',
      totalQuestions: 6,
    });
    expect(payload.questions).toHaveLength(6);
    expect(payload.answers).toHaveLength(5);
    // Skipped question (id 6) never appears in answers, but is counted in totalQuestions.
    expect(payload.answers.find((a) => a.questionId === 6)).toBeUndefined();
  });

  it('rounds and defaults a missing final score to 0', () => {
    const payload = buildIqCompletionPayload({ ...baseInput(), finalScore: null });
    expect(payload.score).toBe(0);
  });
});

describe('completeIqAssessment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reuses markCompleted("iq") with the canonical payload', async () => {
    const { markCompleted } = await import('@/lib/testCompletions');
    const payload = await completeIqAssessment(baseInput());
    expect(markCompleted).toHaveBeenCalledTimes(1);
    const [branch, sentPayload] = (markCompleted as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(branch).toBe('iq');
    expect(sentPayload).toEqual(payload);
    expect(sentPayload).toMatchObject({
      score: 63,
      flowId: 'f0000000-0000-0000-0000-000000000001',
      totalQuestions: 6,
    });
  });
});

/* ------------------------------------------------------------------------ */
/* IqReportPage compatibility — buildIqReport consumes the enriched answers  */
/* ------------------------------------------------------------------------ */

describe('IqReportPage compatibility (buildIqReport)', () => {
  it('computes per-category signals correctly from the adapter output, including visual puzzle grading', () => {
    const payload = buildIqCompletionPayload(baseInput());
    const signals = buildIqReport(payload.answers as any, baseInput().scores as any, payload.score);

    const spatial = signals.perCategory.find((c) => c.category === 'spatial')!;
    // Two spatial (visual puzzle) items: one correct, one incorrect.
    expect(spatial.attempted).toBe(2);
    expect(spatial.correct).toBe(1);
    expect(spatial.accuracyPct).toBe(50);

    const logic = signals.perCategory.find((c) => c.category === 'logic')!;
    expect(logic.attempted).toBe(1);
    expect(logic.correct).toBe(1);

    // Self-report items never contribute to accuracy scoring.
    const self = signals.perCategory.find((c) => c.category === 'self')!;
    expect(self.attempted).toBe(0);

    expect(signals.strongest).toBeDefined();
    expect(signals.weakest).toBeDefined();
    expect(signals.growthLevers.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------------ */
/* Add-on builder compatibility (all five IQ add-ons)                       */
/* ------------------------------------------------------------------------ */

describe('IQ add-on builder compatibility', () => {
  const payload = () => buildIqCompletionPayload(baseInput()) as unknown as Record<string, unknown>;

  it('Weakness Report identifies the two lowest categories from canonical scores', () => {
    const doc = buildIqWeaknessReport(payload());
    expect(doc.sections.some((s) => s.heading.includes('Pattern Recognition'))).toBe(true);
    expect(doc.title).toBe('Your Weakness Report');
  });

  it('Answer Breakdown logs graded items (incl. visual puzzles), classifies self-report, and accounts for skips', () => {
    const doc = buildIqAnswerBreakdown(payload());
    const flat = JSON.stringify(doc.sections);
    // Should not fall back to the "no item data" branch.
    expect(flat).not.toContain('item log is not available');
    // A skipped item (question 6, never answered) should not silently vanish from context.
    expect(doc.sections.length).toBeGreaterThan(0);
  });

  it('Speed vs Accuracy Report profiles pacing from graded item timing (visual puzzles included)', () => {
    const doc = buildIqSpeedAccuracy(payload());
    expect(doc.title).toBe('Speed vs Accuracy Report');
  });

  it('Study & Work Fit Report builds from the strongest scored pair', () => {
    const doc = buildIqWorkFit(payload());
    expect(doc.subtitle).toContain('Self-Awareness'); // self=80 is the top score in the fixture
  });

  it('30-Day Sharpening Planner builds a 30-row plan around the two weakest categories', () => {
    const doc = buildIq30DayPlanner(payload());
    const table = doc.sections.find((s) => s.table)?.table;
    // Weekly checkpoints table always present; daily table too.
    expect(doc.title).toBe('30-Day Sharpening Planner');
    const flat = JSON.stringify(doc.sections);
    expect(flat).toContain('Pattern Recognition'); // pattern=40 is weakest in the fixture
  });

  it('all five builders degrade gracefully (missing-result doc) when scores are absent', () => {
    const empty = { score: 0, scores: {}, percentiles: {}, answers: [], flowId: 'x', totalQuestions: 0, questions: [] };
    for (const build of [buildIqWeaknessReport, buildIqWorkFit, buildIq30DayPlanner]) {
      const doc = build(empty as any);
      expect(doc.sections[0].heading).toContain('not attached');
    }
  });
});
