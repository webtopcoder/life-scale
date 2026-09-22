/**
 * PostHog analytics event names and tracking helper.
 * Use these constants and trackEvent for consistent event naming and optional global properties.
 */

import { STORAGE_KEYS } from "./storage";

const UTM_PARAM_NAMES = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type UtmParams = Partial<Record<(typeof UTM_PARAM_NAMES)[number], string>>;

const AFFILIATE_PARAM_NAMES = [
  "transaction_id",
  "partner_id",
  "subid",
  "flow_id",
  "flow_tag",
] as const;

export type AffiliateParams = Partial<Record<(typeof AFFILIATE_PARAM_NAMES)[number], string>>;

function readAffiliateParamsFromUrl(): AffiliateParams {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const affiliate: AffiliateParams = {};
  for (const name of AFFILIATE_PARAM_NAMES) {
    const value = params.get(name);
    if (value?.trim()) affiliate[name] = value.trim();
  }
  return affiliate;
}

/**
 * First-touch capture of affiliate params (e.g. transaction_id) into sessionStorage.
 * Call once at app boot so params survive SPA navigations and Breeze redirects.
 */
export function captureAffiliateParams(): void {
  if (typeof sessionStorage === "undefined") return;
  const key = STORAGE_KEYS.AFFILIATE_PARAMS;
  const fromUrl = readAffiliateParamsFromUrl();
  if (Object.keys(fromUrl).length === 0) return;

  let existing: AffiliateParams = {};
  const stored = sessionStorage.getItem(key);
  if (stored) {
    try {
      existing = JSON.parse(stored) as AffiliateParams;
    } catch {
      existing = {};
    }
  }

  const merged = { ...existing, ...fromUrl };
  try {
    sessionStorage.setItem(key, JSON.stringify(merged));
  } catch {
    // ignore quota or other storage errors
  }
}

/**
 * Returns affiliate params for the current session (first-touch).
 * Merges URL params when present so late-arriving query strings still apply.
 */
export function getAffiliateParams(): AffiliateParams {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return {};
  }
  const key = STORAGE_KEYS.AFFILIATE_PARAMS;
  const fromUrl = readAffiliateParamsFromUrl();
  let stored: AffiliateParams = {};
  const raw = sessionStorage.getItem(key);
  if (raw) {
    try {
      stored = JSON.parse(raw) as AffiliateParams;
    } catch {
      stored = {};
    }
  }
  const merged = { ...stored, ...fromUrl };
  if (Object.keys(fromUrl).length > 0) {
    try {
      sessionStorage.setItem(key, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }
  return merged;
}

/** Affiliate transaction_id: URL param first, then sessionStorage. */
export function getAffiliateTransactionId(): string | undefined {
  if (typeof window !== "undefined") {
    const fromUrl = new URLSearchParams(window.location.search).get("transaction_id")?.trim();
    if (fromUrl) return fromUrl;
  }
  return getAffiliateParams().transaction_id;
}

/**
 * Query string (no leading `?`) with Life-Scale attribution params for widget pages.
 * The Life-Scale widget reads partner_id / subid / flow_id / flow_tag from the page URL.
 */
export function getLifeScaleAttributionQuery(): string {
  const params = new URLSearchParams();
  const affiliate = getAffiliateParams();
  for (const name of AFFILIATE_PARAM_NAMES) {
    const value = affiliate[name]?.trim();
    if (value) params.set(name, value);
  }
  const qs = params.toString();
  return qs;
}

/** Append attribution params to a path like `/upsell` or `/thank-you`. */
export function withLifeScaleAttribution(path: string): string {
  const qs = getLifeScaleAttributionQuery();
  if (!qs) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${qs}`;
}

/**
 * Returns UTM params for the current session (first-touch). Reads from sessionStorage if already
 * captured; otherwise parses window.location.search, persists to sessionStorage, and returns.
 * Safe when window/sessionStorage are unavailable (e.g. SSR).
 */
export function getUtmParams(): UtmParams {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return {};
  }
  const key = STORAGE_KEYS.UTM_PARAMS;
  const stored = sessionStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as UtmParams;
    } catch {
      return {};
    }
  }
  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  for (const name of UTM_PARAM_NAMES) {
    const value = params.get(name);
    if (value?.trim()) utm[name] = value.trim();
  }
  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem(key, JSON.stringify(utm));
    } catch {
      // ignore quota or other storage errors
    }
  }
  return utm;
}

export const EVENTS = {
  CTA_CLICKED: 'cta_clicked',
  FUNNEL_STEP_COMPLETED: 'funnel_step_completed',
  ASSESSMENT_QUESTION_ANSWERED: 'assessment_question_answered',
  CHECKOUT_CTA_CLICKED: 'checkout_cta_clicked',
  CHECKOUT_COMPLETED: 'checkout_completed',
  UPSELL_PURCHASED: 'upsell_purchased',
  UPSELL_SKIPPED: 'upsell_skipped',
  DASHBOARD_CARD_CLICKED: 'dashboard_card_clicked',
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGIN_FAILED: 'auth_login_failed',
  AUTH_SIGNUP_SUCCESS: 'auth_signup_success',
  AUTH_RESET_PASSWORD_REQUESTED: 'auth_reset_password_requested',
  FUNNEL_SESSION_RESUMED: 'funnel_session_resumed',
  FUNNEL_SESSION_STARTED_OVER: 'funnel_session_started_over',
  ONBOARDING_STARTED: 'onboarding_started',
  ACTIVITY_STARTED: 'activity_started',
  ACTIVITY_COMPLETED: 'activity_completed',
  ALT_PAYMENT_METHOD_CLICKED: 'alt_payment_method_clicked',
} as const;

export type PostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

/**
 * Capture a custom event with optional properties. Safe when posthog is undefined (e.g. before init or opted out).
 * UTM params (when present at landing) are merged into every event for funnel breakdowns.
 */
export function trackEvent(
  posthog: PostHogClient | undefined,
  eventName: string,
  properties?: Record<string, unknown>
): void {
  const utm = getUtmParams();
  const payload = { ...utm, ...properties, source: "web" };
  console.log("[PostHog]", eventName, payload);
  posthog?.capture(eventName, payload);
}
