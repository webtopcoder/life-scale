import { useEffect, useState } from 'react';

export function CheckoutTimerBar888Tt() {
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
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="flex items-center justify-center gap-1 text-sm">
        <span className="font-bold text-primary">IQ Score only $1.00!</span>
        <span className="text-foreground">Offer ends in</span>
        <span className="flex items-center">
          <span className="font-mono font-bold text-foreground">
            {timerMin}:{timerSec.toString().padStart(2, '0')}
          </span>
        </span>
      </div>
    </div>
  );
}

