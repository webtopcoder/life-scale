import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Props {
  onStart: () => void;
  hasProgress: boolean;
}

export const HgLanding = ({ onStart, hasProgress }: Props) => {
  return (
    <div className="text-center py-8 max-w-lg mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight"
      >
        Find your <span className="text-primary">hidden genius</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed"
      >
        A short session that reveals how you think, decide, and connect — and the strengths behind it.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            size="lg"
            className="bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))] px-10 py-7 text-lg font-semibold rounded-2xl shadow-xl transition-all hover:scale-[1.05] active:scale-[0.97]"
            onClick={onStart}
          >
            {hasProgress ? 'Continue' : 'Start'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
