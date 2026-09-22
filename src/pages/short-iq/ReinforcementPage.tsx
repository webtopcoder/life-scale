import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@/lib/posthog';
import { useFunnel } from '@/context/ShortIqFunnelContext';
import { Button } from '@/components/ui/button';
import { EVENTS, trackEvent } from '@/constants/analytics';
import ReinforcementHero from '@/components/dashboard/ReinforcementHero';
import { getShortIqCopy } from '@/constants/shortIqCopy';
import { getQuestion } from '@/engine/datasetLoader';

const ReinforcementPage = () => {
  const posthog = usePostHog();
  const { state, goToStage } = useFunnel();
  const [exiting, setExiting] = useState(false);
  const copy = getShortIqCopy();
  const REINFORCEMENT_TYPES = [
    { type: 'speed' as const, ...copy.reinforcement.speed },
    { type: 'score' as const, ...copy.reinforcement.score },
    { type: 'category' as const, ...copy.reinforcement.category },
    { type: 'momentum' as const, ...copy.reinforcement.momentum },
  ];

  const reinforcement = useMemo(() => {
    const idx = Math.min(state.reinforcementCount - 1, REINFORCEMENT_TYPES.length - 1);
    const r = REINFORCEMENT_TYPES[Math.max(0, idx)];
    const completedQ = getQuestion(Math.max(0, state.questionIndex - 1));
    const answer = completedQ ? state.answers.find((a) => a.questionId === completedQ.id) : undefined;
    const outcome: 'success' | 'miss' = !answer ? 'miss' : answer.isCorrect === false ? 'miss' : 'success';
    const variant = outcome === 'success' ? r.success : r.miss;
    const percentile = variant.percentile;
    const title = variant.titleTemplate.replace('{p}', String(percentile ?? ''));
    return { type: r.type, titleTemplate: variant.titleTemplate, message: variant.message, percentile, title };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.reinforcementCount, state.flowId, state.questionIndex, state.answers]);

  const handleContinue = () => {
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED ?? 'funnel_step_completed', { step: 'reinforcement', reinforcement_count: state.reinforcementCount });
    setExiting(true);
    setTimeout(() => { goToStage('assessment'); }, 250);
  };

  const hasPercentile = reinforcement.titleTemplate.includes('{p}') && reinforcement.percentile !== undefined;
  const titleParts = hasPercentile ? reinforcement.title.split(`${reinforcement.percentile}%`) : [reinforcement.title, ''];

  return (
    <div className="min-h-screen bg-[#F5FCFF] flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.04) 0%, hsl(var(--background)) 70%)' }}>
      <AnimatePresence>
        {!exiting && (
          <motion.div key="reinforcement" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col items-center px-6 pt-16 pb-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="mb-8">
              <ReinforcementHero type={reinforcement.type} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
              className="text-2xl font-bold text-foreground leading-tight text-center whitespace-pre-line">
              {titleParts[0]}
              {hasPercentile && <span className="text-primary">{reinforcement.percentile}%</span>}
              {titleParts[1]}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}
              className="text-muted-foreground text-sm leading-relaxed text-center mt-3 max-w-xs whitespace-pre-line">
              {reinforcement.message}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
              className="w-full mt-8 md:flex md:justify-center">
              <Button size="lg" onClick={handleContinue}
                className="w-full md:w-auto md:min-w-[280px] h-14 rounded-xl font-bold text-base bg-[#0088D1] hover:bg-[#0088D1]/90 text-white">
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