import { isOnboarding888TtPath, isTikTokOnlyPath } from '@/lib/funnelPaths';
import {
  readTikTokFunnelFlag,
  setMetaDisabledFlag,
  setTikTokFunnelFlag,
} from '@/lib/adSourceStorage';

type TtqMethod = (...args: unknown[]) => void;

type TtqStub = {
  track?: TtqMethod;
  identify?: TtqMethod;
  page?: TtqMethod;
  push?: (...args: unknown[]) => number;
};

type WindowWithTtq = Window & {
  ttq?: TtqStub & ((...args: unknown[]) => void);
};

export function markTikTokFunnelSession(): void {
  setTikTokFunnelFlag(true);
}

export function markMetaDisabledSession(): void {
  setMetaDisabledFlag(true);
}

export function isTikTokFunnel(): boolean {
  if (typeof window === 'undefined') return false;
  if (isTikTokOnlyPath(window.location.pathname)) return true;
  return readTikTokFunnelFlag();
}

function is888TtFunnelSession(): boolean {
  if (typeof window === 'undefined') return false;
  return isOnboarding888TtPath(window.location.pathname);
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function tikTokContentPayload(): Record<string, unknown> {
  const is888Tt = is888TtFunnelSession();
  return {
    contents: [
      {
        content_id: is888Tt ? 'iq_subscription_888' : 'iq_subscription_rvr',
        content_type: 'product',
        content_name: is888Tt ? 'Life Scale Subscription 888' : 'Life Scale Subscription RVR',
      },
    ],
    value: 1,
    currency: 'USD',
  };
}

function getTtq(): WindowWithTtq['ttq'] | undefined {
  if (!isTikTokFunnel()) return undefined;
  const ttq = (window as WindowWithTtq).ttq;
  if (!ttq) return undefined;
  // TikTok bootstrap uses an array stub with deferred .track/.identify methods, not a function.
  if (typeof ttq.track === 'function' || typeof ttq.push === 'function' || typeof ttq === 'function') {
    return ttq;
  }
  return undefined;
}

function callTtq(method: 'track' | 'identify', ...args: unknown[]): void {
  const ttq = getTtq() as TtqStub | undefined;
  if (!ttq) return;
  const fn = ttq[method];
  if (typeof fn === 'function') {
    fn(...args);
    return;
  }
  if (typeof ttq.push === 'function') {
    ttq.push([method, ...args]);
  }
}

export const trackTikTokEvent = (
  eventName: string,
  properties?: Record<string, unknown>,
) => {
  callTtq('track', eventName, properties);
};

export async function identifyTikTokUser(opts: {
  email?: string;
  externalId?: string;
}): Promise<void> {
  if (!getTtq()) return;

  const payload: Record<string, string> = {};

  if (opts.email?.trim()) {
    payload.email = await sha256Hex(opts.email.trim().toLowerCase());
  }
  if (opts.externalId?.trim()) {
    payload.external_id = await sha256Hex(opts.externalId.trim());
  }
  if (Object.keys(payload).length === 0) return;

  callTtq('identify', payload);
}

/** Fires a TikTok pageview for SPA navigations (TikTok-sourced sessions only). */
export function trackTikTokPageView(): void {
  const ttq = getTtq() as TtqStub | undefined;
  if (!ttq) return;
  if (typeof ttq.page === 'function') {
    ttq.page();
    return;
  }
  if (typeof ttq.push === 'function') {
    ttq.push(['page']);
  }
}
