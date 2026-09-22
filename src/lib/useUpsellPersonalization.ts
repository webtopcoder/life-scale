import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCompletionPayload, readLocalCompletionPayload, type Branch } from '@/lib/testCompletions';
import { buildTokens, personalizeOffer, type UpsellTokens } from '@/lib/upsellPersonalization';
import type { UpsellOffer } from '@/lib/upsellOffers';

/**
 * Loads the completion payload for a branch and exposes a `personalize`
 * helper. Rendering never blocks: until the payload arrives, offers resolve
 * to their generic fallback copy.
 */
export function useUpsellPersonalization(branch: Branch | undefined, userId?: string) {
  const [tokens, setTokens] = useState<UpsellTokens | null>(null);

  useEffect(() => {
    if (!branch) { setTokens(null); return; }
    let active = true;

    // Fast path: local mirror written at test completion.
    const local = readLocalCompletionPayload(branch);
    if (local) setTokens(buildTokens(branch, local));

    if (!userId) return;
    getCompletionPayload(userId, branch).then((payload) => {
      if (!active || !payload) return;
      setTokens(buildTokens(branch, payload));
    });

    return () => { active = false; };
  }, [branch, userId]);

  const personalize = useCallback(
    (offer: UpsellOffer) => personalizeOffer(offer, tokens),
    [tokens],
  );

  return useMemo(() => ({ tokens, personalize }), [tokens, personalize]);
}
