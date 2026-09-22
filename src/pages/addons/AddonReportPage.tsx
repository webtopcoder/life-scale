import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { useAuth } from '@/context/AuthContext';
import { findAddon, addonCheckoutPath, addonsForBranch, priceLabel, DASH_PATH, type Addon } from '@/lib/addons';
import { fetchOwnedAddonKeys, generateAddonDoc } from '@/lib/addonPurchase';
import type { AddonDoc, AddonSection } from '@/lib/addonBuilders/types';
import { disclaimer } from '@/content/legalCopy';
import { api } from '@/integrations/api/client';

const THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
};

export default function AddonReportPage() {
  const { branch: branchSlug, key: slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const addon = findAddon(branchSlug, slug);

  const [doc, setDoc] = useState<AddonDoc | null>(null);
  const [next, setNext] = useState<Addon | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not-owned' | 'error'>('loading');

  useEffect(() => {
    if (authLoading || !addon) return;
    if (!user) { navigate('/auth-gate', { replace: true }); return; }
    let active = true;
    (async () => {
      // Prefer client confirm (intent) so a missing/misnamed webhook still unlocks.
      try {
        await api.post('/billing/confirm-addon', { addonKey: addon.key });
      } catch (err) {
        console.warn('[addon-report] confirm-addon failed', err);
      }

      // Webhook may still lag — poll briefly for ownership.
      const delays = [0, 800, 1600, 3200, 5000];
      let ownedKeys: Set<string> | null = null;
      for (const ms of delays) {
        if (ms) await new Promise((r) => setTimeout(r, ms));
        if (!active) return;
        ownedKeys = await fetchOwnedAddonKeys(user.id);
        if (ownedKeys.has(addon.key)) break;
      }
      if (!active || !ownedKeys) return;
      if (!ownedKeys.has(addon.key)) {
        setState('not-owned');
        return;
      }
      setNext(addonsForBranch(addon.branch).find((a) => !ownedKeys!.has(a.key)) ?? null);
      const d = await generateAddonDoc(user.id, addon);
      if (!active) return;
      if (d) {
        setDoc(d);
        setState('ready');
      } else setState('error');
    })();
    return () => {
      active = false;
    };
  }, [user, authLoading, addon, navigate]);

  if (!addon) {
    return (
      <div className="min-h-[100dvh] bg-background" style={THEME_STYLE}>
        <LifeScaleHeader wordmark="IQ" showTagline={false} />
        <div className="px-4 py-16 text-center text-[15px] font-semibold">That add-on does not exist.</div>
      </div>
    );
  }

  const dash = DASH_PATH[addon.branch];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background" style={THEME_STYLE}>
      <div className="print:hidden">
        <LifeScaleHeader
          wordmark="IQ"
          showTagline={false}
          left={
            <button
              type="button"
              onClick={() => navigate(dash)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          }
          right={
            state === 'ready' ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            ) : undefined
          }
        />
      </div>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-8 sm:px-6">
          {state === 'loading' && (
            <div className="flex items-center gap-2 py-16 text-[14px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your report…
            </div>
          )}

          {state === 'not-owned' && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-[15px] font-semibold">You do not own this add-on yet.</p>
              <button
                onClick={() => navigate(addonCheckoutPath(addon))}
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground"
              >
                See what is in it
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-[15px] font-semibold">We could not build this report.</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Complete or re-take the test for this category and it will generate automatically.
              </p>
            </div>
          )}

          {state === 'ready' && doc && (
            <article>
              <header className="border-b border-border pb-6">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Life Scale · Add-on report
                </div>
                <h1 className="mt-1.5 text-[26px] font-bold leading-tight sm:text-[34px]">{doc.title}</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{doc.subtitle}</p>
                <p className="mt-3 text-[11.5px] text-muted-foreground">
                  Generated {new Date(doc.generatedAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </header>

              <div className="divide-y divide-border">
                {doc.sections.map((s, i) => (
                  <Section key={`${s.heading}-${i}`} section={s} index={i} />
                ))}
              </div>

              {next && (
                <div className="mt-10 rounded-2xl border border-border bg-card p-5 print:hidden">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Next add-on
                  </div>
                  <h3 className="mt-1 text-[17px] font-bold leading-tight">{next.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{next.tagline}</p>
                  <button
                    type="button"
                    onClick={() => navigate(addonCheckoutPath(next))}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Get it for {priceLabel(next.priceCents)}
                  </button>
                </div>
              )}

              <footer className="mt-10 border-t border-border pt-5 text-[11.5px] leading-relaxed text-muted-foreground">
                {disclaimer('addonShort')}
              </footer>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}

function Section({ section, index }: { section: AddonSection; index: number }) {
  return (
    <section className="py-7 break-inside-avoid">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {String(index + 1).padStart(2, '0')}
      </div>
      <h2 className="mt-1 text-[19px] font-bold leading-tight sm:text-[22px]">{section.heading}</h2>

      {section.intro && (
        <p className="mt-2 text-[13px] italic text-muted-foreground">{section.intro}</p>
      )}

      {section.paragraphs?.map((p, i) => (
        <p key={i} className="mt-3 text-[14.5px] leading-relaxed text-foreground/90">{p}</p>
      ))}

      {section.bullets && (
        <ul className="mt-4 space-y-2">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {section.pairs && (
        <dl className="mt-4 space-y-2.5">
          {section.pairs.map((p, i) => (
            <div key={i} className="rounded-xl bg-secondary/50 px-3.5 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {p.label}
              </dt>
              <dd className="mt-0.5 text-[14px] leading-relaxed">{p.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {section.table && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-secondary/60">
                {section.table.columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, i) => (
                <tr key={i} className="border-t border-border align-top">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-3 py-2 leading-snug ${j === 0 ? 'font-semibold whitespace-nowrap' : ''}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.callout && (
        <div className="mt-4 rounded-xl border-l-2 border-primary bg-primary/[0.05] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {section.callout.label}
          </div>
          <p className="mt-1 text-[14px] leading-relaxed">{section.callout.text}</p>
        </div>
      )}
    </section>
  );
}
