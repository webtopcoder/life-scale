import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFunnel } from '@/context/FunnelContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStrongestCategory, getSecondaryCategory, scoreToPercentile } from '@/engine/scoringEngine';
import { Lock, ArrowRight, Brain, Target, Lightbulb, BookOpen, TrendingUp, Briefcase, Cpu, Sprout, Eye, Clock } from 'lucide-react';
import SocialProofToast from '@/components/SocialProofToast';

const REPORT_SECTIONS = [
  { icon: Brain, label: 'Logic Profile' },
  { icon: Target, label: 'Pattern Recognition' },
  { icon: Briefcase, label: 'Career Profile' },
  { icon: Cpu, label: 'Spatial Reasoning' },
  { icon: BookOpen, label: 'Learning Style' },
  { icon: Lightbulb, label: 'Decision Style' },
  { icon: TrendingUp, label: 'Memory Profile' },
  { icon: Sprout, label: 'Growth Suggestions' },
];

const useAnimatedNumber = (target: number, duration = 1500) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return current;
};

const useFakeViewers = () => {
  const [count, setCount] = useState(Math.floor(Math.random() * 200) + 1400);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const delta = Math.floor(Math.random() * 30) - 12;
        return Math.max(1200, Math.min(1800, prev + delta));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return count;
};

const BellCurve = ({ percentile }: { percentile: number }) => {
  const position = Math.min(percentile / 100 + 0.07, 0.95);

  return (
    <div className="relative w-full h-24 mt-2">
      <svg viewBox="0 0 200 72" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Bell curve */}
        <path
          d="M 2 55 C 15 55 30 54 45 50 C 60 46 70 38 78 28 C 84 20 88 12 92 8 C 95 5 97 3.5 100 3 C 103 3.5 105 5 108 8 C 112 12 116 20 122 28 C 130 38 140 46 155 50 C 170 54 185 55 198 55"
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.3)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 2 55 C 15 55 30 54 45 50 C 60 46 70 38 78 28 C 84 20 88 12 92 8 C 95 5 97 3.5 100 3 C 103 3.5 105 5 108 8 C 112 12 116 20 122 28 C 130 38 140 46 155 50 C 170 54 185 55 198 55 L 2 55 Z"
          fill="hsl(var(--primary) / 0.08)"
        />
        {/* User position marker */}
        <motion.line
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          x1={Math.min(10 + position * 180, 185)}
          y1="0"
          x2={Math.min(10 + position * 180, 185)}
          y2="55"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />
        <motion.text
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.4 }}
          x={Math.min(10 + position * 180, 185)}
          y="66"
          textAnchor="middle"
          className="fill-primary text-[7px] font-bold"
        >
          You're here ✨
        </motion.text>
      </svg>
    </div>
  );
};

const ResultsPreviewPage = () => {
  const { state, goToStage } = useFunnel();

  const strongest = getStrongestCategory(state.scores);
  const secondary = getSecondaryCategory(state.scores);
  const percentile = state.finalScore ? scoreToPercentile(state.finalScore) : 0;
  const ranking = Math.max(percentile, 93).toFixed(0);

  const scoreLow = state.finalScore ? state.finalScore - 8 : 92;
  const scoreHigh = state.finalScore ? state.finalScore + 8 : 108;
  const animatedLow = useAnimatedNumber(scoreLow, 1800);
  const animatedHigh = useAnimatedNumber(scoreHigh, 2000);
  const viewers = useFakeViewers();

  const [reserveMin, setReserveMin] = useState(9);
  const [reserveSec, setReserveSec] = useState(59);

  useEffect(() => {
    const interval = setInterval(() => {
      setReserveSec(prev => {
        if (prev <= 0) {
          setReserveMin(m => Math.max(0, m - 1));
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <SocialProofToast />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Exciting Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">
              You scored higher than most
            </h2>
             <p className="text-primary font-bold text-lg mt-1">
               Better than {ranking}% of all test takers
             </p>
          </motion.div>
        </div>

        {/* Animated Score Card */}
        <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
          <div className="h-2 w-full" style={{ background: 'var(--gradient-primary)' }} />
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="text-5xl font-extrabold text-primary"
              >
                {animatedLow}–{animatedHigh}
              </motion.div>
              <div className="text-sm text-muted-foreground mt-1">Estimated IQ Range</div>
            </div>

            {/* Bell Curve */}
            <BellCurve percentile={percentile} />

            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="font-bold text-foreground capitalize">{strongest}</div>
                <div className="text-xs text-muted-foreground">Top Strength</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="font-bold text-foreground capitalize">{secondary}</div>
                <div className="text-xs text-muted-foreground">Secondary</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Countdown */}
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-foreground font-medium">Results reserved for</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">{reserveMin}:{reserveSec.toString().padStart(2, '0')}</span>
          </div>
          <div className="w-full h-1.5 bg-amber-200/50 dark:bg-amber-900/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${((reserveMin * 60 + reserveSec) / 600) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Live viewers */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5 animate-pulse" />
          <span><span className="font-semibold text-foreground">{viewers} people</span> are viewing their results right now</span>
        </div>

        {/* Report Sections - 3 visible, 5 blurred */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Full Report Includes:</h3>
          <div className="space-y-2">
            {REPORT_SECTIONS.map((section, i) => (
              <div key={i} className="relative">
                <div className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border ${i > 2 ? 'blur-[3px] select-none' : ''}`}>
                  <section.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{section.label}</span>
                  {i <= 2 && <span className="ml-auto text-xs text-accent font-medium">Preview available</span>}
                </div>
                {i > 2 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => goToStage('checkout')}
          className="w-full h-14 rounded-xl text-base font-semibold animate-pulse-glow"
        >
          Claim My Full Report <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

export default ResultsPreviewPage;
