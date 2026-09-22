import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { get888SessionId, useFunnel888 } from '@/context/Funnel888Context';
import { Card, CardContent } from '@/components/ui/card';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { identifyTikTokUser, tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { identifyKlaviyoEmail, syncKlaviyoQuizLeadInBackground } from '@/lib/klaviyoSync';
import { getKlaviyoFunnelForFlowId } from '@/services/klaviyoClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStrongestCategory, scoreToPercentile } from '@/engine/scoringEngine';
import { Clock } from 'lucide-react';
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

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };

export type EmailCaptureView888Props = {
  /** Skip SET_STAGE checkout — user is already on checkout */
  embeddedInCheckout?: boolean;
};

/**
 * Onboarding-888-only email capture screen. Its presentation can evolve
 * without changing any other funnel.
 */
export function EmailCaptureView888({ embeddedInCheckout = false }: EmailCaptureView888Props) {
  const { state, dispatch } = useFunnel888();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const strongest = getStrongestCategory(state.scores);
  const percentile = state.finalScore ? scoreToPercentile(state.finalScore) : 0;
  const ranking = Math.min(percentile, 91).toFixed(0);
  const scoredAnswers = state.answers.filter(answer => answer.isCorrect !== null);
  const accuracy = scoredAnswers.length
    ? Math.round((scoredAnswers.filter(answer => answer.isCorrect).length / scoredAnswers.length) * 100)
    : 0;

  const [reserveMin, setReserveMin] = useState(9);
  const [reserveSec, setReserveSec] = useState(59);

  useEffect(() => {
    const interval = setInterval(() => {
      setReserveSec(prev => { if (prev <= 0) { setReserveMin(m => Math.max(0, m - 1)); return 59; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleContinue = () => {
    if (isSubmitting) return;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();

    const klaviyoFunnel = getKlaviyoFunnelForFlowId(state.flowId);

    trackEvent(undefined, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'email_capture' });
    trackFacebookPixelEvent('CompleteRegistration', {
      page: 'email_capture',
    });
    void (async () => {
      await identifyTikTokUser({
        email: trimmedEmail,
        externalId: get888SessionId(),
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
      logPrefix: '[EmailCaptureView888]',
    });
  };

  return (
    <div
      className={cn(
        'bg-background relative px-4 py-8 w-full [--cta:175_79%_29%] [--cta-hover:175_79%_25%]',
        embeddedInCheckout
          ? 'min-h-full'
          : 'min-h-screen flex items-center justify-center overflow-hidden',
      )}
    >
      <FloatingParticles />
      <motion.div variants={stagger} initial="hidden" animate="visible" className={cn('max-w-md w-full space-y-5 relative z-10', embeddedInCheckout && 'mx-auto')}>
        <motion.div variants={fadeUp} className="text-center space-y-1">
          <p className="text-[hsl(220,70%,25%)] font-semibold text-base">Your IQ Analysis Is Ready</p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-foreground whitespace-pre-line">Where Should We Send{"\n"}<span className="text-primary">Your IQ Certificate</span>?</h2>
                <p className="text-sm text-muted-foreground">Enter your email to unlock your complete IQ analysis and personalized cognitive profile.</p>
              </div>
              <div className="relative">
                <Input type="email" placeholder="Email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="h-13 rounded-xl text-base pl-4 pr-4 border-2 border-input focus:border-primary transition-colors" />
              </div>
              {error && <p className="text-destructive text-xs">{error}</p>}
              <motion.div
                whileHover={isEmailValid ? { scale: 1.02, y: -1 } : undefined}
                whileTap={isEmailValid ? { scale: 0.97 } : undefined}
                animate={isEmailValid ? { boxShadow: ['0 4px 12px hsl(var(--cta) / 0.15)', '0 8px 28px hsl(var(--cta) / 0.35)', '0 4px 12px hsl(var(--cta) / 0.15)'] } : { boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                transition={{ duration: 2.5, repeat: isEmailValid ? Infinity : 0, ease: 'easeInOut' }}
                className="rounded-xl"
              >
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={isSubmitting || !isEmailValid}
                  className="w-full h-14 rounded-xl text-base font-semibold relative overflow-hidden group bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-white disabled:opacity-40 disabled:pointer-events-none transition-opacity"
                >
                  {isEmailValid && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    Continue
                  </span>
                </Button>
              </motion.div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-secondary/50 rounded-xl p-2.5">
                  <div className="text-sm font-bold text-foreground">
                    {(() => { const t = state.timer.completionTime ?? state.timer.elapsedTime; return t ? `${Math.floor(t / 60000)}:${((t % 60000) / 1000).toFixed(0).padStart(2, '0')}` : '—'; })()}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">TEST TIME</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-2.5">
                  <div className="select-none text-sm font-bold text-foreground blur-sm">{accuracy}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Accuracy</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-2.5">
                  <div className="text-sm font-bold text-foreground">{ranking}%</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Faster than</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-xs leading-relaxed text-muted-foreground">Life Scale ensures the confidentiality of your personal information. By clicking “Continue” you acknowledge our Terms &amp; Conditions and Privacy Policy.</motion.p>

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

      </motion.div>
    </div>
  );
}
