import { readMetaDisabledFlag } from '@/lib/adSourceStorage';

type FbqArgs = [string, string, Record<string, unknown>?];

type WindowWithFbq = Window & {
  fbq?: (...args: FbqArgs) => void;
};

function isMetaDisabledSession(): boolean {
  return readMetaDisabledFlag();
}

export const trackFacebookPixelEvent = (
  eventName: string,
  properties?: Record<string, unknown>,
) => {
  if (isMetaDisabledSession()) return;
  const win = window as WindowWithFbq;
  if (typeof win.fbq !== 'function') return;
  win.fbq('track', eventName, properties);
};

/** Fires a Meta PageView for SPA navigations (the base pixel only fires on hard load). */
export const trackFacebookPageView = () => {
  trackFacebookPixelEvent('PageView');
};
