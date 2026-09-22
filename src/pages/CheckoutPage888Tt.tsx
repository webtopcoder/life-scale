import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunnel888Tt } from '@/context/Funnel888TtContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, Clock, Shield, ShieldCheck, Star, ArrowRight, Lock, MapPin, Brain, FileText, Lightbulb, TrendingUp, Eye, ChevronRight, Gift } from 'lucide-react';
import { ImportedFunnelCheckout } from '@/components/ImportedFunnelCheckout';
import {
  IQ_SUBSCRIPTION_BOA_MONTHLY_CENTS,
  IQ_SUBSCRIPTION_MONTHLY_CENTS,
  IQ_SUBSCRIPTION_RVR_MONTHLY_CENTS,
} from '@/services/breezeConfig';
import { FLOW_IDS } from '@/engine/datasetLoader';
import { CheckoutTimerBar888Tt } from '@/components/CheckoutTimerBar888Tt';
import { trackFacebookPixelEvent } from '@/lib/facebookPixel';
import { tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { formatUsdFromCents } from '@/lib/money';

import avatarCara from '@/assets/avatar-cara.jpg';
import avatarJames from '@/assets/avatar-james.jpg';
import avatarMei from '@/assets/avatar-mei.jpg';
import avatarRaj from '@/assets/avatar-raj.jpg';
import avatarSophie from '@/assets/avatar-sophie.jpg';
import avatarEinstein from '@/assets/avatar-einstein.jpg';
import avatarLincoln from '@/assets/avatar-lincoln.jpg';
import altPaymentMethodsImage from '@/assets/alt-payment-methods-data-uri';

const CHECKOUT_AVATAR_URLS = [
  avatarLincoln,
  avatarEinstein,
  avatarCara,
  avatarJames,
  avatarMei,
  avatarRaj,
  avatarSophie,
] as const;
for (const src of CHECKOUT_AVATAR_URLS) {
  const img = new Image();
  img.src = src;
}

const TRUST_POINTS = [
  { icon: Brain, title: 'Proven IQ Test', desc: 'Used by over 50 million people worldwide.' },
  { icon: FileText, title: 'Full Personal Report', desc: '20+ pages about your brain — strengths, weaknesses, and tips.' },
  { icon: Lightbulb, title: 'Brain Training Included', desc: 'Simple daily exercises to sharpen your mind.' }];


const BENEFITS_DEFAULT = [
  'Your exact IQ score and report',
  'Where you rank compared to your peers',
  'Your intelligence strengths and weaknesses',
  'Personalized insights based on your results'];

const BENEFITS = BENEFITS_DEFAULT;

const IQ_TRIAL_DUE_CENTS = 100;

const IQ_ALT_TRIAL_DUE_CENTS = 100;

type CheckoutPricing = {
  monthlyCents: number;
};

function getCheckoutPricing(flowId: string, pathname: string): CheckoutPricing {
  if (pathname === '/onboarding-boa') {
    return {
      monthlyCents: IQ_SUBSCRIPTION_BOA_MONTHLY_CENTS,
    };
  }
  if (pathname === '/onboarding-rvr') {
    return {
      monthlyCents: IQ_SUBSCRIPTION_RVR_MONTHLY_CENTS,
    };
  }
  if (flowId === FLOW_IDS.ALT_V1) {
    return {
      monthlyCents: IQ_SUBSCRIPTION_MONTHLY_CENTS,
    };
  }
  return {
    monthlyCents: IQ_SUBSCRIPTION_MONTHLY_CENTS,
  };
}

function getAltBenefits(monthlyCents: number) {
  return [
    'Your exact IQ score and report',
    'Where you rank compared to your peers',
    'Your intelligence strengths and weaknesses',
    `Get a 7 day trial for $1.00. After trial, we'll charge ${formatUsdFromCents(monthlyCents)} every month until you cancel. Price excludes tax.`,
  ];
}

function getTrialDiscountPercent(trialCents: number, monthlyCents: number): number {
  return Math.round((1 - trialCents / monthlyCents) * 100);
}

function formatUsdLabel(cents: number): string {
  return `USD ${(cents / 100).toFixed(2)}`;
}

function formatOrdinalDate(date: Date): string {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st'
      : day % 10 === 2 && day !== 12 ? 'nd'
        : day % 10 === 3 && day !== 13 ? 'rd'
          : 'th';
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${day}${suffix} ${year}`;
}

function getAltFirstBillDateLabel(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatOrdinalDate(date);
}

const LEARN_HOW_TO = [
  'Think sharper every day',
  'Use your natural strengths',
  'Remember more and forget less',
  'Make better decisions faster'];


const FAQ_ITEMS_BASE = [
  { q: 'Is this test accurate?', a: 'Yes — our test is based on proven methods used by professionals. It gives you a reliable picture of how your brain works.' },
  { q: 'Can I cancel anytime?', a: 'Yes, cancel whenever you want. No fees, no questions asked.' },
  { q: 'What\'s in my report?', a: 'Your IQ score, how you rank against others, a breakdown of 5 brain areas, career suggestions, and tips to get smarter.' }];

function getFaqItems(isAltFlow: boolean, monthlyCents: number) {
  const monthlyLabel = `${formatUsdFromCents(monthlyCents)}/month`;
  const afterTrialAnswer = isAltFlow
    ? `Your 1-week trial is $1.00. After that, it's ${monthlyLabel}. You can cancel anytime before the trial ends to avoid further charges.`
    : `Your 3-day trial is $1.00. After that, it's ${monthlyLabel}. You can cancel anytime before the trial ends to avoid further charges.`;
  const afterTrialQuestion = isAltFlow ? 'What happens after 7 days?' : 'What happens after 3 days?';
  return [
    FAQ_ITEMS_BASE[0],
    { q: afterTrialQuestion, a: afterTrialAnswer },
    ...FAQ_ITEMS_BASE.slice(1),
  ];
}


const TESTIMONIALS = [
  { name: 'Sophie L.', age: 28, location: 'London, UK', quote: 'The report showed me exactly where my brain excels. It changed how I work and study.', avatar: avatarSophie },
  { name: 'James R.', age: 34, location: 'New York, US', quote: 'The career suggestions were spot on. I\'m already making moves based on my results.', avatar: avatarJames },
  { name: 'Mei C.', age: 31, location: 'Singapore', quote: 'After 3 weeks of the brain exercises, I noticed a real difference in my focus.', avatar: avatarMei }];


const SOCIAL_PROOF_ENTRIES = [
  { name: 'John', flag: '🇺🇸' }, { name: 'Priya', flag: '🇮🇳' }, { name: 'Hans', flag: '🇩🇪' },
  { name: 'Yuki', flag: '🇯🇵' }, { name: 'Sofia', flag: '🇪🇸' }, { name: 'Liam', flag: '🇬🇧' },
  { name: 'Fatima', flag: '🇸🇦' }, { name: 'Carlos', flag: '🇧🇷' }, { name: 'Mei', flag: '🇨🇳' },
  { name: 'Pierre', flag: '🇫🇷' }, { name: 'Kim', flag: '🇰🇷' }, { name: 'Isabella', flag: '🇮🇹' },
  { name: 'Tomasz', flag: '🇵🇱' }, { name: 'Sarah', flag: '🇨🇦' }, { name: 'Emma', flag: '🇬🇧' },
  { name: 'Marco', flag: '🇮🇹' }, { name: 'Ingrid', flag: '🇸🇪' }, { name: 'Rafael', flag: '🇵🇹' }];

const useFakeViewers = () => {
  const [count, setCount] = useState(Math.floor(Math.random() * 300) + 1800);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => Math.max(1500, Math.min(2400, prev + (Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : -(Math.floor(Math.random() * 5) + 1)))));
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  return count;
};

const BrainIcon = ({ className }: { className?: string; }) =>
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="currentColor">
    <path d="M32 8c-4.5 0-8.2 2.5-10 6.2C19.8 12.8 17 11 13.8 11 8.4 11 4 15.8 4 21.5c0 3.5 1.6 6.6 4 8.5C6.2 32 5 34.8 5 38c0 5.5 4 10 9 10.8.5 3 3 5.2 6 5.2 1.8 0 3.4-.8 4.5-2 1.5 2.5 4.2 4 7.5 4s6-1.5 7.5-4c1.1 1.2 2.7 2 4.5 2 3 0 5.5-2.2 6-5.2 5-.8 9-5.3 9-10.8 0-3.2-1.2-6-3-8 2.4-1.9 4-5 4-8.5C60 15.8 55.6 11 50.2 11c-3.2 0-6 1.8-8.2 3.2C40.2 10.5 36.5 8 32 8Z" />
    <path d="M32 14v38" stroke="hsl(var(--background))" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M22 24c-3 0-6 2-6 5s2 4 5 4" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M42 24c3 0 6 2 6 5s-2 4-5 4" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M24 38c-2 1-3 3-2 5" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M40 38c2 1 3 3 2 5" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>;


const ComparisonCard = ({ label, score, height, highlight = false, avatar, onClick }: { label: string; score: number | string; height: string; highlight?: boolean; avatar?: string; onClick?: () => void; }) =>
  <div className="flex flex-col items-center gap-1.5">
    <span onClick={onClick} className={`text-sm font-bold px-3 py-0.5 rounded-full ${highlight ? 'bg-cta text-white cursor-pointer hover:opacity-90 transition-opacity' : 'text-primary'}`}>IQ {score}</span>
    <div className={`w-24 sm:w-28 ${height} rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden ${highlight ? 'bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]' : 'bg-muted text-muted-foreground'}`
    }>
      {highlight && <span className="text-xs font-bold mb-1 text-primary-foreground">You</span>}
      {avatar ?
        <img src={avatar} alt={label} className="w-full h-full object-cover object-top" loading="eager" decoding="async" fetchPriority="high" /> :

        <div className="w-16 h-16 rounded-full bg-background border border-border/50 flex items-center justify-center">
          <span className="text-3xl font-extrabold text-foreground">?</span>
        </div>
      }
    </div>
  </div>;




const CheckoutPage888Tt = () => {
  const { state, goToStage } = useFunnel888Tt();
  const location = useLocation();
  const isAltFlow = state.flowId === FLOW_IDS.ALT_V1;
  const checkoutPricing = getCheckoutPricing(state.flowId, location.pathname);
  const monthlyCents = checkoutPricing.monthlyCents;
  const altBenefits = getAltBenefits(monthlyCents);
  const altDiscountPercent = getTrialDiscountPercent(IQ_ALT_TRIAL_DUE_CENTS, monthlyCents);

  // Gender-based celebrity avatars
  const avatarAvg = avatarLincoln;
  const labelAvg = 'A. Lincoln';
  const avatarGen = avatarEinstein;
  const labelGen = 'Einstein';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewers = useFakeViewers();
  useEffect(() => {
    trackTikTokEvent('InitiateCheckout', tikTokContentPayload());
  }, []);

  const handlePaymentStarted = useCallback(() => {
    trackFacebookPixelEvent('InitiateCheckout', {
      page: 'checkout',
      value: 1,
      currency: 'USD',
    });
  }, []);

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const stickyEl = document.getElementById('checkout-sticky-header');
    const stickyHeight = stickyEl ? stickyEl.offsetHeight : 0;
    const cushion = 20;
    const top = el.getBoundingClientRect().top + window.scrollY - stickyHeight - cushion;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleScrollCTA = () => {
    scrollToElement('what-youll-get');
  };

  useEffect(() => {
    handlePaymentStarted();
  }, [handlePaymentStarted]);

  const [proofIndex, setProofIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProofIndex((prev) => (prev + 1) % SOCIAL_PROOF_ENTRIES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const proofEntry = SOCIAL_PROOF_ENTRIES[proofIndex];

  return (
    <div className="min-h-screen bg-background relative">

      {/* Sticky Header */}
      <div id="checkout-sticky-header" className="sticky top-0 z-50">
        {/* Social proof ticker */}
        <div className="bg-muted border-b border-border px-4 h-8 relative overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={proofIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center gap-2 text-xs sm:text-sm">

              <span className="text-base">{proofEntry.flag}</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{proofEntry.name}</span> just claimed their full report
              </span>
            </motion.div>
          </AnimatePresence>
        </div>


        {/* Timer bar */}
        <CheckoutTimerBar888Tt />
      </div>

      {/* Hero — Stacked: Title → Cards → CTA */}
      <section className="bg-primary/5 border-b border-border">
        <div className="max-w-xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center text-center space-y-6">
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Congratulations<br />
              <span className="text-primary">Your IQ Score Is Ready!</span>
            </h1>
          </motion.div>

          {/* Comparison Cards */}
          <motion.div initial={{ opacity: 1, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-end justify-center gap-3 sm:gap-5">
            <ComparisonCard label={labelAvg} score={113} height="h-36 sm:h-40" avatar={avatarAvg} />
            <ComparisonCard label="You" score="???" height="h-44 sm:h-48" highlight onClick={handleScrollCTA} />
            <ComparisonCard label={labelGen} score={160} height="h-52 sm:h-56" avatar={avatarGen} />
          </motion.div>

          {/* CTA */}
          <motion.button onClick={handleScrollCTA}
            className="relative overflow-hidden w-full max-w-md h-14 px-8 rounded-xl text-base font-semibold text-cta-foreground inline-flex items-center justify-center gap-2 cursor-pointer border-0 bg-cta-muted"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: [
                '0 0 12px 0 hsl(var(--cta) / 0.2)',
                '0 0 20px 4px hsl(var(--cta) / 0.35)',
                '0 0 12px 0 hsl(var(--cta) / 0.2)']

            }}
            transition={{ opacity: { duration: 0.5, delay: 0.3 }, y: { duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }, boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}>

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }} />

            <span className="relative z-10 flex items-center gap-2">
              Get My IQ Score Now
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </span>
          </motion.button>
        </div>
      </section>

      {/* Trial Section */}
      <section className="max-w-5xl mx-auto px-4 py-6 md:py-8 overflow-x-hidden bg-card rounded-xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">Unlock Your Full IQ Report</h2>
        <div className="max-w-lg mx-auto space-y-6">
          {/* Benefits checklist - outside card */}
          <div className="space-y-3">
            <div id="what-youll-get" className="scroll-mt-[92px]" aria-hidden="true" />
            {!isAltFlow && <h3 className="text-base font-medium text-muted-foreground">What you'll get:</h3>}
            {(isAltFlow ? altBenefits : BENEFITS_DEFAULT).map((b, i) =>
              <div
                key={i}
                id={isAltFlow && i === 3 ? 'benefits-fourth' : i === 1 ? 'benefits-start' : i === 2 ? 'subscription-disclaimer' : undefined}
                className={`flex items-start gap-2.5 ${isAltFlow && i === 3 ? 'scroll-mt-[92px]' : ''}`}>

                <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isAltFlow ? 'text-muted-foreground' : 'text-success'}`} />
                <span className={`${isAltFlow ? 'text-xs' : 'text-sm'} text-foreground`}>
                  {isAltFlow && i === 3 ? (
                    <>
                      Get a 7 day trial for $1.00. <span className="font-bold">After trial, we'll charge {formatUsdFromCents(monthlyCents)} every month until you cancel</span>. Price excludes tax.
                    </>
                  ) : b}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6 min-w-0 overflow-hidden">
            {/* Promo banner — alt flow only */}
            {isAltFlow && (
              <div className="bg-primary/5 border border-dashed border-primary/30 rounded-xl px-3 sm:px-4 py-3 flex items-center gap-3">
                <Gift className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground leading-tight text-sm">Promo Code IQ100 Applied</p>
                  <p className="text-muted-foreground text-xs font-semibold">You save {altDiscountPercent}%</p>
                </div>
                <span className="bg-primary text-primary-foreground font-bold rounded-full py-1 flex-shrink-0 text-xs px-[6px]">$1.00</span>
              </div>
            )}

            {/* Promo banner — default flow only */}
            {!isAltFlow && (
              <div id="promo-banner" className="bg-primary/5 border border-dashed border-primary/30 rounded-xl px-3 sm:px-4 py-[11px] flex items-center gap-2 scroll-mt-[116px]">
                <Gift className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-foreground leading-tight ${location.pathname === '/onboarding-rvr' ? 'text-[14px]' : 'text-[11px]'}`}>
                    {location.pathname === '/onboarding-rvr' ? 'Exclusive one-time discount applied' : 'Promo Code IQ88 Applied'}
                  </p>
                  <p className="text-muted-foreground text-[10px]">88% off on your report!</p>
                </div>
                <span className="bg-primary text-primary-foreground font-bold rounded-full py-[3px] flex-shrink-0 text-[10px] px-[6px]">88%</span>
              </div>
            )}

            {isAltFlow ? (
              <Card
                id="payment-section"
                className="overflow-hidden scroll-mt-[92px] rounded-2xl border-2 border-[#4A7CFF] shadow-none bg-white"
              >
                <CardContent className="p-4 sm:p-6 space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-center bg-muted/50 rounded-xl px-4 py-3">
                      <span className="text-base font-bold text-foreground">Unlock Your Full Report</span>
                    </div>
                    <div className="border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">Full IQ Report</p>
                          <p className="text-xs text-muted-foreground mt-0.5">1 Week Access</p>
                        </div>
                        <p className="text-sm text-foreground whitespace-nowrap">
                          {formatUsdLabel(monthlyCents)} / month
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Discount applied</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded-full">
                            {altDiscountPercent}%
                          </span>
                          <span className="text-success font-medium whitespace-nowrap">
                            -{formatUsdLabel(monthlyCents - IQ_ALT_TRIAL_DUE_CENTS)}
                          </span>
                        </div>
                      </div>
                      <div className="h-px w-full bg-border" />
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-bold text-foreground">1-week trial</span>
                        <span className="text-sm font-bold text-foreground">
                          {formatUsdLabel(IQ_ALT_TRIAL_DUE_CENTS)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div id="payment-form" className="scroll-mt-[92px] space-y-3">
                    <div id="rvr2-checkout-container" className="relative min-h-[200px]">
                      <ImportedFunnelCheckout pathname={location.pathname} email={state.email} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div id="payment-section" className="scroll-mt-[92px] space-y-5">
                <div id="payment-form" className="scroll-mt-[92px]">
                  <div id="rvr2-checkout-container" className="relative min-h-[200px]">
                    <ImportedFunnelCheckout pathname={location.pathname} email={state.email} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-3 sm:px-4 py-2">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground leading-tight">30-Day Money-Back Guarantee</span>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Social proof & trust */}
          <div className="space-y-6">
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[avatarCara, avatarRaj, avatarSophie, avatarJames].map((av, i) =>
                      <img key={i} src={av} alt="" className="w-8 h-8 rounded-full border-2 border-card object-cover" />
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Over 17,000 tests taken today</p>
                    <p className="text-muted-foreground">Average IQ: 108</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}</div>
                  <span className="font-semibold text-foreground">4.8</span>
                  <span className="text-muted-foreground">based on 14,200+ reviews</span>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground text-center">Why People Trust Us</h3>
              {TRUST_POINTS.map((tp, i) =>
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><tp.icon className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-semibold text-foreground text-sm">{tp.title}</p><p className="text-xs text-muted-foreground mt-0.5">{tp.desc}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Report Preview */}
      <section className="max-w-3xl mx-auto px-4 pt-4 pb-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-3">Sneak Peek at Your Report</h2>
        <p className="text-center text-sm text-muted-foreground max-w-lg mx-auto mb-6">Your results hint at remarkable cognitive strengths and hidden potential. Early indicators suggest you rank among top performers in key areas — your logic and pattern recognition abilities stand out as truly impressive.</p>
        <Card className="relative overflow-hidden shadow-[var(--shadow-card)]">
          <CardContent className="p-8 space-y-4">
            <div className="space-y-3 blur-[6px] select-none pointer-events-none" aria-hidden>
              <p className="text-foreground font-semibold text-lg">Overall IQ Score: 1██</p>
              <p className="text-muted-foreground text-sm">Your brain shows strong results in pattern recognition and logic. You scored in the ██th percentile, ahead of ██% of people...</p>
              <div className="h-4 bg-muted rounded-full w-3/4" /><div className="h-4 bg-muted rounded-full w-1/2" />
              <p className="text-muted-foreground text-sm">Based on your results, you'd do well in careers like ████████, ██████████, and ████████████...</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent flex flex-col items-center justify-end pb-8">
              <div className="bg-muted rounded-full p-3 mb-3"><Lock className="w-6 h-6 text-muted-foreground" /></div>
              <p className="text-foreground font-semibold text-sm">Unlock your full report to see everything</p>
              <Button size="sm" onClick={handleScrollCTA} className="mt-3 rounded-xl bg-cta-muted hover:bg-cta text-cta-foreground">Unlock Full Report <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-foreground">What You'll Discover</h3></div>
              {BENEFITS.map((b, i) => <div key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{b}</span></div>)}
            </CardContent>
          </Card>
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1"><Lightbulb className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-foreground">You'll Learn How To</h3></div>
              {LEARN_HOW_TO.map((item, i) => <div key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground">{item}</span></div>)}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">What People Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) =>
              <Card key={i} className="shadow-[var(--shadow-soft)]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-warning text-warning" />)}</div>
                  <p className="text-sm text-foreground italic leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div><p className="text-sm font-semibold text-foreground">{t.name}, {t.age}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-8 items-start">
          <div><h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">Common Questions</h2><p className="text-muted-foreground mt-2 text-sm">Quick answers before you get started.</p></div>
          <Accordion type="single" collapsible className="w-full">
            {getFaqItems(isAltFlow, monthlyCents).map((faq, i) => <AccordionItem key={i} value={`faq-${i}`}><AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </div>
      </section>

    </div>);

};

export default CheckoutPage888Tt;