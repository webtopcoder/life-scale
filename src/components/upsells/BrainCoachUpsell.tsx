import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_PRICING } from "@/lib/upsellPricing";
import { MessageSquare, Brain, Target, Sparkles, Zap, Star } from "lucide-react";

interface BrainCoachUpsellProps {
  onPurchase: () => void;
  loading?: boolean;
  isWinBack?: boolean;
}

export function BrainCoachUpsell({ onPurchase, loading, isWinBack }: BrainCoachUpsellProps) {
  const { originalLabel: price, originalDiscount: discount } = PRODUCT_PRICING.brain_coach;
  const ctaLabel = isWinBack ? `Special Offer — ${price}` : `Unlock Brain Coach — ${price}`;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      {isWinBack && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold text-center py-1.5 tracking-wider uppercase">
          🔥 Last Chance — Special Price
        </div>
      )}
      <CardContent className="p-6 sm:p-8">
        {/* Icon & title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground">IQ Brain Coach</h3>
            <p className="text-sm text-muted-foreground">AI-Powered Personal Coaching</p>
          </div>
        </div>

        {/* Hook */}
        <p className="text-foreground font-extrabold text-lg mb-1">
          We Know You Can Get There.{" "}
          <span className="text-primary">But Maybe Not All Alone.</span>
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          Most people never improve after testing. This makes sure you're not one of them.
        </p>

        {/* Value props */}
        <ul className="space-y-3 mb-5">
          {[
            { icon: Brain, text: "A guided learning coach built around your actual IQ results" },
            { icon: Target, text: "Exercises that focus on your weakest areas" },
            { icon: Sparkles, text: "Dedicated to make sure you improve" },
            { icon: Zap, text: "Unlimited chats, lifetime access" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </li>
          ))}
        </ul>

        {/* Social proof */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />)}
          </div>
          <span className="text-sm font-semibold text-foreground">4.7</span>
          <span className="text-xs text-muted-foreground">· 55,000+ users</span>
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-3xl font-bold text-foreground">{price}</span>
          <span className="text-lg text-muted-foreground line-through">$49.99</span>
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
          One-time purchase · Lifetime access · No subscription
        </p>
      </CardContent>
    </Card>
  );
}
