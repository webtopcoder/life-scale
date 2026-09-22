import { Answer, CategoryScores, CATEGORY_WEIGHTS, Category, Question } from '@/types/funnel';

export function calculateCategoryScores(answers: Answer[], questions: Question[]): CategoryScores {
  const categoryCorrect: Record<Category, number> = { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 };
  const categoryTotal: Record<Category, number> = { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 };

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) continue;
    if (question.type === 'personal') continue; // demographics — not scored

    categoryTotal[question.category]++;

    if (question.type === 'likert') {
      // Likert: higher selection = higher score (0-5 scale → 0-1)
      categoryCorrect[question.category] += answer.selectedOption / 5;
    } else if (answer.isCorrect === true) {
      // Use the pre-computed isCorrect from the answer (validated server-side)
      categoryCorrect[question.category] += 1;
    }
  }

  const scores: CategoryScores = { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 };
  for (const cat of Object.keys(scores) as Category[]) {
    scores[cat] = categoryTotal[cat] > 0 ? categoryCorrect[cat] / categoryTotal[cat] : 0;
  }
  return scores;
}

export function calculateFinalScore(scores: CategoryScores): number {
  let weighted = 0;
  for (const cat of Object.keys(CATEGORY_WEIGHTS) as Category[]) {
    weighted += scores[cat] * CATEGORY_WEIGHTS[cat];
  }
  // Map 0-1 weighted average to 90-160 range
  const raw = 90 + weighted * 70;
  return Math.round(Math.min(160, Math.max(90, raw)));
}

export function calculatePercentiles(scores: CategoryScores): CategoryScores {
  const percentiles: CategoryScores = { logic: 0, pattern: 0, spatial: 0, speed: 0, self: 0 };
  for (const cat of Object.keys(scores) as Category[]) {
    // Map score (0-1) to encouraging percentile range (60-99)
    percentiles[cat] = Math.round(70 + scores[cat] * 29);
  }
  return percentiles;
}

export function getStrongestCategory(scores: CategoryScores): Category {
  return (Object.entries(scores) as [Category, number][])
    .sort(([, a], [, b]) => b - a)[0][0];
}

export function getSecondaryCategory(scores: CategoryScores): Category {
  return (Object.entries(scores) as [Category, number][])
    .sort(([, a], [, b]) => b - a)[1][0];
}

export type RiskIndicator = 'Moderate' | 'Moderate–High' | 'High';

export function getRiskIndicator(finalScore: number | null): RiskIndicator {
  if (finalScore == null) return 'High';
  if (finalScore >= 150) return 'Moderate';
  if (finalScore >= 140) return 'Moderate–High';
  return 'High';
}

/** Normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(z: number): number {
  if (z < -6) return 0;
  if (z > 6) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

export function scoreToPercentile(score: number): number {
  // IQ follows a normal distribution: mean=100, SD=15
  const z = (score - 100) / 15;
  const pct = normalCDF(z) * 100;
  return Math.round(Math.min(99.9, Math.max(1, pct)) * 10) / 10;
}
