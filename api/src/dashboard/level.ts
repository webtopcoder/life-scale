/**
 * Tiered BrainPoints level curve.
 * Must stay in sync with src/lib/xp.ts on the frontend.
 */
const XP_TIERS = [
  { maxLevel: 5, xpPerLevel: 75 },
  { maxLevel: 10, xpPerLevel: 125 },
  { maxLevel: 15, xpPerLevel: 200 },
  { maxLevel: 20, xpPerLevel: 300 },
  { maxLevel: 25, xpPerLevel: 450 },
  { maxLevel: 30, xpPerLevel: 600 },
];

export const MAX_LEVEL = 30;

function xpPerLevelAt(level: number): number {
  for (const tier of XP_TIERS) {
    if (level <= tier.maxLevel) return tier.xpPerLevel;
  }
  return XP_TIERS[XP_TIERS.length - 1].xpPerLevel;
}

/** Level from total points, clamped to [1, MAX_LEVEL]. */
export function levelFromXp(totalXp: number): number {
  let remaining = Math.max(0, totalXp);
  for (let l = 2; l <= MAX_LEVEL; l++) {
    const needed = xpPerLevelAt(l);
    if (remaining < needed) return l - 1;
    remaining -= needed;
  }
  return MAX_LEVEL;
}
