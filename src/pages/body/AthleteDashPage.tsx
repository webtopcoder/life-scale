import { useMemo } from 'react';
import ScaleDashboard from '@/components/scale/ScaleDashboard';
import { AthleteHero } from '@/components/scale/BodyHeroes';
import { useScaleResult } from '@/hooks/useScaleResult';
import { scoreHiddenAthlete, type HiddenAthleteResult } from '@/engine/bodyScoring';


/** Task areas each axis direction feeds. */
function areasFor(r: HiddenAthleteResult): string[] {
  const out: string[] = [];
  out.push(r.normalized.endurance >= 0 ? 'endurance' : 'power');
  out.push(r.normalized.volume >= 0 ? 'volume' : 'intensity');
  out.push(r.normalized.structure >= 0 ? 'structure' : 'skill');
  return out;
}

export default function AthleteDashPage() {
  const { payload, answers } = useScaleResult('hidden-athlete');

  const result = useMemo<HiddenAthleteResult | null>(() => {
    const stored = payload?.result as HiddenAthleteResult | undefined;
    if (stored?.archetype) return stored;
    if (Object.keys(answers).length > 0) return scoreHiddenAthlete(answers);
    return null;
  }, [payload, answers]);

  const priority = useMemo(() => (result ? areasFor(result) : []), [result]);

  const hero = <AthleteHero result={result} />;


  const focusLine = result
    ? `Your plan is built for how ${result.archetype.name.replace('The ', 'the ')} actually trains.`
    : 'Take the Hidden Athlete test to build your plan.';

  const extra = result ? (
    <section className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-[15px] font-bold">You train best with</h3>
        <ul className="mt-2 space-y-1.5">
          {result.archetype.trainsBestWith.map((t) => (
            <li key={t} className="flex gap-2 text-[13px] leading-snug text-muted-foreground">
              <span className="text-primary">•</span><span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-[15px] font-bold">It breaks down when</h3>
        <ul className="mt-2 space-y-1.5">
          {result.archetype.breaksDownWhen.map((t) => (
            <li key={t} className="flex gap-2 text-[13px] leading-snug text-muted-foreground">
              <span className="text-primary">•</span><span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  ) : null;

  return (
    <ScaleDashboard
      scale="hidden-athlete" hero={hero} priorityAreas={priority} focusLine={focusLine}
    >
      {extra}
    </ScaleDashboard>
  );
}
