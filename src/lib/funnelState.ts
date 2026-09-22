import type { ScaleKey } from '@/config/scales';

// Simple localStorage helpers for the /choose-test → /trial-offer funnel.
export const FUNNEL_KEYS = {
  selectedTest: 'iqscale.funnel.selectedTest',
  selectedTier: 'iqscale.funnel.selectedTier',
  selectedTrial: 'iqscale.funnel.selectedTrial',
} as const;

export type SelectedTest = ScaleKey;
export type SelectedTier = 'insight' | 'guide' | 'focus' | 'complete';
export type SelectedTrial = '3-day' | '7-day' | '14-day' | '28-day' | '84-day';

export const setFunnelValue = (key: keyof typeof FUNNEL_KEYS, value: string) => {
  try { localStorage.setItem(FUNNEL_KEYS[key], value); } catch { /* noop */ }
};

export const getFunnelValue = (key: keyof typeof FUNNEL_KEYS): string | null => {
  try { return localStorage.getItem(FUNNEL_KEYS[key]); } catch { return null; }
};

/** Wipe the homepage-funnel scratch state so it can't leak into a later session. */
export const clearFunnelState = () => {
  try {
    for (const k of Object.values(FUNNEL_KEYS)) localStorage.removeItem(k);
  } catch { /* noop */ }
};
