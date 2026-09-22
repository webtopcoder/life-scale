/**
 * Personalisation layer for upsell copy.
 *
 * Offer copy may contain tokens of the form `{key|Generic fallback}`. A token
 * is only replaced when the user's completion payload actually supports it —
 * otherwise the fallback is used verbatim, so an unpersonalised card always
 * reads as clean, honest marketing copy.
 *
 * Optional modifier: `{key:lower|fallback}` lowercases the substituted value
 * (for use mid-sentence in bullets).
 */

import { ARCHETYPES, TRAIT_LABEL, type HgResult } from '@/engine/hiddenGeniusScoring';
import { analyseIqItems, accuracyByCategory } from '@/lib/addonBuilders/iqItems';
import type { Branch } from '@/lib/testCompletions';
import type { UpsellOffer } from '@/lib/upsellOffers';

export type UpsellTokens = Record<string, string>;

/** Values longer than this break the two-line headline layout. */
const MAX_TOKEN_LENGTH = 30;

const TOKEN_RE = /\{([a-zA-Z0-9_]+)(?::(lower))?\|([^}]*)\}/g;

/** Substitute tokens in a single string. */
export function fillTokens(text: string, tokens: UpsellTokens): string {
  return text.replace(TOKEN_RE, (_m, key: string, mod: string | undefined, fallback: string) => {
    const raw = tokens[key];
    if (!raw || raw.length > MAX_TOKEN_LENGTH) return fallback;
    return mod === 'lower' ? raw.toLowerCase() : raw;
  });
}

/** Returns a copy of the offer with all tokens resolved against `tokens`. */
export function personalizeOffer(offer: UpsellOffer, tokens: UpsellTokens | null): UpsellOffer {
  const t = tokens ?? {};
  return {
    ...offer,
    headline: fillTokens(offer.headline, t),
    highlight: fillTokens(offer.highlight, t),
    valueProps: offer.valueProps.map((vp) => ({ ...vp, text: fillTokens(vp.text, t) })),
    proofLine: offer.proofLine ? fillTokens(offer.proofLine, t) : offer.proofLine,
    contentsList: offer.contentsList?.map((c) => fillTokens(c, t)),
  };
}

/* ------------------------------ IQ tokens ------------------------------ */

const IQ_CAT_LABEL: Record<string, string> = {
  logic: 'Logical Reasoning',
  pattern: 'Pattern Recognition',
  spatial: 'Spatial Reasoning',
  speed: 'Processing Speed',
  self: 'Self-Awareness',
};

function iqTokens(payload: Record<string, unknown>): UpsellTokens {
  const out: UpsellTokens = {};

  const scores = payload.scores as Record<string, number> | undefined;
  if (scores && typeof scores === 'object') {
    const ranked = Object.entries(scores)
      .filter(([k, v]) => typeof v === 'number' && IQ_CAT_LABEL[k])
      .sort((a, b) => a[1] - b[1]);
    if (ranked.length >= 2) {
      out.weakest1 = IQ_CAT_LABEL[ranked[0][0]];
      out.weakest2 = IQ_CAT_LABEL[ranked[1][0]];
      out.strongest = IQ_CAT_LABEL[ranked[ranked.length - 1][0]];
    }
  }

  try {
    const analysis = analyseIqItems(payload);
    const scored = analysis.items.filter((i) => i.kind === 'scored' && i.answered);
    const missed = scored.filter((i) => !i.isCorrect);

    // Rushed vs. stalled: compare time spent on wrong answers to right ones.
    const avg = (xs: typeof scored) =>
      xs.length ? xs.reduce((s, i) => s + (i.timeMs || 0), 0) / xs.length : 0;
    const wrongAvg = avg(missed);
    const rightAvg = avg(scored.filter((i) => i.isCorrect));
    if (wrongAvg > 0 && rightAvg > 0) {
      out.speedStyle = wrongAvg < rightAvg ? 'Rushing' : 'Overthinking';
    }

    const byCat = accuracyByCategory(analysis);
    if (byCat.length) {
      const worst = [...byCat].sort((a, b) => a.pct - b.pct)[0];
      if (worst) out.lowestAccuracy = worst.label;
    }
  } catch { /* copy falls back to generic */ }

  return out;
}

/* -------------------------- Brain Health tokens -------------------------- */

const BH_LABEL: Record<string, string> = {
  cognitive: 'Thinking & Memory',
  vascular: 'Heart & Circulation',
  sleep: 'Sleep & Recovery',
  movement: 'Movement',
  sensory: 'Hearing & Vision',
  mood: 'Mood & Stress',
  reserve: 'Mental Reserve',
};

interface BhDomain { domain: string; score: number; status: string }

function bhBand(status: string): string {
  if (status === 'Strong') return 'Steady';
  if (status === 'Stable') return 'Building';
  return 'Priority';
}

function bhTokens(payload: Record<string, unknown>): UpsellTokens {
  const out: UpsellTokens = {};

  const result = payload.result as { domains?: BhDomain[] } | undefined;
  const domains = Array.isArray(result?.domains) ? (result!.domains as BhDomain[]) : [];
  const top3 = Array.isArray(payload.top3) ? (payload.top3 as BhDomain[]) : domains;

  const ranked = [...(top3.length ? top3 : domains)].sort((a, b) => a.score - b.score);
  if (ranked[0]) out.bhTopRisk = BH_LABEL[ranked[0].domain] ?? ranked[0].domain;
  if (ranked[1]) out.bhSecondRisk = BH_LABEL[ranked[1].domain] ?? ranked[1].domain;

  const focus = payload.focus_label ? String(payload.focus_label) : '';
  if (focus) out.bhFocus = focus;

  const byKey = (k: string) => domains.find((d) => d.domain === k);
  const sleep = byKey('sleep');
  if (sleep) out.sleepStatus = bhBand(sleep.status);
  const mood = byKey('mood');
  if (mood) out.stressStatus = bhBand(mood.status);

  return out;
}

/* -------------------------- Hidden Genius tokens -------------------------- */

function hgTokens(payload: Record<string, unknown>): UpsellTokens {
  const out: UpsellTokens = {};
  const r = payload.result as HgResult | undefined;
  if (!r || !r.primary || !r.traitScores) return out;

  const primary = ARCHETYPES[r.primary];
  if (primary) out.archetype = primary.name.replace(/^The\s+/i, '');
  const secondary = r.secondary ? ARCHETYPES[r.secondary] : undefined;
  if (secondary) out.secondaryArchetype = secondary.name.replace(/^The\s+/i, '');

  if (r.weakestTrait) out.weakestTrait = TRAIT_LABEL[r.weakestTrait] ?? '';

  const entries = Object.entries(r.traitScores).filter(([k]) => k !== 'neuroticism');
  if (entries.length) {
    const strongest = entries.sort((a, b) => b[1] - a[1])[0][0];
    out.strongestTrait = TRAIT_LABEL[strongest as keyof typeof TRAIT_LABEL] ?? '';
  }

  for (const k of Object.keys(out)) if (!out[k]) delete out[k];
  return out;
}

/** Derive the personalisation tokens for one branch from its completion payload. */
export function buildTokens(branch: Branch, payload: Record<string, unknown> | null): UpsellTokens {
  if (!payload) return {};
  try {
    if (branch === 'iq') return iqTokens(payload);
    if (branch === 'brain-health') return bhTokens(payload);
    return hgTokens(payload);
  } catch {
    return {};
  }
}
