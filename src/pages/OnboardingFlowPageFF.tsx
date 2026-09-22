import { useEffect, useRef, useState } from 'react';
import { useFunnel } from '@/context/FunnelContext';
import { waitForCriticalWarmup } from '@/engine/puzzleCache';
import { FLOW_IDS, preloadQuestions } from '@/engine/datasetLoader';
import IntroPageFF from './IntroPageFF';
import AssessmentPageFF from './AssessmentPageFF';
import ReinforcementPageFF from './ReinforcementPageFF';
import SocialProofPageFF from './SocialProofPageFF';
import CalculatingPageFF from './CalculatingPageFF';
import { EmailCaptureView } from '@/components/EmailCaptureView';
import CheckoutPageFF from './CheckoutPageFF';
import { FFIntlProvider } from '@/i18n/ff';

const OnboardingFlowPageFF = () => {
  const { state, dispatch } = useFunnel();
  const [booted, setBooted] = useState(false);
  const prevStage = useRef(state.funnelStage);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    let alive = true;
    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_FLOW_ID', flowId: FLOW_IDS.FIXED_V1_FF });
    const boot = async () => {
      await preloadQuestions(FLOW_IDS.FIXED_V1_FF);
      await waitForCriticalWarmup(1500);
    };
    boot().finally(() => { if (alive) setBooted(true); });
    return () => { alive = false; };
  }, [dispatch]);

  useEffect(() => {
    if (prevStage.current !== state.funnelStage) {
      prevStage.current = state.funnelStage;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [state.funnelStage]);

  if (!booted) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary/60" /></div>;

  const screen = (() => {
    switch (state.funnelStage) {
      case 'assessment': return <AssessmentPageFF />;
      case 'reinforcement': return <ReinforcementPageFF />;
      case 'social-proof': return <SocialProofPageFF />;
      case 'calculating': return <CalculatingPageFF />;
      case 'email': return <EmailCaptureView />;
      case 'checkout': return state.email.trim() ? <CheckoutPageFF /> : <EmailCaptureView />;
      case 'intro':
      default: return <IntroPageFF />;
    }
  })();
  return (
    <FFIntlProvider>
      {screen}
    </FFIntlProvider>
  );
};

export default OnboardingFlowPageFF;
