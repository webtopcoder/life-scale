import { useEffect, useState } from 'react';

export function CheckoutTimerBar() {
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-3 text-sm">
        <span className="font-bold text-primary text-base">IQ Score Report</span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Offer ends in</span>
          <span className="font-mono font-bold text-base text-foreground">
            {timerMin}:{timerSec.toString().padStart(2, '0')}
          </span>
        </span>
      </div>
    </div>
  );
}

