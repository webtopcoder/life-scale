import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFunnel888Tt } from '@/context/Funnel888TtContext';

export default function MemoryIntro888Tt() {
  const { state, dispatch } = useFunnel888Tt();
  const seconds = Math.floor(state.timer.elapsedTime / 1000);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <div className="h-[100dvh] bg-background flex flex-col [--primary:216_100%_47%] [--cta:175_79%_29%]">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-foreground">IQ Scale</span>
        <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm font-semibold tabular-nums"><Clock className="h-4 w-4" />{time}</span>
      </header>
      <div className="h-1 bg-secondary"><div className="h-full w-[2.5%] bg-[hsl(var(--cta))]" /></div>
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 px-4 pt-11 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Memorize this word</h1>
        <div className="mx-auto mt-12 max-w-sm rounded-xl border border-border bg-card py-7 text-4xl font-semibold text-foreground">Insight</div>
        <p className="mt-3 text-sm text-muted-foreground">You will be asked about it during the quiz</p>
      </motion.main>
      <div className="border-t border-border p-4"><Button onClick={() => dispatch({ type: 'SET_MEMORY_INTRO_COMPLETE', complete: true })} className="touch-no-hover h-14 w-full rounded-xl bg-[hsl(var(--cta))] text-base font-bold text-primary-foreground">Continue</Button></div>
    </div>
  );
}