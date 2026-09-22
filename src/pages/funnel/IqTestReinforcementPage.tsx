import { useMemo, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { Button } from '@/components/ui/button';
import { EVENTS, trackEvent } from '@/constants/analytics';
import ReinforcementHero from '@/components/dashboard/ReinforcementHero';

/**
 * Life Scale-only reinforcement interstitial.
 * Isolated from the shared `ReinforcementPage` so /iq-start owns its copy and
 * accent color. Do NOT import this from anywhere outside the Life Scale funnel.
 */

type ReinforcementType = 'speed' | 'score' | 'category' | 'momentum';

const REINFORCEMENT_TYPES: Array<{
  type: ReinforcementType;
  titleTemplate: string;
  message: string;
  showPercentile: boolean;
}> = [
  {
    type: 'speed',
    titleTemplate: "You're answering faster than {p}% of people",
    message: 'Steady pace so far. A few more questions to go.',
    showPercentile: true,
  },
  {
    type: 'score',
    titleTemplate: 'Your accuracy is above {p}% of test takers',
    message: 'Nice work. Keep going at your own pace.',
    showPercentile: true,
  },
  {
    type: 'category',
    titleTemplate: 'Your strongest area so far: {category}',
    message: 'One area is standing out. Finish the test to see the full picture.',
    showPercentile: false,
  },
  {
    type: 'momentum',
    titleTemplate: "You're almost done",
    message: 'Just a few questions left before your results.',
    showPercentile: false,
  },
];

// Darker Life Scale blue, scoped to this page only via a --primary override.
const IQ_SCALE_DEEP_BLUE = '218 90% 26%';

const IqTestReinforcementPage = () => {
  const posthog = usePostHog();
  const { state, goToStage } = useFunnel();
  const [exiting, setExiting] = useState(false);

  const reinforcement = useMemo(() => {
    const idx = Math.min(state.reinforcementCount - 1, REINFORCEMENT_TYPES.length - 1);
    const r = REINFORCEMENT_TYPES[idx];
    const percentiles = [88, 93, 96, 98];
    const percentile = percentiles[idx] ?? 97;

    let categoryLabel: string | null = null;
    if (r.type === 'category') {
      const strongest = state.adaptiveProfile?.strongest
        ?? (state.scores
          ? Object.entries(state.scores).sort(([, a], [, b]) => b - a)[0]?.[0]
          : null);
      if (strongest) {
        categoryLabel = strongest.charAt(0).toUpperCase() + strongest.slice(1);
      }
    }

    const title = r.titleTemplate
      .replace('{p}', String(percentile))
      .replace('{category}', categoryLabel ?? 'your top area');

    return { ...r, percentile, title, categoryLabel };
  }, [state.reinforcementCount, state.adaptiveProfile, state.scores]);

  const handleContinue = () => {
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, {
      step: 'reinforcement',
      reinforcement_count: state.reinforcementCount,
      flow: 'iqscale',
    });
    setExiting(true);
    setTimeout(() => {
      goToStage('assessment');
    }, 250);
  };

  // Split the title around the percentile so we can accent it, when relevant.
  const percentileToken = `${reinforcement.percentile}%`;
  const titleParts = reinforcement.showPercentile
    ? reinforcement.title.split(percentileToken)
    : null;

  // Split the category title around the label so we can accent it.
  const categoryParts =
    reinforcement.type === 'category' && reinforcement.categoryLabel
      ? reinforcement.title.split(reinforcement.categoryLabel)
      : null;

  const wrapperStyle: CSSProperties = {
    // Scope the darker Life Scale blue to this page only.
    ['--primary' as never]: IQ_SCALE_DEEP_BLUE,
    background:
      'radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.05) 0%, hsl(var(--background)) 70%)',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden" style={wrapperStyle}>
      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="iq-test-reinforcement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col items-center px-6 pt-16 pb-8"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="mb-8"
            >
              <ReinforcementHero type={reinforcement.type} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-2xl font-bold text-foreground leading-tight text-center"
            >
              {titleParts ? (
                <>
                  {titleParts[0]}
                  <span className="text-primary">{percentileToken}</span>
                  {titleParts[1]}
                </>
              ) : categoryParts && reinforcement.categoryLabel ? (
                <>
                  {categoryParts[0]}
                  <span className="text-primary">{reinforcement.categoryLabel}</span>
                  {categoryParts[1]}
                </>
              ) : (
                reinforcement.title
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="text-muted-foreground text-sm leading-relaxed text-center mt-3 max-w-xs"
            >
              {reinforcement.message}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="w-full mt-8 md:flex md:justify-center"
            >
              <Button
                size="lg"
                onClick={handleContinue}
                className="w-full md:w-auto md:min-w-[280px] h-14 rounded-xl font-bold text-base bg-[hsl(218,90%,26%)] hover:bg-[hsl(218,90%,32%)] text-white"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IqTestReinforcementPage;
