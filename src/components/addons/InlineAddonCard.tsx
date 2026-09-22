import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import {
  addonByKey, addonCheckoutPath, priceLabel, type Addon,
} from '@/lib/addons';
import { useOwnedAddons } from '@/hooks/useOwnedAddons';

/**
 * Color-differentiated add-on card for use inside a report section.
 *
 * The surface is tinted with the branch's primary color so it no longer
 * blends into the neutral report cards. It still reads as a premium row,
 * not a bargain banner — no emojis, zaps, or countdowns.
 *
 * `teaser` replaces the catalog tagline with a curiosity line specific to the
 * report section it sits under. Keep it curiosity-shaped: name what the add-on
 * answers, never restate a finding the report already gave away.
 */
export default function InlineAddonCard({
  addonKey, teaser,
}: {
  addonKey: string;
  teaser?: string;
}) {
  const navigate = useNavigate();
  const { owned, loading } = useOwnedAddons();
  const addon: Addon | null = addonByKey(addonKey);

  if (!addon || loading) return null;

  // Already purchased: the report says nothing about it. The dashboard
  // "Add-Ons" list is where owned items stay reachable.
  if (owned.has(addon.key)) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(addonCheckoutPath(addon))}
      className="group mt-5 flex w-full items-start gap-3 rounded-xl border border-primary/20 border-l-4 border-l-primary bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-4 py-3.5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 active:scale-[0.99]"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Lock className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Add-on
        </p>
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-foreground">{addon.title}</p>
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {`Unlock — ${priceLabel(addon.priceCents)}`}
          </span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-foreground/80">
          {teaser ?? addon.tagline}
        </p>
      </div>
      <ArrowRight className="mt-2.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
    </button>
  );
}
