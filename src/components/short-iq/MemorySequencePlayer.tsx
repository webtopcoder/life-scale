import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';
import type { Question } from '@/types/funnel';

interface Props {
  question: Question;
  selectedOption: number | null;
  onAnswer: (optionIndex: number) => void;
  shuffleOptions?: boolean;
  onPhaseChange?: (phase: 'reveal' | 'answer') => void;
}

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
};

function renderItem(item: string, variant: Question['sequenceVariant']) {
  if (variant === 'color') {
    return (
      <div className="w-12 h-12 rounded-xl border border-border shadow-sm"
        style={{ backgroundColor: COLOR_MAP[item] ?? item }} />
    );
  }
  return (
    <div className="w-12 h-14 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-2xl font-bold text-foreground tabular-nums">
      {item}
    </div>
  );
}

function renderOption(opt: string, variant: Question['sequenceVariant']) {
  if (variant === 'color') {
    return <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: COLOR_MAP[opt] ?? opt }} />;
  }
  return <span className="text-xl font-bold tabular-nums">{opt}</span>;
}

const MemorySequencePlayer = ({ question, selectedOption, onAnswer, shuffleOptions = false, onPhaseChange }: Props) => {
  const totalShowMs = question.displayMs ?? 5000;
  const [phase, setPhase] = useState<'reveal' | 'answer'>('reveal');
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => { onPhaseChange?.(phase); }, [phase, onPhaseChange]);
  useEffect(() => { setPhase('reveal'); setSecondsLeft(3); }, [question.id, totalShowMs]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    const hide = window.setTimeout(() => setPhase('answer'), totalShowMs);
    const tick = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { window.clearTimeout(hide); window.clearInterval(tick); };
  }, [phase, totalShowMs, question.id]);

  const positionLabel = useMemo(() => {
    const n = question.targetPosition ?? 1;
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    return `${n}${suffix}`;
  }, [question.targetPosition]);

  const displayOptions = useMemo(() => {
    const opts = question.options.map((opt, originalIndex) => ({ opt, originalIndex }));
    if (!shuffleOptions) return opts;
    let seed = 0;
    const idStr = String(question.id);
    for (let i = 0; i < idStr.length; i++) seed = (seed * 31 + idStr.charCodeAt(i)) >>> 0;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
    const arr = [...opts];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [question.id, question.options, shuffleOptions]);

  return (
    <div className="flex flex-col items-center w-full px-2">
      {phase === 'reveal' ? (
        <div className="w-full flex flex-col items-center gap-5">
          <p className="text-sm text-muted-foreground">
            Memorize the sequence — <span className="font-semibold text-foreground tabular-nums">{secondsLeft}s</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-[340px]">
            {(question.sequence ?? []).map((item, i) => (
              <div key={i} className="flex flex-col items-center">{renderItem(item, question.sequenceVariant)}</div>
            ))}
          </div>
          <div className="w-full max-w-[280px] h-1.5 rounded-full bg-primary/15 overflow-hidden">
            <motion.div className="h-full bg-primary" initial={{ width: '0%' }} animate={{ width: '100%' }}
              transition={{ duration: totalShowMs / 1000, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </div>
      ) : (
        <motion.div key="answer" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="w-full flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-foreground text-center">
            Which item was in the <span className="text-primary">{positionLabel}</span> position?
          </p>
          <div className="grid grid-cols-3 gap-2 w-full max-w-[300px]">
            {displayOptions.map(({ opt, originalIndex }) => (
              <button key={originalIndex} type="button"
                {...pointerSafeActivation(() => onAnswer(originalIndex))}
                style={touchFeedbackStyle(selectedOption === originalIndex ? 'rgb(239 246 255)' : 'hsl(var(--card))')}
                className={`aspect-square rounded-xl bg-card border shadow-sm flex items-center justify-center transition-all active:scale-[0.95] touch-no-hover ${
                  selectedOption === originalIndex ? 'border-primary border-2 shadow-md' : 'border-border/60'
                }`}>
                {renderOption(opt, question.sequenceVariant)}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MemorySequencePlayer;