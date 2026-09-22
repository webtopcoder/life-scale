import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePostHog } from '@/lib/posthog';
import { useFunnel } from '@/context/ShortIqFunnelContext';
import { Button } from '@/components/ui/button';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';
import iqBellCurve from '@/assets/iq-bell-curve-transparent.png';
import { getShortIqCopy } from '@/constants/shortIqCopy';

const IntroPage = () => {
  const posthog = usePostHog();
  const { dispatch } = useFunnel();
  const copy = getShortIqCopy();

  useEffect(() => {
    trackEvent(posthog, EVENTS.ONBOARDING_STARTED ?? 'onboarding_started', {});
    trackFacebookPixelEvent('ViewContent', { page: 'short_iq_intro' });
  }, [posthog]);

  const handleStart = () => {
    trackEvent(posthog, EVENTS.FUNNEL_STEP_COMPLETED ?? 'funnel_step_completed', { step: 'intro', action: 'start_test', flow: 'short-iq' });
    dispatch({ type: 'SET_GENDER', gender: 'unspecified' });
    dispatch({ type: 'START_TIMER' });
    dispatch({ type: 'SET_STAGE', stage: 'assessment' });
  };

  return (
    <div className="min-h-screen bg-[#F5FCFF] flex flex-col">
      <div className="flex-1 px-5 pt-8 pb-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-md flex flex-col items-center text-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-6 leading-tight">
            How High Is Your <span className="text-[#0088D1]">IQ</span>?
          </h1>
          <img src={iqBellCurve} alt={copy.intro.heroAlt}
            className="w-full max-w-xs h-auto object-contain mb-6" />
          <div className="text-base text-foreground mb-8 max-w-sm whitespace-pre-line">
            <p>{copy.intro.subtitle}</p>
          </div>
          <Button size="lg" type="button"
            data-testid="intro-start"
            {...pointerSafeActivation(handleStart)}
            style={touchFeedbackStyle('#0088D1')}
            className="w-full h-14 text-base font-semibold rounded-xl bg-[#0088D1] hover:bg-[#0088D1]/90 text-white transition-colors touch-no-hover">
            {copy.intro.cta}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroPage;