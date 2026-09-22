import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { setFunnelValue } from '@/lib/funnelState';
import LifeScaleMarketingLayout from '@/components/marketing/LifeScaleMarketingLayout';
import { BranchOrb } from '@/components/marketing/BranchOrb';
import {
  CATEGORIES,
  scalesInCategory,
  type ScaleDef,
  type ScaleRole,
} from '@/config/scales';
import { useAuth } from '@/context/AuthContext';

const ROLE_LABEL: Record<ScaleRole, string> = {
  core: 'Core test',
  health: 'Health screen',
  hidden: 'Hidden strengths',
};

export default function ChooseTestPage({ previewMode = false }: { previewMode?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelect = (s: ScaleDef) => {
    setFunnelValue('selectedTest', s.key);
    // Signed-in visitors can continue directly; everyone else creates or opens an account first.
    navigate(previewMode ? '/preview-signup/auth-gate' : user ? `/upgrade/${s.key}` : '/auth-gate');
  };


  const live = CATEGORIES.filter((c) => c.status === 'live');
  const soon = CATEGORIES.filter((c) => c.status !== 'live');

  return (
    <LifeScaleMarketingLayout onStart={() => navigate('/choose-test')}>
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6 md:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-lg font-semibold text-[hsl(var(--iq-ink))] md:text-3xl">
            Which scale do you want to take?
          </h1>
          <p className="mt-0.5 text-sm leading-relaxed text-[hsl(var(--iq-muted))] md:mt-2 md:text-[15px]">
            Pick a category, then pick a test. You can take the others later.
          </p>
        </div>

        {live.map((cat) => (
          <div key={cat.key} className="mt-6 md:mt-10">
            <div className="flex items-baseline justify-between gap-3 border-b border-[hsl(var(--iq-border))] pb-2">
              <h2 className="text-base font-semibold text-[hsl(var(--iq-ink))] md:text-xl">
                {cat.name} IQ
              </h2>
              <p className="hidden max-w-sm text-right text-[13px] text-[hsl(var(--iq-muted))] md:block">
                {cat.tagline}
              </p>
            </div>

            <div className="mt-3 flex flex-col items-start gap-2 md:mt-5 md:grid md:grid-cols-3 md:gap-4">
              {scalesInCategory(cat.key).map((s) => (
                <article
                  key={s.key}
                  className="iq-card flex w-full items-center justify-between gap-3 p-4 md:w-auto md:flex-col md:items-start md:p-5"
                  style={{ boxShadow: '0 20px 40px -24px hsl(var(--iq-cobalt) / 0.35)' }}
                >
                  <div className="hidden md:block">
                    <BranchOrb branch={s.key} size={56} />
                  </div>

                  <div className="w-1/2 min-w-0 md:w-auto md:flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--iq-ink-soft))] md:mt-4 md:block">
                      {ROLE_LABEL[s.role]}
                    </span>
                    <h3 className="text-base font-semibold text-[hsl(var(--iq-ink))] md:mt-0.5 md:text-lg">
                      {s.shortName}
                    </h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-[hsl(var(--iq-muted))] md:mt-1.5">
                      {s.tagline}
                    </p>

                    <ul className="mt-1.5 hidden space-y-0 text-xs text-[hsl(var(--iq-ink-soft))] md:mt-3 md:block md:space-y-1 md:text-sm">
                      {s.bullets.map((x) => (
                        <li key={x} className="flex items-start gap-2">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[hsl(var(--iq-emerald))] md:mt-1.5 md:h-1.5 md:w-1.5" />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="shrink-0 md:mt-4">
                    <button
                      onClick={() => handleSelect(s)}
                      className="iq-btn-primary inline-flex h-9 items-center gap-1.5 px-3 text-sm md:px-3"
                    >
                      Start <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}

        {soon.length > 0 && (
          <p className="mt-8 text-center text-[13px] text-[hsl(var(--iq-muted))]">
            Coming soon: {soon.map((c) => `${c.name} IQ`).join(', ')}.
          </p>
        )}
      </section>
    </LifeScaleMarketingLayout>
  );
}
