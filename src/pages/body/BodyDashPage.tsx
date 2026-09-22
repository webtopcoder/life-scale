import { useMemo } from 'react';
import ScaleDashboard from '@/components/scale/ScaleDashboard';
import { BodyIqHero } from '@/components/scale/BodyHeroes';
import { useScaleResult } from '@/hooks/useScaleResult';
import { scoreBodyIq, type BodyIqResult } from '@/engine/bodyScoring';
import { BODY_DOMAIN_LABEL } from '@/data/bodyIqQuiz';

export default function BodyDashPage() {
  const { payload, answers } = useScaleResult('body');

  const result = useMemo<BodyIqResult | null>(() => {
    const stored = payload?.result as BodyIqResult | undefined;
    if (stored?.subScores) return stored;
    if (Object.keys(answers).length > 0) return scoreBodyIq(answers);
    return null;
  }, [payload, answers]);

  const priority = useMemo(
    () => (result ? [...result.ordered].reverse().slice(0, 3).map((d) => d.domain) : []),
    [result],
  );

  const focusLine = result
    ? `Your plan is weighted toward ${BODY_DOMAIN_LABEL[result.weakest]} — the area holding your score down most.`
    : 'Take the Body IQ test to build your plan.';

  return (
    <ScaleDashboard
      scale="body"
      hero={<BodyIqHero result={result} />}
      priorityAreas={priority}
      focusLine={focusLine}
    />
  );
}
