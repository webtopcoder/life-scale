import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFunnel } from '@/context/FunnelContext';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';
import { FFLanguageSelector, useFFIntl } from '@/i18n/ff';

const IntroPageFF = () => {
  const { dispatch } = useFunnel();
  const { t } = useFFIntl();
  const [gender, setGender] = useState<string | null>(null);
  const headline = t('HOW HIGH IS YOUR IQ?');
  const iqStart = headline.lastIndexOf('IQ');

  useEffect(() => {
    trackEvent(undefined, EVENTS.ONBOARDING_STARTED, {});
    trackFacebookPixelEvent('ViewContent', {
      page: 'onboarding_intro',
    });
    trackTikTokEvent('ViewContent', tikTokContentPayload());
  }, []);

  const handleGenderSelect = (g: string) => {
    setGender(g);
    trackEvent(undefined, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'intro', action: 'gender_selected', gender: g });
    dispatch({ type: 'SET_GENDER', gender: g });
    dispatch({ type: 'START_TIMER' });
    dispatch({ type: 'SET_STAGE', stage: 'assessment' });
  };

  const bullets = [
    t('27 questions that get harder as you go'),
    t('Pick the correct answer from 6 options'),
    t('Skip any question and come back to it later'),
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* IQ Scale Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-foreground">
            IQ Scale
          </span>
          <FFLanguageSelector />
        </div>
      </header>

      <div className="flex-1 px-5 pt-3 pb-12 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="bg-card border border-border/50 rounded-2xl shadow-md p-6 sm:p-8 md:p-10 text-center space-y-8">

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-snug">
                {iqStart >= 0 ? (
                  <>{headline.slice(0, iqStart)}<span className="text-primary/80">{headline.slice(iqStart)}</span></>
                ) : headline}
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
              <div className="flex gap-3 justify-center w-full max-w-md mx-auto">
                {['Male', 'Female'].map(g => (
                  <Button
                    key={g}
                    data-testid={`intro-gender-${g.toLowerCase()}`}
                    size="lg"
                    type="button"
                    {...pointerSafeActivation(() => handleGenderSelect(g.toLowerCase()))}
                    style={touchFeedbackStyle('hsl(var(--cta) / 0.85)')}
                    className="flex-1 h-12 md:h-14 text-base md:text-lg font-semibold rounded-xl bg-[hsl(var(--cta)/0.85)] hover:bg-[hsl(var(--cta))] text-white transition-colors touch-no-hover"
                  >
                    {t(g)}
                  </Button>
                ))}
              </div>
              <div className="pt-8">
                <p className="text-xs text-muted-foreground">{t("Today's highest IQ score: {score}", { score: (() => {
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
                })() })}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroPageFF;
