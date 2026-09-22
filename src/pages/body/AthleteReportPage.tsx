import { useMemo } from 'react';
import ScaleReportShell from '@/components/scale/ScaleReportShell';
import { AthleteHero } from '@/components/scale/BodyHeroes';
import { useScaleResult } from '@/hooks/useScaleResult';
import { scoreHiddenAthlete, type HiddenAthleteResult } from '@/engine/bodyScoring';
import { buildAthleteReport } from '@/engine/reportCopy/hiddenAthleteCopy';

export default function AthleteReportPage() {
  const { payload, answers } = useScaleResult('hidden-athlete');

  const result = useMemo<HiddenAthleteResult | null>(() => {
    const stored = payload?.result as HiddenAthleteResult | undefined;
    if (stored?.archetype) return stored;
    if (Object.keys(answers).length > 0) return scoreHiddenAthlete(answers);
    return null;
  }, [payload, answers]);

  const doc = useMemo(() => (result ? buildAthleteReport(result) : null), [result]);

  if (!doc) {
    return (
      <ScaleReportShell
        scale="hidden-athlete"
        headline="Your Hidden Athlete report is waiting on your answers."
        subhead="Take the Hidden Athlete test and this report builds itself from your own results."
        sections={[]}
      />
    );
  }

  return (
    <ScaleReportShell
      scale="hidden-athlete"
      headline={doc.headline}
      subhead={doc.subhead}
      hero={<AthleteHero result={result} />}
      sections={doc.sections}
    />
  );
}
