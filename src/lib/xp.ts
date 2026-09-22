// Tiered XP curve for leveling
const XP_TIERS = [
  { maxLevel: 5, xpPerLevel: 75 },
  { maxLevel: 10, xpPerLevel: 125 },
  { maxLevel: 15, xpPerLevel: 200 },
  { maxLevel: 20, xpPerLevel: 300 },
  { maxLevel: 25, xpPerLevel: 450 },
  { maxLevel: 30, xpPerLevel: 600 },
];

export const MAX_LEVEL = 30;

/** Total XP needed to reach a given level (from level 1) */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= Math.min(level, MAX_LEVEL); l++) {
    total += xpPerLevelAt(l);
  }
  return total;
}

/** XP needed for the level-up at a specific level */
export function xpPerLevelAt(level: number): number {
  for (const tier of XP_TIERS) {
    if (level <= tier.maxLevel) return tier.xpPerLevel;
  }
  return XP_TIERS[XP_TIERS.length - 1].xpPerLevel;
}

/** Calculate level from total XP */
export function levelFromXP(totalXP: number): number {
  let remaining = totalXP;
  for (let l = 2; l <= MAX_LEVEL; l++) {
    const needed = xpPerLevelAt(l);
    if (remaining < needed) return l - 1;
    remaining -= needed;
  }
  return MAX_LEVEL;
}

/** Get progress within current level as 0-100 */
export function levelProgress(totalXP: number): number {
  const level = levelFromXP(totalXP);
  if (level >= MAX_LEVEL) return 100;
  const xpAtCurrentLevel = xpForLevel(level);
  const xpInLevel = totalXP - xpAtCurrentLevel;
  const needed = xpPerLevelAt(level + 1);
  return Math.min(100, Math.round((xpInLevel / needed) * 100));
}

/** XP remaining to next level */
export function xpToNextLevel(totalXP: number): number {
  const level = levelFromXP(totalXP);
  if (level >= MAX_LEVEL) return 0;
  const xpAtNext = xpForLevel(level + 1);
  return xpAtNext - totalXP;
}

// Milestone titles tied to user level
const MILESTONE_TITLES = [
  { minLevel: 1, title: "Novice" },
  { minLevel: 3, title: "Learner" },
  { minLevel: 6, title: "Apprentice" },
  { minLevel: 10, title: "Thinker" },
  { minLevel: 14, title: "Analyst" },
  { minLevel: 18, title: "Strategist" },
  { minLevel: 22, title: "Expert" },
  { minLevel: 26, title: "Master" },
  { minLevel: 30, title: "Grandmaster" },
];

export function getMilestoneTitle(level: number): string {
  let title = "Novice";
  for (const m of MILESTONE_TITLES) {
    if (level >= m.minLevel) title = m.title;
  }
  return title;
}

export function getAllMilestoneTitles() {
  return MILESTONE_TITLES;
}
