import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFunnel888 } from '@/context/Funnel888Context';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { pointerSafeActivation, touchFeedbackStyle } from '@/lib/inputShield';

const IntroPage888 = () => {
  const { dispatch } = useFunnel888();
  const [gender, setGender] = useState<string | null>(null);

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
    'You will get 40 questions with growing difficulty',
    'Select the right answer out of the 6 options',
    'Every answer counts toward your final IQ score',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary flex flex-col [--primary:216_100%_47%] [--cta:175_79%_29%] [--cta-hover:175_79%_25%]">
      {/* IQ Scale Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border/60 px-4 py-4">
        <div className="text-left">
          <span className="text-xl font-bold text-foreground">
            IQ Scale
          </span>
        </div>
      </header>

      <div className="flex-1 px-4 pt-8 pb-12 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
           className="w-full max-w-sm"
        >
          <div className="text-center space-y-8">

            <div className="space-y-2">
              <h1 className="-ml-4 w-[calc(100%+2rem)] font-sans text-2xl font-semibold text-foreground leading-[1.08]">
                <span className="block">Get ready to start the</span>
                <span className="block text-primary">IQ test!</span>
              </h1>
            </div>

            <div className="space-y-4 text-left max-w-sm mx-auto">
              {bullets.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                   <Check className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                   <span className="text-lg text-foreground/80 text-left leading-relaxed">{item}</span>
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
                    className="flex-1 h-12 text-base font-semibold rounded-xl bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-primary-foreground transition-colors touch-no-hover"
                  >
                    {g}
                  </Button>
                ))}
              </div>
              <div className="pt-8">
                 <p className="text-sm text-muted-foreground">Today's average IQ score: 128</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroPage888;
