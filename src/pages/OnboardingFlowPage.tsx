import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFunnel } from '@/context/FunnelContext';
import { waitForCriticalWarmup } from '@/engine/puzzleCache';
import { preloadQuestions } from '@/engine/datasetLoader';
import IntroPage from './IntroPage';
import AssessmentPage from './AssessmentPage';
import ReinforcementPage from './ReinforcementPage';
import SocialProofPage from './SocialProofPage';
import CalculatingPage from './CalculatingPage';
import { EmailCaptureViewV2 } from '@/components/EmailCaptureViewV2';
import CheckoutPage from './CheckoutPage';
import CheckoutPageRVR2 from './CheckoutPageRVR2';
import ReinforcementPageV2 from './ReinforcementPageV2';
import PlanSelectionPage from './PlanSelectionPage';
import { FLOW_IDS } from '@/engine/datasetLoader';
import { isTikTokOnlyPath } from '@/lib/funnelPaths';
import { markMetaDisabledSession, markTikTokFunnelSession } from '@/lib/tiktokPixel';

interface OnboardingFlowPageProps {
  flowId: string;
  resetOnMount?: boolean;
}

const OnboardingFlowPage = ({ flowId, resetOnMount = false }: OnboardingFlowPageProps) => {
  const { state, dispatch } = useFunnel();
  const location = useLocation();
  const [booted, setBooted] = useState(false);
  const prevStage = useRef(state.funnelStage);

  useEffect(() => {
    if (isTikTokOnlyPath(location.pathname)) {
      markTikTokFunnelSession();
      markMetaDisabledSession();
    }
  }, [location.pathname]);

  useEffect(() => {
    let alive = true;

    if (resetOnMount) {
      const returningToPlansSelection =
        flowId === FLOW_IDS.PLANS_V1 &&
        state.flowId === flowId &&
        state.funnelStage === 'checkout-plans';
      if (!returningToPlansSelection) {
        dispatch({ type: 'RESET' });
      }
    }
    dispatch({ type: 'SET_FLOW_ID', flowId });

    Promise.all([
      waitForCriticalWarmup(1500),
      preloadQuestions(flowId),
    ]).finally(() => {
      if (alive) setBooted(true);
    });

    return () => {
      alive = false;
    };
  }, [flowId, resetOnMount, dispatch]);

  useEffect(() => {
    if (prevStage.current !== state.funnelStage) {
      prevStage.current = state.funnelStage;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [state.funnelStage]);

  if (!booted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary/60" />
      </div>
    );
  }

  switch (state.funnelStage) {
    case 'assessment':
      return <AssessmentPage />;
    case 'reinforcement':
      return flowId === FLOW_IDS.FIXED_V1_RVR2 ? <ReinforcementPageV2 /> : <ReinforcementPage />;
    case 'social-proof':
      return <SocialProofPage />;
    case 'calculating':
      return <CalculatingPage />;
    case 'email':
      return flowId === FLOW_IDS.FIXED_V1_RVR2 ? <EmailCaptureViewV2 /> : <IntroPage />;
    case 'checkout':
      if (flowId === FLOW_IDS.FIXED_V1_RVR2) {
        return state.email.trim() ? <CheckoutPageRVR2 /> : <EmailCaptureViewV2 />;
      }
      return <CheckoutPage />;
    case 'checkout-plans':
      return <PlanSelectionPage />;
    case 'intro':
    default:
      return <IntroPage />;
  }
};

export default OnboardingFlowPage;
