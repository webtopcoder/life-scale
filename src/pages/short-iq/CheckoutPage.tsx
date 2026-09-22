import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Gift, Lock, ShieldCheck, Star } from 'lucide-react';
import { LifeScaleCheckout } from '@/components/LifeScaleCheckout';
import { LEGACY_DEFAULT_OFFER_ID } from '@/lib/lifeScaleOffers';
import {
  SHORT_IQ_PROMO_PERCENT,
  SHORT_IQ_SUBSCRIPTION_MONTHLY_CENTS,
  SHORT_IQ_TRIAL_DUE_CENTS,
} from '@/services/breezeConfig';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import brainIcon from '@/assets/brain-icon.png';
import { formatUsdFromCents } from '@/lib/money';
import structuredIcon from '@/assets/Structured_assessment.png';
import reportIcon from '@/assets/Personalized_report.png';
import avatarDanielCarter from '@/assets/Daniel_Carter.png';
import avatarDanielFoster from '@/assets/Daniel_Foster.png';
import avatarLucasBennett from '@/assets/Lucas_Bennett.png';

const CARD_RELIABILITY = [
  { icon: structuredIcon, title: 'Modeled on standardized IQ testing', desc: 'Calibrated against WAIS-style benchmarks' },
  { icon: reportIcon, title: 'Personalized IQ profile', desc: 'See exactly where your intelligence is strongest' },
];

const INSIDE_REPORT = [
  'Your full IQ score (0–160 scale)',
  'How you rank vs. the global population',
  'Your strongest reasoning type (verbal, logical, spatial, memory)',
  'A breakdown of where you scored above 130',
];

const HERO_TITLE = 'Your IQ Score Is Ready';
const HERO_CTA = 'Unlock my IQ Score';
const REPORT_TITLE = 'Your Report';

const TESTIMONIALS = [
  { name: 'Daniel Carter', date: 'February 15, 2026', avatar: avatarDanielCarter,
    quote: 'Finally a number that explains how I think.',
    body: "My IQ came back at 132 — top 2%. The verbal-reasoning breakdown matched exactly how I've always processed problems." },
  { name: 'Daniel Foster', date: 'March 4, 2026', avatar: avatarDanielFoster,
    quote: 'The percentile rank was the eye-opener.',
    body: 'I scored in the top 8% globally. Seeing my logical reasoning and pattern recognition called out specifically was way more useful than a generic number.' },
  { name: 'Lucas Bennett', date: 'March 11, 2026', avatar: avatarLucasBennett,
    quote: 'Way more rigorous than the free IQ tests online.',
    body: "The report broke my score down by reasoning type and showed me where I'm above 130. It actually changed how I approach problem-solving at work." },
];

const SHORT_IQ_MONTHLY_LABEL = `${formatUsdFromCents(SHORT_IQ_SUBSCRIPTION_MONTHLY_CENTS)}/month`;

const FAQ = [
  {
    q: 'How much does the IQ report cost?',
    a: `Start with a 3-day trial for $1.00. After the trial, it's ${SHORT_IQ_MONTHLY_LABEL}. You can cancel anytime before the trial ends to avoid further charges.`,
  },
  {
    q: 'What happens after 3 days?',
    a: `Your 3-day trial is $1.00. After that, it's ${SHORT_IQ_MONTHLY_LABEL} until you cancel.`,
  },
  {
    q: 'How is my IQ score calculated?',
    a: 'Your IQ score is derived from your answers across verbal reasoning, logical reasoning, pattern recognition, and working memory, then normalized against a standardized population distribution (mean 100, SD 15).',
  },
  {
    q: "What's included in the full IQ report?",
    a: 'Your full IQ score, your percentile rank vs. the global population, a per-domain breakdown (verbal, logical, spatial, memory), and a clear view of where your reasoning is strongest.',
  },
];

function formatUsdLabel(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function useCountdown(totalSeconds: number) {
  const [secs, setSecs] = useState(totalSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

const scrollToFirstBullet = () => {
  const el = document.getElementById('first-report-bullet');
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};
const scrollToLastBullet = () => {
  const el = document.getElementById('last-report-bullet');
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

const StickyDiscountBar = () => {
  const time = useCountdown(7 * 60 + 1);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#F5FCFF]/95 backdrop-blur border-b border-border">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="leading-tight">
          <p className="text-[11px] text-foreground/80">Your discount is reserved for:</p>
          <p className="text-lg font-extrabold text-foreground tabular-nums">{time}</p>
        </div>
        <button onClick={scrollToFirstBullet}
          className="font-bold text-sm tracking-wider px-6 h-10 rounded-full bg-[#0088D1] hover:bg-[#0088D1]/90 text-white">
          CONTINUE
        </button>
      </div>
    </div>
  );
};

const SuccessCheckmark = ({ fadingOut }: { fadingOut: boolean }) => (
  <>
    <style>{`
      @keyframes hero-check-ring { from { stroke-dashoffset: 170; } to { stroke-dashoffset: 0; } }
      @keyframes hero-check-fill { from { fill-opacity: 0; } to { fill-opacity: 1; } }
      @keyframes hero-check-mark { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
      .hero-check-ring { stroke-dasharray: 170; stroke-dashoffset: 170; animation: hero-check-ring 600ms ease-out forwards; }
      .hero-check-fill { fill-opacity: 0; animation: hero-check-fill 200ms ease-out 600ms forwards; }
      .hero-check-mark { stroke-dasharray: 40; stroke-dashoffset: 40; animation: hero-check-mark 300ms ease-out 800ms forwards; }
    `}</style>
    <svg viewBox="0 0 60 60" style={{ willChange: 'opacity' }}
      className={`w-[15.4rem] h-[15.4rem] mx-auto transition-opacity duration-700 ease-in-out ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
      fill="none" aria-hidden="true">
      <circle cx="30" cy="30" r="27" className="hero-check-fill" fill="hsl(var(--primary))" />
      <circle cx="30" cy="30" r="27" className="hero-check-ring" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" transform="rotate(-90 30 30)" />
      <path d="M19 31 L27 39 L42 22" className="hero-check-mark" stroke="hsl(var(--primary-foreground))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </>
);

const BlurredScoreBadge = () => (
  <div className="w-44 h-44 mx-auto flex items-center justify-center cursor-pointer" aria-hidden onClick={scrollToFirstBullet}>
    <div className="relative w-44 h-44 rounded-full border-[6px] border-primary bg-white flex items-center justify-center select-none pointer-events-none shadow-[0_0_0_8px_rgba(0,136,209,0.25),0_20px_40px_-10px_rgba(0,136,209,0.35)]">
      <span className="text-8xl font-bold text-foreground" style={{ filter: 'blur(9px)' }}>###</span>
      <div className="absolute -inset-8 rounded-full bg-transparent backdrop-blur-[14px]" />
    </div>
  </div>
);

const HeroSection = () => {
  const [fadingOut, setFadingOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { requestAnimationFrame(() => setFadingOut(true)); }, 1150);
    return () => clearTimeout(t);
  }, []);
  return (
    <section className="bg-[#F5FCFF] px-4 pt-6 pb-8">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h1 className="text-[26px] leading-[32px] font-semibold text-foreground">{HERO_TITLE}</h1>
        <div className="relative w-full max-w-md mx-auto">
          <div className="py-6"><BlurredScoreBadge /></div>
          <div className={`absolute inset-0 flex items-center justify-center bg-[#F5FCFF] transition-opacity duration-700 ease-in-out ${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <SuccessCheckmark fadingOut={fadingOut} />
          </div>
        </div>
        <Button onClick={scrollToFirstBullet}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-[#0088D1] hover:bg-[#0088D1]/90 text-white">
          {HERO_CTA}
        </Button>
      </div>
    </section>
  );
};

type ReliabilityItem = { icon?: string; title: string; desc: string };

type ReportPricingCardProps = {
  title: string;
  items: string[];
};

const ReportPricingCard = ({
  title,
  items,
}: ReportPricingCardProps) => (
  <section id="pricing" className="px-4 pb-4 bg-[#F5FCFF]">
    <div className="max-w-xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <img src={brainIcon} alt="" className="w-6 h-6" />
            <h3 className="text-[26px] leading-[32px] font-semibold text-foreground">{title}</h3>
          </div>
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li key={item}
                id={i === 0 ? 'first-report-bullet' : i === items.length - 1 ? 'last-report-bullet' : undefined}
                className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-base leading-5 text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={scrollToLastBullet}
            className="w-full text-left bg-primary/5 border border-dashed border-primary/30 rounded-xl px-3 sm:px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-primary/10 transition-colors">
            <Gift className="w-7 h-7 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground leading-tight text-base">Promo Code IQ88 Applied</p>
              <p className="text-muted-foreground text-sm">88% Discount Included</p>
            </div>
            <span className="bg-primary text-primary-foreground font-bold rounded-full py-1 flex-shrink-0 text-sm px-2">{SHORT_IQ_PROMO_PERCENT}%</span>
          </button>
          <div className="rounded-xl border-2 border-[#2b6199] overflow-hidden bg-white">
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-baseline justify-between px-1">
                <span className="text-xl font-bold text-foreground">Due today:</span>
                <span className="text-xl font-bold text-foreground">{formatUsdLabel(SHORT_IQ_TRIAL_DUE_CENTS)}</span>
              </div>
              <div id="payment-form" className="space-y-3">
                <div id="lifescale-checkout-container" className="relative min-h-[200px]">
                  <LifeScaleCheckout
                    offerId={LEGACY_DEFAULT_OFFER_ID}
                    successPath="/main-dashboard"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground leading-tight">30-Day Money-Back Guarantee</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);

const ReliabilityUnlockCard = ({ reliability }: { reliability: ReliabilityItem[] }) => (
  <section className="px-4 pb-4 bg-[#F5FCFF]">
    <div className="max-w-xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-4">
            {reliability.map((r) => (
              <div key={r.title} className="flex gap-3 items-start">
                <img src={r.icon ?? structuredIcon} alt="" className="w-7 h-7 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-foreground leading-tight">{r.title}</p>
                  <p className="text-sm leading-snug text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <div aria-hidden className="space-y-3 blur-[6px] select-none pointer-events-none">
              <div className="h-4 rounded bg-muted w-11/12" />
              <div className="h-4 rounded bg-muted w-10/12" />
              <div className="h-4 rounded bg-muted w-9/12" />
              <div className="h-4 rounded bg-muted w-11/12" />
              <div className="h-4 rounded bg-muted w-8/12" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="bg-primary rounded-full p-2 mb-2">
                <Lock className="w-4 h-4 text-primary-foreground" />
              </div>
              <p className="text-base leading-5 font-bold text-primary">
                Unlock the full report to see your IQ score<br />and how you rank against the top 3%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="px-4 py-8 bg-[#F5FCFF] space-y-4">
    <div className="max-w-xl mx-auto space-y-4">
      {TESTIMONIALS.map((t) => (
        <Card key={t.name}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[hsl(40_95%_55%)] text-[hsl(40_95%_55%)]" />
                ))}
              </div>
            </div>
            <p className="font-bold text-foreground">"{t.quote}"</p>
            <p className="text-base leading-5 text-muted-foreground/80">{t.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
);

const FaqSection = () => (
  <section className="px-4 py-10 bg-[#F5FCFF]">
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-[26px] leading-[32px] font-semibold text-foreground">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
        {FAQ.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/70">
            <AccordionTrigger className="text-left font-bold text-foreground hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-base leading-5 text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

const CheckoutPageShortIq = () => {
  useEffect(() => {
    trackFacebookPixelEvent('ViewContent', {
      page: 'short_iq_checkout',
      flow: 'short-iq',
    });
    trackFacebookPixelEvent('InitiateCheckout', {
      page: 'short_iq_checkout',
      value: SHORT_IQ_TRIAL_DUE_CENTS / 100,
      currency: 'USD',
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F5FCFF] font-display text-foreground">
      <StickyDiscountBar />
      <div className="h-16" />
      <HeroSection />
      <ReportPricingCard
        title={REPORT_TITLE}
        items={INSIDE_REPORT}
      />
      <ReliabilityUnlockCard reliability={CARD_RELIABILITY} />
      <TestimonialsSection />
      <FaqSection />
    </div>
  );
};

export default CheckoutPageShortIq;
