import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Authenticated app routes
  if (
    !user &&
    (location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/main-dashboard") ||
      location.pathname.startsWith("/coach") ||
      location.pathname.startsWith("/addons") ||
      location.pathname.startsWith("/upgrade"))
  ) {
    return (
      <Navigate
        to="/auth-gate?mode=login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
