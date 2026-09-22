import { useEffect, useMemo, useState } from "react";
import { api } from "@/integrations/api/client";

type UserProfilesExternalIdRow = {
  external_id: string | null;
};

/**
 * Resolves Breeze `referenceId` / billing external id: prefers `user_profiles.external_id`, else email.
 */
export function useBillingExternalId(email: string | null | undefined): {
  externalId: string;
  loading: boolean;
  error: string | null;
} {
  const [profileExternalId, setProfileExternalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!email) {
        setProfileExternalId(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await api.get<Array<{ externalId?: string; external_id?: string }>>('/funnel/user-profiles');
        
        if (!alive) return;
        
        const profile = data?.find((p: any) => p.email === email);
        setProfileExternalId(profile?.externalId ?? profile?.external_id ?? null);
      } catch (e) {
        if (!alive) return;
        setProfileExternalId(null);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [email]);

  const externalId = useMemo(() => {
    return profileExternalId ?? email ?? "";
  }, [profileExternalId, email]);

  return { externalId, loading, error };
}
