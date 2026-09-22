import { motion } from 'framer-motion';

type HeroType = 'speed' | 'score' | 'category' | 'momentum' | 'profile';

const pulseRing = (delay: number) => ({
  initial: { scale: 1, opacity: 0.45 },
  animate: { scale: [1, 2.4], opacity: [0.45, 0] },
  transition: { duration: 2, repeat: Infinity, delay, ease: 'easeOut' as const },
});

const SpeedHero = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full">
    {[0, 0.6, 1.2].map((d, i) => (
      <motion.circle
        key={i}
        cx="60" cy="60" r="24"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        {...pulseRing(d)}
      />
    ))}
    <motion.path
      d="M66 30 L52 58 H62 L54 90 L76 54 H64 L72 30 Z"
      fill="hsl(var(--primary))"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
      style={{ transformOrigin: '60px 60px' }}
    />
  </svg>
);

const ScoreHero = () => {
  const bars = [
    { x: 20, h: 24, delay: 0.15 },
    { x: 36, h: 36, delay: 0.25 },
    { x: 52, h: 48, delay: 0.35 },
    { x: 68, h: 58, delay: 0.45 },
    { x: 84, h: 70, delay: 0.55 },
  ];
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      {[30, 50, 70].map((y) => (
        <line key={y} x1="16" y1={y} x2="100" y2={y} stroke="hsl(var(--primary) / 0.08)" strokeWidth="1" />
      ))}
      {bars.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x} y={92 - b.h} width="12" height={b.h} rx="3"
          fill={i === bars.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.2)'}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: b.delay }}
          style={{ transformOrigin: `${b.x + 6}px 92px` }}
        />
      ))}
      <motion.g
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.35 }}
      >
        <text x="90" y="16" textAnchor="middle" fontSize="8" fontWeight="700" fill="hsl(var(--primary))">You</text>
      </motion.g>
      <line x1="16" y1="92" x2="100" y2="92" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="1" />
    </svg>
  );
};

const CategoryHero = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full">
    <motion.circle
      cx="60" cy="56" r="32"
      fill="hsl(var(--primary) / 0.08)"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.3, 1] }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    />
    <motion.path
      d="M60 24 L67.5 44.5 L90 46 L73 60.5 L78 83 L60 71 L42 83 L47 60.5 L30 46 L52.5 44.5 Z"
      fill="hsl(var(--primary))"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
      style={{ transformOrigin: '60px 56px' }}
    />
    {[
      { cx: 28, cy: 32 },
      { cx: 92, cy: 38 },
      { cx: 36, cy: 80 },
      { cx: 88, cy: 76 },
    ].map((s, i) => (
      <motion.circle
        key={i}
        cx={s.cx} cy={s.cy} r="2.5"
        fill="hsl(var(--primary))"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.6] }}
        transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
      />
    ))}
  </svg>
);

const MomentumHero = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full">
    <motion.line
      x1="42" y1="28" x2="42" y2="92"
      stroke="hsl(var(--primary))"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4 }}
    />
    <motion.path
      d="M42 28 L84 42 L42 56 Z"
      fill="hsl(var(--primary))"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.3 }}
      style={{ transformOrigin: '42px 42px' }}
    />
    {[
      { x: 70, y: 30 },
      { x: 82, y: 50 },
      { x: 64, y: 64 },
      { x: 90, y: 36 },
    ].map((p, i) => (
      <motion.circle
        key={i}
        cx={p.x} cy={p.y} r="2"
        fill="hsl(var(--primary) / 0.6)"
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: [0, -18], opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 + i * 0.3 }}
      />
    ))}
  </svg>
);

/** No fingerprint asset available in this project — animated ring fallback for the profile hero. */
const ProfileHero = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full">
    {[0, 0.4, 0.8].map((d, i) => (
      <motion.circle
        key={i}
        cx="60" cy="60" r="20"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        {...pulseRing(d)}
      />
    ))}
    <motion.circle
      cx="60" cy="60" r="18"
      fill="hsl(var(--primary))"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
    />
    <motion.path
      d="M52 60 l6 6 12 -14"
      fill="none"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    />
  </svg>
);

const heroes: Record<HeroType, React.FC> = {
  speed: SpeedHero,
  score: ScoreHero,
  category: CategoryHero,
  momentum: MomentumHero,
  profile: ProfileHero,
};

interface ReinforcementHeroV2Props {
  type: HeroType;
}

const ReinforcementHeroV2 = ({ type }: ReinforcementHeroV2Props) => {
  const Hero = heroes[type];
  return (
    <motion.div
      className="w-28 h-28"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: [0.6, 1.08, 1], opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <Hero />
    </motion.div>
  );
};

export default ReinforcementHeroV2;
