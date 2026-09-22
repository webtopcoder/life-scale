import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { useLocation } from 'react-router-dom';
import { useFunnel } from '@/context/FunnelContext';
import { Card, CardContent } from '@/components/ui/card';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { identifyTikTokUser, tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { identifyKlaviyoEmail, syncKlaviyoQuizLeadInBackground } from '@/lib/klaviyoSync';
import { getKlaviyoFunnelForFlowId } from '@/services/klaviyoClient';
import { getStoredSessionId } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStrongestCategory, scoreToPercentile } from '@/engine/scoringEngine';
import { Brain, ArrowRight, Eye, Clock, Target, Briefcase, Lightbulb, BookOpen, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

const PARTICLE_COUNT = 18;

const FloatingParticles = () => {
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 4 + 2, duration: Math.random() * 8 + 6, delay: Math.random() * 4,
    })), []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full bg-primary/10"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -30, 10, -20, 0], x: [0, 15, -10, 5, 0], opacity: [0.2, 0.6, 0.3, 0.5, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

const useAnimatedNumber = (target: number, duration = 1500, delay = 0) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return current;
};

const useFakeViewers = () => {
  const [count, setCount] = useState(Math.floor(Math.random() * 200) + 1400);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => Math.max(1200, Math.min(1800, prev + Math.floor(Math.random() * 30) - 12)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return count;
};

const NAMES_AND_CITIES = [
  'Sarah from London', 'James from New York', 'Aisha from Dubai', 'Liam from Sydney',
  'Priya from Mumbai', 'Carlos from Madrid', 'Emma from Toronto', 'Noah from Berlin',
  'Yuki from Tokyo', 'Olivia from Paris', 'Mateo from São Paulo', 'Fatima from Cairo',
  'Lucas from Amsterdam', 'Mia from Stockholm', 'Chen from Singapore',
];

const useSocialMessages = () => {
  const [messages, setMessages] = useState<string[]>([]);
  useEffect(() => {
    const gen = () => {
      const person = NAMES_AND_CITIES[Math.floor(Math.random() * NAMES_AND_CITIES.length)];
      return [
        `${200 + Math.floor(Math.random() * 110)} people unlocked their results in the last hour`,
        `${(16800 + Math.floor(Math.random() * 600)).toLocaleString()} reports generated today`,
        `${person} just unlocked their profile`,
        `${91 + Math.floor(Math.random() * 6)}% of users found their results accurate`,
      ];
    };
    setMessages(gen());
    const interval = setInterval(() => setMessages(gen()), 14000);
    return () => clearInterval(interval);
  }, []);
  return messages;
};

const BLURRED_SECTIONS = [
  { icon: Brain, label: 'Your full brain breakdown' },
  { icon: Target, label: 'What your brain does best' },
  { icon: Briefcase, label: 'Careers that fit you' },
  { icon: Cpu, label: 'How you see the world' },
  { icon: BookOpen, label: 'How you learn fastest' },
  { icon: Lightbulb, label: 'How you make decisions' },
];

const YouMarker = ({ x, color = 'hsl(var(--primary))', glow = 'hsl(var(--primary) / 0.5)' }: { x: number; color?: string; glow?: string }) => (
  <>
    <motion.line initial={{ opacity: 0, y1: 60, y2: 60 }} animate={{ opacity: 1, y1: 0, y2: 60 }} transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }} x1={x} x2={x} stroke={color} strokeWidth="2" />
    <motion.circle initial={{ opacity: 0, r: 0 }} animate={{ opacity: 1, r: 3.5 }} transition={{ delay: 1.2, type: 'spring', stiffness: 300 }} cx={x} cy="60" fill={color} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />
    <motion.g initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.4 }}>
      <rect x={x - 14} y="-2" width="28" height="12" rx="4" fill={color} />
      <text x={x} y="7" textAnchor="middle" className="text-[6px] font-bold" fill="white">You</text>
    </motion.g>
  </>
);

const BellCurveTeaser = ({ percentile, isRvrTeaser = false }: { percentile: number; isRvrTeaser?: boolean }) => {
  const position = Math.max(0.72, Math.min(0.88, 0.72 + (percentile / 100) * 0.16));
  const markerX = Math.min(10 + position * 180, 185);
  const climbMidX = 78;
  return (
    <div className="relative w-full">
      <div className={cn('h-24 px-2', isRvrTeaser && 'blur-sm pointer-events-none select-none')}>
        <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" /></linearGradient>
            <linearGradient id="bellStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" /><stop offset="30%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.35" /><stop offset="70%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.35" /><stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" /></linearGradient>
          </defs>
          <path d="M 2 60 C 15 60 30 59 45 55 C 60 50 70 42 78 32 C 84 24 88 16 92 11 C 95 7 97 5 100 4.5 C 103 5 105 7 108 11 C 112 16 116 24 122 32 C 130 42 140 50 155 55 C 170 59 185 60 198 60 L 198 60 L 2 60 Z" fill="url(#bellFill)" />
          <path d="M 2 60 C 15 60 30 59 45 55 C 60 50 70 42 78 32 C 84 24 88 16 92 11 C 95 7 97 5 100 4.5 C 103 5 105 7 108 11 C 112 16 116 24 122 32 C 130 42 140 50 155 55 C 170 59 185 60 198 60" fill="none" stroke="url(#bellStroke)" strokeWidth="2" strokeLinecap="round" />
          <clipPath id="leftClip"><rect x="0" y="0" width={markerX} height="80" /></clipPath>
          <path d="M 2 60 C 15 60 30 59 45 55 C 60 50 70 42 78 32 C 84 24 88 16 92 11 C 95 7 97 5 100 4.5 C 103 5 105 7 108 11 C 112 16 116 24 122 32 C 130 42 140 50 155 55 C 170 59 185 60 198 60 L 198 60 L 2 60 Z" fill="hsl(var(--primary) / 0.08)" clipPath="url(#leftClip)" />
          <line x1="2" y1="60" x2="198" y2="60" stroke="hsl(var(--border))" strokeWidth="1" />
          <text x="10" y="72" className="fill-muted-foreground text-[5px]">Low</text>
          <text x="94" y="72" className="fill-muted-foreground text-[5px]">Average</text>
          <text x="180" y="72" className="fill-muted-foreground text-[5px]">High</text>
          {isRvrTeaser && <YouMarker x={climbMidX} color="hsl(25 95% 53%)" glow="hsl(25 95% 53% / 0.5)" />}
          <YouMarker x={markerX} />
        </svg>
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-0.5">Full breakdown in your report</p>
    </div>
  );
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };

export type EmailCaptureViewProps = {
  /** Skip SET_STAGE checkout — user is already on checkout */
  embeddedInCheckout?: boolean;
};

export function EmailCaptureView({ embeddedInCheckout = false }: EmailCaptureViewProps) {
  const posthog = usePostHog();
  const location = useLocation();
  const { state, dispatch } = useFunnel();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [socialIndex, setSocialIndex] = useState(0);
  const socialMessages = useSocialMessages();
  const isRvrTeaser = location.pathname === '/onboarding-rvr';

  const strongest = getStrongestCategory(state.scores);
  const percentile = state.finalScore ? scoreToPercentile(state.finalScore) : 0;
  const ranking = Math.max(percentile, 93).toFixed(0);

  const rawLow = state.finalScore ? state.finalScore - 14 : 96;
  const rawHigh = state.finalScore ? state.finalScore + 14 : 124;
  const scoreLow = Math.max(rawLow, 96);
  const scoreHigh = Math.max(rawHigh, 124);
  const animatedLow = useAnimatedNumber(scoreLow, 1800, 300);
  const animatedHigh = useAnimatedNumber(scoreHigh, 2000, 300);
  const viewers = useFakeViewers();

  const [reserveMin, setReserveMin] = useState(9);
  const [reserveSec, setReserveSec] = useState(59);

  useEffect(() => {
    const interval = setInterval(() => {
      setReserveSec(prev => { if (prev <= 0) { setReserveMin(m => Math.max(0, m - 1)); return 59; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { setSocialIndex(prev => (prev + 1) % (socialMessages.length || 1)); }, 3500);
    return () => clearInterval(interval);
  }, [socialMessages.length]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = () => {
    if (isSubmitting) return;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();

    const klaviyoFunnel = getKlaviyoFunnelForFlowId(state.flowId);

    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'email_capture' });
    trackFacebookPixelEvent('CompleteRegistration', {
      page: 'email_capture',
    });
    void (async () => {
      await identifyTikTokUser({
        email: trimmedEmail,
        externalId: getStoredSessionId() ?? undefined,
      });
      trackTikTokEvent('CompleteRegistration', tikTokContentPayload());
    })();
    identifyKlaviyoEmail(trimmedEmail, { funnel: klaviyoFunnel });

    dispatch({ type: 'SET_EMAIL', email: trimmedEmail });
    if (!embeddedInCheckout) {
      dispatch({ type: 'SET_STAGE', stage: 'checkout' });
    }

    syncKlaviyoQuizLeadInBackground({
      email: trimmedEmail,
      finalScore: state.finalScore,
      scores: state.scores,
      strongestCategory: strongest,
      funnel: klaviyoFunnel,
      logPrefix: '[EmailCaptureView]',
    });
  };

  return (
    <div
      className={cn(
        'bg-background relative px-4 py-8 w-full',
        embeddedInCheckout
          ? 'min-h-full'
          : 'min-h-screen flex items-center justify-center overflow-hidden',
      )}
    >
      <FloatingParticles />
      <motion.div variants={stagger} initial="hidden" animate="visible" className={cn('max-w-md w-full space-y-5 relative z-10', embeddedInCheckout && 'mx-auto')}>
        <motion.div variants={fadeUp} className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">Estimated IQ Range</p>
          <p className="text-[hsl(220,70%,25%)] font-semibold text-base">Faster than {ranking}% of all test takers</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-[var(--shadow-soft)] overflow-hidden">
            <CardContent className="p-4 pb-2"><BellCurveTeaser percentile={percentile} isRvrTeaser={isRvrTeaser} /></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-foreground font-medium">Results expire in</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">{reserveMin}:{reserveSec.toString().padStart(2, '0')}</span>
            </div>
            <div className="w-full h-1.5 bg-amber-200/50 dark:bg-amber-900/30 rounded-full overflow-hidden">
              <motion.div className="h-full bg-amber-500 rounded-full" initial={{ width: '100%' }} animate={{ width: `${((reserveMin * 60 + reserveSec) / 600) * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5 animate-pulse" />
            <span><span className="font-semibold text-foreground">{viewers.toLocaleString()} people</span> are viewing their results right now</span>
          </div>
          <div className="h-5 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p key={socialIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-xs text-muted-foreground/70 text-center">
                {socialMessages[socialIndex % (socialMessages.length || 1)]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-foreground">Unlock Your Full Report</h2>
                <p className="text-xs text-muted-foreground">Enter your email to see your full brain report</p>
              </div>
              <div className="relative">
                <Input type="email" placeholder="your@email.com" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="h-13 rounded-xl text-base pl-4 pr-4 border-2 border-input focus:border-primary transition-colors" />
              </div>
              {error && <p className="text-destructive text-xs">{error}</p>}
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                animate={{ boxShadow: ['0 4px 12px hsl(var(--cta) / 0.15)', '0 8px 28px hsl(var(--cta) / 0.35)', '0 4px 12px hsl(var(--cta) / 0.15)'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-xl"
              >
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-xl text-base font-semibold relative overflow-hidden group bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-white disabled:opacity-70 disabled:pointer-events-none"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    Reveal My IQ Score
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </span>
                </Button>
              </motion.div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-secondary/50 rounded-xl p-2.5">
                  <div className="text-sm font-bold text-foreground">
                    {(() => { const t = state.timer.completionTime ?? state.timer.elapsedTime; return t ? `${Math.floor(t / 60000)}:${((t % 60000) / 1000).toFixed(0).padStart(2, '0')}` : '—'; })()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Time</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-2.5">
                  <div className="text-sm font-bold text-foreground capitalize blur-sm">{strongest}</div>
                  <div className="text-[10px] text-muted-foreground">Top Skill</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-2.5">
                  <div className="text-sm font-bold text-primary">{ranking}%</div>
                  <div className="text-[10px] text-muted-foreground">Faster Than</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider">What you'll unlock</h3>
          <div className="grid grid-cols-2 gap-2">
            {BLURRED_SECTIONS.map((section, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border select-none h-full min-h-[48px]">
                  <section.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground leading-tight">{section.label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center">
          <p className="text-xs text-muted-foreground">Your top strength: <span className="font-semibold text-primary capitalize blur-sm">{strongest}</span> — details inside your report</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
