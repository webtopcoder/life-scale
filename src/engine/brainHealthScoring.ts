import { QUIZ_STEPS, type Domain, type QuizQuestion } from '@/data/brainHealthQuiz';

export type DomainStatus = 'Strong' | 'Stable' | 'Needs Attention' | 'Priority Area';

export interface DomainResult {
  domain: Domain;
  score: number;
  status: DomainStatus;
}

export interface QuizResult {
  domains: DomainResult[];
  top3: DomainResult[];
  overallStatus: DomainStatus;
  riskIndex: number;
  flaggedCount: number;
}

const DOMAINS: Domain[] = ['cognitive', 'vascular', 'sleep', 'movement', 'sensory', 'mood', 'reserve'];

const DOMAIN_ALARM_WEIGHT: Record<Domain, number> = {
  vascular: 1.30,
  cognitive: 1.25,
  sleep: 1.15,
  sensory: 1.10,
  mood: 1.05,
  movement: 1.00,
  reserve: 0.95,
};

export type Answers = Record<number, number>;

function statusFor(score: number): DomainStatus {
  if (score <= 0.25) return 'Strong';
  if (score <= 0.5) return 'Stable';
  if (score <= 0.75) return 'Needs Attention';
  return 'Priority Area';
}

export function scoreQuiz(answers: Answers): QuizResult {
  const totals: Record<Domain, { sum: number; max: number }> = {
    cognitive: { sum: 0, max: 0 },
    vascular: { sum: 0, max: 0 },
    sleep: { sum: 0, max: 0 },
    movement: { sum: 0, max: 0 },
    sensory: { sum: 0, max: 0 },
    mood: { sum: 0, max: 0 },
    reserve: { sum: 0, max: 0 },
  };

  for (const step of QUIZ_STEPS) {
    if (step.kind !== 'q') continue;
    const q = step as QuizQuestion;
    if (!q.domain || !q.weights) continue;
    const bucket = totals[q.domain];
    bucket.max += Math.max(...q.weights);
    const idx = answers[q.id];
    if (idx == null) continue;
    const w = q.weights[idx] ?? 0;
    bucket.sum += w;
  }

  const domains: DomainResult[] = DOMAINS.map((d) => {
    const { sum, max } = totals[d];
    const score = max > 0 ? sum / max : 0;
    return { domain: d, score, status: statusFor(score) };
  });

  const top3 = [...domains]
    .sort(
      (a, b) =>
        b.score * DOMAIN_ALARM_WEIGHT[b.domain] -
        a.score * DOMAIN_ALARM_WEIGHT[a.domain],
    )
    .slice(0, 3);
  const avg = domains.reduce((acc, d) => acc + d.score, 0) / domains.length;
  const riskIndex = Math.round(27 + 73 * Math.pow(avg, 0.75));
  const flaggedCount = domains.filter((d) => d.score > 0.5).length;

  return {
    domains,
    top3,
    overallStatus: statusFor(avg),
    riskIndex,
    flaggedCount,
  };
}

export const AGE_BASELINE_INDEX: Record<number, number> = {
  0: 28,
  1: 36,
  2: 44,
  3: 52,
  4: 58,
};

export function ageBaselineFor(answers: Answers): number {
  const ageIdx = answers[1];
  if (ageIdx == null) return 41;
  return AGE_BASELINE_INDEX[ageIdx] ?? 41;
}
