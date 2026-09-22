import { describe, expect, it, vi } from 'vitest';
import {
  importedFunnelCheckoutConfig,
  IQ_UPSELL_SEQUENCE,
  iqUpsellOfferId,
  iqUpsellPath,
  checkLifeScaleCustomerReadiness,
  importedFunnelUpsellStartPath,
} from '@/lib/importedFunnelCheckout';

describe('imported IQ funnel upsells', () => {
  it('uses the supplied checkout metadata for every imported funnel', () => {
    expect(importedFunnelCheckoutConfig('/onboarding-rvr2')).toMatchObject({
      offerId: 'direct_1.00_7d_7.99_28d', routeId: 'rp_419548f4a7264925', flowId: 'rvr2', flowTag: 'internal',
    });
    expect(importedFunnelCheckoutConfig('/onboarding-rvr2-tt')).toMatchObject({ flowId: 'rvr2_tt', flowTag: 'internal' });
    expect(importedFunnelCheckoutConfig('/onboarding-888')).toMatchObject({ flowId: '888', flowTag: 'competitor' });
    expect(importedFunnelCheckoutConfig('/onboarding-888-tt')).toMatchObject({ flowId: '888_tt', flowTag: 'competitor' });
    expect(importedFunnelCheckoutConfig('/onboarding-ff')).toMatchObject({ flowId: 'ff', flowTag: 'internal' });
  });

  it('loads the RVR2 checkout for tracking links with a trailing slash', () => {
    const trackedUrl = new URL(
      'https://life-scale.com/onboarding-rvr2/?subid=1&transaction_id=affiliate-transaction&utm_source=meta_ads',
    );

    expect(importedFunnelCheckoutConfig(trackedUrl.pathname)).toMatchObject({
      offerId: 'direct_1.00_7d_7.99_28d',
      routeId: 'rp_419548f4a7264925',
      flowId: 'rvr2',
    });
    expect(trackedUrl.searchParams.get('transaction_id')).toBe('affiliate-transaction');
    expect(trackedUrl.searchParams.get('subid')).toBe('1');
  });

  it('keeps the approved five offers in order', () => {
    expect(IQ_UPSELL_SEQUENCE).toEqual([
      'addon_iq_weakness_report',
      'addon_iq_answer_breakdown',
      'addon_iq_speed_accuracy_report',
      'addon_iq_study_work_fit',
      'addon_iq_30day_sharpening',
    ]);
    expect(IQ_UPSELL_SEQUENCE.map((_, step) => iqUpsellOfferId(step))).toEqual([
      'addon_iq_weakness_report',
      'addon_iq_answer_breakdown',
      'addon_iq_speed_accuracy_report',
      'addon_iq_study_work_fit',
      'addon_iq_30day_sharpening',
    ]);
  });

  it('preserves the customer reference and finishes after step five', () => {
    const params = new URLSearchParams('step=3&offer_id=old&customer_id=customer-123');
    expect(iqUpsellPath(4, params)).toBe('/upsell?step=4&customer_id=customer-123');
    expect(iqUpsellPath(5, params)).toBe('/thank-you');
  });

  it('starts the five-step sequence at the first offer', () => {
    expect(importedFunnelUpsellStartPath()).toBe('/upsell?step=0&source=imported-funnel');
    expect(iqUpsellPath(0, new URLSearchParams('customer_id=customer-123'))).toBe(
      '/upsell?customer_id=customer-123&step=0',
    );
  });

  it('treats a missing Sirius customer as pending and other responses as ready', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(
      checkLifeScaleCustomerReadiness('https://sirius.bigdog.app/', 'customer 123'),
    ).resolves.toBe('pending');
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://sirius.bigdog.app/api/customer/summary?customer_id=customer%20123',
      expect.objectContaining({ credentials: 'include' }),
    );

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    await expect(
      checkLifeScaleCustomerReadiness('https://sirius.bigdog.app', 'customer-123'),
    ).resolves.toBe('ready');
    fetchMock.mockRestore();
  });
});