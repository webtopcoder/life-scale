import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, User, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasActiveSubscription } from '@/lib/subscription';
import { LifeScaleWordmark } from '@/components/marketing/LifeScaleWordmark';

type Mode = 'signup' | 'login';

export default function AuthGatePage({
  previewMode = false,
  previewVerify = false,
}: {
  previewMode?: boolean;
  previewVerify?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, confirmSignUp, resendSignUpCode, signInWithGoogle } =
    useAuth();
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get('mode') === 'login' ? 'login' : 'signup'
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(
    previewMode && previewVerify ? 'you@example.com' : null,
  );
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const requestedPath = (() => {
    const from = (location.state as { from?: unknown } | null)?.from;
    return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
      ? from
      : null;
  })();

  useEffect(() => {
    if (previewMode || !user) return;
    let cancelled = false;
    setChecking(true);
    hasActiveSubscription(user.id)
      .then((subbed) => {
        if (cancelled) return;
        navigate(requestedPath ?? (subbed ? '/main-dashboard' : '/choose-tier'), { replace: true });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, navigate, previewMode, requestedPath]);

  const routeAfterAuth = async (userId: string) => {
    const subbed = await hasActiveSubscription(userId);
    navigate(requestedPath ?? (subbed ? '/main-dashboard' : '/choose-tier'), { replace: true });
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (previewMode) {
      const form = new FormData(e.currentTarget);
      setPendingEmail((form.get('email') as string) || 'you@example.com');
      return;
    }
    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    setLoading(true);

    const { error, needsConfirmation } = await signUp(
      email,
      password,
      form.get('displayName') as string,
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (needsConfirmation) {
      setPendingEmail(email);
      setPendingPassword(password);
      return;
    }
    // Auto-confirmed — AuthContext already established the session; useEffect routes.
  };

  const handleConfirmSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (previewMode) {
      navigate('/preview-signup/choose-tier');
      return;
    }
    if (!pendingEmail || !pendingPassword) return;

    const form = new FormData(e.currentTarget);
    const code = (form.get('code') as string).trim();
    setLoading(true);
    const { error } = await confirmSignUp(pendingEmail, code, pendingPassword);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPendingEmail(null);
    setPendingPassword(null);
    toast.success('Account verified');
    // Session is set in AuthContext; useEffect routes after auth.
  };

  const handleResendCode = async () => {
    if (previewMode) {
      toast.success('A new code was sent to your email');
      return;
    }
    if (!pendingEmail) return;
    setResending(true);
    const { error } = await resendSignUpCode(pendingEmail);
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('A new code was sent to your email');
  };

  const handleGoogle = async () => {
    if (previewMode) {
      navigate('/preview-signup/choose-tier');
      return;
    }
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      toast.error(
        error instanceof Error ? error.message : 'Google sign-in failed',
      );
    }
    // On success Amplify redirects away; keep loading state.
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (previewMode) {
      navigate('/preview-signup/choose-tier');
      return;
    }
    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      const name = (error as { name?: string }).name;
      if (name === 'UserNotConfirmedException') {
        setPendingEmail(email);
        setPendingPassword(password);
        setMode('signup');
        toast.message('Enter the verification code we sent to your email');
        return;
      }
      toast.error(error.message);
      return;
    }
    setTimeout(async () => {
      try {
        const { cognitoAuth } = await import('@/integrations/api/cognitoAuth');
        const u = await cognitoAuth.getAuthUser();
        if (u) await routeAfterAuth(u.id);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--iq-bg))] px-4 py-10">
      <div className="mx-auto max-w-md">
        <button
          onClick={() => navigate(previewMode ? '/preview-signup' : '/')}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-6 flex justify-center">
          <LifeScaleWordmark />
        </div>

        <div className="rounded-2xl border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] p-6 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.15)] sm:p-8">
          <h1 className="text-center text-2xl font-semibold text-[hsl(var(--iq-ink))]">
            {pendingEmail
              ? 'Verify your email'
              : mode === 'signup'
                ? 'Create your account'
                : 'Welcome back'}
          </h1>
          <p className="mt-2 text-center text-sm text-[hsl(var(--iq-muted))]">
            {pendingEmail
              ? 'Enter the code we sent to your inbox. If you do not see it, check your spam folder.'
              : mode === 'signup'
                ? 'Save your results and continue to your test.'
                : 'Log in to continue.'}
          </p>

          {checking ? (
            <div className="mt-8 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--iq-emerald))] border-t-transparent" />
            </div>
          ) : pendingEmail ? (
            <div className="mt-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--iq-mint-wash))]">
                <KeyRound className="h-5 w-5 text-[hsl(var(--iq-cobalt))]" />
              </div>
              <p className="text-center text-sm leading-relaxed text-[hsl(var(--iq-muted))]">
                We sent a verification code to{' '}
                <span className="font-medium text-[hsl(var(--iq-ink))]">
                  {pendingEmail}
                </span>
                . Enter it below to activate your account.
              </p>
              <form onSubmit={handleConfirmSignup} className="space-y-3">
                <TextField
                  name="code"
                  label="Verification code"
                  placeholder="123456"
                  icon={<KeyRound className="h-4 w-4" />}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <button
                  disabled={loading}
                  type="submit"
                  className="iq-btn-primary inline-flex h-11 w-full items-center justify-center text-sm font-medium disabled:opacity-60"
                >
                  {loading ? 'Verifying…' : 'Verify and continue'}
                </button>
              </form>
              <div className="flex flex-col items-center gap-2 text-sm">
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendCode}
                  className="font-medium text-[hsl(var(--iq-cobalt))] hover:underline disabled:opacity-60"
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingEmail(null);
                    setPendingPassword(null);
                    setMode('login');
                  }}
                  className="text-[hsl(var(--iq-muted))] hover:text-[hsl(var(--iq-ink))]"
                >
                  Back to log in
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  disabled={loading || googleLoading}
                  onClick={handleGoogle}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] text-sm font-medium text-[hsl(var(--iq-ink))] hover:bg-[hsl(var(--iq-paper))] disabled:opacity-60"
                >
                  <GoogleIcon />
                  {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                </button>

                <div className="flex items-center gap-3 text-xs text-[hsl(var(--iq-muted))]">
                  <div className="h-px flex-1 bg-[hsl(var(--iq-border))]" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-[hsl(var(--iq-border))]" />
                </div>

                {mode === 'signup' ? (
                  <form onSubmit={handleSignup} className="space-y-3">
                    <TextField
                      name="displayName"
                      label="Display name"
                      placeholder="Your name"
                      icon={<User className="h-4 w-4" />}
                    />
                    <TextField
                      name="email"
                      label="Email"
                      placeholder="your@email.com"
                      type="email"
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <TextField
                      name="password"
                      label="Password"
                      placeholder="••••••••"
                      type="password"
                      icon={<Lock className="h-4 w-4" />}
                      minLength={6}
                    />
                    <button
                      disabled={loading || googleLoading}
                      type="submit"
                      className="iq-btn-primary inline-flex h-11 w-full items-center justify-center text-sm font-medium disabled:opacity-60"
                    >
                      {loading ? 'Creating account…' : 'Create account'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <TextField
                      name="email"
                      label="Email"
                      placeholder="your@email.com"
                      type="email"
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <TextField
                      name="password"
                      label="Password"
                      placeholder="••••••••"
                      type="password"
                      icon={<Lock className="h-4 w-4" />}
                    />
                    <button
                      disabled={loading || googleLoading}
                      type="submit"
                      className="iq-btn-primary inline-flex h-11 w-full items-center justify-center text-sm font-medium disabled:opacity-60"
                    >
                      {loading ? 'Signing in…' : 'Log in'}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-5 text-center text-sm text-[hsl(var(--iq-muted))]">
                {mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="font-medium text-[hsl(var(--iq-cobalt))] hover:underline"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Need an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="font-medium text-[hsl(var(--iq-cobalt))] hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function TextField({
  name,
  label,
  placeholder,
  type = 'text',
  icon,
  minLength,
  inputMode,
  autoComplete,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  minLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[hsl(var(--iq-ink-soft))]">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--iq-muted))]">
          {icon}
        </div>
        <input
          name={name}
          type={type}
          required
          minLength={minLength}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))] pl-9 pr-3 text-sm text-[hsl(var(--iq-ink))] placeholder:text-[hsl(var(--iq-muted))] focus:border-[hsl(var(--iq-cobalt))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--iq-cobalt))]/20"
        />
      </div>
    </div>
  );
}
