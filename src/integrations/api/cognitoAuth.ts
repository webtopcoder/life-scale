import { Amplify } from "aws-amplify";
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signOut,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  getCurrentUser,
  fetchAuthSession,
  signInWithRedirect,
} from "aws-amplify/auth";

const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || "";
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || "";
const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || "";

let configured = false;

function oauthRedirectUrls(): string[] {
  if (typeof window === "undefined") {
    return ["http://localhost:5173/auth-gate"];
  }
  const origin = window.location.origin;
  // Prefer /auth-gate so OAuth return lands on the page that routes post-login.
  return [`${origin}/auth-gate`, `${origin}/`];
}

export function configureCognitoAuth() {
  if (configured || !poolId || !clientId) return;

  const loginWith: {
    email: true;
    oauth?: {
      domain: string;
      scopes: string[];
      redirectSignIn: string[];
      redirectSignOut: string[];
      responseType: "code";
      providers: ("Google")[];
    };
  } = {
    email: true,
  };

  if (cognitoDomain) {
    const redirects = oauthRedirectUrls();
    loginWith.oauth = {
      domain: cognitoDomain.replace(/^https?:\/\//, ""),
      scopes: ["email", "openid", "profile"],
      redirectSignIn: redirects,
      redirectSignOut: redirects,
      responseType: "code",
      providers: ["Google"],
    };
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: poolId,
        userPoolClientId: clientId,
        loginWith,
      },
    },
  });
  configured = true;
}

export type AuthSessionUser = {
  id: string;
  email?: string;
};

export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthSessionUser | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const email = session.tokens?.idToken?.payload?.email;
    return {
      id: user.userId,
      email: typeof email === "string" ? email : undefined,
    };
  } catch {
    return null;
  }
}

export const cognitoAuth = {
  signUp: async (email: string, password: string, displayName?: string) => {
    configureCognitoAuth();
    return signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          ...(displayName ? { name: displayName } : {}),
        },
      },
    });
  },
  confirmSignUp: async (email: string, code: string) => {
    configureCognitoAuth();
    return confirmSignUp({
      username: email,
      confirmationCode: code,
    });
  },
  resendSignUpCode: async (email: string) => {
    configureCognitoAuth();
    return resendSignUpCode({ username: email });
  },
  signIn: async (email: string, password: string) => {
    configureCognitoAuth();
    await signIn({ username: email, password });
  },
  signInWithGoogle: async () => {
    configureCognitoAuth();
    if (!cognitoDomain) {
      throw new Error("Google sign-in is not configured (missing VITE_COGNITO_DOMAIN)");
    }
    await signInWithRedirect({ provider: "Google" });
  },
  signOut: async () => {
    configureCognitoAuth();
    await signOut();
  },
  resetPassword: async (email: string) => {
    configureCognitoAuth();
    await resetPassword({ username: email });
  },
  confirmResetPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    configureCognitoAuth();
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  },
  updatePassword: async (oldPassword: string, newPassword: string) => {
    configureCognitoAuth();
    await updatePassword({ oldPassword, newPassword });
  },
  getAccessToken,
  getAuthUser,
};
