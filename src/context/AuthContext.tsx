import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePostHog } from "@posthog/react";
import { resetDailyCheckIn } from "@/lib/dailyCheckIn";
import { Hub } from "aws-amplify/utils";
import { api, setApiAccessTokenGetter } from "@/integrations/api/client";
import {
  cognitoAuth,
  configureCognitoAuth,
  type AuthSessionUser,
} from "@/integrations/api/cognitoAuth";

interface AuthContextType {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: {
      full_name?: string;
      name?: string;
      display_name?: string;
    };
  } | null;
  session: { access_token: string } | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error: any; needsConfirmation?: boolean }>;
  confirmSignUp: (
    email: string,
    code: string,
    password: string,
  ) => Promise<{ error: any }>;
  resendSignUpCode: (email: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const posthog = usePostHog();
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [session, setSession] = useState<AuthContextType["session"]>(null);
  const [loading, setLoading] = useState(true);

  const establishSession = async () => {
    const u = await cognitoAuth.getAuthUser();
    const token = await cognitoAuth.getAccessToken();
    setUser(u ? { id: u.id, email: u.email } : null);
    setSession(token ? { access_token: token } : null);
    if (u) {
      posthog?.identify(u.id);
      if (u.email) {
        window.klaviyo?.push(["identify", { email: u.email }]);
      }
      await api.post("/auth/ensure-profile", {}).catch(() => undefined);
    }
    return u;
  };

  useEffect(() => {
    configureCognitoAuth();
    setApiAccessTokenGetter(() => cognitoAuth.getAccessToken());

    const hydrate = async (u: AuthSessionUser | null) => {
      if (u) {
        const token = await cognitoAuth.getAccessToken();
        setUser({ id: u.id, email: u.email });
        setSession(token ? { access_token: token } : null);
        posthog?.identify(u.id);
        if (u.email) {
          window.klaviyo?.push(["identify", { email: u.email }]);
        }
        let timezone: string | undefined;
        try {
          timezone =
            Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
        } catch {
          /* ignore */
        }
        api.post("/auth/record-login-ip", { timezone }).catch(() => undefined);
        await api.post("/auth/ensure-profile", {}).catch(() => undefined);
      } else {
        setUser(null);
        setSession(null);
      }
    };

    cognitoAuth
      .getAuthUser()
      .then(async (u) => {
        await hydrate(u);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setSession(null);
        setLoading(false);
      });

    const hubCancel = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signInWithRedirect") {
        cognitoAuth
          .getAuthUser()
          .then((u) => hydrate(u))
          .catch(() => undefined);
      }
    });

    return () => hubCancel();
  }, [posthog]);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    try {
      const result = await cognitoAuth.signUp(email, password, displayName);
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        return { error: null, needsConfirmation: true };
      }
      await cognitoAuth.signIn(email, password);
      await establishSession();
      return { error: null, needsConfirmation: false };
    } catch (error) {
      return { error };
    }
  };

  const confirmSignUp = async (
    email: string,
    code: string,
    password: string,
  ) => {
    try {
      await cognitoAuth.confirmSignUp(email, code);
      await cognitoAuth.signIn(email, password);
      await establishSession();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const resendSignUpCode = async (email: string) => {
    try {
      await cognitoAuth.resendSignUpCode(email);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await cognitoAuth.signIn(email, password);
      await establishSession();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await cognitoAuth.signInWithGoogle();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await cognitoAuth.signOut();
    sessionStorage.clear();
    resetDailyCheckIn();
    setUser(null);
    setSession(null);
  };


  const resetPassword = async (email: string) => {
    try {
      await cognitoAuth.resetPassword(email);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await cognitoAuth.updatePassword(password, password);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        confirmSignUp,
        resendSignUpCode,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
