import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getEntitlements } from '@/lib/entitlements';
import type { Branch } from '@/lib/testCompletions';

/**
 * Gates authenticated branch routes (/iq-*, /bh-*, /hg-*).
 * - Signed out → /auth-gate
 * - Signed in without entitlement for this branch → /upgrade/:branch
 * - Otherwise renders children.
 */
export default function BranchGate({
  branch,
  children,
}: {
  branch: Branch;
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [entitled, setEntitled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const ent = await getEntitlements(user.id);
      if (cancelled) return;
      setEntitled(ent.entitledBranches.has(branch));
    })();
    return () => { cancelled = true; };
  }, [user?.id, branch]);

  if (authLoading || (user && entitled === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth-gate" replace state={{ from: location.pathname }} />;
  }

  if (!entitled) {
    return <Navigate to={`/upgrade/${branch}`} replace />;
  }

  return <>{children}</>;
}
