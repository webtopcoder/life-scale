import { useMemo, useState } from 'react';
import { useFunnel888 } from '@/context/Funnel888Context';
import { EVENTS, trackEvent } from '@/constants/analytics';
import ReinforcementScreen888, {
  type ReinforcementScreen888Props,
} from '@/components/reinforcement/ReinforcementScreen888';

type ScreenConfig = Omit<ReinforcementScreen888Props, 'onContinue'>;

/**
 * Reinforcement screens for the /onboarding-888 flow only.
 * Same funnel state as ReinforcementPage, new visuals/order from the design PoC.
 */
const SCREENS: ScreenConfig[] = [
  {
    type: 'speed',
    percentile: 99,
    title: 'You Are Faster Than 99% of Test Participants',
    message: 'Quick reactions help you adapt to challenges and make decisions under pressure.',
  },
  {
    type: 'category',
    percentile: 79,
    title: "You're Outperforming 79% of Test Takers",
    message: 'High scores are linked to strong reasoning, creativity, and original thinking.',
  },
  {
    type: 'memory',
    percentile: 0,
    title: 'Memorize This Number',
    message: '5831\nYou will be asked about it after the quiz.',
  },

  {
    type: 'profile',
    percentile: 88,
    title: 'A Pattern Is Emerging',
    message: 'Every answer adds detail to how you reason, recall, and solve under pressure.',
  },
  {
    type: 'momentum',
    percentile: 88,
    title: 'You Are Almost There!\nOnly 5 Questions Left!',
    message: "You've answered 88% of the questions. Just 5 more until your IQ score is ready!",
  },
  {
    type: 'memory',
    percentile: 0,
    title: 'Memorize One More Word',
    message: 'Falcon\nYou will be asked about it after the quiz.',
  },
];

const ReinforcementPage888 = () => {
  const { state, goToStage } = useFunnel888();
  const [exiting, setExiting] = useState(false);

  const screen = useMemo<ScreenConfig>(() => {
    const idx = Math.min(Math.max(state.reinforcementCount - 1, 0), SCREENS.length - 1);
    const base = SCREENS[idx];

    if (base.type === 'category') {
      const strongest =
        state.adaptiveProfile?.strongest ??
        (state.scores
          ? Object.entries(state.scores).sort(([, a], [, b]) => b - a)[0]?.[0]
          : null);
      return {
        ...base,
        categoryLabel: strongest
          ? strongest.charAt(0).toUpperCase() + strongest.slice(1)
          : base.categoryLabel,
      };
    }

    return base;
  }, [state.reinforcementCount, state.adaptiveProfile, state.scores]);

  const handleContinue = () => {
    if (exiting) return;
    trackEvent(undefined, EVENTS.FUNNEL_STEP_COMPLETED, {
      step: 'reinforcement',
      reinforcement_count: state.reinforcementCount,
    });
    setExiting(true);
    setTimeout(() => goToStage('assessment'), 250);
  };

  return (
    <ReinforcementScreen888 {...screen} onContinue={handleContinue} />
  );
};

export default ReinforcementPage888;