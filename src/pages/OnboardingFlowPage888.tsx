import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFunnel888 } from '@/context/Funnel888Context';
import { FLOW_IDS, preloadQuestions } from '@/engine/datasetLoader';
import IntroPage888 from './IntroPage888';
import AssessmentPage888 from './AssessmentPage888';
import ReinforcementPage888 from './ReinforcementPage888';
import SocialProofPage888 from './SocialProofPage888';
import CalculatingPage888 from './CalculatingPage888';
import CheckoutPage888 from './CheckoutPage888';
import { EmailCaptureView888 } from '@/components/EmailCaptureView888';
import MemoryIntro888 from '@/components/MemoryIntro888';
import { preloadAllVisualQuestions } from '@/assets/quiz-888/visualQuestionAssets';

const OnboardingFlowPage888 = () => {
  const { state, dispatch } = useFunnel888();
  const location = useLocation();
  const navigate = useNavigate();
  const [booted, setBooted] = useState(false);
  const initialized = useRef(false);
  const prevStage = useRef(state.funnelStage);

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
      await preloadQuestions(FLOW_IDS.FIXED_V1_888);
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
      return state.memoryIntroComplete ? <AssessmentPage888 /> : <MemoryIntro888 />;
    case 'reinforcement':
      return <ReinforcementPage888 />;
    case 'social-proof':
      return <SocialProofPage888 />;
    case 'calculating':
      return <CalculatingPage888 />;
    case 'email':
      return <EmailCaptureView888 />;
    case 'checkout':
      return state.email.trim() ? <CheckoutPage888 /> : <EmailCaptureView888 />;
    case 'intro':
    default:
      return <IntroPage888 />;
  }
};

export default OnboardingFlowPage888;