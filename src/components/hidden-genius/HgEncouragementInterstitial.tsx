import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Props {
  stat: string;
  eyebrow: string;
  message: string;
  onContinue: () => void;
}

export const HgEncouragementInterstitial = ({ stat, eyebrow, message, onContinue }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="mb-3"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05 }}
        className="mb-6"
      >
        <p className="text-6xl sm:text-7xl font-bold tracking-tight text-foreground leading-none">
          {stat}
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.1 }}
        className="text-lg sm:text-xl font-medium text-foreground/90 mb-10 max-w-sm leading-snug"
      >
        {message}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.15 }}
        className="w-full max-w-xs"
      >
        <Button
          onClick={onContinue}
          className="w-full h-12 text-base font-semibold bg-cta hover:bg-cta/90 text-cta-foreground"
        >
          Continue
        </Button>
      </motion.div>
    </div>
  );
};
