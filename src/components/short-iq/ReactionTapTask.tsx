import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pointerSafeActivation } from '@/lib/inputShield';
import type { Question } from '@/types/funnel';

interface Props {
  question: Question;
  onAnswer: (optionIndex: number) => void;
}

type Phase = 'ready' | 'waiting' | 'go' | 'tooEarly' | 'done';

function bucketFor(rtMs: number): number {
  if (rtMs < 300) return 0;
  if (rtMs < 450) return 1;
  if (rtMs < 700) return 2;
  return 3;
}

const ReactionTapTask = ({ question, onAnswer }: Props) => {
  const [phase, setPhase] = useState<Phase>('ready');
  const [rt, setRt] = useState<number | null>(null);
  const goAt = useRef<number>(0);
  const timer = useRef<number | null>(null);
  const answerTimer = useRef<number | null>(null);
  const firedRef = useRef<boolean>(false);

  const clearTimers = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (answerTimer.current) window.clearTimeout(answerTimer.current);
    timer.current = null;
    answerTimer.current = null;
  };

  useEffect(() => clearTimers, []);
  useEffect(() => {
    clearTimers();
    setPhase('ready');
    setRt(null);
    firedRef.current = false;
  }, [question.id]);

  const start = () => {
    clearTimers();
    firedRef.current = false;
    setPhase('waiting');
    const [lo, hi] = question.targetDelayMs ?? [1200, 2800];
    const delay = lo + Math.random() * (hi - lo);
    timer.current = window.setTimeout(() => {
      goAt.current = performance.now();
      setPhase('go');
    }, delay);
  };

  const handleTap = () => {
    if (firedRef.current) return;
    if (phase === 'waiting') {
      firedRef.current = true;
      if (timer.current) window.clearTimeout(timer.current);
      setPhase('tooEarly');
      return;
    }
    if (phase === 'go') {
      firedRef.current = true;
      const measured = Math.round(performance.now() - goAt.current);
      setRt(measured);
      setPhase('done');
      answerTimer.current = window.setTimeout(() => onAnswer(bucketFor(measured)), 700);
    }
  };

  const labels = ['Lightning', 'Fast', 'Average', 'Slow'];

  return (
    <div className="flex flex-col items-center w-full px-2 gap-4">
      <AnimatePresence mode="wait">
        {phase === 'ready' && (
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              When the circle turns <span className="font-semibold text-green-600">green</span>, tap it as fast as you can.
            </p>
            <button type="button" {...pointerSafeActivation(start)}
              className="h-14 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.97] touch-no-hover">
              Start
            </button>
          </motion.div>
        )}
        {(phase === 'waiting' || phase === 'go') && (
          <motion.button key="target" type="button"
            onPointerDown={(e) => { if (e.button !== undefined && e.button !== 0) return; handleTap(); }}
            onClick={handleTap}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }}
            className={`w-52 h-52 rounded-full shadow-lg flex items-center justify-center text-white text-xl font-bold transition-colors touch-no-hover active:scale-95 ${
              phase === 'go' ? 'bg-green-500' : 'bg-red-500'
            }`}>
            {phase === 'go' ? 'TAP!' : 'Wait…'}
          </motion.button>
        )}
        {phase === 'tooEarly' && (
          <motion.div key="early" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4">
            <p className="text-base font-semibold text-destructive">Too early — try again.</p>
            <button type="button" {...pointerSafeActivation(start)}
              className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] touch-no-hover">
              Retry
            </button>
          </motion.div>
        )}
        {phase === 'done' && rt != null && (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2">
            <p className="text-3xl font-extrabold text-foreground tabular-nums">{rt} ms</p>
            <p className="text-sm text-muted-foreground">{labels[bucketFor(rt)]} reaction</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReactionTapTask;