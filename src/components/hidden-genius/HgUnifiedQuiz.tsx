import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HgQuizItem, HgResponse } from '@/data/hiddenGeniusQuiz';
import { HgEncouragementInterstitial } from './HgEncouragementInterstitial';

// Preload inkblot images from the isolated hidden-genius folder.
const inkblotImages = import.meta.glob('/src/assets/hidden-genius/inkblots/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const getInkblotImage = (name: string): string | undefined => {
  const key = Object.keys(inkblotImages).find(k => k.includes(`${name}.webp`));
  return key ? inkblotImages[key] : undefined;
};

// Warm the browser cache with all inkblots on first mount so every question is instant.
let inkblotsWarmed = false;
const warmInkblots = () => {
  if (inkblotsWarmed || typeof window === 'undefined') return;
  inkblotsWarmed = true;
  Object.values(inkblotImages).forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

interface Props {
  items: HgQuizItem[];
  responses: HgResponse[];
  onAnswer: (r: HgResponse) => void;
  onComplete: () => void;
  startOffset?: number;
  totalQuestions?: number;
  onBack?: () => void;
  allItems?: HgQuizItem[];
}

const CHECKPOINTS = [13, 25, 35];

// Neutral, Life Scale-toned interstitials. No baity claims.
const CHECKPOINT_CONTENT: Record<number, { eyebrow: string; stat: string; message: string }> = {
  13: {
    eyebrow: 'Progress',
    stat: '⅓',
    message: "You've finished the first section. Keep going — momentum matters.",
  },
  25: {
    eyebrow: 'Progress',
    stat: '⅔',
    message: 'Great pace. Your responses are shaping a clearer picture.',
  },
  35: {
    eyebrow: 'Almost done',
    stat: '90%',
    message: 'A few more to go before we build your results.',
  },
};

// Light-to-deep Life Scale blue for the 5-point Likert.
const LIKERT_CLASSES = [
  'bg-primary/10 text-primary border-primary/25 hover:bg-primary/15',
  'bg-primary/20 text-primary border-primary/35 hover:bg-primary/25',
  'bg-primary/40 text-primary-foreground border-primary/50 hover:bg-primary/50',
  'bg-primary/70 text-primary-foreground border-primary/80 hover:bg-primary/80',
  'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
];

const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
const FREQUENCY_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

export const HgUnifiedQuiz = ({ items, responses, onAnswer, onComplete, startOffset = 0, totalQuestions, onBack, allItems }: Props) => {
  const [index, setIndex] = useState(0);
  const [showCheckpoint, setShowCheckpoint] = useState<number | null>(null);

  const total = totalQuestions ?? items.length;
  const absoluteNumber = startOffset + index + 1;
  const item = items[index];
  const progress = (absoluteNumber / total) * 100;

  // Derive skipped question numbers from the shared responses list.
  const answeredIds = new Set(responses.map(r => r.questionId));
  const skippedAbsoluteNumbers: number[] = [];
  for (let abs = 1; abs < absoluteNumber; abs++) {
    const q = allItems ? allItems[abs - 1] : items[abs - 1 - startOffset];
    if (q && !answeredIds.has(q.id)) skippedAbsoluteNumbers.push(abs);
  }

  useEffect(() => {
    warmInkblots();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index, showCheckpoint]);

  const handleValue = (value: number) => {
    onAnswer({ questionId: item.id, module: 'quiz', value });
    advance();
  };

  const advance = () => {
    if (CHECKPOINTS.includes(absoluteNumber)) {
      setShowCheckpoint(absoluteNumber);
      return;
    }
    if (index + 1 >= items.length) {
      onComplete();
    } else {
      setIndex(index + 1);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      setIndex(index - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const dismissCheckpoint = () => {
    setShowCheckpoint(null);
    if (index + 1 >= items.length) {
      onComplete();
    } else {
      setIndex(index + 1);
    }
  };

  if (showCheckpoint !== null) {
    const c = CHECKPOINT_CONTENT[showCheckpoint];
    return <HgEncouragementInterstitial eyebrow={c.eyebrow} stat={c.stat} message={c.message} onContinue={dismissCheckpoint} />;
  }

  if (!item) return null;

  const canGoBack = index > 0 || !!onBack;

  return (
    <div className="flex h-full min-h-0 flex-col -mx-4 bg-background">
      {/* Slim progress bar under the header */}
      <div className="shrink-0">
        <div className="relative h-[5px] bg-border overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: 'hsl(218, 90%, 26%)' }}
          />
          {skippedAbsoluteNumbers.map((n) => {
            const pos = ((n - 0.5) / total) * 100;
            return (
              <div
                key={n}
                className="absolute top-0 w-[3px] h-full bg-warning"
                style={{ left: `${pos}%` }}
                title={`Question ${n} skipped`}
              />
            );
          })}
        </div>
      </div>

      {/* Question body */}
      <div className="flex-1 min-h-0 w-full max-w-2xl mx-auto py-6 px-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 leading-snug">
              {item.text}
            </h2>

            {item.type === 'scale' && (
              <div className="space-y-2">
                {LIKERT_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => handleValue(i + 1)}
                    className={`w-full py-4 px-5 rounded-xl border text-left text-base font-medium transition-all active:scale-[0.99] ${LIKERT_CLASSES[i]}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {item.type === 'frequency' && (
              <div className="space-y-2">
                {FREQUENCY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => handleValue(i + 1)}
                    className={`w-full py-4 px-5 rounded-xl border text-left text-base font-medium transition-all active:scale-[0.99] ${LIKERT_CLASSES[i]}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {item.type === 'inkblot' && (
              <div>
                <div className="mb-6 flex justify-center">
                  <img
                    src={getInkblotImage(item.image)}
                    alt="Inkblot"
                    className="max-w-full max-h-80 object-contain"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {item.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleValue(opt.value)}
                      className="py-4 px-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-base font-medium transition-all active:scale-[0.98]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(item.type === 'identity-choice' || item.type === 'scenario' || item.type === 'forced-choice') && (
              <div className="space-y-2">
                {item.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleValue(opt.value)}
                    className="w-full py-4 px-5 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-left text-base font-medium transition-all active:scale-[0.99]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky footer: back + counter + skip */}
      <div className="shrink-0 bg-card/90 backdrop-blur-sm border-t border-border/60 px-4 py-1.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={!canGoBack}
            className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{absoluteNumber}</span> of <span className="text-foreground">{total}</span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={advance}
            className="h-8 w-8 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
