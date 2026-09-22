import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import DashboardBackLink from '@/components/funnel/DashboardBackLink';
import { HgLanding } from '@/components/hidden-genius/HgLanding';
import { HgUnifiedQuiz } from '@/components/hidden-genius/HgUnifiedQuiz';
import { HgSocialProof } from '@/components/hidden-genius/HgSocialProof';
import { HgCalculation } from '@/components/hidden-genius/HgCalculation';
import { hiddenGeniusQuiz } from '@/data/hiddenGeniusQuiz';
import { useHiddenGenius } from '@/context/HiddenGeniusContext';
import { markCompleted } from '@/lib/testCompletions';
import { computeHgResult, saveHgResultSnapshot, saveHgResponses } from '@/engine/hiddenGeniusScoring';

const FIRST_HALF = hiddenGeniusQuiz.slice(0, 19);
const SECOND_HALF = hiddenGeniusQuiz.slice(19);

export default function HiddenGeniusStartPage() {
  const navigate = useNavigate();
  const { responses, addResponse, stage, setStage } = useHiddenGenius();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);

  const goDash = () => {
    let result: ReturnType<typeof computeHgResult> | null = null;
    try {
      result = computeHgResult(responses);
      saveHgResultSnapshot(result);
      saveHgResponses(responses);
    } catch { /* noop */ }
    // Snapshot the quiz items so add-on reports stay accurate if the funnel changes.
    const questions = hiddenGeniusQuiz.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: (q as { text?: string }).text ?? '',
      options: Array.isArray((q as { options?: unknown[] }).options)
        ? ((q as { options: { label?: string }[] }).options).map((o) => o.label ?? '')
        : [],
    }));
    void markCompleted('hidden-genius', {
      questions,
      totalQuestions: questions.length,
      ...(result ? { result, responses } : { responses }),
    });
    navigate('/hg-dash');
  };

  return (
    <div
      className="hg-theme h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden"
      style={
        {
          ['--primary' as any]: '218 90% 26%',
          ['--primary-foreground' as any]: '0 0% 100%',
          ['--cta' as any]: '218 90% 26%',
          ['--cta-foreground' as any]: '0 0% 100%',
          ['--cta-hover' as any]: '218 90% 20%',
        } as React.CSSProperties
      }
    >
      <LifeScaleHeader
        wordmark="GeniusIQ"
        left={<DashboardBackLink confirmBeforeLeave={stage === 'quiz-a' || stage === 'quiz-b'} />}
      />

      <main className="flex-1 min-h-0 px-4 overflow-hidden">
        {stage === 'landing' && (
          <HgLanding hasProgress={responses.length > 0} onStart={() => setStage('quiz-a')} />
        )}

        {stage === 'quiz-a' && (
          <HgUnifiedQuiz
            items={FIRST_HALF}
            responses={responses}
            onAnswer={addResponse}
            onComplete={() => setStage('social-proof')}
            startOffset={0}
            totalQuestions={hiddenGeniusQuiz.length}
            allItems={hiddenGeniusQuiz}
          />
        )}

        {stage === 'social-proof' && (
          <HgSocialProof onContinue={() => setStage('quiz-b')} />
        )}

        {stage === 'quiz-b' && (
          <HgUnifiedQuiz
            items={SECOND_HALF}
            responses={responses}
            onAnswer={addResponse}
            onComplete={() => setStage('calculating')}
            startOffset={FIRST_HALF.length}
            totalQuestions={hiddenGeniusQuiz.length}
            onBack={() => setStage('quiz-a')}
            allItems={hiddenGeniusQuiz}
          />
        )}

        {stage === 'calculating' && <HgCalculation onComplete={goDash} />}
      </main>
    </div>
  );
}
