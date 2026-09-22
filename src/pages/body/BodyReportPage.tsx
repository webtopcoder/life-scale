import { useMemo } from 'react';
import ScaleReportShell from '@/components/scale/ScaleReportShell';
import { BodyIqHero } from '@/components/scale/BodyHeroes';
import { useScaleResult } from '@/hooks/useScaleResult';
import { scoreBodyIq, type BodyIqResult } from '@/engine/bodyScoring';
import { buildBodyIqReport } from '@/engine/reportCopy/bodyIqCopy';

export default function BodyReportPage() {
  const { payload, answers } = useScaleResult('body');

  const result = useMemo<BodyIqResult | null>(() => {
    const stored = payload?.result as BodyIqResult | undefined;
    if (stored?.subScores) return stored;
    if (Object.keys(answers).length > 0) return scoreBodyIq(answers);
    return null;
  }, [payload, answers]);

  const doc = useMemo(() => (result ? buildBodyIqReport(result) : null), [result]);

  if (!doc) {
    return (
      <ScaleReportShell
        scale="body"
        headline="Your Body IQ report is waiting on your answers."
        subhead="Take the Body IQ test and this report builds itself from your own results."
        sections={[]}
      />
    );
  }

  return (
    <ScaleReportShell
      scale="body"
      headline={doc.headline}
      subhead={doc.subhead}
      hero={<BodyIqHero result={result} />}
      sections={doc.sections}
    />
  );
}
