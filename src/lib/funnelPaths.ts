/** Path helpers for funnel variants (Meta vs TikTok entry routes). */

export const RVR2_PATH = '/onboarding-rvr2';
export const RVR2_TT_PATH = '/onboarding-rvr2-tt';
export const FF_PATH = '/onboarding-ff';
export const ONBOARDING_888_PATH = '/onboarding-888';
export const ONBOARDING_888_TT_PATH = '/onboarding-888-tt';

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/** RVR2 product UI: standard Meta entry or TikTok-only entry. */
export function isRvr2Path(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === RVR2_PATH || path === RVR2_TT_PATH;
}

/** TikTok-only entry route for RVR2. */
export function isRvr2TtPath(pathname: string): boolean {
  return normalizePathname(pathname) === RVR2_TT_PATH;
}

/** Fully isolated international FF funnel entry route. */
export function isFfPath(pathname: string): boolean {
  return normalizePathname(pathname) === FF_PATH;
}

/** Fully isolated 888 funnel entry route. */
export function isOnboarding888Path(pathname: string): boolean {
  return normalizePathname(pathname) === ONBOARDING_888_PATH;
}

/** Fully isolated TikTok-only 888 funnel entry route. */
export function isOnboarding888TtPath(pathname: string): boolean {
  return normalizePathname(pathname) === ONBOARDING_888_TT_PATH;
}

/** Any TikTok-only entry route (Meta disabled, TikTok enabled). */
export function isTikTokOnlyPath(pathname: string): boolean {
  return isRvr2TtPath(pathname) || isOnboarding888TtPath(pathname);
}
