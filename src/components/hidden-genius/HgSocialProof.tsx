import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import avatarSarah from '@/assets/hidden-genius/avatar-sarah.png';

interface Props {
  onContinue: () => void;
}

export const HgSocialProof = ({ onContinue }: Props) => {
  return (
    <div className="w-full max-w-lg mx-auto py-6 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase mb-3">
          Halfway there
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 leading-tight">
          You're doing great.
        </h2>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-8 text-left">
          <div className="flex items-start gap-4">
            <img
              src={avatarSarah}
              alt=""
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
            <div>
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-base text-foreground leading-relaxed mb-2">
                "It picked up on things about how I think that I hadn't put into words."
              </p>
              <p className="text-sm text-muted-foreground">Sarah, verified user</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onContinue}
          className="w-full h-12 text-base font-semibold bg-[hsl(var(--cta))] hover:bg-[hsl(var(--cta-hover))] text-[hsl(var(--cta-foreground))]"
        >
          Continue
        </Button>
      </motion.div>
    </div>
  );
};
