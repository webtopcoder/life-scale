// ---------------------------------------------------------------------------
// Life Scale — the scale registry.
//
// Life Scale measures the "Intelligence Quotient" of any part of your life, not
// just your mind. Every assessment on the platform is a *scale*, and scales are
// grouped into *categories*. Each category follows the same three-scale format:
//
//   core   — one headline scored test on the 100-mean / 15-SD scale
//   health — a domain status screen (no headline score)
//   hidden — a hidden-strengths archetype profiler (no score)
//
// Adding a new scale means adding an entry here (plus its quiz + report),
// not touching the funnel, the dashboards, or the add-on plumbing.
// ---------------------------------------------------------------------------

export type ScaleKey =
  | 'iq'
  | 'brain-health'
  | 'hidden-genius'
  | 'body'
  | 'sleep-health'
  | 'hidden-athlete';

export type CategoryKey = 'mind' | 'body' | 'money' | 'people' | 'work';

export type ScaleRole = 'core' | 'health' | 'hidden';

export type ScaleStatus = 'live' | 'coming-soon';

export interface ScaleDef {
  key: ScaleKey;
  /** Short slug used in add-on URLs (/addons/:slug/:key). */
  slug: string;
  category: CategoryKey;
  role: ScaleRole;
  /** Full public name. */
  name: string;
  /** Compact name used on tiles and headers. */
  shortName: string;
  tagline: string;
  blurb: string;
  bullets: string[];
  startPath: string;
  dashPath: string;
  reportPath: string;
  /** Deep-blue-relative accent, as an HSL triplet for CSS custom properties. */
  accent: string;
  status: ScaleStatus;
}

export interface CategoryDef {
  key: CategoryKey;
  name: string;
  /** What this category measures, in one line. */
  tagline: string;
  status: ScaleStatus;
}

export const CATEGORIES: CategoryDef[] = [
  {
    key: 'mind',
    name: 'Mind',
    tagline: 'How you think, how your brain is holding up, and what makes it unusual.',
    status: 'live',
  },
  {
    key: 'body',
    name: 'Body',
    tagline: 'How your body is actually doing, how you sleep, and how you are built to move.',
    status: 'live',
  },
  { key: 'money', name: 'Money', tagline: 'How you earn, spend, and decide under risk.', status: 'coming-soon' },
  { key: 'people', name: 'People', tagline: 'How you connect, read others, and handle conflict.', status: 'coming-soon' },
  { key: 'work', name: 'Work', tagline: 'How you perform, focus, and grow in a career.', status: 'coming-soon' },
];

export const SCALES: ScaleDef[] = [
  /* ------------------------------- Mind ------------------------------- */
  {
    key: 'iq',
    slug: 'iq',
    category: 'mind',
    role: 'core',
    name: 'IQ Test',
    shortName: 'IQ',
    tagline: 'See how you think and get a clear score.',
    blurb: 'Your reasoning, memory, and problem-solving profile.',
    bullets: ['Short test', 'Full results', 'Improvement tasks'],
    startPath: '/iq-start',
    dashPath: '/iq-dash',
    reportPath: '/iq-report',
    accent: '218 90% 26%',
    status: 'live',
  },
  {
    key: 'brain-health',
    slug: 'bh',
    category: 'mind',
    role: 'health',
    name: 'Brain Health Test',
    shortName: 'Brain Health',
    tagline: 'A quick look at focus, memory, and daily habits.',
    blurb: 'Everyday areas that shape long-term brain wellbeing.',
    bullets: ['Focus check', 'Memory check', 'Daily habits'],
    startPath: '/bh-start',
    dashPath: '/bh-dash',
    reportPath: '/bh-report',
    accent: '218 90% 26%',
    status: 'live',
  },
  {
    key: 'hidden-genius',
    slug: 'hg',
    category: 'mind',
    role: 'hidden',
    name: 'Hidden Genius Test',
    shortName: 'Hidden Genius',
    tagline: 'Find out what makes your thinking stand out.',
    blurb: 'The cognitive strengths you use without realizing.',
    bullets: ['Your strengths', 'Your style', 'What makes you you'],
    startPath: '/hg-start',
    dashPath: '/hg-dash',
    reportPath: '/hg-report',
    accent: '262 70% 34%',
    status: 'live',
  },

  /* ------------------------------- Body ------------------------------- */
  {
    key: 'body',
    slug: 'body',
    category: 'body',
    role: 'core',
    name: 'Body IQ Test',
    shortName: 'Body IQ',
    tagline: 'One score for how your body is actually doing.',
    blurb: 'Energy, movement, food, recovery, and resilience in one score.',
    bullets: ['One clear score', 'Seven areas', 'A plan that follows it'],
    startPath: '/body-start',
    dashPath: '/body-dash',
    reportPath: '/body-report',
    accent: '178 62% 26%',
    status: 'live',
  },
  {
    key: 'sleep-health',
    slug: 'sleep',
    category: 'body',
    role: 'health',
    name: 'Sleep Health Test',
    shortName: 'Sleep Health',
    tagline: 'A short check-in on how you actually sleep.',
    blurb: 'Seven areas that decide whether your nights repair you.',
    bullets: ['Night check', 'Day check', 'Priority areas'],
    startPath: '/sleep-start',
    dashPath: '/sleep-dash',
    reportPath: '/sleep-report',
    accent: '250 62% 34%',
    status: 'live',
  },
  {
    key: 'hidden-athlete',
    slug: 'ha',
    category: 'body',
    role: 'hidden',
    name: 'Hidden Athlete Test',
    shortName: 'Hidden Athlete',
    tagline: 'Find out how your body is built to train.',
    blurb: 'The physical wiring you already use without naming it.',
    bullets: ['Your archetype', 'Your training style', 'What your body rewards'],
    startPath: '/ha-start',
    dashPath: '/ha-dash',
    reportPath: '/ha-report',
    accent: '8 72% 40%',
    status: 'live',
  },
];

export const SCALE_KEYS: ScaleKey[] = SCALES.map((s) => s.key);

const BY_KEY = new Map<ScaleKey, ScaleDef>(SCALES.map((s) => [s.key, s]));
const BY_SLUG = new Map<string, ScaleDef>(SCALES.map((s) => [s.slug, s]));

export function getScale(key: ScaleKey): ScaleDef {
  const s = BY_KEY.get(key);
  if (!s) throw new Error(`Unknown scale: ${key}`);
  return s;
}

export function findScale(key: string | null | undefined): ScaleDef | null {
  return (key && BY_KEY.get(key as ScaleKey)) || null;
}

export function scaleFromSlug(slug: string | null | undefined): ScaleDef | null {
  return (slug && BY_SLUG.get(slug)) || null;
}

export function isScaleKey(v: unknown): v is ScaleKey {
  return typeof v === 'string' && BY_KEY.has(v as ScaleKey);
}

export function scalesInCategory(category: CategoryKey): ScaleDef[] {
  const order: Record<ScaleRole, number> = { core: 0, health: 1, hidden: 2 };
  return SCALES.filter((s) => s.category === category).sort(
    (a, b) => order[a.role] - order[b.role],
  );
}

export function liveCategories(): CategoryDef[] {
  return CATEGORIES.filter((c) => c.status === 'live');
}

/** Theme override for a scale, applied as inline CSS custom properties. */
export function scaleThemeStyle(key: ScaleKey): React.CSSProperties {
  const accent = getScale(key).accent;
  return {
    ['--primary' as never]: accent,
    ['--primary-foreground' as never]: '0 0% 100%',
    ['--cta' as never]: accent,
    ['--cta-foreground' as never]: '0 0% 100%',
    ['--cta-hover' as never]: accent,
  } as React.CSSProperties;
}

/** The category a scale belongs to. */
export function categoryFromScale(key: ScaleKey): CategoryKey {
  return getScale(key).category;
}

export function getCategory(key: CategoryKey): CategoryDef {
  const c = CATEGORIES.find((x) => x.key === key);
  if (!c) throw new Error(`Unknown category: ${key}`);
  return c;
}

export function findCategory(key: string | null | undefined): CategoryDef | null {
  return CATEGORIES.find((c) => c.key === key) ?? null;
}

export function isCategoryKey(v: unknown): v is CategoryKey {
  return typeof v === 'string' && CATEGORIES.some((c) => c.key === v);
}

/** Every live scale inside live categories. */
export function scalesInLiveCategories(): ScaleDef[] {
  return liveCategories().flatMap((c) => scalesInCategory(c.key));
}

/** The headline (core) scale of a category, falling back to its first scale. */
export function coreScaleOfCategory(key: CategoryKey): ScaleDef {
  const scales = scalesInCategory(key);
  return scales.find((s) => s.role === 'core') ?? scales[0];
}
