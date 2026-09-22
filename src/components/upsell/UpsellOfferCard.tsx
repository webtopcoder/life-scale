import { motion } from 'framer-motion';
import { Check, Clock, Shield, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { priceLabel, type Addon } from '@/lib/addons';
import type { UpsellOffer } from '@/lib/upsellOffers';

interface UpsellOfferCardProps {
  addon: Addon;
  offer: UpsellOffer;
  /** Preview mode makes the CTA inert. */
  inert?: boolean;
  /** Hide buy/skip — e.g. when a payment widget is rendered below. */
  hideActions?: boolean;
  onBuy?: () => void;
  onSkip?: () => void;
}

function discountLabel(regular: string, cents: number): string | null {
  const reg = Number(regular.replace(/[^0-9.]/g, ''));
  if (!reg || !cents) return null;
  const pct = Math.round((1 - cents / 100 / reg) * 100);
  return pct > 0 ? `${pct}% off` : null;
}

function skipLabel(priceCents: number): string {
  if (priceCents >= 500) return 'Skip your premium one-time offer \u2192';
  if (priceCents >= 300) return 'Skip your one-time offer \u2192';
  return 'Skip';
}

const UpsellOfferCard = ({ addon, offer, inert, hideActions, onBuy, onSkip }: UpsellOfferCardProps) => {
  const discount = discountLabel(offer.regularPriceLabel, addon.offerPriceCents);
  const tier = offer.variant ?? 'standard';
  const premium = tier === 'premium';
  const flagship = tier === 'flagship';
  const banded = premium || flagship;

  const shell = flagship
    ? 'max-w-2xl border-primary/45 shadow-xl shadow-primary/20 pb-8'
    : premium
      ? 'max-w-xl border-primary/30 shadow-lg shadow-primary/10 pb-7'
      : 'max-w-lg border-border px-5 py-8 sm:px-7 space-y-7';

  const header = flagship
    ? 'relative bg-gradient-to-b from-primary/20 via-primary/[0.08] to-transparent border-b border-primary/25 px-6 sm:px-10 pt-8 pb-6 space-y-4'
    : premium
      ? 'bg-primary/[0.07] border-b border-primary/15 px-5 sm:px-8 pt-6 pb-4 space-y-3'
      : 'space-y-6';

  const body = flagship
    ? 'px-6 sm:px-10 pt-6 space-y-6'
    : premium
      ? 'px-5 sm:px-8 pt-4 space-y-4'
      : 'space-y-7';

  const ctaClass = flagship
    ? 'relative overflow-hidden w-full h-14 text-base font-extrabold uppercase tracking-[0.08em] rounded-xl bg-gradient-to-b from-primary/95 via-primary to-primary/80 text-primary-foreground ring-1 ring-inset ring-primary-foreground/25 shadow-xl shadow-primary/45 transition-[transform,box-shadow] duration-150 active:scale-[0.98] active:shadow-md active:shadow-primary/30 before:pointer-events-none before:absolute before:inset-x-3 before:top-1 before:h-px before:bg-primary-foreground/45 after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1/2 after:bg-gradient-to-b after:from-primary-foreground/18 after:to-transparent'
    : premium
      ? 'relative overflow-hidden w-full h-[52px] font-extrabold uppercase tracking-[0.07em] rounded-xl bg-gradient-to-b from-primary/90 via-primary to-primary/85 text-primary-foreground ring-1 ring-inset ring-primary-foreground/20 shadow-lg shadow-primary/35 transition-[transform,box-shadow] duration-150 active:scale-[0.98] active:shadow-sm active:shadow-primary/20 before:pointer-events-none before:absolute before:inset-x-3 before:top-1 before:h-px before:bg-primary-foreground/35 after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1/2 after:bg-gradient-to-b after:from-primary-foreground/12 after:to-transparent'
      : 'w-full font-bold';


  return (
    <div className={`relative w-full mx-auto overflow-hidden rounded-2xl border bg-card ${shell}`}>
      {flagship && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      )}

      <div className={header}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <span
            className={`inline-flex items-center text-[11px] uppercase text-center ${
              flagship
                ? 'gap-2 px-5 py-2 rounded-full font-semibold tracking-[0.26em] text-foreground bg-gradient-to-b from-primary/25 to-primary/[0.06] border border-primary/40 shadow-sm ring-1 ring-inset ring-primary/20'
                : premium
                  ? 'gap-2 px-4 py-1.5 rounded-full font-semibold tracking-[0.22em] text-foreground/90 bg-gradient-to-b from-foreground/[0.09] to-transparent border border-foreground/20 shadow-sm ring-1 ring-inset ring-foreground/5'
                  : offer.eyebrowTone === 'urgency'
                    ? 'gap-1.5 px-3.5 py-1.5 rounded-full font-bold tracking-wider border bg-background text-destructive border-destructive/40'
                    : 'gap-1.5 px-3.5 py-1.5 rounded-full font-bold tracking-wider border bg-yellow-400 text-black border-yellow-500/60'
            }`}
          >
            {banded ? (
              <Sparkles className={`w-3 h-3 shrink-0 ${flagship ? 'text-primary' : 'opacity-70'}`} />
            ) : (
              <Clock className="w-3.5 h-3.5 shrink-0" />
            )}
            {offer.eyebrow}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-center space-y-2"
        >
          <h2
            className={`font-extrabold text-foreground leading-tight tracking-tight ${
              flagship ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
            }`}
          >
            {offer.headline && (
              <>
                {offer.headline}
                <br />
              </>
            )}
            <span className="text-primary">{offer.highlight}</span>
          </h2>
        </motion.div>
      </div>

      <div className={body}>
        <div className={flagship ? 'space-y-4' : premium ? 'space-y-3.5' : 'space-y-5'}>
          {offer.valueProps.map(({ icon: Icon, text }, i) => {
            const isLast = i === offer.valueProps.length - 1;
            return (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    flagship
                      ? 'bg-primary/15 ring-1 ring-inset ring-primary/40'
                      : premium
                        ? 'border border-primary/40 bg-primary/[0.06]'
                        : 'bg-primary/10'
                  }`}
                >
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span
                  className={`text-foreground leading-snug ${
                    banded ? 'text-[15px]' : 'text-sm'
                  } ${isLast ? 'font-bold' : ''}`}
                >
                  {text}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">{offer.rating}</span>
          <span className="text-xs text-muted-foreground">· {offer.purchaseCount}</span>
        </div>

        {offer.proofLine && (
          <p className="text-center text-sm italic text-muted-foreground leading-snug">
            {offer.proofLine}
          </p>
        )}

        {offer.contentsList && offer.contentsList.length > 0 && (
          <div
            className={
              flagship
                ? 'rounded-xl border border-primary/25 bg-primary/[0.05] p-5 space-y-3'
                : 'rounded-xl border border-primary/15 bg-primary/[0.04] p-4 space-y-2'
            }
          >
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">What you get</div>
            {flagship && <div className="h-px bg-primary/20" />}
            {offer.contentsList.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground leading-snug">{item}</span>
              </div>
            ))}
          </div>
        )}

        <div
          className={`rounded-xl text-center space-y-2 ${
            flagship
              ? 'bg-gradient-to-b from-primary/[0.12] to-primary/[0.04] border border-primary/30 shadow-sm p-6'
              : premium
                ? 'bg-primary/[0.06] border border-primary/15 p-5'
                : 'bg-muted/50 p-6 space-y-3'
          }`}
        >
          <div className="text-sm text-muted-foreground">
            Regular price <span className="line-through">{offer.regularPriceLabel}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <span className={`font-extrabold text-foreground ${flagship ? 'text-4xl' : 'text-3xl'}`}>
              {priceLabel(addon.offerPriceCents)}
            </span>
            {discount && (
              <span
                className={`bg-primary text-primary-foreground font-bold rounded-full ${
                  flagship ? 'text-xs px-3 py-1.5 shadow-sm shadow-primary/30' : 'text-xs px-2.5 py-1'
                }`}
              >
                {discount}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">one-time payment</div>
        </div>

        {!hideActions && (
          <div className={banded ? 'space-y-3' : 'space-y-4'}>
            <Button
              size="lg"
              className={ctaClass}
              onClick={inert ? undefined : onBuy}
            >
              <span className="relative z-10">{offer.ctaLabel}</span>
            </Button>
            <button
              type="button"
              onClick={inert ? undefined : onSkip}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {skipLabel(addon.offerPriceCents)}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>{offer.guarantee}</span>
        </div>
      </div>
    </div>
  );
};

export default UpsellOfferCard;
