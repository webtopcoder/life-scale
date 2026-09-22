// Shared report shell for registry-driven scales. Reports are long-form
// (~1,470 words), plain-language, and never quote a question or an option label.

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import InlineAddonCard from '@/components/addons/InlineAddonCard';
import { getScale, scaleThemeStyle, type ScaleKey } from '@/config/scales';
import DisclaimerNote from '@/components/legal/DisclaimerNote';

export interface ReportSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: { label: string; text: string };
  /** Add-on card injected directly after this section. */
  addonKey?: string;
  addonTeaser?: string;
}

export interface ScaleReportProps {
  scale: ScaleKey;
  /** Big line at the top: a score, a status, or an archetype name. */
  headline: string;
  subhead: string;
  /** Optional hero visual (score dial, status grid, axis dials). */
  hero?: React.ReactNode;
  sections: ReportSection[];
}

export default function ScaleReportShell({
  scale, headline, subhead, hero, sections,
}: ScaleReportProps) {
  const def = getScale(scale);

  useEffect(() => { document.title = `${def.shortName} Report — Life Scale`; }, [def.shortName]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={scaleThemeStyle(scale)}>
      <LifeScaleHeader
        wordmark={def.shortName}
        left={
          <Link to={def.dashPath} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-8">
        <header className="space-y-3">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wide text-primary">
            {def.shortName} Report
          </span>
          <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight">{headline}</h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">{subhead}</p>
        </header>

        {hero && <div className="mt-6">{hero}</div>}

        <div className="mt-8 space-y-9">
          {sections.map((s) => (
            <section key={s.heading} className="space-y-3">
              <h2 className="text-[21px] font-bold leading-snug">{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="text-[15.5px] leading-[1.75] text-foreground/85">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="space-y-2 pt-1">
                  {s.bullets.map((b) => (
                    <li key={b.slice(0, 40)} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/85">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.callout && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-primary">
                    {s.callout.label}
                  </p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-foreground/85">{s.callout.text}</p>
                </div>
              )}
              {s.addonKey && <InlineAddonCard addonKey={s.addonKey} teaser={s.addonTeaser} />}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold">Where the work happens</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            This report is the picture. Your dashboard is the plan — a 90-day arc with a small number
            of daily actions built from these results.
          </p>
          <Link
            to={def.dashPath}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Open my dashboard
          </Link>
        </div>

        <DisclaimerNote kind="reportShort" category={def.category} className="mt-8 text-center" />
      </main>
    </div>
  );
}
