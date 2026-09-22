import { STORAGE_KEYS } from '@/constants/storage';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostHog } from '@posthog/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunnel } from '@/context/FunnelContext';
import { EVENTS, trackEvent } from '@/constants/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { getStrongestCategory, getSecondaryCategory, scoreToPercentile } from '@/engine/scoringEngine';
import { Category, CategoryScores } from '@/types/funnel';
import {
  Brain, Target, Briefcase, Cpu, BookOpen, Lightbulb,
  TrendingUp, Sprout, ChevronRight, ChevronLeft, Lock, CheckCircle2,
  Zap, Shield, Eye, BarChart3, Users, ArrowRight,
  Star, Award, Sparkles, Clock, Heart, Dumbbell,
  Moon, Apple, Activity, Flame, GraduationCap, Globe, Share2
} from 'lucide-react';
import ShareModal from '@/components/report/ShareModal';
import CertificateSection from '@/components/report/CertificateSection';
import GeographicSection from '@/components/report/GeographicSection';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/context/AuthContext';
import { useUserPurchases } from '@/hooks/useUserPurchases';
import { PRODUCT_PRICING } from '@/lib/upsellPricing';

import { WeaknessReportUpsell } from '@/components/upsells/WeaknessReportUpsell';
import { GeniusBlueprintUpsell } from '@/components/upsells/GeniusBlueprintUpsell';
import { BrainCoachUpsell } from '@/components/upsells/BrainCoachUpsell';

import { getCategoryFloors, CATEGORY_FLOORS, getArchetype, ARCHETYPES } from '@/lib/archetypes';
import { CATEGORY_DEPTH, breakdownFraming, strengthsFraming, careerFraming } from '@/engine/reportCopy/iqCopy';
export { getCategoryFloors, CATEGORY_FLOORS };

/* ─── constants ─── */

export const CATEGORY_LABELS: Record<Category, string> = {
  logic: 'Logical Reasoning',
  pattern: 'Pattern Recognition',
  spatial: 'Spatial Awareness',
  speed: 'Processing Speed',
  self: 'Self-Assessment',
};

export const CATEGORY_ICONS: Record<Category, typeof Brain> = {
  logic: Brain,
  pattern: Target,
  spatial: Cpu,
  speed: Zap,
  self: Eye,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  logic: 'hsl(220 70% 45%)',
  pattern: 'hsl(280 60% 50%)',
  spatial: 'hsl(160 60% 45%)',
  speed: 'hsl(30 90% 55%)',
  self: 'hsl(350 70% 55%)',
};

/* ─── types ─── */

export interface ReportSection {
  id: string;
  title: string;
  icon: typeof Brain;
}

/* ─── animated counter hook ─── */

export function useCountUp(target: number, duration: number = 2000, start: boolean = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    let frame: number;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, start]);
  return value;
}

/* ─── confetti particle system ─── */

interface Particle {
  id: number; x: number; y: number; angle: number; speed: number;
  size: number; color: string; rotation: number; rotationSpeed: number;
  shape: 'circle' | 'rect' | 'triangle'; delay: number;
}

export function ConfettiOverlay({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ['hsl(var(--primary))', 'hsl(280 60% 50%)', 'hsl(160 60% 45%)', 'hsl(30 90% 55%)', 'hsl(350 70% 55%)', 'hsl(45 95% 55%)'];
    const shapes: Particle['shape'][] = ['circle', 'rect', 'triangle'];
    setParticles(Array.from({ length: 60 }, (_, i) => ({
      id: i, x: 50 + (Math.random() - 0.5) * 30, y: 40,
      angle: -90 + (Math.random() - 0.5) * 120, speed: 2 + Math.random() * 4,
      size: 4 + Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 720,
      shape: shapes[Math.floor(Math.random() * shapes.length)], delay: Math.random() * 0.4,
    })));
  }, [trigger]);
  if (!particles.length) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
            backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '1px' : '0',
            borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
            borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
            borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
          }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: p.rotation, scale: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: Math.cos((p.angle * Math.PI) / 180) * p.speed * 80,
            y: [Math.sin((p.angle * Math.PI) / 180) * p.speed * 40, Math.sin((p.angle * Math.PI) / 180) * p.speed * 40 + 200],
            rotate: p.rotation + p.rotationSpeed, scale: [0, 1.2, 0.8],
          }}
          transition={{ duration: 2 + Math.random(), delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      ))}
    </div>
  );
}

/* ─── Section 1: Score Reveal ─── */

export function ScoreRevealSection({ finalScore }: { finalScore: number }) {
  const animatedScore = useCountUp(finalScore, 3000);
  const [phase, setPhase] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 3500);
    const tConfetti = setTimeout(() => setShowConfetti(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tConfetti); };
  }, []);

  return (
    <div className="text-center space-y-8 relative">
      <ConfettiOverlay trigger={showConfetti} />
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, type: 'spring' }}>
        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Your Cognitive Score</div>
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-52 h-52" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <motion.circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={534} strokeDashoffset={534}
              animate={{ strokeDashoffset: 534 - (534 * Math.min(finalScore / 160, 1)) }}
              transition={{ duration: 3, ease: 'easeOut' }} transform="rotate(-90 100 100)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black text-foreground">{animatedScore}</span>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-0 shadow-[var(--shadow-card)] max-w-md mx-auto">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 text-left mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                   <div>
                    <div className="text-sm font-semibold text-foreground">
                      {finalScore >= 140 ? 'Exceptional Intelligence' : finalScore >= 120 ? 'Above Average Intelligence' : 'Strong Cognitive Profile'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {finalScore >= 140 ? 'Top 2% of the population' : finalScore >= 120 ? 'Top 15% of the population' : 'Solid foundation with growth potential'}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {finalScore >= 140
                    ? 'A seriously strong result. You think faster and sharper than almost everyone around you, and it shows in the problems other people get stuck on.'
                    : finalScore >= 120
                    ? 'Sharper than most. You think clearly, learn quickly, and handle complexity better than average — with room to push further.'
                    : 'A solid mind with real strengths. The breakdown ahead shows where you shine and where a little practice pays off fastest.'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-[var(--shadow-soft)] max-w-md mx-auto">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">What the number means:</strong> {finalScore} reflects your performance across logic, pattern recognition, spatial reasoning and processing speed, scored against everyone else who took the same adaptive test.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 inline mr-1" />
            Let's break down your cognitive strengths in detail…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Section 2: Cognitive Breakdown with Radar Chart ─── */

export function AnimatedRadarChart({ scores, finalScore = 0 }: { scores: CategoryScores; finalScore?: number }) {
  const categories = Object.keys(scores) as Category[];
  const center = 110;
  const radius = 75;
  const angleStep = (2 * Math.PI) / categories.length;
  const floors = getCategoryFloors(finalScore);

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = radius * Math.max(value, floors[categories[index]]);
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const points = categories.map((_, i) => getPoint(i, scores[categories[i]]));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex justify-center my-4">
      <svg viewBox="0 0 220 220" className="w-64 h-64">
        {/* Grid */}
        {gridLevels.map((level) => {
          const gridPoints = categories.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return { x: 110 + radius * level * Math.cos(angle), y: 110 + radius * level * Math.sin(angle) };
          });
          const d = gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return <path key={level} d={d} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />;
        })}
        {/* Axes */}
        {categories.map((cat, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const end = { x: 110 + radius * Math.cos(angle), y: 110 + radius * Math.sin(angle) };
          const labelPos = { x: 110 + (radius + 22) * Math.cos(angle), y: 110 + (radius + 22) * Math.sin(angle) };
          const fullLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
          return (
            <g key={cat}>
              <line x1={110} y1={110} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />
              <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle"
                fill={CATEGORY_COLORS[cat]} fontSize="7" fontWeight="bold">
                {fullLabel}
              </text>
            </g>
          );
        })}
        {/* Data polygon */}
        <motion.path d={pathD} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2"
          initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }} style={{ transformOrigin: '110px 110px' }} />
        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill={CATEGORY_COLORS[categories[i]]} stroke="white" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.15, duration: 0.4, type: 'spring' }} />
        ))}
      </svg>
    </div>
  );
}

export function CategoryBreakdownSection({ scores, finalScore = 0, addon }: { scores: CategoryScores; finalScore?: number; addon?: ReactNode }) {
  const floors = getCategoryFloors(finalScore);
  /* Depth prose renders only for the strongest and weakest categories — word budget. */
  const rankedCats = (Object.entries(scores) as [Category, number][])
    .sort(([ka, a], [kb, b]) => Math.max(b, floors[kb]) - Math.max(a, floors[ka]))
    .map(([k]) => k);
  const depthCats: Category[] = [rankedCats[0], rankedCats[rankedCats.length - 1]];

  const getInsight = (cat: Category, score: number): string => {
    const insights: Record<Category, Record<string, string>> = {
      logic: {
        high: "You land on the answer while others are still reading the question.",
        mid: "Solid logic, and one of the fastest areas to sharpen further.",
        low: "Still developing — reasoning practice moves this faster than any other category.",
      },
      pattern: {
        high: "You see connections that pass most people by, and call what is coming next.",
        mid: "You pick up sequences better than most; the jump to great is small.",
        low: "Building — your brain registers patterns already; practice teaches you to catch them.",
      },
      spatial: {
        high: "You picture how things fit together with unusual accuracy.",
        mid: "Good with maps and layouts; rotation drills push it higher.",
        low: "Plenty of room, and it responds fast to rotation practice.",
      },
      speed: {
        high: "You read, decide and learn faster than the people around you.",
        mid: "Good pace. Sleep and short timed drills lift it within weeks.",
        low: "Normal range, and among the easiest things to improve.",
      },
      self: {
        high: "A clear read on your own strengths and gaps, so effort lands where it matters.",
        mid: "You can usually tell when you are struggling. Worth sharpening.",
        low: "High leverage — you learn faster and repeat fewer mistakes.",
      },
    };
    const level = score > 0.7 ? 'high' : score > 0.4 ? 'mid' : 'low';
    return insights[cat][level];
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold text-foreground">Your Cognitive Breakdown</h3>
        <p className="text-sm text-muted-foreground mt-1">Your performance across five cognitive domains</p>
      </div>

      <AnimatedRadarChart scores={scores} finalScore={finalScore} />

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {breakdownFraming(
              CATEGORY_LABELS[(Object.entries(scores) as [Category, number][]).reduce((a, b) => (Math.max(b[1], floors[b[0]]) > Math.max(a[1], floors[a[0]]) ? b : a))[0]],
              CATEGORY_LABELS[(Object.entries(scores) as [Category, number][]).reduce((a, b) => (Math.max(b[1], floors[b[0]]) < Math.max(a[1], floors[a[0]]) ? b : a))[0]],
            )}
          </p>
        </CardContent>
      </Card>

      {addon}


      {(Object.entries(scores) as [Category, number][]).map(([cat, rawScore], i) => {
        const score = Math.max(rawScore, floors[cat]);
        const Icon = CATEGORY_ICONS[cat];
        const percentage = Math.round(score * 100);

        return (
          <motion.div key={cat} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
            <Card className="border-0 shadow-[var(--shadow-elevated)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[cat]}15` }}>
                    <Icon className="w-5 h-5" style={{ color: CATEGORY_COLORS[cat] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[cat]}</span>
                      <span className="text-sm font-bold" style={{ color: CATEGORY_COLORS[cat] }}>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3 + i * 0.15, duration: 0.8 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">{getInsight(cat, score)}</p>
                  {cat === depthCats[1] && (
                    <>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                        <span className="font-semibold text-foreground">Where you feel it: </span>
                        {CATEGORY_DEPTH[cat].realTasks}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                        <span className="font-semibold text-foreground">How to move it: </span>
                        {CATEGORY_DEPTH[cat].strengthens}
                      </p>
                    </>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{percentage}%</div>
                      <div className="text-xs text-muted-foreground">Percentage</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{score > 0.7 ? 'Elite' : score > 0.5 ? 'Strong' : 'Growing'}</div>
                      <div className="text-xs text-muted-foreground">Classification</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Section 3: Deep Dive Strength ─── */

const FAMOUS_PEOPLE: Record<Category, { name: string; desc: string; trait: string; photo: string }[]> = {
  logic: [
    { name: 'Sherlock Holmes (Archetype)', desc: 'The master of deductive reasoning', trait: 'Logical chain analysis', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Sherlock_Holmes_Portrait_Paget.jpg/100px-Sherlock_Holmes_Portrait_Paget.jpg' },
    { name: 'Ada Lovelace', desc: 'Pioneered algorithmic thinking', trait: 'Structured problem decomposition', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/100px-Ada_Lovelace_portrait.jpg' },
    { name: 'Alan Turing', desc: 'Founded computer science through pure logic', trait: 'Formal logical systems', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/100px-Alan_Turing_Aged_16.jpg' },
  ],
  pattern: [
    { name: 'Nikola Tesla', desc: 'Visualized entire inventions before building them', trait: 'Abstract pattern synthesis', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/N.Tesla.JPG/100px-N.Tesla.JPG' },
    { name: 'Srinivasa Ramanujan', desc: 'Intuited mathematical patterns others couldn\'t see', trait: 'Numerical pattern recognition', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Srinivasa_Ramanujan_-_OPC_-_1.jpg/100px-Srinivasa_Ramanujan_-_OPC_-_1.jpg' },
    { name: 'Marie Curie', desc: 'Detected patterns in radioactive phenomena', trait: 'Scientific pattern analysis', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Marie_Curie_c._1920s.jpg/100px-Marie_Curie_c._1920s.jpg' },
  ],
  spatial: [
    { name: 'Leonardo da Vinci', desc: 'Master of spatial visualization in art & engineering', trait: '3D mental modeling', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Leonardo_self.jpg/100px-Leonardo_self.jpg' },
    { name: 'Simone Biles', desc: 'Executes complex aerial maneuvers with pinpoint body awareness', trait: 'Kinesthetic spatial mastery', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Simone_Biles_in_2024_%28cropped%29.jpg/100px-Simone_Biles_in_2024_%28cropped%29.jpg' },
    { name: 'Steve Jobs', desc: 'Obsessed over spatial design and product layout', trait: 'Visual-spatial intuition', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/100px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg' },
  ],
  speed: [
    { name: 'Magnus Carlsen', desc: 'Processes chess positions at extraordinary speed', trait: 'Rapid pattern processing', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Magnus_Carlsen_in_2023.jpg/100px-Magnus_Carlsen_in_2023.jpg' },
    { name: 'Fighter Pilots', desc: 'Make split-second decisions under extreme pressure', trait: 'Accelerated decision cycles', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Fighter_pilot_at_the_controls.jpg/100px-Fighter_pilot_at_the_controls.jpg' },
    { name: 'ER Physicians', desc: 'Diagnose and act in seconds', trait: 'Rapid information synthesis', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/US_Navy_091006-N-2571C-033_A_doctor_reviews_a_patient%27s_chart.jpg/100px-US_Navy_091006-N-2571C-033_A_doctor_reviews_a_patient%27s_chart.jpg' },
  ],
  self: [
    { name: 'Marcus Aurelius', desc: 'Master of self-reflection and metacognition', trait: 'Deep self-awareness', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/MSR-ra-61-b-1-DM.jpg/100px-MSR-ra-61-b-1-DM.jpg' },
    { name: 'Daniel Kahneman', desc: 'Studied how we think about thinking', trait: 'Metacognitive mastery', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Daniel_Kahneman_%282crop%29.jpg/100px-Daniel_Kahneman_%282crop%29.jpg' },
    { name: 'Brené Brown', desc: 'Pioneer in understanding human emotional patterns', trait: 'Introspective intelligence', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Bren%C3%A9_Brown_2022.jpg/100px-Bren%C3%A9_Brown_2022.jpg' },
  ],
};

const DAILY_LIFE: Record<Category, string[]> = {
  logic: ['You spot flawed arguments and can say exactly why they fail', 'Dense instructions and technical documents feel intuitive', 'People come to you for a rational second opinion', 'You build frameworks for ambiguity without being asked'],
  pattern: ['You notice trends before the crowd does', 'Puzzles, codes and hidden systems pull you in', 'You predict endings and outcomes with odd accuracy', 'You look for the rule rather than memorising facts'],
  spatial: ['You rarely get lost and can retrace a route once travelled', 'You estimate distances, volumes and fit with unusual accuracy', 'Blueprints, diagrams and assembly steps read easily', 'You notice when a design is fractionally off'],
  speed: ['You react fast in conversation, games and emergencies', 'You read and absorb written material quickly', 'Context-switching costs you less than it costs most people', 'Deadlines sharpen your focus rather than scrambling it'],
  self: ['You feel a reaction rising and choose your response', 'You set goals you can actually hit', 'You adapt how you learn instead of following generic advice', 'You predict your own performance before you attempt the task'],
};

export function DeepDiveStrengthSection({ strongest, scores, finalScore = 0, addon }: { strongest: Category; scores: CategoryScores; finalScore?: number; addon?: ReactNode }) {
  const floors = getCategoryFloors(finalScore);
  const score = Math.max(scores[strongest], floors[strongest]);
  const famous = FAMOUS_PEOPLE[strongest];
  const daily = DAILY_LIFE[strongest];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Deep Dive: {CATEGORY_LABELS[strongest]}</h3>
        <p className="text-sm text-muted-foreground mt-1">Your #1 cognitive strength explored</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: CATEGORY_COLORS[strongest] }} />
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[strongest]}15` }}>
              <Star className="w-7 h-7" style={{ color: CATEGORY_COLORS[strongest] }} />
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: CATEGORY_COLORS[strongest] }}>{Math.round(score * 100)}%</div>
              <div className="text-xs text-muted-foreground">{score > 0.85 ? 'Exceptional — Top 5%' : score > 0.7 ? 'Strong — Top 15%' : 'Above Average'}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {strongest === 'logic' && 'You feel it when an argument does not hold before you can say why — built from thousands of quiet checks.'}
            {strongest === 'pattern' && 'Where most people need five or six examples to see a rule, you tend to have it after two or three. That is a real edge anywhere hidden structure matters.'}
            {strongest === 'spatial' && 'An unusually accurate mind\'s eye: rotation, navigation, and diagrams that leave other people stuck.'}
            {strongest === 'speed' && 'You take information in faster, connect it faster, and respond with less delay. That advantage compounds across every task you do.'}
            {strongest === 'self' && 'You can watch your own thinking while it happens, so you catch errors earlier and switch strategy sooner.'}
          </p>
        </CardContent>
      </Card>

      {addon}

      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" /> Notable Minds Who Share This Strength
        </h4>
        <div className="space-y-2">
          {famous.map((person, i) => (
            <motion.div key={person.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
              <Card className="border-0 shadow-[var(--shadow-soft)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="w-12 h-12 rounded-full flex-shrink-0 bg-muted object-cover border-2 border-primary/20"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(person.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">{person.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{person.desc}</div>
                      <div className="text-xs font-medium mt-1.5 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${CATEGORY_COLORS[strongest]}15`, color: CATEGORY_COLORS[strongest] }}>
                        {person.trait}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-accent" /> How This Shows Up Daily
        </h4>
        <Card className="border-0 shadow-[var(--shadow-soft)]">
          <CardContent className="p-4 space-y-3">
            {daily.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: CATEGORY_COLORS[strongest] }} />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Section 4: Population Comparison with Bell Curve ─── */

function AnimatedBellCurve({ finalScore, percentile }: { finalScore: number; percentile: number }) {
  const width = 300;
  const height = 120;
  const mean = 100;
  const std = 15;

  const bellPoints: string[] = [];
  for (let x = 55; x <= 145; x += 1) {
    const z = (x - mean) / std;
    const y = Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
    const px = ((x - 55) / 90) * width;
    const py = height - y * std * height * 2.2 - 5;
    bellPoints.push(`${px},${py}`);
  }
  const bellPath = `M ${bellPoints.join(' L ')}`;

  const userX = ((Math.min(Math.max(finalScore, 55), 145) - 55) / 90) * width;
  const userZ = (finalScore - mean) / std;
  const userY = height - (Math.exp(-0.5 * userZ * userZ) / (std * Math.sqrt(2 * Math.PI))) * std * height * 2.2 - 5;

  const bands = [
    { from: 55, to: 85, color: 'hsl(var(--muted))', label: 'Below Avg' },
    { from: 85, to: 115, color: 'hsl(var(--muted-foreground) / 0.15)', label: 'Average' },
    { from: 115, to: 130, color: 'hsl(var(--primary) / 0.2)', label: 'Above Avg' },
    { from: 130, to: 145, color: 'hsl(var(--accent) / 0.25)', label: 'Exceptional' },
  ];

  return (
    <div className="flex justify-center my-6">
      <svg viewBox={`0 0 ${width} ${height + 30}`} className="w-full max-w-md">
        {/* Shaded bands */}
        {bands.map((band) => {
          const x1 = ((band.from - 55) / 90) * width;
          const x2 = ((band.to - 55) / 90) * width;
          return (
            <rect key={band.label} x={x1} y={0} width={x2 - x1} height={height} fill={band.color} opacity={0.4} />
          );
        })}
        {/* Bell curve */}
        <motion.path d={bellPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} />
        {/* User marker */}
        <motion.g initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}>
          <line x1={userX} y1={userY} x2={userX} y2={height} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx={userX} cy={userY} r="6" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
          <rect x={userX - 20} y={userY - 22} width="40" height="16" rx="4" fill="hsl(var(--primary))" />
          <text x={userX} y={userY - 11} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">YOU</text>
        </motion.g>
        {/* X-axis labels */}
        {[70, 85, 100, 115, 130].map((v) => (
          <text key={v} x={((v - 55) / 90) * width} y={height + 15} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">{v}</text>
        ))}
        <text x={width / 2} y={height + 28} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="7">IQ Score Distribution</text>
      </svg>
    </div>
  );
}

export function PopulationComparisonSection({ finalScore, percentile, addon }: { finalScore: number; percentile: number; addon?: ReactNode }) {
  const [showDetail, setShowDetail] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowDetail(true), 1500); return () => clearTimeout(t); }, []);

  const rarityPeople = Math.max(2, Math.round(100 / (100 - percentile)));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">How You Compare</h3>
        <p className="text-sm text-muted-foreground mt-1">Your position in the global population</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The curve below shows how scores spread across the population. Most people cluster near 100; the further out you sit, the rarer the result.
          </p>
        </CardContent>
      </Card>

      <AnimatedBellCurve finalScore={finalScore} percentile={percentile} />

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Your Score', value: finalScore.toString(), sub: 'IQ Points' },
          { label: 'Ranking', value: `${percentile}%`, sub: 'Percentage' },
          { label: 'Rarer Than', value: `1 in ${rarityPeople}`, sub: 'People' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}>
            <Card className="border-0 shadow-[var(--shadow-soft)]">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-primary">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
                <div className="text-xs font-medium text-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {addon}

      <AnimatePresence>
        {showDetail && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Card className="border-0 shadow-[var(--shadow-soft)]">
              <CardContent className="p-4">
                <div className="flex gap-3 items-start">
                  <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Out of every <strong className="text-foreground">1,000 people</strong> who take this assessment,
                    only <strong className="text-foreground">{Math.max(1, Math.round(1000 * (1 - percentile / 100)))}</strong> score as high as you.
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-[var(--shadow-soft)]">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Your ranking:</strong> better than {percentile}% of the population on the standard normal distribution.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Section 5: Cognitive Age Analysis ─── */

export function CognitiveAgeSection({ finalScore }: { finalScore: number }) {
  const cognitiveAge = Math.round(25 - (finalScore - 100) * 0.15);
  const ageDiff = 30 - cognitiveAge; // assuming average user ~30
  const animatedAge = useCountUp(cognitiveAge, 2500);

  const arcRadius = 70;
  const arcCenter = 85;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const ageRange = { min: 15, max: 45 };
  const normalized = 1 - (cognitiveAge - ageRange.min) / (ageRange.max - ageRange.min);
  const currentAngle = startAngle + totalArc * normalized;

  const degToRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number, r: number) => {
    const s = degToRad(start);
    const e = degToRad(end);
    const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${arcCenter + r * Math.cos(s)} ${arcCenter + r * Math.sin(s)} A ${r} ${r} 0 ${largeArc} 1 ${arcCenter + r * Math.cos(e)} ${arcCenter + r * Math.sin(e)}`;
  };

  const gaugeColor = cognitiveAge < 25 ? 'hsl(160 60% 45%)' : cognitiveAge < 35 ? 'hsl(var(--primary))' : 'hsl(30 90% 55%)';
  const percent = Math.round(normalized * 100);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Cognitive Age Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">How old is your brain, really?</p>
      </div>

      {/* Horizontal gauge — mobile-friendly */}
      <Card className="border-0 shadow-[var(--shadow-elevated)]">
        <CardContent className="p-5 space-y-5">
          {/* Big number */}
          <div className="text-center">
            <motion.div
              className="text-5xl font-black"
              style={{ color: gaugeColor }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {animatedAge}
            </motion.div>
            <div className="text-sm text-muted-foreground mt-1">Cognitive Age</div>
          </div>

          {/* Horizontal bar */}
          <div className="space-y-2">
            <div className="relative h-4 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: gaugeColor }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>45+ yrs</span>
              <span>30 yrs</span>
              <span>15 yrs</span>
            </div>
          </div>

          {/* Insight */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Your brain performs like someone</div>
            <div className="text-2xl font-black text-primary mt-1">{cognitiveAge} years old</div>
            {ageDiff > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-2">
                <span className="text-sm font-semibold text-accent">That's {ageDiff} years younger than average! 🎉</span>
              </motion.div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {cognitiveAge < 25
                ? 'Your speed and accuracy across the domains point to unusually youthful cognitive function — quick processing and flexible thinking.'
                : 'Your results show healthy performance with room to sharpen. Cognitive age responds well to exercise, sleep and regular mental challenge.'}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">How it is calculated:</strong> processing speed, working memory and reasoning accuracy against age-group norms. Unlike calendar age, it moves both ways.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section 6: Strengths Profile (existing, kept) ─── */

export function StrengthsProfileSection({ scores, strongest, secondary, addon }: { scores: CategoryScores; strongest: Category; secondary: Category; addon?: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Your Cognitive Strengths</h3>
        <p className="text-sm text-muted-foreground mt-1">What makes your mind unique</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {strengthsFraming(CATEGORY_LABELS[strongest])}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            {CATEGORY_DEPTH[strongest].realTasks}
          </p>
        </CardContent>
      </Card>

      {addon}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: 'var(--gradient-primary)' }} />
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Primary Strength</div>
                <div className="text-lg font-bold text-foreground">{CATEGORY_LABELS[strongest]}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {strongest === 'logic' && 'You break problems into parts by instinct and see through complexity that stalls other people.'}
              {strongest === 'pattern' && 'You connect things other people never notice are related — the whole game in work that rewards synthesis.'}
              {strongest === 'spatial' && 'You see the solution to a physical problem before you attempt it.'}
              {strongest === 'speed' && 'You take in more in the same time, which compounds under pressure and while learning.'}
              {strongest === 'self' && 'Knowing where your thinking needs support makes every hour of practice worth more.'}
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-0 shadow-[var(--shadow-soft)]">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Secondary Strength</div>
                <div className="font-bold text-foreground">{CATEGORY_LABELS[secondary]}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{CATEGORY_LABELS[strongest]}</strong> plus <strong className="text-foreground">{CATEGORY_LABELS[secondary]}</strong> is a pairing fewer than <strong className="text-foreground">8%</strong> of people share — your first language, and the angle you switch to.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ─── Section 7: Weakness Analysis (NEW) ─── */

export function WeaknessAnalysisSection({ scores, finalScore = 0 }: { scores: CategoryScores; finalScore?: number }) {
  const floors = getCategoryFloors(finalScore);
  const sorted = (Object.entries(scores) as [Category, number][]).sort(([, a], [, b]) => a - b);
  const [weakest] = sorted[0];
  const weakScore = Math.max(sorted[0][1], floors[weakest]);

  const improvements: Record<Category, { exercises: string[]; timeline: string; potential: string }> = {
    logic: { exercises: ['Syllogism practice sets', 'If-then reasoning chains', 'Logic grid puzzles', 'Formal argument analysis'], timeline: '2-4 weeks of daily practice', potential: '+15-20% improvement potential' },
    pattern: { exercises: ['Number sequence completion', 'Matrix reasoning puzzles', 'Abstract pattern matching', 'Rule discovery exercises'], timeline: '3-5 weeks of regular training', potential: '+12-18% improvement potential' },
    spatial: { exercises: ['Mental rotation tasks', '3D cube folding puzzles', 'Mirror image identification', 'Map reading challenges'], timeline: '2-4 weeks with visual exercises', potential: '+15-22% improvement potential' },
    speed: { exercises: ['Timed reaction drills', 'Rapid categorization tasks', 'Speed reading exercises', 'Dual n-back training'], timeline: '1-3 weeks of speed training', potential: '+10-15% improvement potential' },
    self: { exercises: ['Metacognitive journaling', 'Calibration exercises', 'Reflective assessment practice', 'Mindfulness meditation'], timeline: '4-6 weeks of reflection practice', potential: '+8-12% improvement potential' },
  };

  const imp = improvements[weakest];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Growth Opportunity</h3>
        <p className="text-sm text-muted-foreground mt-1">Your path to balanced cognitive power</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
        <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, hsl(30 90% 55%), hsl(var(--primary)))' }} />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Biggest Growth Area</div>
              <div className="text-lg font-bold text-foreground">{CATEGORY_LABELS[weakest]}</div>
              <div className="text-xs font-semibold text-accent">{imp.potential}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Don't worry — this is actually great news. {CATEGORY_LABELS[weakest]} is one of the most trainable cognitive skills. With focused practice, improvements in this area can dramatically boost your overall cognitive score. Neuroscientific research consistently shows that the brain's most underdeveloped areas respond most dramatically to training — a phenomenon called "low-hanging fruit plasticity." Your improvement potential here is significantly higher than in areas where you're already strong.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Here's the key insight: cognitive improvement isn't linear. The first 20% of improvement comes from the first 10% of effort. You're not starting from zero — your brain already has the foundational wiring for {CATEGORY_LABELS[weakest].toLowerCase()}. What targeted training does is strengthen those existing connections and build new parallel pathways. Think of it like upgrading a road from a single lane to a highway: the route already exists, you're just increasing its capacity.
          </p>
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="text-sm font-semibold text-foreground mb-3">Your Improvement Roadmap</div>
            {imp.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">{ex}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Expected timeline: {imp.timeline}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Why does this matter?</strong> A balanced cognitive profile isn't just about scoring higher on tests — it's about being more adaptable in real life. When your weakest area improves, it creates a multiplier effect: you can approach problems from more angles, you're less dependent on a single cognitive strategy, and you become resilient against situations that specifically tax your weaker areas. Research from the University of Michigan shows that balanced cognitive profiles predict professional success more reliably than profiles with extreme strengths and weaknesses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section 8: Career Aptitude (expanded) ─── */

export function CareerInsightsSection({ strongest, secondary, addon }: { strongest: Category; secondary: Category; addon?: ReactNode }) {
  const careers: Record<Category, { roles: { title: string; industry: string; dayInLife: string }[] }> = {
    logic: { roles: [
      { title: 'Strategic Consultant', industry: 'Consulting', dayInLife: 'Analyzing market data, building frameworks, and presenting solutions to C-suite executives.' },
      { title: 'Research Scientist', industry: 'Research', dayInLife: 'Designing experiments, analyzing results, and publishing findings that advance human knowledge.' },
      { title: 'Legal Analyst', industry: 'Law', dayInLife: 'Reviewing case precedents, building logical arguments, and advising on regulatory compliance.' },
      { title: 'Systems Architect', industry: 'Technology', dayInLife: 'Designing complex software systems, optimizing performance, and solving scalability challenges.' },
    ]},
    pattern: { roles: [
      { title: 'Data Scientist', industry: 'Technology', dayInLife: 'Uncovering hidden patterns in datasets, building predictive models, and turning data into actionable insights.' },
      { title: 'Quantitative Analyst', industry: 'Finance', dayInLife: 'Developing mathematical models, identifying market patterns, and optimizing trading strategies.' },
      { title: 'Software Engineer', industry: 'Technology', dayInLife: 'Recognizing code patterns, architecting elegant solutions, and automating complex processes.' },
      { title: 'Investment Strategist', industry: 'Finance', dayInLife: 'Analyzing market trends, spotting investment opportunities, and managing portfolio risk.' },
    ]},
    spatial: { roles: [
      { title: 'Architect', industry: 'Architecture', dayInLife: 'Sketching designs, creating 3D models, and transforming spaces from concept to reality.' },
      { title: 'UX Designer', industry: 'Design', dayInLife: 'Crafting user interfaces, prototyping interactions, and designing seamless digital experiences.' },
      { title: 'Surgeon', industry: 'Medicine', dayInLife: 'Navigating complex anatomy in 3D, performing precise procedures with spatial accuracy.' },
      { title: 'Mechanical Engineer', industry: 'Engineering', dayInLife: 'Designing mechanical systems, running simulations, and optimizing physical components.' },
    ]},
    speed: { roles: [
      { title: 'Emergency Physician', industry: 'Healthcare', dayInLife: 'Making rapid diagnoses, prioritizing critical patients, and coordinating emergency responses.' },
      { title: 'Day Trader', industry: 'Finance', dayInLife: 'Processing market signals in real-time, executing trades in milliseconds, and managing risk dynamically.' },
      { title: 'Air Traffic Controller', industry: 'Aviation', dayInLife: 'Tracking multiple aircraft simultaneously, making split-second routing decisions safely.' },
      { title: 'Sports Analyst', industry: 'Sports', dayInLife: 'Processing live game data, identifying patterns in real-time, and advising on strategy.' },
    ]},
    self: { roles: [
      { title: 'Executive Coach', industry: 'Coaching', dayInLife: 'Guiding leaders through self-discovery, facilitating growth conversations, and measuring behavioral change.' },
      { title: 'Therapist', industry: 'Psychology', dayInLife: 'Helping clients understand their thought patterns, developing treatment plans, and tracking progress.' },
      { title: 'Team Lead', industry: 'Management', dayInLife: 'Understanding team dynamics, providing feedback, and creating environments where people thrive.' },
      { title: 'Educator', industry: 'Education', dayInLife: 'Adapting teaching methods to students, assessing learning gaps, and inspiring curiosity.' },
    ]},
  };

  const c = careers[strongest];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Career Aptitude Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">Roles that align with your cognitive profile</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {careerFraming(CATEGORY_LABELS[strongest], CATEGORY_LABELS[secondary])}
          </p>
        </CardContent>
      </Card>

      {addon}

      {c.roles.slice(0, 3).map((role, i) => (
        <motion.div key={role.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}>
          <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="h-1 w-full" style={{ background: i === 0 ? 'var(--gradient-primary)' : 'var(--gradient-success)' }} />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{i + 1}</div>
                <div>
                  <div className="font-semibold text-foreground">{role.title}</div>
                  <div className="text-xs text-muted-foreground">{role.industry}</div>
                </div>
              </div>
              {i === 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-foreground mb-1">A Day in the Life</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{role.dayInLife}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <div className="grid grid-cols-2 gap-2">
        {c.roles.slice(2).map((role, i) => (
          <Card key={role.title} className="border-0 shadow-[var(--shadow-soft)]">
            <CardContent className="p-3">
              <div className="text-sm font-semibold text-foreground">{role.title}</div>
              <div className="text-xs text-muted-foreground">{role.industry}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-[var(--shadow-elevated)] bg-primary/5">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Why these roles?</strong> They match the interaction between {CATEGORY_LABELS[strongest]} and {CATEGORY_LABELS[secondary]}, not your top category alone. When the work matches the wiring, it costs less effort.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section 9: Learning Style (existing, kept) ─── */

export function LearningStyleSection({ strongest }: { strongest: Category }) {
  const styles: Record<Category, { style: string; techniques: string[]; tips: string[] }> = {
    logic: { style: 'Analytical Sequential Learner', techniques: ['Step-by-step breakdowns', 'Flowcharts & decision trees', 'Structured problem sets', 'Socratic questioning'], tips: ['Start with the "why" before the "how"', 'Create logical frameworks for new information', 'Practice by teaching others', 'Use deductive reasoning exercises daily'] },
    pattern: { style: 'Intuitive Pattern Learner', techniques: ['Mind mapping', 'Analogy-based learning', 'Cross-domain connections', 'Abstract reasoning puzzles'], tips: ['Look for patterns across different subjects', 'Use visualization to encode information', 'Connect new concepts to existing knowledge', 'Engage with mathematical sequences regularly'] },
    spatial: { style: 'Visual-Spatial Learner', techniques: ['3D models & diagrams', 'Color-coded notes', 'Spatial memory palaces', 'Hands-on experimentation'], tips: ['Use visual aids whenever possible', 'Create mental maps of information', 'Practice mental rotation exercises', 'Engage with design challenges'] },
    speed: { style: 'Rapid Adaptive Learner', techniques: ['Spaced repetition', 'Speed-reading techniques', 'Active recall practice', 'Dual-task training'], tips: ['Leverage your processing speed with timed challenges', 'Use flashcards for rapid memorization', 'Practice under time pressure', 'Alternate between focused & diffuse thinking'] },
    self: { style: 'Reflective Meta-Learner', techniques: ['Journaling & reflection', 'Self-assessment checkpoints', 'Peer feedback loops', 'Goal-setting frameworks'], tips: ['Keep a learning journal', 'Set measurable cognitive goals', 'Regularly assess your own understanding', 'Use metacognitive strategies to plan study sessions'] },
  };
  const s = styles[strongest];
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Your Learning Profile</h3>
        <p className="text-sm text-muted-foreground mt-1">How your brain absorbs information best</p>
      </div>
      <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: 'var(--gradient-success)' }} />
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-accent" />
            <div className="text-lg font-bold text-foreground">{s.style}</div>
          </div>
          <div className="text-sm font-semibold text-foreground mb-3">Optimal Techniques</div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {s.techniques.map((t, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span className="text-xs text-foreground">{t}</span>
              </div>
            ))}
          </div>
          <div className="text-sm font-semibold text-foreground mb-3">Personalized Tips</div>
          <div className="space-y-2">
            {s.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section 10: Personality-Cognition Matrix (8 Archetypes) ─── */

export function PersonalityMatrixSection({ scores, finalScore = 0 }: { scores: CategoryScores; finalScore?: number }) {
  const userArchetype = getArchetype(scores, finalScore);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Personality-Cognition Matrix</h3>
        <p className="text-sm text-muted-foreground mt-1">Where your thinking style falls</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Personality-Cognition Matrix maps your thinking style along three axes: <strong className="text-foreground">Analytical vs. Creative</strong> (how you approach problems), <strong className="text-foreground">Methodical vs. Rapid</strong> (how quickly you act), and <strong className="text-foreground">Independent vs. Collaborative</strong> (how you engage with others). Your position reveals one of eight cognitive archetypes — a fundamental pattern that shapes how you work, learn, and make decisions.
          </p>
        </CardContent>
      </Card>

      {/* 8 archetype grid — 2x4 on mobile, 4x2 on larger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ARCHETYPES.map((arch, i) => {
          const isActive = arch.name === userArchetype.name;
          return (
            <motion.div
              key={arch.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-xl p-3 text-center transition-all ${isActive ? 'shadow-md' : 'opacity-50'}`}
              style={{
                backgroundColor: isActive ? `${arch.color}15` : 'hsl(var(--muted) / 0.5)',
                border: isActive ? `2px solid ${arch.color}` : '2px solid transparent',
              }}
            >
              <div className="text-xs font-bold mb-1" style={{ color: isActive ? arch.color : 'hsl(var(--muted-foreground))' }}>
                {arch.name}
              </div>
              <div className="text-[9px] text-muted-foreground leading-tight">
                {arch.axes[0]} · {arch.axes[1]} · {arch.axes[2]}
              </div>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="w-3 h-3 rounded-full mx-auto mt-2 border-2 border-white shadow-sm"
                  style={{ backgroundColor: arch.color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Axis legend */}
      <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span>← Analytical · Creative →</span>
        <span>|</span>
        <span>← Methodical · Rapid →</span>
        <span>|</span>
        <span>← Independent · Collaborative →</span>
      </div>

      <Card className="border-0 shadow-[var(--shadow-elevated)]">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${userArchetype.color}15` }}>
              <Sparkles className="w-5 h-5" style={{ color: userArchetype.color }} />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{userArchetype.name}</div>
              <div className="text-xs text-muted-foreground">Your Cognitive Archetype</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{userArchetype.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section 11: Decision Making (existing) ─── */

export function DecisionMakingSection({ scores, strongest, finalScore = 0 }: { scores: CategoryScores; strongest: Category; finalScore?: number }) {
  const floors = getCategoryFloors(finalScore);
  const logicScore = Math.max(scores.logic, floors.logic);
  const speedScore = Math.max(scores.speed, floors.speed);
  const isAnalytical = logicScore > speedScore;
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Decision-Making Profile</h3>
        <p className="text-sm text-muted-foreground mt-1">How you approach choices and judgments</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every day, you make thousands of decisions — from what to eat to how to respond to a complex email. Your cognitive profile reveals a distinct decision-making style that shapes how you evaluate options, weigh risks, and commit to action. Understanding your style is the first step to making better decisions more consistently.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className={`border-0 ${isAnalytical ? 'shadow-[var(--shadow-elevated)] ring-2 ring-primary/20' : 'shadow-[var(--shadow-soft)]'}`}>
          <CardContent className="p-4 text-center">
            <Brain className={`w-8 h-8 mx-auto mb-2 ${isAnalytical ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="text-sm font-semibold text-foreground">Analytical</div>
            <div className="text-xs text-muted-foreground mt-1">Evidence-based, methodical</div>
            {isAnalytical && <div className="text-xs font-bold text-primary mt-2">Your Style</div>}
          </CardContent>
        </Card>
        <Card className={`border-0 ${!isAnalytical ? 'shadow-[var(--shadow-elevated)] ring-2 ring-accent/20' : 'shadow-[var(--shadow-soft)]'}`}>
          <CardContent className="p-4 text-center">
            <Zap className={`w-8 h-8 mx-auto mb-2 ${!isAnalytical ? 'text-accent' : 'text-muted-foreground'}`} />
            <div className="text-sm font-semibold text-foreground">Intuitive</div>
            <div className="text-xs text-muted-foreground mt-1">Quick, pattern-driven</div>
            {!isAnalytical && <div className="text-xs font-bold text-accent mt-2">Your Style</div>}
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAnalytical
              ? 'You weigh evidence carefully before making decisions. This leads to well-reasoned conclusions, especially in high-stakes situations. Your analytical approach means you naturally create mental pros-and-cons lists, seek additional data when uncertain, and prefer to have a clear rationale for every choice. Nobel laureate Daniel Kahneman calls this "System 2 thinking" — the slow, deliberate, logical mode of decision-making that catches errors and produces higher-quality outcomes.'
              : 'You make decisions quickly by leveraging pattern recognition and intuition. Your gut feelings are surprisingly accurate because they\'re built on your brain\'s ability to rapidly process patterns from past experience. This is what Kahneman calls "System 1 thinking" — the fast, automatic, intuitive mode that expert chess players, seasoned doctors, and veteran firefighters rely on. Your cognitive profile suggests your intuitions are well-calibrated, meaning you can trust them more than most people can trust theirs.'}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAnalytical
              ? 'The research is clear: analytical decision-makers excel in environments with high complexity and high stakes — strategic planning, financial analysis, medical diagnosis, legal reasoning. However, be aware of your potential blind spot: analysis paralysis. When you have too much data or too many options, your analytical tendency can slow you down unnecessarily. The key is recognizing which decisions deserve deep analysis and which ones can be safely delegated to your intuition.'
              : 'Research shows that intuitive decision-makers thrive in fast-paced, ambiguous environments where waiting for complete information isn\'t an option — startup leadership, emergency response, creative direction, sales. Your potential blind spot is overconfidence: because your intuitions are usually right, you might underweight evidence that contradicts your gut feeling. The key is building in occasional "pause points" for high-stakes decisions where the cost of being wrong is particularly high.'}
          </p>
          <div className="text-sm font-semibold text-foreground mb-3">Optimize Your Decisions</div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              {isAnalytical ? 'Set time limits for routine decisions to avoid analysis paralysis — give yourself 2 minutes for low-stakes choices' : 'Pause on high-stakes decisions to apply analytical thinking — sleep on any decision that costs more than $500 or affects more than a week'}
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              {isAnalytical ? 'Trust your analysis — your logical reasoning score confirms your strength here, so once you\'ve done your due diligence, commit' : 'Keep a decision journal to calibrate your intuition over time — track your gut calls and compare them to outcomes after 30 days'}
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              {isAnalytical ? 'Use the "10/10/10 rule" for perspective: how will you feel about this decision in 10 minutes, 10 months, and 10 years?' : 'For important decisions, write down your intuitive answer first, then spend 5 minutes looking for evidence that contradicts it — this catches your blind spots without slowing you down'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section 12: Memory & Processing (existing) ─── */

export function MemoryProcessingSection({ scores, finalScore = 0 }: { scores: CategoryScores; finalScore?: number }) {
  const floors = getCategoryFloors(finalScore);
  const speedScore = Math.max(scores.speed, floors.speed);
  const performanceFactor = Math.min(1, (finalScore - 80) / 70); // 0 at 80, 1 at 150
  const blended = (speedScore + performanceFactor) / 2;
  const metrics = [
    { label: 'Working Memory', value: Math.min(98, Math.round(70 + blended * 28)), unit: '%' },
    { label: 'Processing Speed', value: Math.min(97, Math.round(65 + blended * 32)), unit: '%' },
    { label: 'Attention Span', value: Math.min(98, Math.round(72 + blended * 26)), unit: '%' },
    { label: 'Cognitive Load', value: blended > 0.6 ? 'High' : 'Moderate', unit: '' },
  ];
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Memory & Processing</h3>
        <p className="text-sm text-muted-foreground mt-1">Your information-handling capabilities</p>
      </div>

      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Memory and processing speed form the infrastructure of your cognitive system. Think of working memory as your brain's RAM — it determines how many pieces of information you can hold and manipulate simultaneously. Processing speed is your clock rate — how quickly you can perform each cognitive operation. Together, they determine the raw throughput of your thinking.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-[var(--shadow-soft)]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {m.value}{m.unit && <span className="text-lg">{m.unit}</span>}
                </div>
                <div className="text-xs font-medium text-foreground mt-2">{m.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="border-0 shadow-[var(--shadow-soft)]">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your processing capabilities indicate {speedScore > 0.7 ? 'impressive ability to handle' : 'good capacity for managing'} multiple information streams. {speedScore > 0.7 ? 'Your working memory and processing speed operate at a level that allows you to juggle complex multi-step problems, track multiple conversations, and rapidly switch between tasks with minimal cognitive cost. This level of cognitive throughput is associated with high performance in demanding professional environments.' : 'Your cognitive infrastructure is solid and well-suited for most professional and academic demands. With targeted training, you can significantly increase both your working memory capacity and processing speed — these are among the most trainable cognitive metrics.'}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">The science of working memory:</strong> Working memory capacity is one of the strongest predictors of academic and professional success — even more predictive than IQ in some studies. It determines how well you can follow complex arguments, solve multi-step math problems, understand dense written material, and hold a plan in mind while executing it. The average person can hold 4-7 chunks of information simultaneously; your results suggest you're {speedScore > 0.7 ? 'at the upper end of this range' : 'in the healthy middle of this range with clear room for expansion'}.
          </p>
          <div className="text-sm font-semibold text-foreground">Enhancement Tips</div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />Practice dual n-back exercises for 10 minutes daily — this is the single most evidence-backed method for expanding working memory capacity, with studies showing 15-25% improvement over 4-6 weeks</div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />Use spaced repetition for memorization tasks — apps that implement this technique can help you retain 90% of information vs. 20% with traditional studying</div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />Prioritize sleep — it's the #1 factor in memory consolidation. During deep sleep, your brain replays and strengthens neural connections formed during the day, converting short-term memories into long-term ones</div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />Reduce cognitive clutter — close unnecessary browser tabs, silence notifications, and use external systems (notes, calendars) to offload information your working memory doesn't need to hold</div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section 13: Brain Health Score (NEW) ─── */

export function BrainHealthSection({ finalScore }: { finalScore: number }) {
  const healthScore = Math.min(98, Math.round(70 + (finalScore - 90) * 0.55));
  const animatedHealth = useCountUp(healthScore, 2000);

  const pf = Math.min(1, (finalScore - 80) / 70);
  const subMetrics = [
    { label: 'Sleep Impact', value: Math.min(97, Math.round(68 + pf * 28)), icon: Moon, tip: 'Getting 7-9 hours of quality sleep improves memory consolidation by up to 40%' },
    { label: 'Exercise Benefit', value: Math.min(96, Math.round(62 + pf * 32)), icon: Dumbbell, tip: '30 minutes of aerobic exercise 3x/week increases BDNF — a brain growth protein — by 32%' },
    { label: 'Nutrition Score', value: Math.min(96, Math.round(65 + pf * 30)), icon: Apple, tip: 'Omega-3 fatty acids, blueberries, and dark chocolate directly support cognitive function' },
    { label: 'Mental Activity', value: Math.min(98, Math.round(72 + pf * 26)), icon: Brain, tip: 'Regular cognitive challenges like puzzles and learning new skills strengthen neural pathways' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Brain Health Score</h3>
        <p className="text-sm text-muted-foreground mt-1">Holistic cognitive wellness assessment</p>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <svg className="w-40 h-40" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="65" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <motion.circle cx="80" cy="80" r="65" fill="none" stroke="hsl(160 60% 45%)" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={408} strokeDashoffset={408}
              animate={{ strokeDashoffset: 408 - (408 * healthScore / 100) }}
              transition={{ duration: 2, ease: 'easeOut' }} transform="rotate(-90 80 80)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Heart className="w-5 h-5 text-accent mb-1" />
            <span className="text-3xl font-black text-foreground">{animatedHealth}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {subMetrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div key={metric.label} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
              <Card className="border-0 shadow-[var(--shadow-soft)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{metric.label}</span>
                        <span className="text-sm font-bold text-primary">{metric.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }} transition={{ delay: 0.5 + i * 0.12, duration: 0.6 }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-8">{metric.tip}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section 14: Cognitive Trajectory (NEW) ─── */

export function CognitiveTrajectorySection({ finalScore }: { finalScore: number }) {
  const milestones = [
    { day: 0, label: 'Today', score: finalScore, desc: 'Your current score' },
    { day: 30, label: '30 Days', score: finalScore + 5, desc: 'Foundations built' },
    { day: 60, label: '60 Days', score: finalScore + 10, desc: 'Skills compounding' },
    { day: 90, label: '90 Days', score: finalScore + 15, desc: 'Breakthrough potential' },
  ];

  const width = 300;
  const height = 120;
  const padding = { left: 30, right: 20, top: 20, bottom: 25 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const minScore = finalScore - 5;
  const maxScore = finalScore + 20;

  const getX = (day: number) => padding.left + (day / 90) * plotW;
  const getY = (score: number) => padding.top + plotH - ((score - minScore) / (maxScore - minScore)) * plotH;

  const currentPath = milestones.map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.day)} ${getY(m.score)}`).join(' ');
  const potentialPath = milestones.map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.day)} ${getY(m.score + 3)}`).join(' ');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Your Cognitive Trajectory</h3>
        <p className="text-sm text-muted-foreground mt-1">Potential improvement over 90 days</p>
      </div>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md">
          {/* Grid lines */}
          {[0, 30, 60, 90].map(day => (
            <line key={day} x1={getX(day)} y1={padding.top} x2={getX(day)} y2={height - padding.bottom}
              stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" />
          ))}
          {/* Current path */}
          <motion.path d={currentPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: 'easeOut' }} />
          {/* Milestone dots */}
          {milestones.map((m, i) => (
            <motion.g key={m.day} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.4, type: 'spring' }}>
              <circle cx={getX(m.day)} cy={getY(m.score)} r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
              <text x={getX(m.day)} y={height - 5} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="7">{m.label}</text>
              <text x={getX(m.day)} y={getY(m.score) - 10} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontWeight="bold">{m.score}</text>
            </motion.g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 items-stretch">
        {milestones.slice(1).map((m, i) => (
          <motion.div key={m.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.2 }} className="flex">
            <Card className="border-0 shadow-[var(--shadow-soft)] flex-1">
              <CardContent className="p-3 text-center h-full flex flex-col items-center justify-center">
                <Flame className="w-4 h-4 text-accent mb-1" />
                <div className="text-lg font-bold text-primary">+{m.score - finalScore}</div>
                <div className="text-[10px] text-muted-foreground">{m.label}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{m.desc}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Section 15: Brain Growth Plan (AI-generated + Dashboard CTA) ─── */

export function BrainGrowthPlanSection({ scores, strongest, finalScore }: { scores: CategoryScores; strongest: Category; finalScore: number }) {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const weakest = (Object.entries(scores) as [Category, number][]).sort(([, a], [, b]) => a - b)[0][0];

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const data = await api.post('/ai/generate-learning-path', {
          scores,
          strongestCategory: strongest,
          weakestCategory: weakest,
          finalScore,
        });
        setPlan(data);
      } catch (err) {
        console.error('Failed to generate learning path:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Your Brain Growth Plan</h3>
        <p className="text-sm text-muted-foreground mt-1">AI-generated personalized training program</p>
      </div>

      {loading ? (
        <Card className="border-0 shadow-[var(--shadow-elevated)]">
          <CardContent className="p-8 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-10 h-10 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
            <div className="text-sm font-semibold text-foreground">Generating your personalized plan…</div>
            <div className="text-xs text-muted-foreground mt-1">Our AI is analyzing your cognitive profile</div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-0 shadow-[var(--shadow-soft)]">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">We couldn't generate your plan right now, but don't worry — your dashboard has everything you need to start training.</p>
          </CardContent>
        </Card>
      ) : plan ? (
        <>
          {plan.motivational_insight && (
            <Card className="border-0 shadow-[var(--shadow-soft)] bg-accent/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.motivational_insight}</p>
              </CardContent>
            </Card>
          )}

          {plan.weeks?.slice(0, 2).map((week: any, wi: number) => (
            <motion.div key={wi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.2 }}>
              <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
                <div className="h-1 w-full" style={{ background: wi === 0 ? 'var(--gradient-primary)' : 'var(--gradient-success)' }} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{week.week || wi + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{week.theme || `Week ${wi + 1}`}</div>
                      {week.milestone && <div className="text-[10px] text-muted-foreground">🎯 {week.milestone}</div>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {(week.daily_activities || []).slice(0, 3).map((act: any, ai: number) => (
                      <div key={ai} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        <span className="font-semibold text-foreground w-8">{act.day}</span>
                        <span className="flex-1">{act.activity}</span>
                        <span>{act.duration_min}min</span>
                      </div>
                    ))}
                    {(week.daily_activities || []).length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">+ {(week.daily_activities || []).length - 3} more activities</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {plan.projected_improvement && (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(plan.projected_improvement).map(([key, val]: [string, any]) => {
                const normalized = typeof val === 'number' && val < 1 ? Math.round(val * 100) : Math.round(Number(val) || 0);
                const label = key.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                return (
                  <Card key={key} className="border-0 shadow-[var(--shadow-soft)]">
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold text-primary">+{normalized} pts</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* Final CTA — only show when plan is generated */}
      {plan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="border-0 shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))' }} />
            <CardContent className="p-6 text-center space-y-4">
              <div>
                <h4 className="text-lg font-bold text-foreground">Ready to Start Growing?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your personalized dashboard awaits with exercises, tracking, and a 4-week plan
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> Personalized exercises</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> 4-week plan</span>
                <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Daily tracking</span>
              </div>
              <Button
                onClick={() => {
                  trackEvent(posthog, EVENTS.CTA_CLICKED, { cta: 'go_to_dashboard', location: 'report' });
                  navigate('/iq-dash');
                }}
                className="w-full h-12 text-base font-semibold rounded-xl relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sprout className="w-5 h-5" />
                  Start Your Brain Growth Plan
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }} />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ─── main page ─── */

export const SECTIONS_CONFIG: ReportSection[] = [
  { id: 'score', title: 'Score Reveal', icon: BarChart3 },
  { id: 'breakdown', title: 'Cognitive Breakdown', icon: Brain },
  { id: 'deepdive', title: 'Deep Dive: #1 Strength', icon: Star },
  { id: 'comparison', title: 'Population Comparison', icon: Users },
  { id: 'geographic', title: 'Geographic Comparison', icon: Globe },
  { id: 'cognitive-age', title: 'Cognitive Age', icon: Clock },
  { id: 'strengths', title: 'Strengths Profile', icon: Shield },
  { id: 'weakness', title: 'Growth Opportunity', icon: TrendingUp },
  { id: 'career', title: 'Career Aptitude', icon: Briefcase },
  { id: 'learning', title: 'Learning Style', icon: BookOpen },
  { id: 'matrix', title: 'Personality Matrix', icon: Sparkles },
  { id: 'decision', title: 'Decision Making', icon: Lightbulb },
  { id: 'memory', title: 'Memory & Processing', icon: Cpu },
  { id: 'health', title: 'Brain Health', icon: Heart },
  { id: 'trajectory', title: 'Your Trajectory', icon: TrendingUp },
  { id: 'certificate', title: 'Your Certificate', icon: Award },
  { id: 'growth-plan', title: 'Brain Growth Plan', icon: Sprout },
];

const ReportPage = () => {
  const { state } = useFunnel();
  const { user } = useAuth();
  const strongest = getStrongestCategory(state.scores);
  const secondary = getSecondaryCategory(state.scores);
  const rawPercentile = state.finalScore ? scoreToPercentile(state.finalScore) : 0;
  const percentile = Math.max(rawPercentile, 92);
  const finalScore = state.finalScore || 0;
  const { hasWeaknessReport, hasGeniusBlueprint, hasBrainCoach, declinedUpsells, loading: purchasesLoading } = useUserPurchases();
  const boughtWeaknessInFunnel = sessionStorage.getItem(STORAGE_KEYS.FUNNEL_WEAKNESS_PURCHASED) === '1';
  const boughtBlueprintInFunnel = sessionStorage.getItem(STORAGE_KEYS.FUNNEL_BLUEPRINT_PURCHASED) === '1';
  const boughtCoachInFunnel = sessionStorage.getItem(STORAGE_KEYS.FUNNEL_COACH_PURCHASED) === '1';
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  const handleReportUpsell = async (productKey: string, amountCents: number) => {
    if (!user) return;
    setPurchaseLoading(productKey);
    setPurchaseLoading(null);
    window.location.reload();
  };

  const [currentSection, setCurrentSection] = useState(0);
  const [unlockedSections, setUnlockedSections] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (currentSection >= SECTIONS_CONFIG.length - 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      const next = currentSection + 1;
      setCurrentSection(next);
      setUnlockedSections(s => Math.max(s, next + 1));
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, [currentSection]);

  const goToSection = (index: number) => {
    if (index >= unlockedSections) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSection(index);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const renderSection = () => {
    switch (SECTIONS_CONFIG[currentSection].id) {
      case 'score': return <ScoreRevealSection finalScore={finalScore} />;
      case 'breakdown': return <CategoryBreakdownSection scores={state.scores} finalScore={finalScore} />;
      case 'deepdive': return <DeepDiveStrengthSection strongest={strongest} scores={state.scores} finalScore={finalScore} />;
      case 'comparison': return <PopulationComparisonSection finalScore={finalScore} percentile={percentile} />;
      case 'geographic': return <GeographicSection finalScore={finalScore} percentile={percentile} />;
      case 'cognitive-age': return <CognitiveAgeSection finalScore={finalScore} />;
      case 'strengths': return <StrengthsProfileSection scores={state.scores} strongest={strongest} secondary={secondary} />;
      case 'weakness': return <WeaknessAnalysisSection scores={state.scores} finalScore={finalScore} />;
      case 'career': return <CareerInsightsSection strongest={strongest} secondary={secondary} />;
      case 'learning': return <LearningStyleSection strongest={strongest} />;
      case 'matrix': return <PersonalityMatrixSection scores={state.scores} finalScore={finalScore} />;
      case 'decision': return <DecisionMakingSection scores={state.scores} strongest={strongest} finalScore={finalScore} />;
      case 'memory': return <MemoryProcessingSection scores={state.scores} finalScore={finalScore} />;
      case 'health': return <BrainHealthSection finalScore={finalScore} />;
      case 'trajectory': return <CognitiveTrajectorySection finalScore={finalScore} />;
      case 'certificate': return <CertificateSection finalScore={finalScore} percentile={percentile} strongest={strongest} />;
      case 'growth-plan': return <BrainGrowthPlanSection scores={state.scores} strongest={strongest} finalScore={finalScore} />;
      default: return null;
    }
  };

  const progressPercent = ((currentSection + 1) / SECTIONS_CONFIG.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky progress header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">
              Section {currentSection + 1} of {SECTIONS_CONFIG.length}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-primary">
                {SECTIONS_CONFIG[currentSection].title}
              </div>
              <ShareModal finalScore={finalScore} />
            </div>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Section navigation dots */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {SECTIONS_CONFIG.map((section, i) => {
            const Icon = section.icon;
            const isUnlocked = i < unlockedSections;
            const isCurrent = i === currentSection;
            return (
              <button key={section.id} onClick={() => goToSection(i)} disabled={!isUnlocked}
                className={`flex items-center gap-0.5 px-2 py-1.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                  isCurrent ? 'bg-primary text-primary-foreground shadow-sm' : isUnlocked ? 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer' : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                }`}>
                {isUnlocked ? <Icon className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span className="hidden lg:inline">{section.title}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex items-center justify-center gap-1.5 mb-4"
        >
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 rotate-90" />
          </motion.div>
          <span className="text-xs text-muted-foreground/50">Scroll down to read more</span>
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 rotate-90" />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={currentSection}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? 20 : 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            {renderSection()}
            {/* Contextual upsell cards */}
            {!purchasesLoading && SECTIONS_CONFIG[currentSection].id === 'weakness' && !hasWeaknessReport && !boughtWeaknessInFunnel && (
              <div className="mt-8">
                <WeaknessReportUpsell
                  onPurchase={() => handleReportUpsell('weakness_report', PRODUCT_PRICING.weakness_report.originalCents)}
                  loading={purchaseLoading === 'weakness_report'}
                  isWinBack={declinedUpsells.includes('weakness_report')}
                />
              </div>
            )}
            {!purchasesLoading && SECTIONS_CONFIG[currentSection].id === 'career' && !hasGeniusBlueprint && !boughtBlueprintInFunnel && (
              <div className="mt-8">
                <GeniusBlueprintUpsell
                  onPurchase={() => handleReportUpsell('genius_blueprint', PRODUCT_PRICING.genius_blueprint.originalCents)}
                  loading={purchaseLoading === 'genius_blueprint'}
                  isWinBack={declinedUpsells.includes('genius_blueprint')}
                />
              </div>
            )}
            {!purchasesLoading && SECTIONS_CONFIG[currentSection].id === 'growth-plan' && !hasBrainCoach && !boughtCoachInFunnel && (
              <div className="mt-8">
                <BrainCoachUpsell
                  onPurchase={() => handleReportUpsell('brain_coach', PRODUCT_PRICING.brain_coach.originalCents)}
                  loading={purchaseLoading === 'brain_coach'}
                  isWinBack={declinedUpsells.includes('brain_coach')}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Sticky navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-2">
          {currentSection > 0 && (
            <Button variant="outline" onClick={() => goToSection(currentSection - 1)} className="h-12 px-4 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>
          )}
          {currentSection < SECTIONS_CONFIG.length - 1 ? (
            <Button onClick={goToNext} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              {currentSection === 0 ? 'Reveal Your Breakdown' : `Next: ${SECTIONS_CONFIG[currentSection + 1].title}`}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
