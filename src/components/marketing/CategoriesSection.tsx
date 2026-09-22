import { ArrowRight } from 'lucide-react';
import { BranchOrb } from './BranchOrb';
import {
  CATEGORIES,
  scalesInCategory,
  type ScaleKey,
  type ScaleRole,
} from '@/config/scales';

const ROLE_LABEL: Record<ScaleRole, string> = {
  core: 'Core test',
  health: 'Health screen',
  hidden: 'Hidden strengths',
};

interface CategoriesSectionProps {
  /** Starts the funnel with the chosen scale pre-selected. */
  onStartScale: (key: ScaleKey) => void;
}

export const CategoriesSection = ({ onStartScale }: CategoriesSectionProps) => {
  const live = CATEGORIES.filter((c) => c.status === 'live');
  const soon = CATEGORIES.filter((c) => c.status !== 'live');

  return (
    <section id="framework" className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="iq-serif mt-3 text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
          Many scales, <span className="text-[hsl(var(--iq-emerald))]">many sides of you.</span>
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
          Every category works the same way: one scored core test, one health check, and one
          hidden-strengths profile. Clear results, never a diagnosis.
        </p>
      </div>

      {live.map((cat) => (
        <div key={cat.key} id={`category-${cat.key}`} className="mt-14 scroll-mt-24">
          <div className="flex flex-col gap-2 border-b border-[hsl(var(--iq-border))] pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--iq-emerald))]">
                Category
              </span>
              <h3 className="iq-serif mt-1 text-2xl font-semibold text-[hsl(var(--iq-ink))] md:text-3xl">
                {cat.name} IQ
              </h3>
            </div>
            <p className="max-w-md text-[14px] leading-relaxed text-[hsl(var(--iq-muted))]">
              {cat.tagline}
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {scalesInCategory(cat.key).map((s) => (
              <article
                key={s.key}
                id={`scale-${s.key}`}
                className="iq-card flex scroll-mt-24 flex-col p-7"
                style={{ boxShadow: '0 20px 40px -24px hsl(var(--iq-cobalt) / 0.35)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--iq-ink-soft))]">
                      {ROLE_LABEL[s.role]}
                    </span>
                    <h4 className="iq-serif mt-1 text-2xl font-semibold text-[hsl(var(--iq-ink))]">
                      {s.shortName}
                    </h4>
                  </div>
                  <BranchOrb branch={s.key} size={56} />
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--iq-muted))]">{s.tagline}</p>

                <ul className="mt-4 space-y-2 text-sm text-[hsl(var(--iq-ink-soft))]">
                  {s.bullets.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="iq-pearl mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <button
                    onClick={() => onStartScale(s.key)}
                    className="iq-btn-primary iq-lit inline-flex h-10 items-center gap-1.5 px-4 text-sm"
                  >
                    Start Test <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}

      {soon.length > 0 && (
        <div className="mt-16 rounded-xl border border-dashed border-[hsl(var(--iq-border))] p-7">
          <h3 className="text-[15px] font-semibold text-[hsl(var(--iq-ink))]">More categories coming.</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[hsl(var(--iq-muted))]">
            The same three-test format, applied to the rest of your life.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {soon.map((cat) => (
              <div
                key={cat.key}
                className="rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] p-4 opacity-70"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[hsl(var(--iq-ink))]">{cat.name} IQ</span>
                  <span className="rounded-full bg-[hsl(var(--iq-mint-wash))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--iq-emerald))]">
                    Soon
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[hsl(var(--iq-muted))]">{cat.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoriesSection;
