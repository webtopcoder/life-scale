import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFunnel } from '@/context/FunnelContext';
import { Button } from '@/components/ui/button';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { Users, MessageCircle, Star } from 'lucide-react';
import avatarCara from '@/assets/avatar-cara.jpg';
import avatarJames from '@/assets/avatar-james.jpg';
import avatarSophie from '@/assets/avatar-sophie.jpg';
import avatarRaj from '@/assets/avatar-raj.jpg';
import avatarMei from '@/assets/avatar-mei.jpg';
import { useFFIntl } from '@/i18n/ff';

const REVIEWS = [
  {
    name: 'Cara Mitchell',
    date: 'January 10, 2026',
    avatar: avatarCara,
    title: '"It helped me understand myself better!"',
    body: "I'm really glad I took this test! It highlighted things about my thinking I never noticed before. The results felt accurate and gave me a fresh view of my strengths.",
  },
  {
    name: 'James Okafor',
    date: 'February 3, 2026',
    avatar: avatarJames,
    title: '"Surprisingly accurate results"',
    body: "I was skeptical at first, but the cognitive profile was spot on. It pinpointed areas where I excel and where I could improve. Highly recommend it.",
  },
  {
    name: 'Sophie Laurent',
    date: 'January 28, 2026',
    avatar: avatarSophie,
    title: '"A real eye-opener"',
    body: "The detailed breakdown of my cognitive strengths was fascinating. I've shared this with friends and they all found it equally insightful.",
  },
  {
    name: 'Raj Patel',
    date: 'February 8, 2026',
    avatar: avatarRaj,
    title: '"Better than I expected"',
    body: "I've tried other IQ tests online but this one actually felt scientific. The category breakdown was really helpful and the results matched my self-assessment.",
  },
  {
    name: 'Mei Chen',
    date: 'January 19, 2026',
    avatar: avatarMei,
    title: '"Fascinating cognitive breakdown"',
    body: "What impressed me most was how detailed the report was. It didn't just give a number — it showed where my strengths lie and areas I can work on.",
  },
];

const SocialProofPageFF = () => {
  const { dispatch } = useFunnel();
  const { locale, t, formatNumber } = useFFIntl();
  const [review] = useState(() => REVIEWS[Math.floor(Math.random() * REVIEWS.length)]);
  const [userCount] = useState(() => 15000 + Math.floor(Math.random() * 5000));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-4 pt-4 pb-28">
        <div className="max-w-md w-full space-y-8">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-center text-foreground leading-tight mt-2"
          >
            <span className="text-primary">{t('50 Million+ people')}</span> {t('have discovered their IQ score')}
          </motion.h1>

          {/* Review Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="border border-border rounded-2xl p-5 bg-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={review.avatar} alt={review.name} className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
            </div>
            <p className="font-semibold text-foreground text-[15px]">{t(review.title.split('"').join(''))}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(review.body)}</p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Button
                onClick={() => { trackEvent(undefined, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'social_proof' }); dispatch({ type: 'SET_STAGE', stage: 'calculating' }); }}
                className="w-full h-12 text-base font-bold rounded-xl bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-white shadow-[0_0_20px_hsl(var(--cta)/0.4)]"
              >
                {t('Continue')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-bold">{t('{count} users', { count: formatNumber(userCount) })}</span> {t('took their IQ test today.')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-foreground">
                {t('Trusted by over')} <span className="font-bold">{t('50 million')}</span> {t('people.')}{' '}
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-warning">★</span>
                ))}
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default SocialProofPageFF;
