import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/integrations/api/client';
import { STORAGE_KEYS } from '@/constants/storage';
import { getDeclinedProducts } from '@/lib/upsellPricing';
import { useClaimStatus } from '@/context/ClaimContext';

interface UserPurchases {
  hasWeaknessReport: boolean;
  hasGeniusBlueprint: boolean;
  hasBrainCoach: boolean;
  declinedUpsells: string[];
  loading: boolean;
}

export function useUserPurchases(): UserPurchases {
  const { user } = useAuth();
  const { claimComplete } = useClaimStatus();
  const [purchases, setPurchases] = useState<UserPurchases>({
    hasWeaknessReport: false,
    hasGeniusBlueprint: false,
    hasBrainCoach: false,
    declinedUpsells: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      const localDeclines = getDeclinedProducts();
      setPurchases(p => ({ ...p, declinedUpsells: localDeclines, loading: false }));
      return;
    }

    // Wait for claim-funnel-assets to finish before querying purchases
    if (!claimComplete) return;

    const fetchAndSync = async () => {
      try {
        // Fetch purchases
        const purchases = await api.get<Array<{ productKey: string; product_key?: string }>>('/dashboard/purchases');
        const purchasedKeys = new Set(purchases.map(d => d.productKey ?? d.product_key));

        // Fetch profile declined_upsells
        const profile = await api.get<{ declinedUpsells?: string[]; declined_upsells?: string[] }>('/dashboard/profile');
        const dbDeclines: string[] = (profile?.declinedUpsells ?? profile?.declined_upsells ?? []) as string[];
        const localDeclines = getDeclinedProducts();

        const filteredDbDeclines = dbDeclines.filter(key => !purchasedKeys.has(key));
        const filteredLocalDeclines = localDeclines.filter(key => !purchasedKeys.has(key));

        // Merge: union of local + db
        const merged = [...new Set([...filteredDbDeclines, ...filteredLocalDeclines])];

        // If local had new declines, sync to DB
        const hasNewDeclines = filteredLocalDeclines.some(d => !filteredDbDeclines.includes(d));
        if (hasNewDeclines && merged.length > 0) {
          await api.patch('/dashboard/profile', { declinedUpsells: merged });
          // Clear localStorage copy after syncing
          localStorage.removeItem(STORAGE_KEYS.DECLINED_UPSELLS);
        }

        setPurchases({
          hasWeaknessReport: purchasedKeys.has('weakness_report'),
          hasGeniusBlueprint: purchasedKeys.has('genius_blueprint'),
          hasBrainCoach: purchasedKeys.has('brain_coach'),
          declinedUpsells: merged,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
        setPurchases(p => ({ ...p, loading: false }));
      }
    };

    fetchAndSync();
  }, [user, claimComplete]);

  return purchases;
}
