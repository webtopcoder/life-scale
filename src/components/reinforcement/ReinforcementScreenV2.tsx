import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ReinforcementHeroV2 from './ReinforcementHeroV2';

export interface ReinforcementScreenV2Props {
  type: 'speed' | 'score' | 'category' | 'momentum' | 'profile';
  percentile: number;
  title: string;
  message: string;
  categoryLabel?: string | null;
  bullets?: string[];
  footnote?: string;
  highlight?: string;
  belowCtaNote?: string;
  onContinue?: () => void;
}

/**
 * RVR2-specific reinforcement screen presentation. Pure presentation component —
 * no funnel state, analytics, or stage transitions live here.
 */
const ReinforcementScreenV2 = ({
  type,
  percentile,
  title,
  message,
  categoryLabel,
  bullets,
  footnote,
  highlight,
  belowCtaNote,
  onContinue,
}: ReinforcementScreenV2Props) => {
  const token = highlight ?? `${percentile}%`;
  const titleParts = title.includes(token) ? title.split(token) : null;

  return (
    <div
      className="min-h-screen bg-background flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.04) 0%, hsl(var(--background)) 70%)' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col items-center px-6 pt-16 pb-8"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <ReinforcementHeroV2 type={type} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-2xl font-bold text-foreground leading-tight text-center whitespace-pre-line"
          >
            {titleParts ? (
              <>
                {titleParts[0]}
                <span className="text-primary">{token}</span>
                {titleParts.slice(1).join(token)}
              </>
            ) : (
              title
            )}
            {categoryLabel && (
              <>
                {': '}
                <span className="text-primary">{categoryLabel}</span>
              </>
            )}
          </motion.h1>

          {bullets?.length ? (
            <>
              <motion.ul
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="mt-5 w-full max-w-xs space-y-3 text-left"
              >
                {bullets.map((b, i) => (
                  <motion.li
                    key={b}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.35 }}
                    className="flex items-start gap-3 text-sm text-foreground leading-snug"
                  >
                    <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>{b}</span>
                  </motion.li>
                ))}
              </motion.ul>
              {footnote && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.95, duration: 0.4 }}
                  className="text-muted-foreground text-xs leading-relaxed text-center mt-5 max-w-xs"
                >
                  {footnote}
                </motion.p>
              )}
            </>
          ) : (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="text-muted-foreground text-sm leading-relaxed text-center mt-3 max-w-xs"
            >
              {message}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="w-full mt-8 md:flex md:justify-center"
          >
            <Button
              size="lg"
              onClick={onContinue}
              className="w-full md:w-auto md:min-w-[280px] h-14 rounded-xl font-bold text-base bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta))]/90 text-white"
            >
              Continue
            </Button>
          </motion.div>

          {belowCtaNote && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              className="mt-3 text-center text-xs italic text-muted-foreground max-w-xs"
            >
              {belowCtaNote}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReinforcementScreenV2;
