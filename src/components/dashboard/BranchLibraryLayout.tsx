import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import LifeScaleHeader from '@/components/marketing/LifeScaleHeader';
import { useAuth } from '@/context/AuthContext';

type Branch = 'iq' | 'hg' | 'bh';

const HOME_PATH: Record<Branch, string> = {
  iq: '/iq-dash',
  hg: '/hg-dash',
  bh: '/bh-dash',
};

const WORDMARK: Record<Branch, string> = {
  iq: 'IQ',
  hg: 'Genius',
  bh: 'Brain',
};

/**
 * Thin dashboard-scoped layout used by every branch library page
 * (Brain Teasers, Mazes, Lessons, Achievements, and branch-specific pages).
 * Renders the Life Scale header with a "Home" button that goes to the branch dash,
 * no sidebar, and a max-width content column.
 */
export default function BranchLibraryLayout({
  branch,
  children,
}: {
  branch: Branch;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <LifeScaleHeader
        wordmark={WORDMARK[branch]}
        showTagline={false}
        left={
          <button
            type="button"
            onClick={() => navigate(HOME_PATH[branch])}
            className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
            aria-label="Home"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
        right={
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        }
      />
      <main className="flex-1">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 pt-6 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
