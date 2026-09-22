import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';
import { FLOW_IDS } from '@/engine/datasetLoader';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import DashboardBackLink from '@/components/funnel/DashboardBackLink';

const IntroPage = () => {
  const posthog = usePostHog();
  const { state, dispatch } = useFunnel();
  const [gender, setGender] = useState<string | null>(null);
  const isIqScale = state.flowId === FLOW_IDS.IQSCALE_V1;
  const isImportedRvr2 = state.flowId === FLOW_IDS.FIXED_V1_RVR2;

  useEffect(() => {
    trackEvent(posthog, EVENTS.ONBOARDING_STARTED, {});
    trackFacebookPixelEvent('ViewContent', {
      page: 'onboarding_intro',
    });
    trackTikTokEvent('ViewContent', tikTokContentPayload());
  }, []);

  const handleGenderSelect = (g: string) => {
    setGender(g);
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'intro', action: 'gender_selected', gender: g });
    dispatch({ type: 'SET_GENDER', gender: g });
    dispatch({ type: 'START_TIMER' });
    dispatch({ type: 'SET_STAGE', stage: 'assessment' });
  };

  const bullets = [
    '36 questions that get harder progressively',
    'Pick the correct answer from 6 options',
    'Skip any question and come back to it later',
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {isIqScale ? (
        <LifeScaleHeader left={<DashboardBackLink />} wordmark="IQ Scale" />
      ) : (
        <header className="sticky top-0 z-50 bg-white border-b border-border/60 px-4 py-3">
          <div className="text-left">
            <span className="text-lg font-bold tracking-tight text-foreground">
              {isImportedRvr2 ? 'IQ Scale' : <>True<span className="text-foreground">IQ</span></>}
            </span>
          </div>
        </header>
      )}

      <div className="flex-1 px-5 pt-3 pb-12 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="bg-card border border-border/50 rounded-2xl shadow-md p-6 sm:p-8 md:p-10 text-center space-y-8">

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-snug text-foreground">
                Ready to test your&nbsp;{isImportedRvr2 ? <span className="text-primary">IQ</span> : 'IQ'}?
              </h1>
            </div>

            <div className="space-y-4 text-left max-w-sm mx-auto">
              {bullets.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary/70 flex-shrink-0 mt-0.5" />
                  <span className="text-base text-foreground/80">{item}</span>
                </div>
              ))}
            </div>

            <div>
              {isIqScale ? (
                <div className="w-full max-w-md mx-auto">
                  <Button
                    size="lg"
                    type="button"
                    data-testid="intro-start"
                    {...pointerSafeActivation(() => handleGenderSelect('unspecified'))}
                    className="w-full h-12 md:h-14 text-base md:text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors touch-no-hover"
                  >
                    Start
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 justify-center w-full max-w-md mx-auto">
                  {['Male', 'Female'].map(g => (
                    <Button
                      key={g}
                      size="lg"
                      type="button"
                      data-testid={`intro-gender-${g.toLowerCase()}`}
                      {...pointerSafeActivation(() => handleGenderSelect(g.toLowerCase()))}
                      style={touchFeedbackStyle('hsl(var(--cta) / 0.85)')}
                      className="flex-1 h-12 md:h-14 text-base md:text-lg font-semibold rounded-xl bg-[hsl(var(--cta)/0.85)] hover:bg-[hsl(var(--cta))] text-white transition-colors touch-no-hover"
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              )}
              <div className="pt-8">
                <p className="text-xs text-muted-foreground">Today's highest IQ score: {(() => {
                  const today = new Date().toISOString().slice(0, 10);
                  const key = `highestIQ_${today}`;
                  const stored = localStorage.getItem(key);
                  const newVal = Math.floor(Math.random() * 15) + 143;
                  if (stored) {
                    const max = Math.max(parseInt(stored), newVal);
                    localStorage.setItem(key, String(max));
                    return max;
                  }
                  localStorage.setItem(key, String(newVal));
                  return newVal;
                })()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroPage;
