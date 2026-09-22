import { toPartnerAddonOfferId } from '@/lib/addons';

export const IMPORTED_FUNNEL_WIDGET_API_BASE_URL = 'https://sirius.bigdog.app';

export const IQ_UPSELL_SEQUENCE = [
  'addon_iq_weakness_report',
  'addon_iq_answer_breakdown',
  'addon_iq_speed_accuracy_report',
  'addon_iq_study_work_fit',
  'addon_iq_30day_sharpening',
] as const;

export type ImportedFunnelPath =
  | '/onboarding-rvr2'
  | '/onboarding-rvr2-tt'
  | '/onboarding-888'
  | '/onboarding-888-tt'
  | '/onboarding-ff';

export type ImportedFunnelCheckoutConfig = {
  offerId: string;
  routeId: string;
  flowId: string;
  flowTag: 'internal' | 'competitor';
};

const CHECKOUT_CONFIGS: Record<ImportedFunnelPath, ImportedFunnelCheckoutConfig> = {
  '/onboarding-rvr2': {
    offerId: 'direct_1.00_7d_7.99_28d',
    routeId: 'rp_419548f4a7264925',
    flowId: 'rvr2',
    flowTag: 'internal',
  },
  '/onboarding-rvr2-tt': {
    offerId: 'direct_1.00_7d_7.99_28d',
    routeId: 'rp_419548f4a7264925',
    flowId: 'rvr2_tt',
    flowTag: 'internal',
  },
  '/onboarding-888': {
    offerId: 'direct_1.00_7d_7.99_28d',
    routeId: 'rp_419548f4a7264925',
    flowId: '888',
    flowTag: 'competitor',
  },
  '/onboarding-888-tt': {
    offerId: 'direct_1.00_7d_7.99_28d',
    routeId: 'rp_419548f4a7264925',
    flowId: '888_tt',
    flowTag: 'competitor',
  },
  '/onboarding-ff': {
    offerId: 'direct_1.00_7d_7.99_28d',
    routeId: 'rp_419548f4a7264925',
    flowId: 'ff',
    flowTag: 'internal',
  },
};

export function importedFunnelCheckoutConfig(pathname: string): ImportedFunnelCheckoutConfig | null {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (!(normalizedPath in CHECKOUT_CONFIGS)) return null;
  return CHECKOUT_CONFIGS[normalizedPath as ImportedFunnelPath];
}

export function iqUpsellOfferId(step: number): string | null {
  const key = IQ_UPSELL_SEQUENCE[step];
  return key ? toPartnerAddonOfferId(key) : null;
}

export function iqUpsellPath(step: number, params?: URLSearchParams): string {
  if (step >= IQ_UPSELL_SEQUENCE.length) return '/thank-you';
  const next = new URLSearchParams(params);
  next.set('step', String(step));
  next.delete('offer');
  next.delete('offer_id');
  return `/upsell?${next.toString()}`;
}

export function importedFunnelUpsellStartPath(): string {
  return '/upsell?step=0&source=imported-funnel';
}

export type LifeScaleCustomerReadiness = 'ready' | 'pending' | 'unknown';

/** Mirrors the Sirius upsell widget's customer check without mounting it prematurely. */
export async function checkLifeScaleCustomerReadiness(
  apiBaseUrl: string,
  customerId: string,
  signal?: AbortSignal,
): Promise<LifeScaleCustomerReadiness> {
  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/, '')}/api/customer/summary?customer_id=${encodeURIComponent(customerId)}`,
      { credentials: 'include', signal },
    );
    return response.status === 404 ? 'pending' : 'ready';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return 'unknown';
  }
}