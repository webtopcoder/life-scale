import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_PRICING } from "@/lib/upsellPricing";
import { Compass, BookOpen, Briefcase, MessageCircle, TrendingUp, Users, Star } from "lucide-react";

interface GeniusBlueprintUpsellProps {
  onPurchase: () => void;
  loading?: boolean;
  isWinBack?: boolean;
}

export function GeniusBlueprintUpsell({ onPurchase, loading, isWinBack }: GeniusBlueprintUpsellProps) {
  const { originalLabel: price, originalDiscount: discount } = PRODUCT_PRICING.genius_blueprint;
  const ctaLabel = isWinBack ? `Special Offer — ${price}` : `Get My Genius Blueprint — ${price}`;

  return (
    <Card className="relative overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-card to-accent/5">
      {isWinBack && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold text-center py-1.5 tracking-wider uppercase">
          🔥 Last Chance — Special Price
        </div>
      )}
      <CardContent className="p-6 sm:p-8">
        {/* Icon & title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Compass className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground">Genius Blueprint</h3>
            <p className="text-sm text-muted-foreground">Your Cognitive Success Map</p>
          </div>
        </div>

        {/* Hook */}
        <p className="text-foreground font-extrabold text-lg mb-1">
          Why People With Your Same IQ{" "}
          <span className="text-accent">Typically Outperform You</span>
        </p>

        {/* What's included */}
        <ul className="space-y-3 my-5">
          {[
            { icon: Briefcase, text: "Career matches — make sure you work on the right thing for your profile" },
            { icon: BookOpen, text: "Learning style — find out how your brain absorbs info best" },
            { icon: TrendingUp, text: "Business strengths — see if you're built for entrepreneurship" },
            { icon: MessageCircle, text: "Communication style — how your brain shapes the way you connect" },
            { icon: Compass, text: "Growth roadmap — what to focus on next to level up" },
            { icon: Users, text: "Famous minds with a similar score to yours" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </li>
          ))}
        </ul>

        {/* Social proof */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />)}
          </div>
          <span className="text-sm font-semibold text-foreground">4.9</span>
          <span className="text-xs text-muted-foreground">· 28,000+ purchased</span>
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
          One-time purchase · Personalized to your exact score · AI-generated insights
        </p>
      </CardContent>
    </Card>
  );
}
