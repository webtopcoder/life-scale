import type { LucideIcon } from 'lucide-react';
import {
  ListChecks, Timer, Target, Gauge, TrendingDown, Crosshair, EyeOff,
  Briefcase, BookOpen, UserX, TrendingUp, CalendarDays, Flag, Repeat,
  Moon, Sliders, BatteryLow, Activity, LifeBuoy, BrainCircuit,
  HeartPulse, Apple, Footprints, CloudFog,
  Sunrise, CalendarClock, BatteryCharging, Hourglass, RotateCcw,
  Fingerprint, Award, Scale, Glasses, Sparkles, AlertTriangle, ArrowRightLeft,
  Users, Zap, MessageSquare, Palette, Layers, Home, Wind, Lock, ShieldCheck,
} from 'lucide-react';

import { ADDONS, type Addon } from '@/lib/addons';

export interface UpsellValueProp {
  icon: LucideIcon;
  text: string;
}

export interface UpsellOffer {
  /** Matches Addon.key. */
  key: string;
  /** Visual treatment. Premium is used for the $3/$5 add-ons. */
  variant?: 'standard' | 'premium' | 'flagship';
  /** Small pill above the headline. */
  eyebrow: string;
  /** Color treatment for the eyebrow pill on standard cards. */
  eyebrowTone?: 'default' | 'urgency';
  /** First headline line — a flat statement. */
  headline: string;
  /** Second headline line — the payoff, rendered in the accent colour. */
  highlight: string;
  valueProps: UpsellValueProp[];
  /** Optional social-comparison line under the star row (premium framework). */
  proofLine?: string;
  /** Optional "what you get" line items above the price (premium framework). */
  contentsList?: string[];
  /** Anchor price shown struck through. */
  regularPriceLabel: string;
  rating: string;
  purchaseCount: string;
  ctaLabel: string;
  guarantee: string;
}


/**
 * Offer copy for each add-on. Titles and prices always come from ADDONS so the
 * card can never promise a price that differs from what is actually charged.
 * Entries are added one at a time; the preview gallery skips anything missing.
 */
export const UPSELL_OFFERS: Record<string, UpsellOffer | undefined> = {
  addon_iq_answer_breakdown: {
    key: 'addon_iq_answer_breakdown',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'default',
    headline: 'See What Cost You',
    highlight: 'Question by Question...',
    valueProps: [
      { icon: ListChecks, text: 'All the questions you missed, with the right answer' },
      { icon: Timer, text: 'The question that ate most of your time' },
      { icon: Gauge, text: 'Rushed mistakes vs. stuck mistakes' },
      { icon: Target, text: "Why you didn't score higher" },
    ],
    regularPriceLabel: '$19.99',
    rating: '4.8',
    purchaseCount: '12,400+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_iq_speed_accuracy_report: {
    key: 'addon_iq_speed_accuracy_report',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'urgency',
    headline: "Fast Doesn't Mean Smart",
    highlight: "And Slow Isn't Saving You...",
    valueProps: [
      { icon: Gauge, text: 'Your accuracy on fast answers vs. slow ones' },
      { icon: Timer, text: 'The point where extra time stops paying off' },
      { icon: TrendingDown, text: 'Whether hesitation or haste costs you more' },
      { icon: Crosshair, text: 'What {speedStyle:lower|your pace} says about your intelligence' },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '9,700+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_iq_weakness_report: {
    key: 'addon_iq_weakness_report',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'default',
    headline: '(2) Areas Are Dragging You Down',
    highlight: "You Won't Guess Which...",
    valueProps: [
      { icon: TrendingDown, text: '{weakest1|Your weakest area} and {weakest2|the next one}, in full' },
      { icon: Target, text: 'How many points each one costs you' },
      { icon: Crosshair, text: 'Why you keep losing points in {weakest1:lower|the same places}' },
      { icon: EyeOff, text: 'The part of your thinking you avoid' },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '15,200+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_iq_study_work_fit: {
    key: 'addon_iq_study_work_fit',
    variant: 'premium',
    eyebrow: 'PREMIUM REPORT',
    headline: 'People Who Test Like You Do',
    highlight: 'Are More Successful Than You...',
    valueProps: [
      { icon: Briefcase, text: 'The work your mind is built for' },
      { icon: BookOpen, text: 'How you actually advance fastest' },
      { icon: UserX, text: 'Where strong {strongest:lower|thinking} gets overlooked' },
      { icon: TrendingUp, text: 'Where your potential shines' },
    ],

    regularPriceLabel: '$19.99',
    rating: '4.9',
    purchaseCount: '6,300+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_iq_30day_sharpening: {
    key: 'addon_iq_30day_sharpening',
    variant: 'flagship',
    eyebrow: 'THE COMPLETE PLAN',
    headline: "Knowing Your Weak Spots",
    highlight: "Won't Fix Them. This Will...",
    valueProps: [
      { icon: Crosshair, text: '{weakest1|Your weakest area} and {weakest2|the next one}, fixed by name' },
      { icon: CalendarDays, text: 'A dated daily plan — no guessing, just do it' },
      { icon: Flag, text: 'Weekly proof your score is actually moving' },
      { icon: Repeat, text: 'Locked-in review days so gains never slip back' },
    ],

    proofLine: "Most people's scores drop within a week of testing.Those who finished the 30 days grew..",
    contentsList: [
      'All 30 days written out and dated for you',
      '4 weekly checkpoints to measure real change',
      'Built-in review days so nothing fades',
      'Printable — keep it somewhere you will see it',
    ],
    regularPriceLabel: '$39.99',
    rating: '4.9',
    purchaseCount: '4,100+ started',
    ctaLabel: 'ADD + GO TO REPORT',
    guarantee: '30-day money-back guarantee',
  },

  /* --------------------------- Brain Health --------------------------- */
  addon_brain_sleep_recovery: {
    key: 'addon_brain_sleep_recovery',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'default',
    headline: 'Your Sleep Is Costing You',
    highlight: 'More Than You Think...',
    valueProps: [
      { icon: Moon, text: 'Where your sleep is actually breaking down' },
      { icon: Sliders, text: 'The four levers that change it fastest' },
      { icon: CalendarDays, text: 'Your first week, night by night' },
      { icon: BatteryLow, text: 'Why you wake up tired doing everything right' },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '11,800+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_brain_stress_load: {
    key: 'addon_brain_stress_load',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'urgency',
    headline: "You're Carrying More Load",
    highlight: 'Than Your Brain Can Clear...',
    valueProps: [
      { icon: Activity, text: 'The areas your answers flagged, explained' },
      { icon: EyeOff, text: 'Where stress hides in a normal week' },
      { icon: LifeBuoy, text: 'Three recovery tools and when to use each' },
      { icon: BrainCircuit, text: "Why you can't switch off at night" },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '10,300+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_brain_nutrition_movement: {
    key: 'addon_brain_nutrition_movement',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'default',
    headline: 'Your Foggy Afternoons',
    highlight: "Aren't About Willpower...",
    valueProps: [
      { icon: HeartPulse, text: 'Your circulation and energy picture' },
      { icon: Apple, text: 'Eating patterns with real evidence behind them' },
      { icon: Footprints, text: "A repeatable week you'll actually keep" },
      { icon: CloudFog, text: 'The habit quietly dulling your thinking' },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '8,900+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_brain_focus_energy_map: {
    key: 'addon_brain_focus_energy_map',
    variant: 'premium',
    eyebrow: 'PREMIUM REPORT',
    headline: 'People With Your Same Results',
    highlight: 'Get More Out of Their Day...',
    valueProps: [
      { icon: Sunrise, text: 'The hours your brain is actually sharp' },
      { icon: CalendarClock, text: 'What to schedule against each one, around {bhFocus:lower|your focus}' },
      { icon: BatteryCharging, text: 'Where your day quietly leaks energy' },
      { icon: Hourglass, text: 'Why your best hours go to the wrong things' },
    ],
    regularPriceLabel: '$19.99',
    rating: '4.9',
    purchaseCount: '6,100+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_brain_30day_habit: {
    key: 'addon_brain_30day_habit',
    variant: 'flagship',
    eyebrow: 'THE COMPLETE PLAN',
    headline: 'Knowing What’s Wrong',
    highlight: "Won't Fix It. This Will...",
    valueProps: [
      { icon: Crosshair, text: '{bhTopRisk|The one priority area} — where your effort pays back most' },
      { icon: CalendarDays, text: 'A dated daily action — no guessing, just do it' },
      { icon: Flag, text: "Weekly proof it's actually working" },
      { icon: RotateCcw, text: 'Built-in reset days so you never fall off' },
    ],
    proofLine: 'Most people slip back within a week of a check-in. Those who finished the 30 days kept going..',
    contentsList: [
      'All 30 days written out and dated for you',
      '4 weekly checkpoints to measure real change',
      'Built-in reset days so one bad day never ends it',
      'Printable — keep it somewhere you will see it',
    ],
    regularPriceLabel: '$39.99',
    rating: '4.9',
    purchaseCount: '4,300+ started',
    ctaLabel: 'ADD + GO TO REPORT',
    guarantee: '30-day money-back guarantee',
  },


  /* --------------------------- Hidden Genius --------------------------- */
  addon_genius_archetype_deep_dive: {
    key: 'addon_genius_archetype_deep_dive',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'default',
    headline: 'Your Archetype Is the Label',
    highlight: 'Not the Explanation...',
    valueProps: [
      { icon: Fingerprint, text: 'The full thesis behind {archetype|your archetype}' },
      { icon: Award, text: 'Where you genuinely outperform other people' },
      { icon: Scale, text: 'What the same wiring quietly costs you' },
      { icon: Glasses, text: 'The part of you people keep misreading' },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '13,100+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_genius_strengths_blind: {
    key: 'addon_genius_strengths_blind',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'urgency',
    headline: 'The Traits That Carry You',
    highlight: 'Are the Ones Holding You Back...',
    valueProps: [
      { icon: Sparkles, text: 'Your four strongest traits and their trade-offs' },
      { icon: AlertTriangle, text: 'Three blind spots, named plainly' },
      { icon: ArrowRightLeft, text: 'Why {weakestTrait:lower|one trait} is the first thing to fix' },
      { icon: EyeOff, text: 'The blind spot you already suspect you have' },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '10,900+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_genius_collaboration: {
    key: 'addon_genius_collaboration',
    eyebrow: 'One-Time Offer — This Page Only',
    eyebrowTone: 'default',
    headline: 'Other People Don\'t Always',
    highlight: 'See You How You Think...',
    valueProps: [
      { icon: Users, text: 'The conditions a {archetype|mind like yours} works best in' },
      { icon: Zap, text: 'Where friction with a team usually starts' },
      { icon: MessageSquare, text: 'What to tell a new manager in week one' },
      { icon: UserX, text: 'Why you keep getting read the wrong way' },
    ],
    regularPriceLabel: '$9.99',
    rating: '4.8',
    purchaseCount: '9,400+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_genius_creative_style: {
    key: 'addon_genius_creative_style',
    variant: 'premium',
    eyebrow: 'PREMIUM REPORT',
    headline: 'People With Your Archetype',
    highlight: "Don't Always Finish What They Start...",
    valueProps: [
      { icon: Palette, text: 'How a {archetype|mind like yours} actually makes things' },
      { icon: Layers, text: 'The four stages of work, done your way' },
      { icon: Home, text: 'The rituals and setup that actually hold' },
      { icon: Wind, text: 'Where your best ideas quietly die' },
    ],
    regularPriceLabel: '$19.99',
    rating: '4.9',
    purchaseCount: '6,200+ unlocked',
    ctaLabel: 'Add to My Report',
    guarantee: '30-day money-back guarantee',
  },
  addon_genius_30day_practice: {
    key: 'addon_genius_30day_practice',
    variant: 'flagship',
    eyebrow: 'THE COMPLETE PLAN',
    headline: 'Your Archetype Runs You',
    highlight: 'Only 30 Days and You Can Run It Instead...',
    valueProps: [
      { icon: Crosshair, text: 'The one default {archetype|your archetype} falls back on, named on day one' },
      { icon: CalendarDays, text: 'A small daily rep built for how the {archetype|your type} works' },
      { icon: Flag, text: 'What changes by week two, and what people notice by week four' },
      { icon: Lock, text: 'The inspiration to start the thing you keep telling yourself you will start' },
    ],
    proofLine: 'Reading your archetype changes how you talk about yourself. Thirty days of practising against it changes what you do..',
    contentsList: [
      'A 30-day practice sequence built around your archetype',
      'A weekly arc that gets harder as your default weakens',
      'Rules that stop you coasting back into what feels easy',
      'A catch-yourself checklist for the days you slip',
    ],
    regularPriceLabel: '$39.99',
    rating: '4.9',
    purchaseCount: '4,000+ started',
    ctaLabel: 'ADD + GO TO REPORT',
    guarantee: '30-day money-back guarantee',
  },
};





export interface ResolvedUpsell {
  addon: Addon;
  offer?: UpsellOffer;
}

export function resolvedUpsells(): ResolvedUpsell[] {
  return ADDONS.map((addon) => ({ addon, offer: UPSELL_OFFERS[addon.key] }));
}
