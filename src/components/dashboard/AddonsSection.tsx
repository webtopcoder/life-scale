import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Check, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { listCompletions, type Branch } from '@/lib/testCompletions';
import { addonsForBranch, addonCheckoutPath, addonViewPath, priceLabel, type Addon } from '@/lib/addons';
import { fetchOwnedAddonKeys } from '@/lib/addonPurchase';
import { SCALES } from '@/config/scales';

const TEST_PATH: Record<Branch, string> = Object.fromEntries(
  SCALES.map((s) => [s.key, s.startPath]),
) as Record<Branch, string>;

export default function AddonsSection({ branch }: { branch: Branch }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) { setLoading(false); return; }
    Promise.all([fetchOwnedAddonKeys(user.id), listCompletions(user.id)]).then(([set, done]) => {
      if (!active) return;
      setOwned(set);
      setCompleted(done.has(branch));
      setLoading(false);
    });
    return () => { active = false; };
  }, [user, branch]);

  const addons = addonsForBranch(branch);
  const purchased = addons.filter((a) => owned.has(a.key));
  const available = addons.filter((a) => !owned.has(a.key));

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-[16px] font-bold">Add-Ons</h3>
        <span className="text-[11px] text-muted-foreground">One-time, built from your answers</span>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Short, focused reports generated from the test you already took.
      </p>

      {!loading && !completed && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-background px-3.5 py-3">
          <Lock className="mt-[3px] h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="text-[12.5px] leading-snug text-muted-foreground">
            These are written from your own answers, so they unlock once you have finished the test.{' '}
            <button
              type="button"
              onClick={() => navigate(TEST_PATH[branch])}
              className="font-semibold text-primary underline"
            >
              Take the test
            </button>
          </div>
        </div>
      )}


      {purchased.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">Yours</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {purchased.map((a) => (
              <OwnedCard key={a.key} addon={a} onOpen={() => navigate(addonViewPath(a))} />
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          {purchased.length > 0 && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Available
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {available.map((a) => (
              <StoreCard
                key={a.key}
                addon={a}
                disabled={loading || !completed}
                locked={!loading && !completed}
                onBuy={() => navigate(addonCheckoutPath(a))}
              />

            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function OwnedCard({ addon, onOpen }: { addon: Addon; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] p-3.5 text-left transition-colors hover:border-primary/60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[14px] font-semibold">{addon.title}</p>
          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
        </div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground line-clamp-2">{addon.tagline}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}

function StoreCard({ addon, onBuy, disabled, locked }: { addon: Addon; onBuy: () => void; disabled?: boolean; locked?: boolean }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-background p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[14px] font-semibold">{addon.title}</p>
            {addon.tier === 'premium' && (
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Premium" />
            )}
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{addon.tagline}</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[12px] font-bold">
          {priceLabel(addon.priceCents)}
        </span>
      </div>
      <ul className="mt-2.5 space-y-1">
        {addon.includes.map((inc) => (
          <li key={inc} className="flex items-start gap-1.5 text-[11.5px] leading-snug text-muted-foreground">
            <Check className="mt-[2px] h-3 w-3 shrink-0 text-primary" />
            <span>{inc}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onBuy}
        disabled={disabled}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {locked ? (
          <>
            <Lock className="h-3.5 w-3.5" /> Finish the test to unlock
          </>
        ) : (
          <>
            Get it for {priceLabel(addon.priceCents)}
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>

    </div>
  );
}
