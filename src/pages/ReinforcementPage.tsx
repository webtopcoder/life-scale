import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { Button } from '@/components/ui/button';
import { EVENTS, trackEvent } from '@/constants/analytics';
import ReinforcementHero from '@/components/dashboard/ReinforcementHero';

const REINFORCEMENT_TYPES = [
  {
    type: 'speed' as const,
    titleTemplate: "Your Speed Puts You in the Top {p}%",
    message: "Your response time is impressive — keep it up to unlock your full brain profile.",
  },
  {
    type: 'score' as const,
    titleTemplate: "You're Scoring Higher Than {p}% of Test Takers",
    message: "You're outperforming most people who take this assessment. Keep going!",
  },
  {
    type: 'category' as const,
    titleTemplate: "Top {p}% — Your Strongest Area",
    message: "You have a clear cognitive strength. Finish the test to see your full profile.",
  },
  {
    type: 'momentum' as const,
    titleTemplate: "Almost There — Top {p}% So Far",
    message: "Just 3 questions left! Finish strong to see your complete results.",
  },
];

const ReinforcementPage = () => {
  const posthog = usePostHog();
  const { state, goToStage } = useFunnel();
  const [exiting, setExiting] = useState(false);

  const reinforcement = useMemo(() => {
    const idx = Math.min(state.reinforcementCount - 1, REINFORCEMENT_TYPES.length - 1);
    const r = REINFORCEMENT_TYPES[idx];
    const percentiles = [88, 93, 96, 98];
    const percentile = percentiles[idx] ?? 97;
    const title = r.titleTemplate.replace('{p}', String(percentile));

    // Derive strongest category from scores or adaptive profile
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

    return { ...r, percentile, title, categoryLabel };
  }, [state.reinforcementCount, state.adaptiveProfile, state.scores]);

  const handleContinue = () => {
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'reinforcement', reinforcement_count: state.reinforcementCount });
    setExiting(true);
    setTimeout(() => {
      goToStage(state.isV2 ? 'assessment' : 'assessment');
    }, 250);
  };

  const titleParts = reinforcement.title.split(`${reinforcement.percentile}%`);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.04) 0%, hsl(var(--background)) 70%)' }}
    >
      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="reinforcement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col items-center px-6 pt-16 pb-8"
          >
            {/* Animated hero */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="mb-8"
            >
              <ReinforcementHero type={reinforcement.type} />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-2xl font-bold text-foreground leading-tight text-center"
            >
              {titleParts[0]}
              <span className="text-primary">{reinforcement.percentile}%</span>
              {titleParts[1]}
              {reinforcement.categoryLabel && (
                <>
                  {': '}
                  <span className="text-primary">{reinforcement.categoryLabel}</span>
                </>
              )}
            </motion.h1>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="text-muted-foreground text-sm leading-relaxed text-center mt-3 max-w-xs"
            >
              {reinforcement.message}
            </motion.p>

            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="w-full mt-8 md:flex md:justify-center"
            >
              <Button
                size="lg"
                onClick={handleContinue}
                className="w-full md:w-auto md:min-w-[280px] h-14 rounded-xl font-bold text-base bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta))]/90 text-white"
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

export default ReinforcementPage;
