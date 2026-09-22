import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SIGNUP_STEPS } from './PreviewSignupShell';

export default function PreviewSignupIndex() {
  return (
    <div className="min-h-screen bg-[hsl(var(--iq-bg))] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-[hsl(var(--iq-ink))]">
          Sign-up flow preview
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--iq-muted))]">
          Every screen of the homepage “Start Test” funnel, rendered with the real components.
          No sign-in, no payment, no test required — edit these screens and the live funnel updates too.
        </p>

        <ul className="mt-8 space-y-3">
          {SIGNUP_STEPS.map((s) => (
            <li key={s.path}>
              <Link
                to={s.path}
                className="iq-card flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-[hsl(var(--iq-ink))] transition-colors hover:border-[hsl(var(--iq-cobalt))]"
              >
                {s.label}
                <ArrowRight className="h-4 w-4 text-[hsl(var(--iq-muted))]" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
