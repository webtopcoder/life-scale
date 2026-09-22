// Server-side mirror of the frontend scale registry (src/config/scales.ts).
// Kept intentionally small: enough to group completions by category and to
// summarise each scale's headline result for the AI Coach prompt.

export type ScaleRole = "core" | "health" | "hidden";

export interface ApiScaleDef {
  key: string;
  category: string;
  categoryName: string;
  role: ScaleRole;
  name: string;
}

export const API_SCALES: ApiScaleDef[] = [
  { key: "iq", category: "mind", categoryName: "Mind", role: "core", name: "Mind IQ" },
  {
    key: "brain-health",
    category: "mind",
    categoryName: "Mind",
    role: "health",
    name: "Brain Health",
  },
  {
    key: "hidden-genius",
    category: "mind",
    categoryName: "Mind",
    role: "hidden",
    name: "Hidden Genius",
  },
  { key: "body", category: "body", categoryName: "Body", role: "core", name: "Body IQ" },
  {
    key: "sleep-health",
    category: "body",
    categoryName: "Body",
    role: "health",
    name: "Sleep Health",
  },
  {
    key: "hidden-athlete",
    category: "body",
    categoryName: "Body",
    role: "hidden",
    name: "Hidden Athlete",
  },
];

export function scaleDef(key: string | null | undefined): ApiScaleDef | null {
  return API_SCALES.find((s) => s.key === key) ?? null;
}

export function categoryOfScale(key: string | null | undefined): string | null {
  return scaleDef(key)?.category ?? null;
}

export function scalesInCategory(category: string | null | undefined): ApiScaleDef[] {
  return API_SCALES.filter((s) => s.category === category);
}

type Payload = Record<string, unknown> | null | undefined;

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Compact numeric sub-score map, rounded, at most 8 entries. */
function subScores(p: Record<string, unknown>): Record<string, number> | undefined {
  const source =
    obj(p.sub_scores) ?? obj(p.scores) ?? obj(p.axes) ?? obj(p.traitScores) ?? null;
  if (!source) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(source).slice(0, 8)) {
    const n = num(v);
    if (n !== null) out[k] = n;
  }
  return Object.keys(out).length ? out : undefined;
}

export interface ScaleSummary {
  scale: string;
  name: string;
  category: string;
  categoryName: string;
  role: ScaleRole;
  completedAt: string;
  headline: string;
  subScores?: Record<string, number>;
  strongest?: string;
  weakest?: string;
  flags?: string[];
}

/**
 * Turn one stored completion payload into a short, model-friendly summary.
 * Unknown payload shapes degrade to "completed, no detail stored".
 */
export function summarizeCompletion(
  branch: string,
  payload: Payload,
  completedAt: Date | string | null,
): ScaleSummary | null {
  const def = scaleDef(branch);
  if (!def) return null;
  const p = obj(payload) ?? {};
  const nested = obj(p.result) ?? {};
  const pick = (key: string) => p[key] ?? nested[key];

  let headline = "Completed (no detail stored)";
  if (def.role === "core") {
    const score = num(pick("score")) ?? num(pick("overall")) ?? num(pick("finalScore"));
    const band = str(pick("band"));
    if (score !== null) headline = `score ${score}${band ? ` (${band})` : ""}`;
    else if (band) headline = band;
  } else if (def.role === "health") {
    const overall = num(pick("overall")) ?? num(pick("risk_index"));
    const flagged = num(pick("flagged_count"));
    const parts: string[] = [];
    if (overall !== null) parts.push(`status index ${overall}`);
    if (flagged !== null) parts.push(`${flagged} flagged area(s)`);
    const focus = str(pick("focus_label")) ?? str(pick("focus"));
    if (focus) parts.push(`stated focus: ${focus}`);
    if (parts.length) headline = parts.join(", ");
  } else {
    const archetype =
      str(pick("archetype_name")) ??
      str(pick("archetype")) ??
      str(obj(pick("archetype"))?.name) ??
      str(obj(nested.archetype)?.name) ??
      str(obj(nested)?.primary) ??
      str(pick("primary"));
    const secondary = str(pick("secondary"));
    if (archetype)
      headline = `archetype ${archetype}${secondary ? `, secondary ${secondary}` : ""}`;
  }

  const flagsRaw = pick("flags");
  const flags = Array.isArray(flagsRaw)
    ? flagsRaw.map((f) => str(f) ?? str(obj(f)?.label)).filter((f): f is string => !!f)
    : undefined;

  const strongestRaw = pick("strongest");
  const weakestRaw = pick("weakest");

  return {
    scale: def.key,
    name: def.name,
    category: def.category,
    categoryName: def.categoryName,
    role: def.role,
    completedAt:
      completedAt instanceof Date
        ? completedAt.toISOString().slice(0, 10)
        : str(completedAt) ?? "unknown",
    headline,
    subScores: subScores({ ...nested, ...p }),
    strongest: str(strongestRaw) ?? str(obj(strongestRaw)?.domain) ?? undefined,
    weakest:
      str(weakestRaw) ??
      str(obj(weakestRaw)?.domain) ??
      str(pick("weakestTrait")) ??
      undefined,
    ...(flags && flags.length ? { flags: flags.slice(0, 6) } : {}),
  };
}
