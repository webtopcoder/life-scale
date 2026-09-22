import { useEffect, useRef } from 'react';
import {
  importedFunnelCheckoutConfig,
  importedFunnelUpsellStartPath,
  IMPORTED_FUNNEL_WIDGET_API_BASE_URL,
  IQ_UPSELL_SEQUENCE,
} from '@/lib/importedFunnelCheckout';
import { tikTokContentPayload, trackTikTokEvent } from '@/lib/tiktokPixel';
import { withLifeScaleAttribution } from '@/constants/analytics';
import { persistCheckoutOffer } from '@/lib/lifeScaleOffers';

const SCRIPT_ID = 'life-scale-imported-funnel-checkout-umd';

type ImportedFunnelCheckoutProps = {
  pathname: string;
  email?: string;
};

export function ImportedFunnelCheckout({ pathname, email }: ImportedFunnelCheckoutProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const config = importedFunnelCheckoutConfig(pathname);
  const didFireAddPaymentInfo = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !config) return;

    const widenWidget = () => {
      const root = host.querySelector<HTMLElement>('.cw-root.ls-widget--funnel');
      if (!root) return;

      root.style.setProperty('max-width', '100%', 'important');
      root.style.setProperty('padding-left', '0', 'important');
      root.style.setProperty('padding-right', '0', 'important');
    };

    const observer = new MutationObserver(widenWidget);
    observer.observe(host, { childList: true, subtree: true });

    host.replaceChildren();
    persistCheckoutOffer(config.offerId, '/iq-report');
    const checkout = document.createElement('div');
    checkout.id = 'ls-checkout';
    checkout.dataset.variant = 'funnel-iframe';
    checkout.dataset.offerId = config.offerId;
    checkout.dataset.routeId = config.routeId;
    checkout.dataset.flowId = config.flowId;
    checkout.dataset.flowTag = config.flowTag;
    checkout.dataset.upsellSequence = IQ_UPSELL_SEQUENCE.join(',');
    checkout.dataset.upsellUrl = withLifeScaleAttribution(importedFunnelUpsellStartPath());
    checkout.dataset.successUrl = withLifeScaleAttribution('/thank-you');
    checkout.dataset.apiBaseUrl = IMPORTED_FUNNEL_WIDGET_API_BASE_URL;

    const queryEmail = new URLSearchParams(window.location.search).get('email');
    const resolvedEmail = queryEmail || email?.trim();
    if (resolvedEmail) checkout.dataset.email = resolvedEmail;
    host.appendChild(checkout);

    // Closest equivalent to Breeze "payment started" for the external widget.
    if (resolvedEmail && !didFireAddPaymentInfo.current) {
      didFireAddPaymentInfo.current = true;
      trackTikTokEvent('AddPaymentInfo', tikTokContentPayload());
    }

    document.getElementById(SCRIPT_ID)?.remove();
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${IMPORTED_FUNNEL_WIDGET_API_BASE_URL}/widget/life-scale-checkout.umd.js`;
    document.body.appendChild(script);

    return () => {
      observer.disconnect();
      script.remove();
    };
  }, [config, email]);

  return <div ref={hostRef} className="min-h-[400px] w-full" data-imported-funnel-checkout="" />;
}
