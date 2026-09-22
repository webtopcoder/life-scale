import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePostHog } from '@/lib/posthog';
import { useFunnel } from '@/context/ShortIqFunnelContext';
import { fetchQuestions } from '@/engine/datasetLoader';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { calculateCategoryScores, calculateFinalScore, calculatePercentiles } from '@/engine/scoringEngine';
import { Star } from 'lucide-react';
import peopleIcon from '@/assets/people-icon.png';
import brainIcon from '@/assets/brain-icon.png';
import ratedIcon from '@/assets/rated-icon.png';
import trophyIcon from '@/assets/trophy-icon.png';
import profileIcon from '@/assets/profile-icon.png';
import { getShortIqCopy } from '@/constants/shortIqCopy';

const CalculatingPage = () => {
  const posthog = usePostHog();
  const { state, dispatch } = useFunnel();
  const copy = getShortIqCopy();
  const BARS = copy.calculatingBars;
  const POPUPS = copy.calculatingPopups;
  const [progress, setProgress] = useState<number[]>(() => BARS.map(() => 0));
  const [done, setDone] = useState(false);
  const [showCuriosityPopup, setShowCuriosityPopup] = useState(false);
  const [curiosityDismissed, setCuriosityDismissed] = useState(false);
  const [showPerformancePopup, setShowPerformancePopup] = useState(false);
  const [performanceDismissed, setPerformanceDismissed] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profileDismissed, setProfileDismissed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [baseElapsed, setBaseElapsed] = useState(0);

  useEffect(() => {
    if (paused) return;
    const start = performance.now() - baseElapsed;
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const next = BARS.map((b, i) => {
        const prevDurations = BARS.slice(0, i).reduce((sum, bar) => sum + bar.durationMs, 0);
        if (elapsed <= prevDurations) return 0;
        return Math.min(b.target, ((elapsed - prevDurations) / b.durationMs) * b.target);
      });
      setProgress(next);
      setBaseElapsed(elapsed);

      if (!curiosityDismissed && next[0] >= BARS[0].target) {
        setShowCuriosityPopup(true); setPaused(true); return;
      }
      if (curiosityDismissed && !performanceDismissed && next[2] >= BARS[2].target) {
        setShowPerformancePopup(true); setPaused(true); return;
      }
      if (performanceDismissed && !profileDismissed && next[4] >= 3) {
        setShowProfilePopup(true); setPaused(true); return;
      }
      const totalDuration = BARS.reduce((sum, b) => sum + b.durationMs, 0);
      if (elapsed < totalDuration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const questions = await fetchQuestions(state.flowId);
      if (cancelled) return;
      const scores = calculateCategoryScores(state.answers, questions);
      const finalScore = calculateFinalScore(scores);
      const percentiles = calculatePercentiles(scores);
      dispatch({ type: 'SET_SCORES', scores });
      dispatch({ type: 'SET_PERCENTILES', percentiles });
      dispatch({ type: 'SET_FINAL_SCORE', score: finalScore });
      setDone(true);
    })();
    return () => { cancelled = true; };
  }, [state.flowId, state.answers, dispatch]);

  useEffect(() => {
    if (!done || paused || !curiosityDismissed || !performanceDismissed || !profileDismissed) return;
    if (progress[4] < 100) return;
    const t = setTimeout(() => {
      trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED ?? 'funnel_step_completed', { step: 'calculating' });
      dispatch({ type: 'SET_STAGE', stage: 'email' });
    }, 400);
    return () => clearTimeout(t);
  }, [done, paused, curiosityDismissed, performanceDismissed, profileDismissed, progress, posthog, dispatch]);

  const handleCuriosityDismiss = () => { setShowCuriosityPopup(false); setCuriosityDismissed(true); setPaused(false); };
  const handlePerformanceDismiss = () => { setShowPerformancePopup(false); setPerformanceDismissed(true); setPaused(false); };
  const handleProfileDismiss = () => { setShowProfilePopup(false); setProfileDismissed(true); setPaused(false); };

  const popupOpen = showCuriosityPopup || showPerformancePopup || showProfilePopup;

  return (
    <div className="min-h-screen bg-[#F5FCFF] px-5 py-8 relative">
      <div className={`max-w-md mx-auto space-y-7 transition-[filter] duration-200 ${popupOpen ? 'blur-md pointer-events-none' : ''}`}>
        <h1 className="text-[28px] font-bold text-foreground text-center leading-tight">{copy.calculatingHeading}</h1>
        <div className="space-y-4">
          {BARS.map((bar, i) => {
            const pct = Math.round(progress[i]);
            return (
              <div key={bar.label} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] text-foreground">{bar.label}</span>
                  <span className="text-[15px] font-medium text-foreground tabular-nums">{Number.isFinite(pct) ? pct : 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-primary/15 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-primary" initial={{ width: '0%' }}
                    style={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.2, ease: 'linear' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <img src={peopleIcon} alt="" className="w-7 h-7 flex-shrink-0" />
            <p className="text-[15px] text-foreground"><span className="font-bold">13,284</span> people took the test today</p>
          </div>
          <div className="flex items-center gap-3">
            <img src={brainIcon} alt="" className="w-7 h-7 flex-shrink-0" />
            <p className="text-[15px] text-foreground"><span className="font-bold">20M+</span> IQ tests completed</p>
          </div>
          <div className="flex items-center gap-3">
            <img src={ratedIcon} alt="" className="w-7 h-7 flex-shrink-0" />
            <p className="text-[15px] text-foreground">Rated <span className="font-bold">4.8/5</span> by users</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
          </div>
          <h3 className="text-[17px] font-bold text-foreground leading-snug">"The result honestly surprised me."</h3>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            I thought it would be just another quick test, but it actually revealed some unexpected things about my logical thinking and decision-making speed. Now it makes sense why I tend to solve certain problems faster than others.
          </p>
          <p className="text-[14px] text-foreground pt-1">Alex Ja</p>
        </div>
      </div>

      <AnimatePresence>
        {showCuriosityPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 text-center">
              <p className="text-lg font-semibold text-foreground">{POPUPS[0]?.question}</p>
              <div className="flex gap-3">
                <Button onClick={handleCuriosityDismiss} variant="outline" className="flex-1 h-12 text-base font-bold rounded-xl">{POPUPS[0]?.noLabel}</Button>
                <Button onClick={handleCuriosityDismiss} className="flex-1 h-12 text-base font-bold rounded-xl bg-[#0088D1] hover:bg-[#0088D1]/90 text-white">{POPUPS[0]?.yesLabel}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPerformancePopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 text-center">
              <div className="flex justify-center"><img src={trophyIcon} alt="" className="w-14 h-14" /></div>
              <p className="text-lg font-semibold text-foreground">{POPUPS[1]?.question}</p>
              <div className="flex gap-3">
                <Button onClick={handlePerformanceDismiss} variant="outline" className="flex-1 h-12 text-base font-bold rounded-xl">{POPUPS[1]?.noLabel}</Button>
                <Button onClick={handlePerformanceDismiss} className="flex-1 h-12 text-base font-bold rounded-xl bg-[#0088D1] hover:bg-[#0088D1]/90 text-white">{POPUPS[1]?.yesLabel}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfilePopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 text-center">
              <div className="flex justify-center"><img src={profileIcon} alt="" className="w-14 h-14" /></div>
              <p className="text-lg font-semibold text-foreground">{POPUPS[2]?.question}</p>
              <div className="flex gap-3">
                <Button onClick={handleProfileDismiss} variant="outline" className="flex-1 h-12 text-base font-bold rounded-xl">{POPUPS[2]?.noLabel}</Button>
                <Button onClick={handleProfileDismiss} className="flex-1 h-12 text-base font-bold rounded-xl bg-[#0088D1] hover:bg-[#0088D1]/90 text-white">{POPUPS[2]?.yesLabel}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalculatingPage;