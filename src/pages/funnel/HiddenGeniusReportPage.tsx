import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ChevronLeft, ChevronRight, Sparkles, Star, Brain, Users,
  Compass, Lightbulb, TrendingUp, Sprout, Lock, Gauge, Layers, Zap, MapPin, AlertTriangle, Merge,
} from 'lucide-react';
import InlineAddonCard from '@/components/addons/InlineAddonCard';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useHiddenGenius } from '@/context/HiddenGeniusContext';
import { useAuth } from '@/context/AuthContext';
import { markReportSeen } from '@/lib/reportSeen';
import {
  ARCHETYPES, TRAIT_LABEL, TRAIT_META, resolveHgResult,
  computeStyleAxes, rarityBand, blendCopy,
  answerHighlightsByTrait, tensionPairs, archetypeConfidence, environmentFit, growthArc,
  composeIdentitySynthesis,
  type HgResult, type StyleAxis, type AnswerHighlight, type TensionPair, type ArchetypeId,
  type ArchetypeConfidence, type EnvironmentFit, type GrowthPhase, type CompositeSynthesis,
} from '@/engine/hiddenGeniusScoring';
import {
  ARCHETYPE_DEPTH, secondaryWhenToTrust,
  blindSpotFraming, blindSpotCorrection, fingerprintFraming, environmentFraming,
  shinesFraming, tensionsFraming, mindFraming, growthFraming,
  SYNTHESIS_INTRO, synthesisConvergence, synthesisDivergence, synthesisInstinct, synthesisConclusion,
  TRAIT_NEUTRALITY_NOTE,
} from '@/engine/reportCopy/hiddenGeniusCopy';
import { api } from '@/integrations/api/client';
import { DescriptorAckNotice } from '@/components/DescriptorAckNotice';
import { useDescriptorAckNotice } from '@/lib/descriptorAckNotice';


import type { HgTraitKey, HgResponse } from '@/data/hiddenGeniusQuiz';
import DisclaimerNote from '@/components/legal/DisclaimerNote';

const HG_THEME_STYLE: React.CSSProperties = {
  ['--primary' as any]: '218 90% 26%',
  ['--primary-foreground' as any]: '0 0% 100%',
  ['--cta' as any]: '218 90% 26%',
  ['--cta-foreground' as any]: '0 0% 100%',
  ['--cta-hover' as any]: '218 90% 20%',
};

const SECTIONS = [
  { id: 'reveal',      title: 'Your Genius',           icon: Sparkles },
  { id: 'signature',   title: 'Cognitive Signature',   icon: Gauge },
  { id: 'composite',   title: 'Composite Identity',    icon: Merge },
  { id: 'fingerprint', title: 'Trait Fingerprint',     icon: Layers },
  { id: 'mind',        title: 'How Your Mind Works',   icon: Brain },
  { id: 'superpower',  title: 'Cognitive Superpower',  icon: Star },
  { id: 'secondary',   title: 'The Second Layer',      icon: Compass },
  { id: 'tensions',    title: 'Productive Tensions',   icon: Zap },
  { id: 'shines',      title: 'Where It Shines',       icon: Lightbulb },
  { id: 'environment', title: 'Environment Fit',       icon: MapPin },
  { id: 'blindspot',   title: 'Blind Spot',            icon: AlertTriangle },
  { id: 'growth',      title: '90-Day Growth Arc',     icon: TrendingUp },
  { id: 'minds',       title: 'Minds Like Yours',      icon: Users },
] as const;

/* -------------------------- Radar chart -------------------------- */

function TraitRadar({ traits, scores }: { traits: HgTraitKey[]; scores: Record<HgTraitKey, number> }) {
  const center = 110;
  const radius = 75;
  const step = (2 * Math.PI) / traits.length;
  const points = traits.map((t, i) => {
    const angle = step * i - Math.PI / 2;
    const r = radius * (Math.round(scores[t]) / 100);
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  return (
    <div className="flex justify-center my-4">
      <svg viewBox="0 0 220 220" className="w-64 h-64">
        {[0.25, 0.5, 0.75, 1.0].map((lvl) => {
          const gp = traits.map((_, i) => {
            const a = step * i - Math.PI / 2;
            return { x: 110 + radius * lvl * Math.cos(a), y: 110 + radius * lvl * Math.sin(a) };
          });
          const gd = gp.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return <path key={lvl} d={gd} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />;
        })}
        {traits.map((t, i) => {
          const a = step * i - Math.PI / 2;
          const end = { x: 110 + radius * Math.cos(a), y: 110 + radius * Math.sin(a) };
          const lp = { x: 110 + (radius + 22) * Math.cos(a), y: 110 + (radius + 22) * Math.sin(a) };
          return (
            <g key={t}>
              <line x1={110} y1={110} x2={end.x} y2={end.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--primary))" fontSize="7" fontWeight="bold">
                {TRAIT_LABEL[t]}
              </text>
            </g>
          );
        })}
        <motion.path d={d} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2"
          initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }} style={{ transformOrigin: '110px 110px' }} />
        {points.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4, type: 'spring' }} />
        ))}
      </svg>
    </div>
  );
}

/* -------------------------- Section renderers -------------------------- */

function RevealSection({ result, confidence }: { result: HgResult; confidence: ArchetypeConfidence }) {
  const arch = ARCHETYPES[result.primary];
  const sec = ARCHETYPES[result.secondary];
  const sigAvg = Math.round(
    arch.traits.reduce((s, t) => s + result.traitScores[t], 0) / arch.traits.length
  );
  const rarity = rarityBand(result.primary, result.traitScores);
  return (
    <div className="space-y-6">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, type: 'spring' }}
        className="text-center">
        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-3">Your hidden genius is…</div>
        <h1 className="text-3xl sm:text-4xl font-black text-primary leading-tight">{arch.name}</h1>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          {confidence.headline}
        </div>
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-[15.5px] leading-relaxed text-foreground max-w-md mx-auto text-center">
        {arch.thesis}
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Signature</div>
          <div className="mt-1 text-lg font-black text-primary">{sigAvg}</div>
          <div className="text-[10.5px] text-muted-foreground">out of 100</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Secondary</div>
          <div className="mt-1 text-[12.5px] font-bold leading-tight text-foreground line-clamp-2">
            {sec.name.replace(/^The\s+/, '')}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rarity</div>
          <div className="mt-1 text-lg font-black text-primary">{rarity.inTen} in 10</div>
          <div className="text-[10.5px] text-muted-foreground">share this</div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="rounded-2xl border border-border bg-card p-5 max-w-md mx-auto text-left">
        <p className="text-[14px] leading-relaxed text-muted-foreground">{confidence.body}</p>
      </motion.div>
    </div>
  );
}

function SignatureSection({ axes, addon }: { axes: StyleAxis[]; addon?: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your cognitive signature</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Three axes that describe how your mind moves through a problem.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          An archetype tells you what kind of mind you have. These axes tell you how it moves.
        </p>
      </div>



      {addon}

      {axes.map((axis, i) => {
        const pct = Math.round(50 + axis.value / 2);
        return (
          <motion.div key={axis.key}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{axis.leftLabel}</span>
              <span>{axis.rightLabel}</span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
              <motion.div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-primary border-2 border-background shadow"
                initial={{ left: '50%' }}
                animate={{ left: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 + i * 0.1 }}
                style={{ transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-foreground">
              {axis.interpretation}
            </p>
          </motion.div>
        );
      })}

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Neither end of an axis is better — a bad fit is a solvable mismatch, not a failing.
        </p>
      </div>



    </div>
  );
}

/**
 * Renders one piece of evidence from the quiz. Never shows the choice on its
 * own — the interpretation is the product, the quote is just the receipt.
 */
function AnswerEvidence({
  h,
  trait,
  showTrait = true,
}: { h: AnswerHighlight; trait: HgTraitKey; showTrait?: boolean }) {
  return (
    <div className="mt-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] uppercase tracking-widest font-semibold text-primary">
          {h.projective ? 'What you saw' : 'What you said'}
        </span>
        {showTrait && (
          <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            {TRAIT_LABEL[trait]}
          </span>
        )}
      </div>


      <p className="mt-1.5 text-[12.5px] italic text-muted-foreground leading-snug">
        “{h.prompt}”
      </p>
      <p className="mt-1 text-[14px] font-semibold text-foreground leading-snug">
        → {h.choice}
      </p>

      {h.reading && (
        <p className="mt-2 text-[13px] leading-relaxed text-foreground">{h.reading}</p>
      )}

    </div>
  );
}


function FingerprintSection({
  result, highlights, addon,
}: {
  result: HgResult;
  highlights: Record<HgTraitKey, AnswerHighlight[]>;
  addon?: ReactNode;
}) {
  const allTraits: HgTraitKey[] = [
    'openness', 'conscientiousness', 'extraversion', 'agreeableness',
    'structurePreference', 'autonomyNeed', 'riskTolerance', 'peopleOrientation',
    'systemsOrientation', 'creativityOrientation', 'detailOrientation',
    'leadershipDrive', 'persuasionComfort', 'learningVelocity',
  ];
  // Deterministic: score desc, then a stable secondary key so tied traits never
  // reorder between renders or between two identical profiles.
  const ranked = [...allTraits].sort((a, b) =>
    (result.traitScores[b] - result.traitScores[a]) || allTraits.indexOf(a) - allTraits.indexOf(b));

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your trait fingerprint</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your five defining traits — the ones that shape how you actually operate.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        {ranked.slice(0, 5).map((t, i) => {
          const score = Math.round(result.traitScores[t]);
          return (
            <div key={t} className="rounded-lg p-2.5 bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary">#{i + 1}</span>
                  <span className="text-[13px] font-bold text-foreground">
                    {TRAIT_LABEL[t]}
                  </span>
                </div>
                <span className="text-[13px] font-bold text-primary">{score}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }} animate={{ width: `${score}%` }}
                  transition={{ delay: 0.1 + i * 0.03, duration: 0.5 }} />
              </div>
            </div>
          );
        })}
        <p className="pt-1 text-[12.5px] leading-snug text-muted-foreground">
          {TRAIT_NEUTRALITY_NOTE}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          {fingerprintFraming(ranked.slice(0, 2).map(t => TRAIT_LABEL[t]), result.primary)}
        </p>
      </div>

      {addon}


    </div>
  );
}

function MindSection({
  result, highlights, addon,
}: {
  result: HgResult;
  highlights: Record<HgTraitKey, AnswerHighlight[]>;
  addon?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">How your mind works</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your two strongest cognitive traits, each backed by something you actually answered.
        </p>

      </div>
      <TraitRadar traits={result.topTraits} scores={result.traitScores} />

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          {mindFraming(result.primary, TRAIT_LABEL[result.topTraits[0]])}
        </p>
      </div>

      {addon}


      <div className="space-y-2">
        {result.topTraits.slice(0, 2).map((t, i) => {
          const meta = TRAIT_META[t];
          const hl = (highlights[t] ?? [])[0];
          return (
            <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold">{TRAIT_LABEL[t]}</span>
                <span className="text-sm font-bold text-primary">{Math.round(result.traitScores[t])}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${Math.round(result.traitScores[t])}%` }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.6 }} />
              </div>
              {hl
                ? <AnswerEvidence h={hl} trait={t} showTrait={false} />
                : (
                  <p className="mt-2 text-[13px] leading-relaxed text-foreground">
                    <span className="font-semibold text-primary">In you this looks like: </span>
                    {meta.highBehavior}
                  </p>
                )}


            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

function SuperpowerSection({ result, addon }: { result: HgResult; addon?: ReactNode }) {
  const arch = ARCHETYPES[result.primary];
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Your cognitive superpower</div>
        <h3 className="text-xl font-bold mt-1">{arch.name}</h3>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[15px] leading-relaxed text-foreground">{arch.superpower}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Where it came from</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{ARCHETYPE_DEPTH[result.primary].origin}</p>
      </div>

      {addon}


      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">What it costs you</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{ARCHETYPE_DEPTH[result.primary].cost}</p>
      </div>


      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground pl-1">How this shows up</div>
        {arch.showsUp.slice(0, 3).map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-4 flex gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <p className="text-[14px] leading-relaxed text-foreground">{s}</p>
          </motion.div>
        ))}
      </div>


    </div>
  );
}


function SecondarySection({ result, addon }: { result: HgResult; addon?: ReactNode }) {
  const primary = ARCHETYPES[result.primary];
  const secondary = ARCHETYPES[result.secondary];
  const secAvg = Math.round(
    secondary.traits.reduce((s, t) => s + result.traitScores[t], 0) / secondary.traits.length
  );
  const blend = blendCopy(result.primary, result.secondary);
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">The second layer</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Underneath your primary genius, another pattern shows up.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Secondary</div>
            <h4 className="text-lg font-bold mt-1 text-primary">{secondary.name}</h4>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Strength</div>
            <div className="text-lg font-black text-primary">{secAvg}</div>
          </div>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">{secondary.thesis}</p>
      </div>
      <div className="rounded-2xl border border-border bg-primary/5 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">How they combine</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {blend}
        </p>
      </div>

      {addon}


      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">How they trade control</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {secondaryWhenToTrust(result.primary, result.secondary)}
        </p>


      </div>
    </div>
  );
}

/**
 * Composite Identity — the one section that fuses the two evidence streams.
 * Deliberately non-literal: no option labels, no quoted prompts. Those live
 * in AnswerEvidence further down the report.
 */
function CompositeSection({
  result, synthesis, addon,
}: { result: HgResult; synthesis: CompositeSynthesis | null; addon?: ReactNode }) {
  const s = synthesis;
  const convergentLabels = (s?.convergent ?? []).map(t => TRAIT_LABEL[t]);
  const divergences = (s?.divergent ?? []).map(d => ({
    label: TRAIT_LABEL[d.trait],
    selfHigher: d.selfHigher,
  }));
  const agreement = s?.agreementScore ?? 100;
  const hasProjective = s?.hasProjective ?? false;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your composite identity</h3>
        <p className="text-sm text-muted-foreground mt-1">
          What you said about yourself, read against what you revealed without meaning to.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{SYNTHESIS_INTRO}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Where both agree</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {synthesisConvergence(convergentLabels, result.primary, hasProjective)}
        </p>
        {convergentLabels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {convergentLabels.map(l => (
              <span key={l} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Where they split</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {synthesisDivergence(divergences, agreement)}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Self-image vs. instinct alignment</span>
              <span className="text-primary font-bold">{agreement}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${agreement}%` }} />
            </div>
          </div>
        </div>
      </div>

      {addon}


      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Your instinct signature</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {synthesisInstinct(
            s?.lenses ?? { valence: 0, abstraction: 0, contentClass: 0 },
            hasProjective,
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="text-xs uppercase tracking-widest text-primary">The conclusion</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {synthesisConclusion(result.primary, result.secondary, agreement, divergences.length > 0)}
        </p>
      </div>
    </div>
  );
}

function TensionsSection({ tensions, addon }: { tensions: TensionPair[]; addon?: ReactNode }) {
  if (tensions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold">Productive tensions</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The trait combinations that create real leverage.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[14px] leading-relaxed text-foreground">
            Your trait profile is balanced enough that no single tension dominates.
            The upside: you can move between modes as the moment demands. The trade-off:
            you'll want to be intentional about which mode you're running in a given week.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Productive tensions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Two traits that would seem to fight each other — but in you they combine.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{tensionsFraming()}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          You have {tensions.length === 1 ? 'one' : tensions.length}. That is more than most profiles produce,
          and each one below is a place where a combination other people have to choose between is available to
          you at the same time.
        </p>
      </div>

      {addon}


      {tensions.map((t, i) => (
        <motion.div key={`${t.a}-${t.b}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tension #{i + 1}</div>
              <div className="mt-1 text-[16px] font-bold text-primary">{t.title}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <div className="text-[11px] font-semibold text-muted-foreground">{TRAIT_LABEL[t.a]}</div>
              <div className="text-lg font-black text-primary">{Math.round(t.scoreA)}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 text-center">
              <div className="text-[11px] font-semibold text-muted-foreground">{TRAIT_LABEL[t.b]}</div>
              <div className="text-lg font-black text-primary">{Math.round(t.scoreB)}</div>
            </div>
          </div>
          <p className="text-[14px] leading-relaxed text-foreground">{t.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ShinesSection({ result, addon }: { result: HgResult; addon?: ReactNode }) {
  const arch = ARCHETYPES[result.primary];
  const [tagPS, tagLearn, tagDec] = [0, 1, 2].map(i => arch.traits[i % arch.traits.length]);
  const rows: { label: string; body: string; icon: any; tagTrait: HgTraitKey }[] = [
    { label: 'Problem-solving',  body: arch.shines.problemSolving, icon: Lightbulb, tagTrait: tagPS },
    { label: 'Learning speed',   body: arch.shines.learning,       icon: Brain,     tagTrait: tagLearn },
    { label: 'Decision-making',  body: arch.shines.decisions,      icon: Compass,   tagTrait: tagDec },
  ];
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Where your genius shines</h3>
        <p className="text-sm text-muted-foreground mt-1">Three places this cognitive pattern gives you an edge.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{shinesFraming(result.primary)}</p>
      </div>

      {addon}


      {rows.map((r, i) => {
        const Icon = r.icon;
        const score = Math.round(result.traitScores[r.tagTrait]);
        return (
          <motion.div key={r.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">{r.label}</span>
            </div>
            <p className="text-[14px] leading-relaxed text-muted-foreground">{r.body}</p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-[12px] font-semibold text-foreground">
                You specifically: {TRAIT_LABEL[r.tagTrait]}
              </span>
              <span className="text-[12px] font-bold text-primary">{score}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function EnvironmentSection({ env, primary, addon }: { env: EnvironmentFit; primary: ArchetypeId; addon?: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Where you thrive vs. drain</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Environments that amplify your genius — and the ones that quietly cost you.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">{environmentFraming(primary)}</p>
      </div>

      {addon}


      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-primary pl-1 font-semibold">Amplifiers</div>
        {env.amplifiers.slice(0, 2).map((a, i) => (
          <motion.div key={a.title}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="text-[14px] font-bold text-foreground">{a.title}</div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{a.body}</p>
          </motion.div>
        ))}
        {env.amplifiers.slice(2).map(a => (
          <div key={a.title} className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="text-[14px] font-bold text-foreground">{a.title}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground pl-1 font-semibold">Drainers</div>
        {env.drainers.slice(0, 1).map((d, i) => (
          <motion.div key={d.title}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="text-[14px] font-bold text-foreground">{d.title}</div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{d.body}</p>
          </motion.div>
        ))}
        {env.drainers.slice(1).map(d => (
          <div key={d.title} className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div className="text-[14px] font-bold text-foreground">{d.title}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

function BlindSpotSection({ result, addon }: { result: HgResult; addon?: ReactNode }) {
  const arch = ARCHETYPES[result.primary];
  const weakMeta = TRAIT_META[result.weakestTrait];
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your blind spot</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Every strong mind has one weak spot. Naming it is half the fix.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">The pattern</div>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground">
          {arch.blindSpotCopy(result.weakestTrait)}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-primary/5 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">When it fires</div>
        <p className="mt-2 text-[14px] leading-relaxed text-foreground">
          {blindSpotFraming(result.primary, TRAIT_LABEL[result.weakestTrait])}
        </p>
      </div>

      {addon}


      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Weakest lever</div>
            <div className="mt-1 text-[16px] font-bold">{TRAIT_LABEL[result.weakestTrait]}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</div>
            <div className="text-lg font-black text-primary">
              {Math.round(result.traitScores[result.weakestTrait])}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
          {weakMeta.oneLiner}
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-foreground">
          <span className="font-semibold text-primary">The first correction: </span>
          {blindSpotCorrection(result.primary)}
        </p>



      </div>
    </div>
  );
}

function GrowthArcSection({ arc, result, onDone, addon }: { arc: GrowthPhase[]; result: HgResult; onDone: () => void; addon?: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Your 90-day growth arc</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Three phases — awareness, stretch, integration — designed for how your mind actually learns.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[14px] leading-relaxed text-foreground">
          {growthFraming(result.primary, TRAIT_LABEL[result.weakestTrait])}
        </p>
      </div>

      {addon}


      {arc.map((p, i) => (
        <motion.div key={p.phase}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
              {p.phase}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{p.window}</div>
              <div className="text-[15px] font-bold text-foreground">{p.focus}</div>
            </div>
          </div>
          <p className="text-[14px] leading-relaxed text-foreground">{p.practice}</p>
        </motion.div>
      ))}

      <div className="rounded-2xl border border-border bg-primary/5 p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Why this order</div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-foreground">
          Phase one is deliberately low-effort — most people fail in week two, not week ten. Phase two is the
          stretch. Phase three integrates it.
        </p>

      </div>




      <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sprout className="h-5 w-5" />
        </div>
        <h3 className="mt-3 text-[17px] font-bold">Turn this into daily practice</h3>
        <p className="mt-1 text-[13.5px] text-muted-foreground max-w-md mx-auto">
          Your Genius Dashboard is where this signature turns into a 90-day plan.
        </p>
        <button type="button" onClick={onDone}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90">
          Back to Genius Dashboard <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MindsSection({ result }: { result: HgResult }) {
  const arch = ARCHETYPES[result.primary];
  const sharedTrait = arch.traits[0];
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold">Minds like yours</h3>
        <p className="text-sm text-muted-foreground mt-1">Three thinkers whose cognitive pattern matches yours.</p>
      </div>
      {arch.minds.map((m, i) => (
        <motion.div key={m.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-border bg-card p-4">
          <div className="text-[15px] font-bold text-foreground">{m.name}</div>
          <div className="mt-1 text-[13.5px] text-muted-foreground">{m.note}</div>
          <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            You share: {TRAIT_LABEL[sharedTrait]}
          </div>
        </motion.div>
      ))}
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          These names aren't goals — they're proof that the pattern you run has produced serious work
          in the real world when it's given room to run.
        </p>
      </div>
    </div>
  );
}

/* -------------------------- Page shell -------------------------- */

const REPORT_ADDONS: Record<string, string> = {
  'composite': 'addon_genius_strengths_blind',
  'mind': 'addon_genius_archetype_deep_dive',
  'superpower': 'addon_genius_archetype_deep_dive',
  'secondary': 'addon_genius_archetype_deep_dive',
  'blindspot': 'addon_genius_strengths_blind',
  'environment': 'addon_genius_collaboration',
  'shines': 'addon_genius_creative_style',
  'growth': 'addon_genius_30day_practice',
};

/* Curiosity lines: name what the add-on answers, never restate a finding. */
const ADDON_TEASERS: Record<string, string> = {
  'composite': 'Your four strongest traits — and what each one quietly costs you.',
  'mind': 'What your archetype is most often mistaken for, and why it matters.',
  'superpower': 'The full archetype write-up: where this wins, and where it backfires.',
  'secondary': 'How your two archetypes trade control — and which one to trust when.',
  'blindspot': 'Your three lowest traits, with a drill for each.',
  'environment': 'Word-for-word scripts for telling a manager how you work best.',
  'shines': 'Your creative process, stage by stage, with the rituals that hold it.',
  'growth': 'The 90-day arc broken into 30 dated days of practice.',
};


export default function HiddenGeniusReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { responses } = useHiddenGenius();
  const { user } = useAuth();
  const isPreview = location.pathname.startsWith('/preview');
  const descriptorNotice = useDescriptorAckNotice(!isPreview);

  const [currentSection, setCurrentSection] = useState(0);
  const [unlocked, setUnlocked] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [payloadResult, setPayloadResult] = useState<HgResult | null>(null);
  const [payloadResponses, setPayloadResponses] = useState<HgResponse[] | null>(null);

  useEffect(() => {
    document.title = 'My Genius Report — Genius';
    markReportSeen('hidden-genius');
  }, []);

  useEffect(() => {
    if (!user?.id || responses.length > 0) return;
    let cancelled = false;
    (async () => {
      const completions = await api.get<
        Array<{ payload?: unknown }>
      >('/dashboard/test-completions?branch=hidden-genius');
      if (cancelled) return;
      const data = completions[0];
      const p = (data?.payload ?? null) as { result?: HgResult; responses?: HgResponse[] } | null;
      if (p?.result?.primary && p.result.traitScores) setPayloadResult(p.result);
      if (Array.isArray(p?.responses)) setPayloadResponses(p.responses);
    })();
    return () => { cancelled = true; };
  }, [user?.id, responses.length]);

  const effectiveResponses = responses.length > 0 ? responses : (payloadResponses ?? []);

  const result = useMemo<HgResult | null>(() => {
    return resolveHgResult(responses, payloadResponses) ?? payloadResult;
  }, [responses, payloadResponses, payloadResult]);

  const axes = useMemo<StyleAxis[]>(
    () => (result ? computeStyleAxes(result.traitScores) : []),
    [result]
  );

  const highlights = useMemo(
    () => (effectiveResponses.length > 0 ? answerHighlightsByTrait(effectiveResponses) : {} as Record<HgTraitKey, AnswerHighlight[]>),
    [effectiveResponses]
  );

  const synthesis = useMemo<CompositeSynthesis | null>(
    () => (effectiveResponses.length > 0 ? composeIdentitySynthesis(effectiveResponses) : null),
    [effectiveResponses]
  );

  const tensions = useMemo(
    () => (result ? tensionPairs(result.traitScores) : []),
    [result]
  );

  const confidence = useMemo(
    () => (result ? archetypeConfidence(result.primary, result.secondary, result.traitScores) : null),
    [result]
  );

  const env = useMemo(
    () => (result ? environmentFit(result.primary, result.traitScores) : null),
    [result]
  );

  const arc = useMemo(
    () => (result ? growthArc(result.weakestTrait, result.primary) : []),
    [result]
  );

  const goNext = useCallback(() => {
    if (currentSection >= SECTIONS.length - 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      const next = currentSection + 1;
      setCurrentSection(next);
      setUnlocked(u => Math.max(u, next + 1));
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }, [currentSection]);

  const goTo = (i: number) => {
    if (i >= unlocked) return;
    setIsTransitioning(true);
    setTimeout(() => { setCurrentSection(i); setIsTransitioning(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 300);
  };

  if (!result || !confidence || !env) {
    return (
      <div className="min-h-screen bg-background text-foreground" style={HG_THEME_STYLE}>
        <LifeScaleHeader wordmark="Genius" showTagline={false} />
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">No results yet</h1>
          <p className="text-muted-foreground text-sm">Take the Genius test to unlock your report.</p>
          <button onClick={() => navigate('/hg-start')} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Take the test <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const isLast = currentSection === SECTIONS.length - 1;
  const progressPercent = ((currentSection + 1) / SECTIONS.length) * 100;

  

  const renderSection = () => {
    const id = SECTIONS[currentSection].id;
    const sectionAddon = REPORT_ADDONS[id] ? (
      <InlineAddonCard addonKey={REPORT_ADDONS[id]} teaser={ADDON_TEASERS[id]} />
    ) : null;
    switch (id) {
      case 'reveal': return <RevealSection result={result} confidence={confidence} />;
      case 'signature': return <SignatureSection axes={axes} addon={sectionAddon} />;
      case 'composite': return <CompositeSection result={result} synthesis={synthesis} addon={sectionAddon} />;
      case 'fingerprint': return <FingerprintSection result={result} highlights={highlights} addon={sectionAddon} />;
      case 'mind': return <MindSection result={result} highlights={highlights} addon={sectionAddon} />;
      case 'superpower': return <SuperpowerSection result={result} addon={sectionAddon} />;
      case 'secondary': return <SecondarySection result={result} addon={sectionAddon} />;
      case 'tensions': return <TensionsSection tensions={tensions} addon={sectionAddon} />;
      case 'shines': return <ShinesSection result={result} addon={sectionAddon} />;
      case 'environment': return <EnvironmentSection env={env} primary={result.primary} addon={sectionAddon} />;
      case 'blindspot': return <BlindSpotSection result={result} addon={sectionAddon} />;
      case 'growth': return <GrowthArcSection arc={arc} result={result} onDone={() => navigate('/hg-dash')} addon={sectionAddon} />;
      case 'minds': return <MindsSection result={result} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={HG_THEME_STYLE}>
      <div className="sticky top-0 z-40 bg-background">
        <LifeScaleHeader wordmark="Genius" showTagline={false} />
        <div className="bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">
                Section {currentSection + 1} of {SECTIONS.length}
              </div>
              <div className="text-xs font-medium text-primary">{SECTIONS[currentSection].title}</div>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>
      </div>


      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            const isUnlocked = i < unlocked;
            const isCurrent = i === currentSection;
            return (
              <button key={s.id} onClick={() => goTo(i)} disabled={!isUnlocked}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                  isCurrent ? 'bg-primary text-primary-foreground shadow-sm'
                    : isUnlocked ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                }`}>
                {isUnlocked ? <Icon className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                <span className="hidden md:inline">{s.title}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? 20 : 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            {renderSection()}
          </motion.div>
        </AnimatePresence>
        <DisclaimerNote kind="reportShort" category="mind" className="mt-8 text-center" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-2">
          {currentSection > 0 && (
            <Button variant="outline" onClick={() => goTo(currentSection - 1)} className="h-12 px-4 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>
          )}
          {!isLast ? (
            <Button onClick={goNext} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              Next: {SECTIONS[currentSection + 1].title}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => navigate('/hg-dash')} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg">
              Back to Genius Dashboard <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {!isPreview && (
        <DescriptorAckNotice
          open={descriptorNotice.open}
          onDismiss={descriptorNotice.dismiss}
        />
      )}
    </div>
  );
}
