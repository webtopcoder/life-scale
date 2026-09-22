import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const STEPS = [
  'Reviewing your responses',
  'Mapping cognitive patterns',
  'Comparing across frameworks',
  'Building your profile',
];

const DURATION_MS = 6000;

export const HgCalculation = ({ onComplete }: Props) => {
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(p);
      setCompletedSteps(Math.min(STEPS.length, Math.floor((p / 100) * STEPS.length)));
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => onCompleteRef.current(), 400);
      }
    }, 60);
    return () => clearInterval(id);
  }, []);

  // Ring geometry
  const size = 200;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4 text-center">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl sm:text-3xl font-bold mb-2 text-primary"
      >
        Preparing your results
      </motion.h2>
      <p className="text-muted-foreground mb-8">This will take a moment.</p>

      <div className="relative flex items-center justify-center mb-10" style={{ height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary">{Math.round(progress)}%</span>
        </div>
      </div>

      <ul className="text-left space-y-3 max-w-sm mx-auto">
        {STEPS.map((step, i) => {
          const done = i < completedSteps;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 text-base transition-colors ${done ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  done ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />}
              </span>
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
