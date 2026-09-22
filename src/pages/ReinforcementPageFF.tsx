import { useMemo, useState } from 'react';
import { useFunnel } from '@/context/FunnelContext';
import { EVENTS, trackEvent } from '@/constants/analytics';
import ReinforcementScreenFF, {
  type ReinforcementScreenFFProps,
} from '@/components/reinforcement/ReinforcementScreenFF';
import { useFFIntl } from '@/i18n/ff';

type ScreenConfig = Omit<ReinforcementScreenFFProps, 'onContinue'>;

/**
 * Reinforcement screens for the /onboarding-ff flow only.
 * Same funnel state as ReinforcementPage, new visuals/order from the design PoC.
 */
const SCREENS: ScreenConfig[] = [
  {
    type: 'speed',
    percentile: 88,
    title: 'Speed Is In The Top 88%',
    message: 'Your response time is impressive. Keep it up!',
  },
  {
    type: 'category',
    percentile: 96,
    title: 'Strongest Area So Far',
    message: 'You may have other cognitive strengths. Finish the test to see your full profile.',
    categoryLabel: 'Logic',
  },
  {
    type: 'profile',
    percentile: 1,
    title: 'Your Profile Is Unique...',
    message: '',
    bullets: [
      'Income potential: Top 1%',
      'You think twice, even when right the first time',
      'Others struggle to understand you in (1) key area',
    ],
    belowCtaNote: 'Full breakdown available in your personalized report',
  },

  {
    type: 'momentum',
    percentile: 98,
    title: 'Just 3 Questions Left\n',
    highlight: '3',
    message: 'Finish strong to see your complete results.',
  },
];

const ReinforcementPageFF = () => {
  const { state, goToStage } = useFunnel();
  const { t } = useFFIntl();
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
        title: t(base.title), message: t(base.message), bullets: base.bullets?.map((item) => t(item)), belowCtaNote: base.belowCtaNote ? t(base.belowCtaNote) : undefined,
        categoryLabel: strongest
          ? t(strongest.charAt(0).toUpperCase() + strongest.slice(1))
          : base.categoryLabel ? t(base.categoryLabel) : base.categoryLabel,
      };
    }

    return { ...base, title: t(base.title), message: t(base.message), bullets: base.bullets?.map((item) => t(item)), belowCtaNote: base.belowCtaNote ? t(base.belowCtaNote) : undefined };
  }, [state.reinforcementCount, state.adaptiveProfile, state.scores, t]);

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
    <ReinforcementScreenFF {...screen} onContinue={handleContinue} />
  );
};

export default ReinforcementPageFF;