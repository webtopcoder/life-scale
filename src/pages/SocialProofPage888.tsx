import { motion } from 'framer-motion';
import { useFunnel888 } from '@/context/Funnel888Context';
import { Button } from '@/components/ui/button';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { Users, Star } from 'lucide-react';
import avatarCara from '@/assets/avatar-cara.jpg';

const REVIEW = {
  name: 'Cara Mitchell',
  date: 'January 10, 2026',
  avatar: avatarCara,
  body: 'The results felt accurate and helped me see strengths in my thinking I had never noticed before.',
};

const SocialProofPage888 = () => {
  const { dispatch } = useFunnel888();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col [--primary:216_100%_47%] [--cta:175_79%_29%] [--cta-hover:175_79%_25%]">
      <header className="shrink-0 border-b-4 border-[hsl(var(--cta))] bg-background px-4 py-2">
        <span className="text-xl font-bold text-foreground">Life Scale</span>
      </header>

      <main className="flex-1 px-4 pb-4 pt-3">
        <div className="mx-auto w-full max-w-sm space-y-2.5">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-center text-2xl font-bold leading-tight text-foreground"
          >
            <span className="text-primary">50 Million+ people</span><br />have discovered their<br />IQ score with Life Scale
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="space-y-2 rounded-lg border border-border bg-card p-3"
          >
            <div className="flex gap-1" aria-label="5 out of 5 stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-warning text-warning" />
              ))}
            </div>
            <p className="text-sm leading-snug text-muted-foreground">{REVIEW.body}</p>
            <div className="flex items-center gap-2">
              <img src={REVIEW.avatar} alt={REVIEW.name} className="h-8 w-8 rounded-full object-cover" />
              <p className="text-sm text-foreground">
                <span className="font-medium">{REVIEW.name}</span>
                <span className="text-muted-foreground"> · verified customer</span>
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.35 }}>
            <Button
              onClick={() => { trackEvent(undefined, EVENTS.FUNNEL_STEP_COMPLETED, { step: 'social_proof' }); dispatch({ type: 'SET_STAGE', stage: 'calculating' }); }}
              className="h-12 w-full rounded-xl bg-[hsl(var(--cta))] text-base font-bold text-primary-foreground hover:bg-[hsl(var(--cta-hover))]"
            >
              Continue
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="flex items-center gap-3 px-1"
          >
            <Users className="h-5 w-5 flex-shrink-0 text-foreground" strokeWidth={1.75} />
            <p className="text-sm text-foreground">
              <span className="font-bold">15,000+ users</span> took their IQ test today.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SocialProofPage888;
