import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchOwnedAddonKeys } from '@/lib/addonPurchase';

/**
 * Shared ownership lookup for add-on surfaces (dashboards + reports).
 *
 * Re-fetches on route change so a card the user just bought disappears as soon
 * as they navigate back into a report, without needing a full reload.
 */
export function useOwnedAddons(): { owned: Set<string>; loading: boolean; refresh: () => void } {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setOwned(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOwnedAddonKeys(user.id).then((set) => {
      if (!active) return;
      setOwned(set);
      setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id, pathname, nonce]);

  return { owned, loading, refresh };
}
