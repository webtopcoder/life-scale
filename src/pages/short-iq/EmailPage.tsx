import { useState, FormEvent } from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { usePostHog } from '@/lib/posthog';
import { useFunnel } from '@/context/ShortIqFunnelContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import testDurationIcon from '@/assets/test-duration.png';
import performanceLevelIcon from '@/assets/performance-level.png';
import keyStrengthIcon from '@/assets/key-strength.png';
import cognitiveProfileImg from '@/assets/cognitive-profile.jpg';
import { getShortIqCopy } from '@/constants/shortIqCopy';
import { getRiskIndicator, getStrongestCategory } from '@/engine/scoringEngine';
import { identifyKlaviyoEmail, syncKlaviyoQuizLeadInBackground } from '@/lib/klaviyoSync';

const emailSchema = z.string().trim().email({ message: 'Please enter a valid email' }).max(255);

const formatDuration = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
};

const EmailPage = () => {
  const posthog = usePostHog();
  const { state, dispatch } = useFunnel();
  const [email, setEmail] = useState(state.email || '');
  const [error, setError] = useState<string | null>(null);
  const copy = getShortIqCopy();
  const riskIndicator = getRiskIndicator(state.finalScore);
  const strongest = getStrongestCategory(state.scores);

  const duration = state.timer.completionTime ?? state.timer.elapsedTime;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    const trimmedEmail = parsed.data.trim().toLowerCase();
    identifyKlaviyoEmail(trimmedEmail, { funnel: 'v2' });
    dispatch({ type: 'SET_EMAIL', email: trimmedEmail });
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED ?? 'funnel_step_completed', { step: 'email' });
    trackFacebookPixelEvent('CompleteRegistration', {
      page: 'short_iq_email',
      flow: 'short-iq',
    });
    syncKlaviyoQuizLeadInBackground({
      email: trimmedEmail,
      finalScore: state.finalScore,
      scores: state.scores,
      strongestCategory: strongest,
      funnel: 'v2',
      logPrefix: '[ShortIqEmailPage]',
    });
    dispatch({ type: 'SET_STAGE', stage: 'checkout' });
  };

  return (
    <div className="min-h-screen bg-[#F5FCFF] flex flex-col">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-md mx-auto w-full space-y-6 px-5 pt-8 pb-10 flex-1">
        <h1 className="text-[28px] font-bold text-foreground text-center leading-tight">{copy.email.heading}</h1>
        <p className="text-[15px] text-foreground text-center leading-relaxed">{copy.email.subhead}</p>
        <form id="email-form" onSubmit={handleSubmit} className="space-y-2">
          <Input type="email" inputMode="email" autoComplete="email" placeholder="Your email"
            value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
            maxLength={255}
            className="h-14 rounded-2xl text-base px-5 border-border bg-card" />
          {error && <p className="text-sm text-destructive pl-1">{error}</p>}
          <Button type="submit"
            className="w-full h-14 rounded-2xl text-base font-semibold bg-[#0088D1] hover:bg-[#0088D1]/90 text-white mt-3">
            {copy.email.cta}
          </Button>
          <div className="space-y-3 pt-3">
            <div className="flex items-center gap-3">
              <img src={testDurationIcon} alt="" className="w-7 h-7 flex-shrink-0" />
              <p className="text-[15px] text-foreground flex items-center gap-2 flex-wrap">
                <span className="font-bold">Test Duration</span>
                <span>- {formatDuration(duration)}</span>
                <span className="inline-flex items-center bg-[#0088D1] text-white text-xs font-semibold px-2 py-0.5 rounded-full">Top Speed</span>
              </p>
            </div>
            {copy.email.rows.map((r, i) => {
              const isRisk = r.label === 'Risk Indicator';
              const value = isRisk ? riskIndicator : r.value;
              return (
                <div key={i} className="flex items-center gap-3">
                  <img src={i === 0 ? performanceLevelIcon : keyStrengthIcon} alt="" className="w-7 h-7 flex-shrink-0" />
                  <p className="text-[15px] text-foreground flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{r.label}</span>
                    <span>- {value}</span>
                    {isRisk && (
                      <span aria-label="Warning" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600">
                        <AlertTriangle className="w-3 h-3 text-white" strokeWidth={2.5} />
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mt-4">
            <img src={cognitiveProfileImg} alt="Your Cognitive Profile" className="w-full h-auto block" />
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EmailPage;