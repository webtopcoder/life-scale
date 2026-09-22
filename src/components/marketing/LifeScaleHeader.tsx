import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import supportAgentIcon from '@/assets/support-agent.webp';

interface LifeScaleHeaderProps {
  left?: ReactNode;
  right?: ReactNode;
  wordmark?: string;
  showTagline?: boolean;
  /** Set false to hide the signed-in Help link (e.g. mid-test surfaces). */
  showHelp?: boolean;
}

const LifeScaleHeader = ({
  left,
  right,
  wordmark = 'Life Scale',
  showTagline = true,
  showHelp = true,
}: LifeScaleHeaderProps) => {
  const { user } = useAuth();
  const helpLink =
    showHelp && user ? (
      <Link
        to="/help"
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
      >
        <img src={supportAgentIcon} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
        <span className="hidden sm:inline">Help</span>
      </Link>
    ) : null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border/60 px-4 py-3">
      <div className="relative flex items-center justify-center">
        {left ? <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">{left}</div> : null}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-foreground leading-none">
            {wordmark}
          </span>

          {showTagline && !user && (
            <span className="text-[11px] not-italic slight-italic text-muted-foreground/70 font-medium leading-none">
              a Life Scale product
            </span>
          )}
        </div>
        {(helpLink || right) && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {helpLink}
            {right}
          </div>
        )}
      </div>
    </header>
  );
};

export default LifeScaleHeader;
