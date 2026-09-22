import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, FileText } from 'lucide-react';
import {
  addonsForBranch, addonCheckoutPath, addonViewPath, priceLabel, type Addon,
} from '@/lib/addons';
import type { Branch } from '@/lib/testCompletions';
import { useOwnedAddons } from '@/hooks/useOwnedAddons';
import { SCALES } from '@/config/scales';

const BRANCH_LABEL: Record<Branch, string> = Object.fromEntries(
  SCALES.map((s) => [s.key, s.shortName]),
) as Record<Branch, string>;

const ORDER: Branch[] = SCALES.map((s) => s.key);

interface Props {
  /** Branches the user can buy against (entitled AND test completed). */
  branches: Branch[];
}

/** Cross-branch "Add-Ons" list for the main dashboard. Collapsed by default. */
export default function AllAddonsSection({ branches }: Props) {
  const navigate = useNavigate();
  const { owned, loading } = useOwnedAddons();
  const [open, setOpen] = useState(false);

  const groups = useMemo(
    () => ORDER.filter((b) => branches.includes(b)).map((b) => ({ branch: b, addons: addonsForBranch(b) })),
    [branches],
  );

  if (loading || groups.length === 0) return null;

  const total = groups.reduce((n, g) => n + g.addons.length, 0);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-foreground">Add-Ons</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {total} short reports built from the tests you already took.
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border px-5 py-4">
          {groups.map((g) => (
            <div key={g.branch}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {BRANCH_LABEL[g.branch]}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[...g.addons]
                  .sort((a, b) => Number(owned.has(b.key)) - Number(owned.has(a.key)))
                  .map((a) => (
                    <AddonRow
                      key={a.key}
                      addon={a}
                      owned={owned.has(a.key)}
                      onClick={() => navigate(owned.has(a.key) ? addonViewPath(a) : addonCheckoutPath(a))}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddonRow({ addon, owned, onClick }: { addon: Addon; owned: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
        owned ? 'border-primary/30 bg-primary/[0.04] hover:border-primary/60' : 'border-border bg-background hover:border-primary/40',
      ].join(' ')}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13.5px] font-semibold text-foreground">{addon.title}</p>
          {owned ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {priceLabel(addon.priceCents)}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{addon.tagline}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}
