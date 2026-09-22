import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EmailCaptureView } from '@/components/EmailCaptureView';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, Star, Lock, MapPin, Lightbulb, TrendingUp, ChevronRight, ShieldCheck } from 'lucide-react';
import { PlanSelectionTimerBar } from '@/components/preview/PlanSelectionTimerBar';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import type { CheckoutPlanId } from '@/services/breezeConfig';

import avatarJames from '@/assets/avatar-james.jpg';
import avatarMei from '@/assets/avatar-mei.jpg';
import avatarSophie from '@/assets/avatar-sophie.jpg';

const IQ_COMPARISON_IMAGE = '/iq-comparison.png';

const CHECKOUT_EMAIL_OVERLAY_ENABLED = import.meta.env.VITE_CHECKOUT_EMAIL_OVERLAY !== 'false';

const BENEFITS = [
  'Your exact IQ score and report',
  'Where you rank compared to your peers',
  'Your intelligence strengths and weaknesses',
  'Personalized insights based on your results',
];

type PlanDisplay = {
  id: CheckoutPlanId;
  label: string;
  oldTotal: string;
  newTotal: string;
  oldPerDay: string;
  perDayDollars: string;
  perDayCents: string;
  discountPercent: number;
  badge?: string;
  popular?: boolean;
};

const PLANS: PlanDisplay[] = [
  { id: '1w', label: '1-WEEK PLAN', oldTotal: '$9.99', newTotal: '$4.99', oldPerDay: '$1.43', perDayDollars: '0', perDayCents: '71', discountPercent: 50, badge: 'LIMITED TIME ONLY' },
  { id: '4w', label: '4-WEEK PLAN', oldTotal: '$29.99', newTotal: '$14.99', oldPerDay: '$1.07', perDayDollars: '0', perDayCents: '54', discountPercent: 50, badge: 'Most Popular', popular: true },
  { id: '12w', label: '12-WEEK PLAN', oldTotal: '$59.99', newTotal: '$29.99', oldPerDay: '$0.71', perDayDollars: '0', perDayCents: '36', discountPercent: 50, badge: 'BEST VALUE' },
];

const LEARN_HOW_TO = [
  'Think sharper every day',
  'Use your natural strengths',
  'Remember more and forget less',
  'Make better decisions faster',
];

const FAQ_ITEMS_BASE = [
  { q: 'Is this test accurate?', a: 'Yes — our test is based on proven methods used by professionals. It gives you a reliable picture of how your brain works.' },
  { q: 'Can I cancel anytime?', a: 'Yes, cancel whenever you want. No fees, no questions asked.' },
  { q: 'What\'s in my report?', a: 'Your IQ score, how you rank against others, a breakdown of 5 brain areas, career suggestions, and tips to get smarter.' },
];


function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.max(0, totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const TESTIMONIALS = [
  { name: 'Sophie L.', age: 28, location: 'London, UK', quote: 'The report showed me exactly where my brain excels. It changed how I work and study.', avatar: avatarSophie },
  { name: 'James R.', age: 34, location: 'New York, US', quote: 'The career suggestions were spot on. I\'m already making moves based on my results.', avatar: avatarJames },
  { name: 'Mei C.', age: 31, location: 'Singapore', quote: 'After 3 weeks of the brain exercises, I noticed a real difference in my focus.', avatar: avatarMei },
];

const SOCIAL_PROOF_ENTRIES = [
  { name: 'John', flag: '🇺🇸' }, { name: 'Priya', flag: '🇮🇳' }, { name: 'Hans', flag: '🇩🇪' },
  { name: 'Yuki', flag: '🇯🇵' }, { name: 'Sofia', flag: '🇪🇸' }, { name: 'Liam', flag: '🇬🇧' },
  { name: 'Fatima', flag: '🇸🇦' }, { name: 'Carlos', flag: '🇧🇷' }, { name: 'Mei', flag: '🇨🇳' },
  { name: 'Pierre', flag: '🇫🇷' }, { name: 'Kim', flag: '🇰🇷' }, { name: 'Isabella', flag: '🇮🇹' },
];

type PlanSelectionPageProps = {
  /** Unguarded preview at /preview/plan-selection — no funnel or payment navigation. */
  previewMode?: boolean;
};

const PlanSelectionPage = ({ previewMode = false }: PlanSelectionPageProps) => {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch, goToStage } = useFunnel();

  const [proofIndex, setProofIndex] = useState(0);
  const [localPlan, setLocalPlan] = useState<CheckoutPlanId>('4w');
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);

  const selectedPlan = previewMode ? localPlan : (state.selectedPlanId ?? '4w');
  const setSelectedPlan = (id: CheckoutPlanId) => {
    if (previewMode) {
      setLocalPlan(id);
    } else {
      dispatch({ type: 'SET_SELECTED_PLAN', planId: id });
    }
  };

  const showCheckoutEmailGate =
    !previewMode && CHECKOUT_EMAIL_OVERLAY_ENABLED && !state.email.trim();
  const wasEmailGateOpenRef = useRef(showCheckoutEmailGate);

  useEffect(() => {
    if (wasEmailGateOpenRef.current && !showCheckoutEmailGate) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    wasEmailGateOpenRef.current = showCheckoutEmailGate;
  }, [showCheckoutEmailGate]);

  useEffect(() => {
    if (previewMode) return;
    trackFacebookPixelEvent('ViewContent', {
      page: 'checkout_plans',
    });
  }, [previewMode]);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProofIndex((prev) => (prev + 1) % SOCIAL_PROOF_ENTRIES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const faqItems = useMemo(() => FAQ_ITEMS_BASE, []);

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const stickyEl = document.getElementById('checkout-sticky-header');
    const stickyHeight = stickyEl ? stickyEl.offsetHeight : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - stickyHeight - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleScrollCTA = () => scrollToElement('promo-banner');

  const handleGetMyReport = () => {
    if (previewMode) {
      handleScrollCTA();
      return;
    }
    dispatch({ type: 'SET_SELECTED_PLAN', planId: selectedPlan });
    trackEvent(posthog, EVENTS.CHECKOUT_CTA_CLICKED, {
      location: 'checkout_plans',
      button: 'primary',
      plan_id: selectedPlan,
    });
    goToStage('checkout-plans-pay');
    navigate({
      pathname: '/onboarding-plans/pay',
      search: searchParams.toString(),
    });
  };

  const handleTimerContinue = () => {
    const cardContainer = document.getElementById('comparison-cards');
    const stickyEl = document.getElementById('checkout-sticky-header');
    if (!cardContainer || !stickyEl) return;
    const cardBottom = cardContainer.getBoundingClientRect().bottom + window.scrollY;
    const stickyHeight = stickyEl.offsetHeight;
    window.scrollTo({ top: cardBottom - stickyHeight, behavior: 'smooth' });
  };

  const proofEntry = SOCIAL_PROOF_ENTRIES[proofIndex];

  return (
    <div className="min-h-screen bg-background relative">
      {!previewMode && (
        <Dialog open={showCheckoutEmailGate}>
          <DialogContent
            className="fixed inset-0 left-0 top-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto overscroll-y-contain rounded-none border-0 bg-background p-0 shadow-none duration-200 sm:rounded-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 [&>button]:hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <EmailCaptureView embeddedInCheckout />
          </DialogContent>
        </Dialog>
      )}

      <div id="checkout-sticky-header" className="sticky top-0 z-50">
        <div className="bg-[#efeeff] border-b border-border px-4 h-8 relative overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={proofIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span className="text-base">{proofEntry.flag}</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{proofEntry.name}</span> just claimed their full report
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <PlanSelectionTimerBar onContinue={handleTimerContinue} />
      </div>

      <section id="trial-section" className="max-w-5xl mx-auto px-4 pt-6 pb-6 md:pt-8 md:pb-8 overflow-x-hidden bg-card rounded-xl">
        <div className="max-w-lg mx-auto space-y-8">
          <motion.div
            id="comparison-cards"
            initial={{ opacity: 1, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center cursor-pointer"
            onClick={handleScrollCTA}
          >
            <img
              src={IQ_COMPARISON_IMAGE}
              alt="IQ comparison: Steve Jobs 160, You ??, Albert Einstein 180"
              className="w-full max-w-md h-auto"
              loading="eager"
              decoding="async"
            />
          </motion.div>

          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
            Find Out Your <span className="text-primary">Brain Strengths</span>
          </h2>

          <div id="promo-banner" className="bg-[#4338ca] text-white rounded-full px-5 py-3 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold scroll-mt-[116px]">
            <span>🔥 Special Offer - ends in:</span>
            <span className="tabular-nums font-bold">{formatTimer(secondsLeft)}</span>
          </div>

          <div className="space-y-3">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isPopular = !!plan.popular;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left rounded-2xl overflow-hidden border transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'
                  } ${isPopular ? 'bg-primary/5' : 'bg-card'}`}
                >
                  {isSelected && plan.badge && (
                    <div className="bg-primary text-primary-foreground text-center text-xs font-bold uppercase tracking-wider py-1.5">
                      {plan.badge}
                    </div>
                  )}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <p className="text-lg font-extrabold text-foreground uppercase tracking-tight">{plan.label}</p>
                      <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-0.5 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        SAVE {plan.discountPercent}%
                      </span>
                      <p className="text-sm">
                        <span className="line-through text-muted-foreground mr-1.5">{plan.oldTotal}</span>
                        <span className="text-foreground font-semibold">{plan.newTotal}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="line-through text-muted-foreground text-sm">{plan.oldPerDay}</span>
                      <div className="flex items-start">
                        <span className="text-xl font-bold text-foreground mt-1">$</span>
                        <span className="text-4xl font-extrabold text-foreground leading-none">{plan.perDayDollars}</span>
                        <div className="flex flex-col items-start ml-0.5">
                          <span className="text-base font-bold text-foreground leading-none">{plan.perDayCents}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">per day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            className="w-full py-7 text-lg font-bold rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg mb-4"
            onClick={handleGetMyReport}
          >
            Get My Report
          </Button>

          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Pay safe &amp; secure
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 pt-4 pb-6">
        <h2 className="text-2xl font-bold text-center text-foreground mb-3">Sneak Peek at Your Report</h2>
        <p className="text-center text-sm text-muted-foreground max-w-lg mx-auto mb-6">Your results hint at remarkable cognitive strengths and hidden potential. Early indicators suggest you rank among top performers in key areas — your logic and pattern recognition abilities stand out as truly impressive.</p>
        <Card className="relative overflow-hidden shadow-[var(--shadow-card)]">
          <CardContent className="p-8 space-y-4">
            <div className="space-y-3 blur-[6px] select-none pointer-events-none" aria-hidden>
              <p className="text-foreground font-semibold text-lg">Overall IQ Score: 1██</p>
              <p className="text-muted-foreground text-sm">Your brain shows strong results in pattern recognition and logic. You scored in the ██th percentile, ahead of ██% of people...</p>
              <div className="h-4 bg-muted rounded-full w-3/4" /><div className="h-4 bg-muted rounded-full w-1/2" />
              <p className="text-muted-foreground text-sm">Based on your results, you&apos;d do well in careers like ████████, ██████████, and ████████████...</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent flex flex-col items-center justify-end pb-8">
              <div className="bg-muted rounded-full p-3 mb-3"><Lock className="w-6 h-6 text-muted-foreground" /></div>
              <p className="text-foreground font-semibold text-sm">Unlock your full report to see everything</p>
              <Button size="sm" onClick={handleScrollCTA} className="mt-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">Unlock Full Report <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto px-4 pt-6 pb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-foreground">What You&apos;ll Discover</h3></div>
              {BENEFITS.map((b, i) => <div key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{b}</span></div>)}
            </CardContent>
          </Card>
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1"><Lightbulb className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-foreground">You&apos;ll Learn How To</h3></div>
              {LEARN_HOW_TO.map((item, i) => <div key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{item}</span></div>)}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-white border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Recent IQ Test Results</h2>
              <div className="divide-y divide-border">
                {[
                  { flag: '🇺🇸', country: 'United States', time: '12 min ago', iq: 92 },
                  { flag: '🇬🇧', country: 'United Kingdom', time: '12 min ago', iq: 101 },
                  { flag: '🇲🇽', country: 'Mexico', time: '30 min ago', iq: 95 },
                  { flag: '🇺🇸', country: 'United States', time: '52 min ago', iq: 111 },
                  { flag: '🇦🇺', country: 'Australia', time: '58 min ago', iq: 104 },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl leading-none">{r.flag}</span>
                      <div>
                        <p className="text-base font-bold text-foreground leading-tight">{r.country}</p>
                        <p className="text-xs text-muted-foreground">{r.time}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground leading-tight">{r.iq}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">What People Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="shadow-[var(--shadow-soft)]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-warning text-warning" />)}</div>
                  <p className="text-sm text-foreground italic leading-relaxed">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}, {t.age}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-8 items-start">
          <div><h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">Common Questions</h2><p className="text-muted-foreground mt-2 text-sm">Quick answers before you get started.</p></div>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((faq, i) => <AccordionItem key={i} value={`faq-${i}`}><AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default PlanSelectionPage;
