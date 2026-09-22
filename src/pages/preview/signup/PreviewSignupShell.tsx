import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const SIGNUP_STEPS = [
  { path: '/preview-signup/choose-test', label: '1. Choose test' },
  { path: '/preview-signup/auth-gate', label: '2. Create account' },
  { path: '/preview-signup/auth-gate-verify', label: '3. Verify code' },
  { path: '/preview-signup/choose-tier', label: '4. Choose plan' },
  { path: '/preview-signup/trial-offer', label: '5. Trial offer' },
  { path: '/preview-signup/checkout', label: '6. Checkout' },
] as const;

export function PreviewSignupShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[hsl(var(--iq-bg))]">
      <div className="sticky top-0 z-50 border-b border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
          <Link
            to="/preview-signup"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
          >
            Preview index
          </Link>
          <span className="text-[hsl(var(--iq-border))]">/</span>
          {SIGNUP_STEPS.map((s) => {
            const active = pathname === s.path;
            return (
              <Link
                key={s.path}
                to={s.path}
                className={
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors ' +
                  (active
                    ? 'bg-[hsl(var(--iq-cobalt))] text-white'
                    : 'text-[hsl(var(--iq-ink-soft))] hover:bg-[hsl(var(--iq-paper))]')
                }
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}

export default PreviewSignupShell;
