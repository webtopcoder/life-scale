import { Link } from "react-router-dom";

const tests = [
  { path: "/preview/iq-start", label: "IQ Test" },
  { path: "/preview/bh-start", label: "Brain Health Test" },
  { path: "/preview/hg-start", label: "Hidden Genius Test" },
];

export default function PreviewIndex() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Preview: Onboarding Tests</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Direct access — bypasses sign-in, tier, and paywall.
          </p>
        </div>
        <ul className="space-y-3">
          {tests.map((t) => (
            <li key={t.path}>
              <Link
                to={t.path}
                className="block rounded-lg border border-border bg-card px-4 py-3 text-center font-medium hover:bg-accent transition"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
