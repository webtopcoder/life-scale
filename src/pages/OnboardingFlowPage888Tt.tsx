import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFunnel888Tt } from '@/context/Funnel888TtContext';
import { FLOW_IDS, preloadQuestions } from '@/engine/datasetLoader';
import IntroPage888Tt from './IntroPage888Tt';
import AssessmentPage888Tt from './AssessmentPage888Tt';
import ReinforcementPage888Tt from './ReinforcementPage888Tt';
import SocialProofPage888Tt from './SocialProofPage888Tt';
import CalculatingPage888Tt from './CalculatingPage888Tt';
import CheckoutPage888Tt from './CheckoutPage888Tt';
import { EmailCaptureView888Tt } from '@/components/EmailCaptureView888Tt';
import MemoryIntro888Tt from '@/components/MemoryIntro888Tt';
import { preloadAllVisualQuestions } from '@/assets/quiz-888-tt/visualQuestionAssets';
import { markMetaDisabledSession, markTikTokFunnelSession } from '@/lib/tiktokPixel';

const OnboardingFlowPage888Tt = () => {
  const { state, dispatch } = useFunnel888Tt();
  const location = useLocation();
  const navigate = useNavigate();
  const [booted, setBooted] = useState(false);
  const initialized = useRef(false);
  const prevStage = useRef(state.funnelStage);

  useEffect(() => {
    markTikTokFunnelSession();
    markMetaDisabledSession();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('reset') !== '1') return;

    dispatch({ type: 'RESET' });
    searchParams.delete('reset');
    const nextSearch = searchParams.toString();
    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
      { replace: true },
    );
  }, [dispatch, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    let alive = true;

    const boot = async () => {
      void preloadAllVisualQuestions();
      await preloadQuestions(FLOW_IDS.FIXED_V1_888_TT);
    };

    boot().finally(() => {
      if (alive) setBooted(true);
    });

    return () => {
      alive = false;
    };
  }, []);

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
      return state.memoryIntroComplete ? <AssessmentPage888Tt /> : <MemoryIntro888Tt />;
    case 'reinforcement':
      return <ReinforcementPage888Tt />;
    case 'social-proof':
      return <SocialProofPage888Tt />;
    case 'calculating':
      return <CalculatingPage888Tt />;
    case 'email':
      return <EmailCaptureView888Tt />;
    case 'checkout':
      return state.email.trim() ? <CheckoutPage888Tt /> : <EmailCaptureView888Tt />;
    case 'intro':
    default:
      return <IntroPage888Tt />;
  }
};

export default OnboardingFlowPage888Tt;