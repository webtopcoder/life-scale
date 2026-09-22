import ScaleQuizFlow, { type ScaleFlowConfig } from '@/components/scale/ScaleQuizFlow';
import { SLEEP_QUIZ_STEPS } from '@/data/sleepHealthQuiz';
import { scoreSleepHealth } from '@/engine/bodyScoring';

const CONFIG: ScaleFlowConfig = {
  scale: 'sleep-health',
  steps: SLEEP_QUIZ_STEPS,
  eyebrow: 'Sleep Health Check-in',
  headline: 'A five-minute check-in on how you actually sleep.',
  intro:
    'Seven areas decide whether your nights repair you. This check-in shows which ones are working, which are under strain, and what to change first. No score, no ranking — just where you stand.',
  areas: ['How long you sleep', 'Falling asleep', 'Staying asleep', 'Timing & rhythm', 'Room & wind-down', 'Caffeine & screens', 'How your days feel'],
  startLabel: 'Start my sleep check-in',
  calculatingTitle: 'Building your sleep check-in…',
  calculatingLines: [
    'Separating length from quality…',
    'Checking your timing and your rhythm…',
    'Matching your nights to your days…',
    'Sorting what to change first.',
  ],
  buildPayload: (answers) => {
    const result = scoreSleepHealth(answers);
    return {
      overall: result.overall,
      flags: result.flags,
      flagged_count: result.flags.length,
      weakest: result.weakest,
      strongest: result.strongest,
      breathing_flag: result.breathingFlag,
      result,
    };
  },
};

export default function SleepStartPage() {
  return <ScaleQuizFlow config={CONFIG} />;
}
