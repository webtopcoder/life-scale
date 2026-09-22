import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_PRICING } from "@/lib/upsellPricing";
import { AlertTriangle, Clock, Eye, BrainCircuit, Star } from "lucide-react";

interface WeaknessReportUpsellProps {
  onPurchase: () => void;
  loading?: boolean;
  isWinBack?: boolean;
}

export function WeaknessReportUpsell({ onPurchase, loading, isWinBack }: WeaknessReportUpsellProps) {
  const { originalLabel: price, originalDiscount: discount } = PRODUCT_PRICING.weakness_report;
  const ctaLabel = isWinBack ? `Special Offer — ${price}` : `Get My Weakness Report — ${price}`;

  return (
    <Card className="relative overflow-hidden border-2 border-warning/30 bg-gradient-to-br from-card to-warning/5">
      {isWinBack && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold text-center py-1.5 tracking-wider uppercase">
          🔥 Last Chance — Special Price
        </div>
      )}
      <CardContent className="p-6 sm:p-8">
        {/* Icon & title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground">Weakness Report</h3>
            <p className="text-sm text-muted-foreground">Deep Error Analysis</p>
          </div>
        </div>

        {/* Hook */}
        <p className="text-foreground font-extrabold text-lg mb-1">
          Your IQ Is Strong But...{" "}
          <span className="text-warning">Here's What's Holding You Back</span>
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          If fixed, your score would be in the top 1% worldwide.
        </p>

        {/* What's included */}
        <ul className="space-y-3 mb-5">
          {[
            { icon: AlertTriangle, text: "Category-by-category breakdown" },
            { icon: BrainCircuit, text: "Rushed errors, misreads, logic gaps" },
            { icon: Clock, text: "Where you lost points to the clock" },
            { icon: Eye, text: "Hidden weaknesses you didn't notice" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </li>
          ))}
        </ul>

        {/* Social proof */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />)}
          </div>
          <span className="text-sm font-semibold text-foreground">4.8</span>
          <span className="text-xs text-muted-foreground">· 32,000+ purchased</span>
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-3xl font-bold text-foreground">{price}</span>
          <span className="text-lg text-muted-foreground line-through">$34.99</span>
          <Badge className="bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1">
            {discount}
          </Badge>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>

        {/* CTA */}
        <Button
          onClick={onPurchase}
          disabled={loading}
          className="w-full h-12 text-base font-semibold bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] animate-pulse-subtle"
          size="lg"
        >
          {loading ? "Processing…" : ctaLabel}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          One-time purchase · Instant delivery · Based on your real answers
        </p>
      </CardContent>
    </Card>
  );
}
