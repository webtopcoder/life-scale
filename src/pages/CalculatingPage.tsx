import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { FLOW_IDS } from '@/engine/datasetLoader';
import { fetchQuestions } from '@/engine/datasetLoader';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { calculateCategoryScores, calculateFinalScore, calculatePercentiles } from '@/engine/scoringEngine';
import { Check, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { completeIqAssessment } from '@/lib/iqCompletionAdapter';

const STEPS = [
  'Analyzing responses…',
  'Evaluating pattern recognition…',
  'Mapping cognitive strengths…',
  'Comparing against dataset…',
  'Finalizing your report…',
];

const PARTICLE_COUNT = 20;

const FloatingParticles = () => {
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/10"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [0.2, 0.6, 0.3, 0.5, 0.2],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

const CalculatingPage = () => {
  const posthog = usePostHog();
  const { state, dispatch, goToStage } = useFunnel();
  const [currentStep, setCurrentStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const [recordsAnalyzed, setRecordsAnalyzed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showPuzzlePopup, setShowPuzzlePopup] = useState(false);
  const [puzzleDismissed, setPuzzleDismissed] = useState(false);
  const [showSecondPopup, setShowSecondPopup] = useState(false);
  const [secondDismissed, setSecondDismissed] = useState(false);
  const [calculationDone, setCalculationDone] = useState(false);

  useEffect(() => {
    if (currentStep === 1 && !puzzleDismissed && !showPuzzlePopup) setShowPuzzlePopup(true);
  }, [currentStep, puzzleDismissed, showPuzzlePopup]);

  useEffect(() => {
    if (currentStep === 3 && !secondDismissed && !showSecondPopup && puzzleDismissed) setShowSecondPopup(true);
  }, [currentStep, secondDismissed, showSecondPopup, puzzleDismissed]);

  useEffect(() => {
    if (showPuzzlePopup || showSecondPopup) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => { if (prev >= STEPS.length - 1) { clearInterval(interval); return prev; } return prev + 1; });
    }, 1800);
    return () => clearInterval(interval);
  }, [showPuzzlePopup, showSecondPopup]);

  const handlePuzzleDismiss = () => { setShowPuzzlePopup(false); setPuzzleDismissed(true); };
  const handleSecondDismiss = () => { setShowSecondPopup(false); setSecondDismissed(true); };

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
    const targetRecords = Math.round(((currentStep + 1) / STEPS.length) * 14847);
    const interval = setInterval(() => {
      setRecordsAnalyzed(prev => {
        const step = Math.max(1, Math.floor((targetRecords - prev) / 8));
        if (prev >= targetRecords) return targetRecords;
        return Math.min(prev + step + Math.floor(Math.random() * 20), targetRecords);
      });
    }, 30);
    return () => clearInterval(interval);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === STEPS.length - 1 && !calculationDone) {
      const timeout = setTimeout(async () => {
        const questions = await fetchQuestions(state.flowId);
        const scores = calculateCategoryScores(state.answers, questions);
        const finalScore = calculateFinalScore(scores);
        const percentiles = calculatePercentiles(scores);
        // Dispatch all at once so DB persistence reads fresh values
        dispatch({ type: 'SET_SCORES', scores });
        dispatch({ type: 'SET_PERCENTILES', percentiles });
        dispatch({ type: 'SET_FINAL_SCORE', score: finalScore });
        if (state.flowId === FLOW_IDS.FIXED_V1_RVR2) {
          await completeIqAssessment({
            answers: state.answers,
            questions,
            scores: { ...scores },
            percentiles: { ...percentiles },
            finalScore,
            flowId: state.flowId,
          });
        }
        setCalculationDone(true);
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, state.answers, state.flowId, dispatch, calculationDone]);

  useEffect(() => {
    if (calculationDone && puzzleDismissed && secondDismissed && !showWarning) setShowWarning(true);
  }, [calculationDone, puzzleDismissed, secondDismissed, showWarning]);

  const handleWarningDismiss = () => {
    setShowWarning(false);
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'calculating' });
    const isPlansFlow = state.flowId === FLOW_IDS.PLANS_V1;
    const isRvr2Flow = state.flowId === FLOW_IDS.FIXED_V1_RVR2;
    dispatch({ type: 'SET_STAGE', stage: isPlansFlow ? 'checkout-plans' : isRvr2Flow ? 'email' : 'checkout' });
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percent / 100) * circumference;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingParticles />
      <div className="max-w-sm w-full space-y-8 text-center relative z-10">
        <div className="flex justify-center">
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} animate={{ strokeDashoffset: strokeOffset }} transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                <Brain className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.span className="text-2xl font-bold text-foreground mt-1" key={percent} initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>{percent}%</motion.span>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Calculating Your Results</h2>
          <p className="text-sm text-muted-foreground">Please wait while we analyze your performance…</p>
        </motion.div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 20 }} className="flex items-center gap-3 text-left">
              <div className="relative">
                <AnimatePresence mode="wait">
                  {i < currentStep ? (
                    <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} className="w-7 h-7 rounded-full bg-success text-success-foreground flex items-center justify-center" style={{ boxShadow: '0 0 12px hsl(var(--success) / 0.4)' }}><Check className="w-4 h-4" /></motion.div>
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
          <motion.div className="h-full rounded-full" style={{ background: 'var(--gradient-primary)' }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }} />
        </div>

        <motion.p className="text-xs text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <span className="font-mono font-semibold text-foreground">{recordsAnalyzed.toLocaleString()}</span> records analyzed
        </motion.p>
      </div>

      {/* Puzzle Popup */}
      <AnimatePresence>
        {showPuzzlePopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }} className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 300 }} className="flex justify-center">
                <div className="relative"><Sparkles className="w-10 h-10 text-primary" /><Sparkles className="w-5 h-5 text-primary/70 absolute -top-2 -right-3" /><Sparkles className="w-4 h-4 text-primary/50 absolute -bottom-1 -left-2" /></div>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }} className="text-lg font-semibold text-foreground">Do you enjoy challenging your mind?</motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }} className="flex gap-3">
                <Button onClick={handlePuzzleDismiss} className="flex-1 h-12 text-base font-bold rounded-xl" style={{ background: 'var(--gradient-primary)' }}>No</Button>
                <Button onClick={handlePuzzleDismiss} className="flex-1 h-12 text-base font-bold rounded-xl" style={{ background: 'var(--gradient-primary)' }}>Yes</Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Second Popup */}
      <AnimatePresence>
        {showSecondPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }} className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 300 }} className="flex justify-center text-3xl">🧠</motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }} className="text-lg font-semibold text-foreground">Are you a curious person?</motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }} className="flex gap-3">
                <Button onClick={handleSecondDismiss} className="flex-1 h-12 text-base font-bold rounded-xl" style={{ background: 'var(--gradient-primary)' }}>No</Button>
                <Button onClick={handleSecondDismiss} className="flex-1 h-12 text-base font-bold rounded-xl" style={{ background: 'var(--gradient-primary)' }}>Yes</Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }} className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 text-center">
              <motion.h3 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-xl font-bold text-primary tracking-wide uppercase">Warning</motion.h3>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.4 }} className="text-foreground text-[15px] leading-relaxed">Your results may surprise you. IQ report reveals hidden strengths and growth areas — a powerful tool for unlocking your potential.</motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.4 }}>
                <Button onClick={handleWarningDismiss} className="w-full h-12 text-base font-bold uppercase tracking-wider rounded-xl bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-white">I Understand</Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalculatingPage;
