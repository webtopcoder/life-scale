import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { FLOW_IDS } from '@/engine/datasetLoader';
import { fetchQuestions } from '@/engine/datasetLoader';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { calculateCategoryScores, calculateFinalScore, calculatePercentiles } from '@/engine/scoringEngine';
import { Check } from 'lucide-react';

const STEPS = [
  'Reviewing your answers',
  'Looking at pattern recognition',
  'Mapping cognitive strengths',
  'Comparing with our dataset',
  'Preparing your report',
];

// Life Scale deep blue overrides
const themeStyle = {
  ['--primary' as string]: '218 90% 26%',
  ['--primary-foreground' as string]: '0 0% 100%',
  ['--gradient-primary' as string]: 'linear-gradient(135deg, hsl(218 90% 26%), hsl(218 85% 34%))',
} as React.CSSProperties;

const IqTestCalculatingPage = () => {
  const posthog = usePostHog();
  const { state, dispatch } = useFunnel();
  const [currentStep, setCurrentStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const [calculationDone, setCalculationDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => { if (prev >= STEPS.length - 1) { clearInterval(interval); return prev; } return prev + 1; });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targetPercent = Math.min(((currentStep + 1) / STEPS.length) * 100, 100);
    const duration = 800;
    const startPercent = percent;
    const startTime = performance.now();
    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setPercent(Math.round(startPercent + (targetPercent - startPercent) * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === STEPS.length - 1 && !calculationDone) {
      const timeout = setTimeout(async () => {
        const questions = await fetchQuestions(state.flowId);
        const scores = calculateCategoryScores(state.answers, questions);
        const finalScore = calculateFinalScore(scores);
        const percentiles = calculatePercentiles(scores);
        dispatch({ type: 'SET_SCORES', scores });
        dispatch({ type: 'SET_PERCENTILES', percentiles });
        dispatch({ type: 'SET_FINAL_SCORE', score: finalScore });
        setCalculationDone(true);
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, state.answers, state.flowId, dispatch, calculationDone]);

  useEffect(() => {
    if (!calculationDone) return;
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'calculating' });
    const isPlansFlow = state.flowId === FLOW_IDS.PLANS_V1;
    dispatch({ type: 'SET_STAGE', stage: isPlansFlow ? 'checkout-plans' : 'checkout' });
  }, [calculationDone, posthog, state.flowId, dispatch]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percent / 100) * circumference;

  return (
    <div style={themeStyle} className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="max-w-sm w-full space-y-8 text-center relative z-10">
        <div className="flex justify-center">
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} animate={{ strokeDashoffset: strokeOffset }} transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span className="text-3xl font-bold text-foreground" key={percent} initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>{percent}%</motion.span>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Preparing your results</h2>
          <p className="text-sm text-muted-foreground">This takes a moment while we review your session.</p>
        </motion.div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 20 }} className="flex items-center gap-3 text-left">
              <div className="relative">
                <AnimatePresence mode="wait">
                  {i < currentStep ? (
                    <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="w-4 h-4" /></motion.div>
                  ) : i === currentStep ? (
                    <motion.div key="active" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" /></motion.div>
                  ) : (
                    <motion.div key="pending" className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center"><span className="text-xs">{i + 1}</span></motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className={`text-sm ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</span>
            </motion.div>
          ))}
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${percent}%` }} transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }} />
        </div>
      </div>
    </div>
  );
};

export default IqTestCalculatingPage;
