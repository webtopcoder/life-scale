import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import UpsellOfferCard from '@/components/upsell/UpsellOfferCard';
import { priceLabel } from '@/lib/addons';
import { resolvedUpsells } from '@/lib/upsellOffers';
import { buildTokens, personalizeOffer, type UpsellTokens } from '@/lib/upsellPersonalization';
import { UPSELL_PERSONAS, KNOWN_TOKEN_KEYS } from '@/lib/upsellPreviewPersonas';
import type { Branch } from '@/lib/testCompletions';
import { SCALES } from '@/config/scales';

const TABS: { id: 'all' | Branch; label: string }[] = [
  { id: 'all', label: 'All' },
  ...SCALES.map((s) => ({ id: s.key as 'all' | Branch, label: s.shortName })),
];

const BRANCH_LABEL: Record<Branch, string> = Object.fromEntries(
  SCALES.map((s) => [s.key, s.shortName]),
) as Record<Branch, string>;

const BRANCHES: Branch[] = SCALES.map((s) => s.key);

/** Which tokens the offer copy actually references, per branch. */
function tokensUsedByBranch(): Record<Branch, Set<string>> {
  const out = Object.fromEntries(
    SCALES.map((s) => [s.key, new Set<string>()]),
  ) as Record<Branch, Set<string>>;
  const re = /\{([a-zA-Z0-9_]+)(?::lower)?\|/g;
  for (const { addon, offer } of resolvedUpsells()) {
    if (!offer) continue;
    const blob = [
      offer.headline,
      offer.highlight,
      offer.proofLine ?? '',
      ...offer.valueProps.map((v) => v.text),
      ...(offer.contentsList ?? []),
    ].join(' ');
    for (const m of blob.matchAll(re)) out[addon.branch].add(m[1]);
  }
  return out;
}

export default function PreviewUpsellsPage() {
  const [tab, setTab] = useState<'all' | Branch>('all');
  /** null = generic copy. */
  const [personaId, setPersonaId] = useState<string | null>(null);
  const persona = UPSELL_PERSONAS.find((p) => p.id === personaId) ?? null;

  const items = useMemo(
    () => resolvedUpsells().filter((r) => tab === 'all' || r.addon.branch === tab),
    [tab],
  );
  const written = resolvedUpsells().filter((r) => r.offer).length;

  /** Tokens resolved from the persona's mock payloads, via the real engine. */
  const tokensByBranch = useMemo<Record<Branch, UpsellTokens> | null>(() => {
    if (!persona) return null;
    return Object.fromEntries(
      SCALES.map((s) => [s.key, buildTokens(s.key, persona.payloads[s.key] ?? {})]),
    ) as Record<Branch, UpsellTokens>;
  }, [persona]);

  const unresolved = useMemo(() => {
    if (!tokensByBranch) return [];
    const used = tokensUsedByBranch();
    const missing: string[] = [];
    for (const b of BRANCHES) {
      for (const key of used[b]) {
        if (!tokensByBranch[b][key]) missing.push(`${BRANCH_LABEL[b]}: {${key}}`);
      }
    }
    return missing;
  }, [tokensByBranch]);



  return (
    <div className="min-h-screen bg-background text-foreground">
      <LifeScaleHeader
        left={
          <Link to="/preview" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        }
      />

      <div className="mx-auto w-full min-w-0 max-w-6xl overflow-hidden px-4 py-8 space-y-6">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight">Upsell cards</h1>
          <p className="text-sm text-muted-foreground">
            Preview only — nothing here charges or unlocks anything. {written} of {resolvedUpsells().length} cards written.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Sample data
          </span>
          <div className="w-full min-w-0 overflow-x-auto sm:w-auto">
            <div className="inline-flex min-w-max rounded-full border border-border bg-card p-0.5">
              {[{ id: null, label: 'Generic' }, ...UPSELL_PERSONAS.map((p) => ({ id: p.id as string | null, label: p.label }))].map((opt) => (
                <button
                  key={opt.id ?? 'generic'}
                  type="button"
                  onClick={() => setPersonaId(opt.id)}
                  className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                    personaId === opt.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {persona && (
          <div className="rounded-xl border border-border bg-card/50 px-4 py-3 space-y-1">
            <p className="text-xs text-muted-foreground">{persona.blurb}</p>
            <p className="text-[11px] text-muted-foreground/80">
              {unresolved.length === 0
                ? 'All tokens used in the copy resolved for this persona.'
                : `Falling back to generic wording — ${unresolved.join(', ')}`}
            </p>
          </div>
        )}




        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
          {items.map(({ addon, offer }) => (
            <div key={addon.key} className="min-w-0 space-y-2">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <span className="text-xs font-semibold text-foreground">
                  {BRANCH_LABEL[addon.branch]} · {addon.title}
                </span>
                <span className="text-xs text-muted-foreground">{priceLabel(addon.offerPriceCents)}</span>
              </div>
              {offer ? (
                <UpsellOfferCard
                  addon={addon}
                  offer={personalizeOffer(offer, tokensByBranch ? tokensByBranch[addon.branch] : null)}
                  inert
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Card not written yet</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{addon.tagline}</p>
                  <p className="text-[11px] text-muted-foreground/70 font-mono">{addon.key}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
