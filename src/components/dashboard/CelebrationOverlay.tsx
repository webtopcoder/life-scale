import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Star, ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export interface CelebrationEvent {
  type: "activity_complete" | "achievement" | "level_up" | "milestone";
  title: string;
  message: string;
  xp?: number;
  icon?: string;
}

const themeMap: Record<string, { gradient: string; iconBg: string }> = {
  activity_complete: { gradient: "from-primary/90 to-primary/70", iconBg: "bg-primary/20" },
  achievement: { gradient: "from-warning/90 to-warning/70", iconBg: "bg-warning/20" },
  level_up: { gradient: "from-accent/90 to-accent/70", iconBg: "bg-accent/20" },
  milestone: { gradient: "from-info/80 to-primary/80", iconBg: "bg-info/20" },
};

const iconMap: Record<string, React.ElementType> = {
  activity_complete: Star,
  achievement: Trophy,
  level_up: ArrowUp,
  milestone: Sparkles,
};

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{ width: size, height: size, backgroundColor: color, left: `${x}%`, top: -10 }}
      initial={{ opacity: 1, y: 0, rotate: 0 }}
      animate={{ opacity: 0, y: 600 + Math.random() * 200, rotate: 360 + Math.random() * 360, x: (Math.random() - 0.5) * 200 }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeOut" }}
    />
  );
}

export default function CelebrationOverlay({ event, onDismiss }: { event: CelebrationEvent | null; onDismiss: () => void }) {
  const [particles, setParticles] = useState<{ id: number; delay: number; x: number }[]>([]);

  useEffect(() => {
    if (event) {
      setParticles(Array.from({ length: 40 }, (_, i) => ({ id: i, delay: Math.random() * 0.5, x: Math.random() * 100 })));
    }
  }, [event]);

  return (
    <AnimatePresence>
      {event && (() => {
        const theme = themeMap[event.type] || themeMap.activity_complete;
        const Icon = iconMap[event.type] || Star;
        return (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {particles.map(p => <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />)}
            </div>

            {/* Card */}
            <motion.div
              className={`relative z-10 w-[90vw] max-w-sm rounded-2xl bg-gradient-to-br ${theme.gradient} p-8 text-center shadow-2xl`}
              initial={{ scale: 0.5, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className={`w-16 h-16 mx-auto rounded-full ${theme.iconBg} flex items-center justify-center mb-4`}
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <Icon className="w-8 h-8 text-primary-foreground" />
              </motion.div>

              <motion.h2
                className="text-2xl font-bold text-primary-foreground mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {event.title}
              </motion.h2>

              <motion.p
                className="text-primary-foreground/80 text-sm mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {event.message}
              </motion.p>

              {event.xp && (
                <motion.div
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground font-bold text-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <Zap className="w-4 h-4" /> +{event.xp} BrainPoints
                </motion.div>
              )}

              <motion.p
                className="text-primary-foreground/50 text-xs mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Tap anywhere to continue
              </motion.p>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
