import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PlanSelectionTimerBarProps {
  onContinue?: () => void;
}

export function PlanSelectionTimerBar({ onContinue }: PlanSelectionTimerBarProps = {}) {
  const [timerMin, setTimerMin] = useState(9);
  const [timerSec, setTimerSec] = useState(59);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 0) {
          setTimerMin((m) => Math.max(0, m - 1));
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border-b border-border py-2.5 px-4">
      <div className="max-w-xl mx-auto flex flex-row items-center justify-between gap-3">
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-muted-foreground">50% discount reserved for:</span>
          <span className="font-mono font-bold text-lg text-foreground">
            {timerMin}:{timerSec.toString().padStart(2, '0')}
          </span>
        </div>
        <Button
          onClick={onContinue}
          className="rounded-full px-6 font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 animate-soft-pulse-ring"
        >
          CONTINUE
        </Button>
      </div>
    </div>
  );
}
