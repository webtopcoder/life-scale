import { STORAGE_KEYS } from '@/constants/storage';

/**
 * Ad-source markers (TikTok funnel / Meta disabled).
 *
 * Written to sessionStorage AND localStorage so a retargeted user who returns
 * later on the same device (landing directly on a checkout URL) keeps the pixel
 * that matches the funnel they originally entered from.
 */

function setFlag(key: string, value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      sessionStorage.setItem(key, '1');
      localStorage.setItem(key, '1');
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch {
    // ignore quota / private mode
  }
}

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(key) === '1') return true;
  } catch {
    // ignore
  }
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function setTikTokFunnelFlag(value: boolean): void {
  setFlag(STORAGE_KEYS.TIKTOK_FUNNEL_SESSION, value);
}

export function setMetaDisabledFlag(value: boolean): void {
  setFlag(STORAGE_KEYS.META_DISABLED_SESSION, value);
}

export function readTikTokFunnelFlag(): boolean {
  return readFlag(STORAGE_KEYS.TIKTOK_FUNNEL_SESSION);
}

export function readMetaDisabledFlag(): boolean {
  return readFlag(STORAGE_KEYS.META_DISABLED_SESSION);
}
