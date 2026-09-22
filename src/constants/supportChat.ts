const ONBOARDING_PATH_PATTERN = /^\/onboarding(?:$|[-/])/;

/** Paths where the floating policy chat should stay hidden (purchase / assessment funnels). */
export const SUPPORT_CHAT_FUNNEL_PATHS = [
  '/assessment2',
  '/social-proof2',
  '/calculating2',
  '/email2',
  '/checkout',
  '/checkout2',
  '/report',
  '/choose-test',
  '/auth-gate',
  '/choose-tier',
  '/trial-offer',
  '/upgrade',
  '/iq-start',
  '/iq-dash',
  '/iq-report',
  '/bh-start',
  '/bh-dash',
  '/bh-report',
  '/hg-start',
  '/hg-dash',
  '/hg-report',
  '/body-start',
  '/body-dash',
  '/body-report',
  '/sleep-start',
  '/sleep-dash',
  '/sleep-report',
  '/ha-start',
  '/ha-dash',
  '/ha-report',
  '/preview',
  '/preview-upsells',
  '/addons',
  '/short-iq',
  '/upsell/weakness-report',
  '/upsell/genius-blueprint',
  '/upsell/brain-coach',
] as const;

export function isOnboardingPath(pathname: string): boolean {
  return ONBOARDING_PATH_PATTERN.test(pathname);
}

export function isFunnelPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (isOnboardingPath(normalized)) return true;
  return (SUPPORT_CHAT_FUNNEL_PATHS as readonly string[]).some(
    (path) => normalized === path || normalized.startsWith(`${path}/`),
  );
}
