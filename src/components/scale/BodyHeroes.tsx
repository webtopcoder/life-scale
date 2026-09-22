// Shared hero visuals for the Body category. Used by both the branch
// dashboards and the branch reports so the area breakdown a user is shown in
// the sample report is the same one their real report renders.

import { BODY_DOMAIN_LABEL, type BodyDomain } from '@/data/bodyIqQuiz';
import { SLEEP_DOMAIN_LABEL, type SleepDomain } from '@/data/sleepHealthQuiz';
import { ATHLETE_AXIS_LABEL, type AthleteAxis } from '@/data/hiddenAthleteQuiz';
import {
  SLEEP_STATUS_LABEL,
  type BodyIqResult,
  type SleepHealthResult,
  type HiddenAthleteResult,
} from '@/engine/bodyScoring';

const BAND_LINE: Record<BodyIqResult['band'], string> = {
  exceptional: 'Well above the middle of the range. Your job now is protecting it.',
  strong: 'Above the middle of the range, with clear room in one or two areas.',
  typical: 'Around the middle of the range — the most improvable place to be.',
  below: 'Below the middle, and the reasons are specific rather than general.',
  low: 'Low for now. Everything that moves this number is in your control.',
};

const STATUS_CLASS: Record<string, string> = {
  solid: 'bg-primary/10 text-primary',
  watch: 'bg-secondary text-foreground',
  strained: 'bg-warning/15 text-warning-foreground',
  urgent: 'bg-destructive/10 text-destructive',
};

const OVERALL_LINE: Record<SleepHealthResult['overall'], string> = {
  settled: 'Your nights are broadly working. The plan protects them rather than rebuilding them.',
  mixed: 'Parts of your night work and parts do not. The plan starts with the parts that do not.',
  disrupted: 'Your nights are under real strain. The plan starts small on purpose.',
};

const AXES: AthleteAxis[] = ['endurance', 'volume', 'structure'];

const Shell = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card p-5">{children}</section>
);

export function BodyIqHero({ result }: { result: BodyIqResult | null }) {
  if (!result) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Take the Body IQ test and your score and seven areas appear here.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            Your Body IQ
          </p>
          <p className="text-4xl font-bold text-primary leading-none mt-1">{result.score}</p>
        </div>
        <p className="max-w-[55%] text-[12.5px] leading-snug text-muted-foreground text-right">
          {BAND_LINE[result.band]}
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {result.ordered.map((d) => (
          <div key={d.domain}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-medium">{BODY_DOMAIN_LABEL[d.domain as BodyDomain]}</span>
              <span className="text-muted-foreground">{d.value}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${d.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function SleepHero({ result }: { result: SleepHealthResult | null }) {
  if (!result) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Take the sleep check-in and your seven areas appear here.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        Your sleep picture
      </p>
      <p className="mt-1 text-[15px] leading-relaxed text-foreground/85">
        {OVERALL_LINE[result.overall]}
      </p>
      <ul className="mt-4 space-y-2">
        {result.domains.map((d) => (
          <li key={d.domain} className="flex items-center justify-between gap-3">
            <span className="text-[13.5px] font-medium">
              {SLEEP_DOMAIN_LABEL[d.domain as SleepDomain]}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_CLASS[d.status]}`}>
              {SLEEP_STATUS_LABEL[d.status]}
            </span>
          </li>
        ))}
      </ul>
      {result.breathingFlag && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-3">
          <p className="text-[12.5px] leading-snug text-foreground/85">
            One of your answers is worth raising with a doctor. Heavy snoring with pauses in
            breathing has a real, treatable cause, and no habit change substitutes for that
            conversation.
          </p>
        </div>
      )}
    </Shell>
  );
}

export function AthleteHero({ result }: { result: HiddenAthleteResult | null }) {
  if (!result) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Take the Hidden Athlete test and your archetype appears here.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        Your athlete type
      </p>
      <h2 className="mt-1 text-2xl font-bold text-primary">{result.archetype.name}</h2>
      <p className="text-[13px] text-muted-foreground">{result.archetype.tagline}</p>
      <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/85">
        {result.archetype.summary}
      </p>

      <div className="mt-5 space-y-3">
        {AXES.map((a) => {
          const value = result.normalized[a];
          const pct = ((value + 1) / 2) * 100;
          const [low, high] = ATHLETE_AXIS_LABEL[a];
          return (
            <div key={a}>
              <div className="flex items-center justify-between text-[11.5px] font-medium text-muted-foreground">
                <span>{low}</span><span>{high}</span>
              </div>
              <div className="relative mt-1 h-1.5 w-full rounded-full bg-secondary">
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary"
                  style={{ left: `${Math.min(97, Math.max(3, pct))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
