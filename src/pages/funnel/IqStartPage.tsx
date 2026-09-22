import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFunnel } from '@/context/FunnelContext';
import { waitForCriticalWarmup } from '@/engine/puzzleCache';
import { preloadQuestions, loadQuestions, FLOW_IDS } from '@/engine/datasetLoader';
import IntroPage from '@/pages/IntroPage';
import AssessmentPage from '@/pages/funnel/IqTestAssessmentPage';
import IqTestReinforcementPage from '@/pages/funnel/IqTestReinforcementPage';
import CalculatingPage from '@/pages/funnel/IqTestCalculatingPage';
import { markCompleted } from '@/lib/testCompletions';

const FLOW_ID = FLOW_IDS.IQSCALE_V1;

export default function IqStartPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useFunnel();
  const [booted, setBooted] = useState(false);
  const prevStage = useRef(state.funnelStage);

  // Boot: reset funnel, set flowId, warm caches.
  useEffect(() => {
    let alive = true;
    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_FLOW_ID', flowId: FLOW_ID });
    Promise.all([
      waitForCriticalWarmup(1500),
      preloadQuestions(FLOW_ID),
    ]).finally(() => {
      if (alive) setBooted(true);
    });
    return () => {
      alive = false;
    };
  }, [dispatch]);

  // Scroll to top on stage change.
  useEffect(() => {
    if (prevStage.current !== state.funnelStage) {
      prevStage.current = state.funnelStage;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [state.funnelStage]);

  // Skip social-proof stage entirely in this flow.
  useEffect(() => {
    if (state.funnelStage === 'social-proof') {
      dispatch({ type: 'SET_STAGE', stage: 'calculating' });
    }
  }, [state.funnelStage, dispatch]);

  // Short-circuit: after results calculation, go to /iq-dash instead of checkout.
  useEffect(() => {
    if (state.funnelStage === 'checkout' || state.funnelStage === 'checkout-plans') {
      // Snapshot the funnel questions alongside the answers so add-on reports
      // stay accurate (item counts, likert vs graded, option labels) even if
      // the funnel is edited later.
      const questions = loadQuestions().map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        category: q.category,
        options: Array.isArray(q.options) ? q.options : [],
        difficulty: q.difficulty,
      }));
      void markCompleted('iq', {
        score: state.finalScore ?? 0,
        scores: state.scores,
        percentiles: state.percentiles,
        answers: state.answers,
        flowId: FLOW_ID,
        totalQuestions: questions.length,
        questions,
      });
      navigate('/iq-dash', { replace: true });
    }
  }, [state.funnelStage, state.finalScore, state.scores, state.percentiles, state.answers, navigate]);



  const renderStage = () => {
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
        return <IqTestReinforcementPage />;
      case 'social-proof':
      case 'calculating':
        return <CalculatingPage />;
      case 'checkout':
      case 'checkout-plans':
        // Transitional — redirect effect above navigates to /iq-dash.
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary/60" />
          </div>
        );
      case 'intro':
      default:
        return <IntroPage />;
    }
  };

  return (
    <div className="lifescale-root lifescale-theme min-h-screen">
      {renderStage()}
    </div>
  );
}
