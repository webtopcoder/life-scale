import { useEffect, useState } from 'react';
import { useFunnel } from '@/context/FunnelContext';
import { Badge } from '@/components/ui/badge';
import { waitForCriticalWarmup } from '@/engine/puzzleCache';
import IntroPageDev from './dev/IntroPageDev';
import AssessmentPageDev from './dev/AssessmentPageDev';
import ReinforcementPage from './ReinforcementPage';
import SocialProofPage from './SocialProofPage';
import CalculatingPage from './CalculatingPage';
import CheckoutPage from './CheckoutPage';

const OnboardingDevPage = () => {
  const { state, dispatch } = useFunnel();
  const [booted, setBooted] = useState(false);

  // Boot gate: trigger warmup BEFORE Intro renders, cap at 1.5s
  useEffect(() => {
    dispatch({ type: 'RESET' });
    waitForCriticalWarmup(1500).then(() => setBooted(true));
  }, []);

  if (!booted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary/60" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Badge
        variant="destructive"
        className="fixed top-2 right-2 z-[9999] text-xs font-bold tracking-wider"
      >
        DEV MODE
      </Badge>

      {(() => {
        switch (state.funnelStage) {
          case 'assessment':
            return <AssessmentPageDev />;
          case 'reinforcement':
            return <ReinforcementPage />;
          case 'social-proof':
            return <SocialProofPage />;
          case 'calculating':
            return <CalculatingPage />;
          case 'email':
            return <CheckoutPage />;
          case 'checkout':
            return <CheckoutPage />;
          case 'intro':
          default:
            return <IntroPageDev />;
        }
      })()}
    </div>
  );
};

export default OnboardingDevPage;
