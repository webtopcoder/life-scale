import { useEffect, useRef, useState } from 'react';
import { useFunnel } from '@/context/ShortIqFunnelContext';
import { preloadStaticSvgAssets } from '@/engine/staticSvgCache';
import { preloadQuestions } from '@/engine/datasetLoader';
import IntroPage from './short-iq/IntroPage';
import AssessmentPage from './short-iq/AssessmentPage';
import ReinforcementPage from './short-iq/ReinforcementPage';
import SocialProofPage from './short-iq/SocialProofPage';
import CalculatingPage from './short-iq/CalculatingPage';
import EmailPage from './short-iq/EmailPage';
import CheckoutPage from './short-iq/CheckoutPage';
import { RotateCcw } from 'lucide-react';

interface ShortIqFlowPageProps { flowId: string; }

const ShortIqFlowPage = ({ flowId }: ShortIqFlowPageProps) => {
  const { state, dispatch } = useFunnel();
  const [booted, setBooted] = useState(false);
  const prevStage = useRef(state.funnelStage);

  useEffect(() => {
    let alive = true;
    dispatch({ type: 'SET_FLOW_ID', flowId });
    (async () => {
      try {
        await preloadQuestions(flowId);
        await preloadStaticSvgAssets();
      } finally {
        if (alive) setBooted(true);
      }
    })();
    return () => { alive = false; };
  }, [flowId, dispatch]);

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

  const renderStage = () => {
    switch (state.funnelStage) {
      case 'assessment': return <AssessmentPage />;
      case 'reinforcement': return <ReinforcementPage />;
      case 'social-proof': return <SocialProofPage />;
      case 'calculating': return <CalculatingPage />;
      case 'email': return <EmailPage />;
      case 'checkout': return <CheckoutPage />;
      case 'intro':
      default: return <IntroPage />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-muted/40 flex justify-center">
      <div className="w-full max-w-[430px] bg-background shadow-xl min-h-screen relative overflow-hidden">
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="absolute bottom-3 right-3 z-50 p-2 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Reset funnel"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        {renderStage()}
      </div>
    </div>
  );
};

export default ShortIqFlowPage;