import { api } from '@/integrations/api/client';
import { getFunnelValue, type SelectedTier, type SelectedTest } from '@/lib/funnelState';
import type { Branch } from '@/lib/testCompletions';
import {
  SCALE_KEYS,
  isScaleKey,
  categoryFromScale,
  scalesInCategory,
  type CategoryKey,
} from '@/config/scales';

export type Tier = SelectedTier;

export interface Entitlements {
  tier: Tier | null;
  /** Every scale the user can open. */
  entitledBranches: Set<Branch>;
  /** Every category the user's plan covers. */
  entitledCategories: Set<CategoryKey>;
  hasSubscription: boolean;
}

const ALL_BRANCHES: Branch[] = [...SCALE_KEYS];
const ALL_CATEGORIES: CategoryKey[] = [
  ...new Set(ALL_BRANCHES.map((b) => categoryFromScale(b))),
];

/**
 * A plan unlocks a whole category. Single-category tiers store one scale key in
 * `entitledBranch`; that scale's category is what the user actually owns.
 */
function entitledCategoriesFromTier(
  tier: Tier | null,
  entitledBranch: Branch | null,
): Set<CategoryKey> {
  if (!tier) return new Set();
  if (tier === 'complete') return new Set(ALL_CATEGORIES);
  return entitledBranch ? new Set([categoryFromScale(entitledBranch)]) : new Set();
}

function branchesFromCategories(categories: Set<CategoryKey>): Set<Branch> {
  const out = new Set<Branch>();
  for (const c of categories) for (const s of scalesInCategory(c)) out.add(s.key);
  return out;
}


function normalizeBranch(v: string | null | undefined): Branch | null {
  return isScaleKey(v) ? v : null;
}

function normalizeTier(v: string | null | undefined): Tier | null {
  if (v === 'insight' || v === 'guide' || v === 'focus' || v === 'complete') return v;
  return null;
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  void userId;
  let tier: Tier | null = null;
  let entitledBranch: Branch | null = null;
  let hasSubscription = false;

  const [profile, purchases] = await Promise.all([
    api.get<Record<string, unknown>>('/dashboard/profile'),
    api.get<Array<{ productKey?: string; product_key?: string; status?: string }>>(
      '/dashboard/purchases',
    ),
  ]);
  tier = normalizeTier(
    (profile.subscriptionTier ?? profile.subscription_tier) as string | null,
  );
  entitledBranch = normalizeBranch(
    (profile.entitledBranch ?? profile.entitled_branch) as string | null,
  );
  hasSubscription = purchases.some(
    (p) =>
      (p.productKey ?? p.product_key) === 'iq_subscription' &&
      (p.status === 'active' || !p.status),
  );

  if (!tier || (tier !== 'complete' && !entitledBranch)) {
    const localTier = normalizeTier(getFunnelValue('selectedTier'));
    const localBranch = normalizeBranch(
      getFunnelValue('selectedTest') as SelectedTest | null,
    );
    if (localTier && !tier) tier = localTier;
    if (localBranch && !entitledBranch) entitledBranch = localBranch;
    if ((localTier || localBranch) && hasSubscription) {
      try {
        await api.patch('/dashboard/profile', {
          ...(localTier ? { subscriptionTier: localTier } : {}),
          ...(localBranch ? { entitledBranch: localBranch } : {}),
        });
      } catch {
        /* noop */
      }
    }
  }

  const categories = hasSubscription
    ? entitledCategoriesFromTier(tier, entitledBranch)
    : new Set<CategoryKey>();

  return {
    tier,
    entitledBranches: branchesFromCategories(categories),
    entitledCategories: categories,
    hasSubscription,
  };
}

