import { useMemo } from 'react';
import ScaleReportShell from '@/components/scale/ScaleReportShell';
import { SleepHero } from '@/components/scale/BodyHeroes';
import { useScaleResult } from '@/hooks/useScaleResult';
import { scoreSleepHealth, type SleepHealthResult } from '@/engine/bodyScoring';
import { buildSleepReport } from '@/engine/reportCopy/sleepHealthCopy';

export default function SleepReportPage() {
  const { payload, answers } = useScaleResult('sleep-health');

  const result = useMemo<SleepHealthResult | null>(() => {
    const stored = payload?.result as SleepHealthResult | undefined;
    if (stored?.domains) return stored;
    if (Object.keys(answers).length > 0) return scoreSleepHealth(answers);
    return null;
  }, [payload, answers]);

  const doc = useMemo(() => (result ? buildSleepReport(result) : null), [result]);

  if (!doc) {
    return (
      <ScaleReportShell
        scale="sleep-health"
        headline="Your sleep report is waiting on your check-in."
        subhead="Take the sleep check-in and this report builds itself from your own answers."
        sections={[]}
      />
    );
  }

  return (
    <ScaleReportShell
      scale="sleep-health"
      headline={doc.headline}
      subhead={doc.subhead}
      hero={<SleepHero result={result} />}
      sections={doc.sections}
    />
  );
}
