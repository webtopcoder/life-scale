import { useMemo } from 'react';
import ScaleDashboard from '@/components/scale/ScaleDashboard';
import { SleepHero } from '@/components/scale/BodyHeroes';
import { useScaleResult } from '@/hooks/useScaleResult';
import { scoreSleepHealth, type SleepHealthResult } from '@/engine/bodyScoring';
import { SLEEP_DOMAIN_LABEL } from '@/data/sleepHealthQuiz';

export default function SleepDashPage() {
  const { payload, answers } = useScaleResult('sleep-health');

  const result = useMemo<SleepHealthResult | null>(() => {
    const stored = payload?.result as SleepHealthResult | undefined;
    if (stored?.domains) return stored;
    if (Object.keys(answers).length > 0) return scoreSleepHealth(answers);
    return null;
  }, [payload, answers]);

  const priority = useMemo(
    () => (result ? result.domains.slice(0, 3).map((d) => d.domain) : []),
    [result],
  );

  const focusLine = result
    ? `Your plan starts with ${SLEEP_DOMAIN_LABEL[result.weakest]} — the area under the most strain.`
    : 'Take the sleep check-in to build your plan.';

  return (
    <ScaleDashboard
      scale="sleep-health"
      hero={<SleepHero result={result} />}
      priorityAreas={priority}
      focusLine={focusLine}
    />
  );
}
