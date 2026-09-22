import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { scrollToSection } from '@/lib/scrollToSection';
import { setFunnelValue } from '@/lib/funnelState';
import { usePostHog } from '@posthog/react';
import { useFunnel } from '@/context/FunnelContext';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight } from 'lucide-react';
import { BranchOrb } from '@/components/marketing/BranchOrb';
import LifeScaleMarketingLayout from '@/components/marketing/LifeScaleMarketingLayout';
import HeroIllustration from '@/components/marketing/HeroIllustration';
import CategoriesSection from '@/components/marketing/CategoriesSection';
import { CATEGORIES, scalesInCategory, type ScaleKey } from '@/config/scales';
import { NOT_CLINICAL_FAQ, PERSONAL_INTEREST_NOTE } from '@/content/legalCopy';


const METHOD = [
  { n: '01', title: 'Pick a scale', desc: 'Choose a category, then answer a short set of questions on any device.' },
  { n: '02', title: 'See where you stand', desc: 'Get your result and see how you did in each area of that scale.' },
  { n: '03', title: 'Explore your results', desc: 'Read your report and work through the improvement tasks built from it.' },
];

const PROFILE_CONTENTS = [
  { title: 'Overview', desc: 'A quick summary of how you did.' },
  { title: 'Score Areas', desc: 'Your results split into the areas that scale measures.' },
  { title: 'Answer Summary', desc: 'A simple recap of the choices you made.' },
  { title: 'Notes About You', desc: 'Short, plain notes based on your answers.' },
  { title: 'Highlights', desc: 'A few things that stood out in your results.' },
  { title: 'Improvement Tasks', desc: 'Fun puzzles and tasks to exercise your brain.' },
];


const FAQ = [
  {
    q: 'What is Life Scale?',
    a: `Life Scale measures the "IQ" of different parts of your life, not just your mind. Each area is a category, and each category has three short scales with clear results. ${PERSONAL_INTEREST_NOTE}`,
  },
  {
    q: 'What is a category?',
    a: 'A category is one side of you. Every category has the same three scales: a scored core test, a health check, and a hidden-strengths profile. Mind and Body are live now, with Money, People, and Work coming.',
  },
  {
    q: 'What is the difference between the plans?',
    a: 'Insight gives you all three tests in one category, with a report and improvement dashboard for each. Guide adds a static coaching kit that walks you through your plan. Focus keeps it to one category but adds a personalized AI coach trained on your results, available 24/7. Complete covers every live scale, a dashboard for each, and a personalized AI coach trained on your results, available 24/7 — including new categories as they launch.',
  },
  {
    q: 'How long do your tests take?',
    a: 'Most people finish in 5-10 minutes. You can do it in one sitting on your phone or computer.',
  },
  {
    q: 'Is this a medical or school test?',
    a: NOT_CLINICAL_FAQ,
  },
  {
    q: 'Can I cancel my plan?',
    a: 'Yes. You can cancel any time from the ',
    aLink: { text: 'help center', href: '/help' },
    aAfter: '. You keep access until the end of the month you paid for.',
  },
];


const LandingPage = () => {
  const posthog = usePostHog();
  const { dispatch } = useFunnel();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Life Scale — The IQ of You';
  }, []);

  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!target) return;
    // Wait for layout, then scroll with header offset
    const tryScroll = (attempts = 0) => {
      if (scrollToSection(target) || attempts > 10) {
        window.history.replaceState({}, '', `/#${target}`);
        return;
      }
      setTimeout(() => tryScroll(attempts + 1), 50);
    };
    tryScroll();
  }, [location.state]);

  const handleStart = () => {
    trackEvent(posthog, EVENTS.CTA_CLICKED, { cta: 'start_test', location: 'landing' });
    navigate('/choose-test');
  };

  const handlePlanSignup = (planId: string) => {
    trackEvent(posthog, EVENTS.CTA_CLICKED, { cta: `signup_${planId}`, location: 'landing_pricing' });
    setFunnelValue('selectedTier', planId);
    navigate('/choose-test');
  };

  const handleStartScale = (key: ScaleKey) => {
    trackEvent(posthog, EVENTS.CTA_CLICKED, { cta: `start_${key}`, location: 'categories_section' });
    setFunnelValue('selectedTest', key);
    navigate('/auth-gate');
  };

  const handleViewSample = () => {
    trackEvent(posthog, EVENTS.CTA_CLICKED, { cta: 'view_sample_report', location: 'landing' });
    navigate('/sample');
  };

  return (
    <LifeScaleMarketingLayout onStart={handleStart}>
      {/* HERO */}
      <section className="iq-mint-wash relative overflow-hidden">
        <div className="iq-hero-ambient" aria-hidden="true">
          <span className="iq-hero-aura-3" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-16 sm:px-6 md:grid-cols-2 md:pt-16 md:pb-20">
          <div>
            <h1 className="iq-serif mt-4 text-[42px] font-semibold leading-[1.1] text-[hsl(var(--iq-ink))] md:text-[56px]">
              We give you the{' '}
              <span className="text-[hsl(var(--iq-emerald))]">IQ of You.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[hsl(var(--iq-muted))]">
              A score for the life you actually lead. Find out what you are truly built for and how you may be misunderstood by others.&nbsp;
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={handleStart} className="iq-btn-primary iq-lit inline-flex h-12 items-center gap-2 px-6 text-[15px]">
                Start Test <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={handleViewSample} className="iq-btn-outline inline-flex h-12 items-center px-6 text-[15px]">
                See a sample result
              </button>
            </div>

          </div>

          <div className="relative flex justify-center md:justify-end">
            <HeroIllustration />
          </div>
        </div>
      </section>



      {/* CATEGORIES - the multi-scale brand story */}
      <CategoriesSection onStartScale={handleStartScale} />

      {/* METHOD */}
      <section className="bg-[hsl(var(--iq-mint-wash))]/60 pt-14 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="iq-serif mt-3 text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
              How it works: three simple steps.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {METHOD.map(({ n, title, desc }) => (
              <div key={n} className="iq-plan-card p-7">
                <span className="iq-numeral block">{n}</span>
                <span className="iq-rule mt-4" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--iq-ink))]">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[hsl(var(--iq-muted))]">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PROFILE CONTENTS */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="iq-serif mt-3 text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
            What you get.
          </h2>
          <p className="mt-4 text-[15px] text-[hsl(var(--iq-muted))]">
            A clear, easy-to-read look at your answers. No confusing numbers.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROFILE_CONTENTS.map(({ title, desc }, idx) => (
            <div key={title} className="iq-plan-card p-6">
              <span className="iq-numeral-sm block">{String(idx + 1).padStart(2, '0')}</span>
              <span className="iq-rule mt-3" aria-hidden="true" />
              <h3 className="mt-3 text-[15px] font-semibold text-[hsl(var(--iq-ink))]">{title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[hsl(var(--iq-muted))]">{desc}</p>
            </div>
          ))}
        </div>

      </section>

      {/* AFTER THE TEST */}
      <section className="bg-[hsl(var(--iq-surface))] pt-14 pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="iq-serif mt-3 text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
              Turn any result into real gains.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[hsl(var(--iq-muted))]">
              After any test on any scale, you get a personal plan built around your weakest areas.
              You work on what matters most in daily life, at work, in school, and at home.
            </p>

            <ol className="mt-8 space-y-5">
              {[
                { title: 'See your strengths and weak spots', desc: 'Notes on where you shine and where to grow.' },
                { title: 'Get a plan for what matters most', desc: 'Small, focused steps built for your results.' },
                { title: 'Practice in short daily sessions', desc: 'Just 5-10 minutes a day to build the habit.' },
              ].map(({ title, desc }, idx) => (
                <li key={title} className="flex gap-5">
                  <span className="iq-numeral-sm block w-10 flex-none">{String(idx + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-semibold text-[hsl(var(--iq-ink))]">{title}</div>
                    <span className="iq-rule mt-2" aria-hidden="true" />
                    <div className="mt-2 text-[13.5px] leading-relaxed text-[hsl(var(--iq-muted))]">{desc}</div>
                  </div>
                </li>
              ))}
            </ol>

          </div>

          <div className="iq-card iq-card-aura p-6">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold uppercase tracking-wider text-[hsl(var(--iq-ink-soft))]">
                Your growth plan
              </div>
              <span className="rounded-full bg-[hsl(var(--iq-mint-wash))] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(var(--iq-emerald))]">
                Personalized
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {CATEGORIES.filter((c) => c.status === 'live').flatMap((c) =>
                scalesInCategory(c.key).map((s) => ({
                  orb: s.key,
                  branch: `${c.name} · ${s.shortName}`,
                  outcome: s.tagline,
                  desc: s.blurb,
                })),
              ).map(({ orb, branch, outcome, desc }) => (
                <div
                  key={branch}
                  className="flex gap-4 rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] p-4"
                >
                  <div className="flex-none">
                    <BranchOrb branch={orb} size={44} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--iq-emerald))]">
                      {branch}
                    </div>
                    <div className="mt-0.5 text-[14px] font-semibold text-[hsl(var(--iq-ink))]">{outcome}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-[hsl(var(--iq-muted))]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                'Custom plans',
                'Daily practices',
                'Track progress',
                '24/7 coaching',
                'Weekly insights',
                'Full reports',
              ].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] px-3 py-2.5"
                >
                  <span className="iq-pearl mt-0.5 h-1.5 w-1.5 flex-none rounded-full" aria-hidden="true" />
                  <span className="text-[12.5px] font-semibold text-[hsl(var(--iq-ink-soft))]">{label}</span>
                </div>
              ))}
            </div>


            {/* PROGRESS BAR */}
            <div className="mt-6 rounded-2xl border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[hsl(var(--iq-ink))]">Your improvement path</span>
                <span className="text-[13px] font-bold text-[hsl(var(--iq-emerald))]">75%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--iq-border))]">
                <div
                  className="iq-progress-glow h-full rounded-full bg-gradient-to-r from-[hsl(var(--iq-cobalt))] to-[hsl(var(--iq-emerald))]"
                  style={{ width: '75%' }}
                />
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[hsl(var(--iq-muted))]">
                Most members finish their first improvement task on the first day.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* PLANS */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="iq-serif mt-3 text-3xl font-semibold text-[hsl(var(--iq-ink))] md:text-4xl">
            Pick the option that fits you.
          </h2>
          <p className="mt-4 text-[15px] text-[hsl(var(--iq-muted))]">
            Each option gives you a clear report and a path to improve. Prices shown are monthly.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: 'complete',
              name: 'Complete',
              scope: 'EVERY SCALE, EVERY CATEGORY',
              price: '39',
              highlighted: true,
              benefits: [
                'Full reports from every live scale',
                'A dashboard for each scale you take',
                'A personalized AI coach, trained on your results, 24/7',
              ],
            },
            {
              id: 'focus',
              name: 'Focus',
              scope: 'ONE SCALE + AI COACH 24/7',
              price: '29',
              benefits: [
                'All three tests in one category',
                '1 improvement dashboard',
                'A personalized AI coach, trained on your results, 24/7',
              ],
            },
            {
              id: 'guide',
              name: 'Guide',
              scope: 'ONE SCALE + STATIC COACHING',
              price: '14',
              benefits: ['All three tests in one category', '1 improvement dashboard', 'Coaching kit to guide your plan'],
            },
            {
              id: 'insight',
              name: 'Insight',
              scope: 'ONE SCALE, THE ESSENTIALS',
              price: '8',
              benefits: ['All three tests in one category', '1 improvement dashboard', 'Access on any device'],
            },

          ].map((plan) => {
            const featured = plan.highlighted;
            return (
              <article
                key={plan.id}
                className={
                  'iq-plan-card relative flex flex-col ' +
                  (featured ? 'iq-plan-card--featured p-8 md:pb-9' : 'p-7')
                }
              >
                {featured && (
                  <span className="iq-plan-pill absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                    Most popular
                  </span>
                )}

                <div>
                  <h3
                    className={
                      'font-semibold text-[hsl(var(--iq-ink))] ' +
                      (featured ? 'text-[26px]' : 'text-[22px]')
                    }
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-[13px] uppercase tracking-[0.12em] text-[hsl(var(--iq-muted))]">
                    {plan.scope}
                  </p>
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-[15px] font-semibold text-[hsl(var(--iq-ink-soft))]">$</span>
                  <span
                    className={
                      'font-bold leading-none tracking-tight text-[hsl(var(--iq-ink))] ' +
                      (featured ? 'text-[56px]' : 'text-[44px]')
                    }
                  >
                    {plan.price}
                  </span>
                  <span className="ml-1 text-[14px] text-[hsl(var(--iq-muted))]">/ mo</span>
                </div>
                

                <span className="mt-6 block h-px w-full bg-[hsl(var(--iq-border))]" aria-hidden="true" />

                <ul className="mt-5 space-y-3 text-sm text-[hsl(var(--iq-ink-soft))]">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span className="iq-pearl mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button
                    onClick={() => handlePlanSignup(plan.id)}
                    className={
                      (featured ? 'iq-btn-primary iq-lit' : 'iq-btn-outline') +
                      ' inline-flex h-11 w-full items-center justify-center gap-1.5 px-4 text-sm'
                    }
                  >
                    Sign up <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pt-14 pb-20 sm:px-6">
        <div className="text-center">
          <h2 className="iq-serif mt-3 text-3xl font-semibold text-[hsl(var(--iq-ink))]">Common questions.</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 divide-y divide-[hsl(var(--iq-border))] border-y border-[hsl(var(--iq-border))]">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`f-${i}`} className="border-none">
              <AccordionTrigger className="py-5 text-left text-[15px] font-semibold text-[hsl(var(--iq-ink))] hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[14px] leading-relaxed text-[hsl(var(--iq-muted))]">
                {item.a}
                {item.aLink && (
                  <a href={item.aLink.href} className="text-[hsl(var(--iq-emerald))] underline hover:no-underline">
                    {item.aLink.text}
                  </a>
                )}
                {item.aAfter}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-14 rounded-xl bg-[hsl(var(--iq-ink))] p-8 text-center md:p-12">
          <h3 className="iq-serif mt-3 text-2xl font-semibold text-white md:text-3xl">
            Take a test in 5-10 minutes.
          </h3>
          <button
            onClick={handleStart}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-[10px] bg-white px-6 text-[15px] font-semibold text-[hsl(var(--iq-ink))] transition hover:bg-[hsl(var(--iq-mint))]"
          >
            Start <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </LifeScaleMarketingLayout>
  );
};

export default LandingPage;
