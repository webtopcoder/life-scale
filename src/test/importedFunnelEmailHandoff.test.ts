import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8');

describe('imported funnel email-to-checkout handoff', () => {
  it('routes RVR2 and FF calculation through a normal email stage', () => {
    expect(readSource('pages/CalculatingPage.tsx')).toContain("isRvr2Flow ? 'email' : 'checkout'");
    expect(readSource('pages/CalculatingPageFF.tsx')).toContain("stage: 'email'");
    expect(readSource('pages/OnboardingFlowPage.tsx')).toContain("case 'email':");
    expect(readSource('pages/OnboardingFlowPageFF.tsx')).toContain("case 'email':");
  });

  it('keeps checkout unmounted until an email exists in all five funnels', () => {
    expect(readSource('pages/OnboardingFlowPage.tsx')).toContain('state.email.trim() ? <CheckoutPageRVR2 /> : <EmailCaptureViewV2 />');
    expect(readSource('pages/OnboardingFlowPage888.tsx')).toContain('state.email.trim() ? <CheckoutPage888 /> : <EmailCaptureView888 />');
    expect(readSource('pages/OnboardingFlowPage888Tt.tsx')).toContain('state.email.trim() ? <CheckoutPage888Tt /> : <EmailCaptureView888Tt />');
    expect(readSource('pages/OnboardingFlowPageFF.tsx')).toContain('state.email.trim() ? <CheckoutPageFF /> : <EmailCaptureView />');
  });

  it('contains no checkout email dialogs or deferred widget flags', () => {
    const checkoutSources = [
      'pages/CheckoutPageRVR2.tsx',
      'pages/CheckoutPage888.tsx',
      'pages/CheckoutPage888Tt.tsx',
      'pages/CheckoutPageFF.tsx',
    ].map(readSource);

    for (const source of checkoutSources) {
      expect(source).not.toContain('CHECKOUT_EMAIL_OVERLAY');
      expect(source).not.toContain('showCheckoutEmailGate');
      expect(source).not.toContain('shouldInitCheckout');
      expect(source).not.toContain('<Dialog');
      expect(source).toContain('<ImportedFunnelCheckout');
    }
  });
});