// Lightweight stub for the short-iq port. The original project pipes
// trackEvent calls through PostHog; here we just return undefined so the
// existing trackEvent helper short-circuits on `posthog?.capture(...)`.
export function usePostHog(): undefined {
  return undefined;
}

export type PostHogClient = undefined;