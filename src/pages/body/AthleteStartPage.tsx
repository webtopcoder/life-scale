import ScaleQuizFlow, { type ScaleFlowConfig } from '@/components/scale/ScaleQuizFlow';
import { ATHLETE_QUIZ_STEPS } from '@/data/hiddenAthleteQuiz';
import { scoreHiddenAthlete } from '@/engine/bodyScoring';

const CONFIG: ScaleFlowConfig = {
  scale: 'hidden-athlete',
  steps: ATHLETE_QUIZ_STEPS,
  eyebrow: 'Hidden Athlete Test',
  headline: 'Find out how your body is built to train.',
  intro:
    'Not a fitness test. Twenty-two questions read how your body prefers to work — long or short, steady or spiky, planned or improvised — and hand you a way of training that fits instead of one you have to force.',
  areas: ['How you move', 'Your rhythm', 'Recovery', 'Under pressure', 'Motivation', 'Your body'],
  startLabel: 'Find my athlete type',
  calculatingTitle: 'Reading your athlete profile…',
  calculatingLines: [
    'Weighing endurance against power…',
    'Reading volume against intensity…',
    'Checking structure against instinct…',
    'Matching you to your archetype.',
  ],
  buildPayload: (answers) => {
    const result = scoreHiddenAthlete(answers);
    return {
      archetype: result.archetype.key,
      archetype_name: result.archetype.name,
      secondary: result.secondary.key,
      axes: result.normalized,
      result,
    };
  },
};

export default function AthleteStartPage() {
  return <ScaleQuizFlow config={CONFIG} />;
}
