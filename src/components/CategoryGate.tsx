import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getEntitlements } from '@/lib/entitlements';
import { coreScaleOfCategory, isCategoryKey } from '@/config/scales';

/**
 * Gates a category hub route (/dash/:category).
 * - Signed out → /auth-gate
 * - Signed in without this category → /upgrade/:coreScale
 */
export default function CategoryGate({ children }: { children: React.ReactNode }) {
  const { category } = useParams<{ category?: string }>();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [entitled, setEntitled] = useState<boolean | null>(null);

  const valid = isCategoryKey(category) ? category : null;

  useEffect(() => {
    if (!user?.id || !valid) return;
    let cancelled = false;
    (async () => {
      const ent = await getEntitlements(user.id);
      if (cancelled) return;
      setEntitled(ent.entitledCategories.has(valid));
    })();
    return () => { cancelled = true; };
  }, [user?.id, valid]);

  if (!valid) return <Navigate to="/main-dashboard" replace />;

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
    return <Navigate to={`/upgrade/${coreScaleOfCategory(valid).key}`} replace />;
  }

  return <>{children}</>;
}
