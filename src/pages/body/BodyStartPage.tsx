import ScaleQuizFlow, { type ScaleFlowConfig } from '@/components/scale/ScaleQuizFlow';
import { BODY_QUIZ_STEPS } from '@/data/bodyIqQuiz';
import { scoreBodyIq } from '@/engine/bodyScoring';

const CONFIG: ScaleFlowConfig = {
  scale: 'body',
  steps: BODY_QUIZ_STEPS,
  eyebrow: 'Body IQ Test',
  headline: 'One number for how your body is actually doing.',
  intro:
    'Twenty-four short questions across seven everyday areas. You get a single Body IQ score on the same scale as an IQ test — 100 is the middle — plus the areas holding your number down.',
  areas: ['Daily energy', 'Movement & strength', 'Food & hydration', 'Rest & recovery', 'Resilience', 'Your numbers', 'Stress load'],
  startLabel: 'Start my Body IQ test',
  calculatingTitle: 'Working out your Body IQ…',
  calculatingLines: [
    'Reading your answers across seven areas…',
    'Weighting movement and recovery…',
    'Placing you on the 100-point scale…',
    'Building the plan that follows your score.',
  ],
  buildPayload: (answers) => {
    const result = scoreBodyIq(answers);
    return {
      score: result.score,
      band: result.band,
      sub_scores: result.subScores,
      strongest: result.strongest,
      weakest: result.weakest,
      result,
    };
  },
};

export default function BodyStartPage() {
  return <ScaleQuizFlow config={CONFIG} />;
}
