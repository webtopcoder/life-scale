import { useEffect, useRef } from 'react';
import {
  lifeScaleApiBaseUrl,
  persistCheckoutOffer,
  persistUpsellOffer,
} from '@/lib/lifeScaleOffers';
import { withLifeScaleAttribution } from '@/constants/analytics';
import { STORAGE_KEYS } from '@/constants/storage';

const SCRIPT_ID = 'life-scale-checkout-umd';
const STYLE_ID = 'life-scale-checkout-css';

/** Default embed look (card + order summary). Use funnel-iframe for compact funnel panel. */
export type LifeScaleCheckoutVariant = 'home-iframe' | 'funnel-iframe';

function widgetBase(apiBase: string): string {
  return apiBase.replace(/\/$/, '');
}

/** Widget styles are a separate asset from the UMD — without this the form renders unstyled. */
function ensureWidgetStyles(apiBase: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.crossOrigin = 'anonymous';
  link.href = `${widgetBase(apiBase)}/widget/life-scale-checkout.css`;
  document.head.appendChild(link);
}

/**
 * UMD auto-boots once via getElementById('ls-checkout'|'ls-upsell') when the script
 * evaluates. In an SPA the mount target often appears after that, so we re-inject
 * the script (cache-busted) whenever we need another boot.
 */
function loadAndBootWidget(apiBase: string): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  ensureWidgetStyles(apiBase);

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) existing.remove();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `${widgetBase(apiBase)}/widget/life-scale-checkout.umd.js?t=${Date.now()}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Life-Scale widget failed to load'));
    document.body.appendChild(script);
  });
}

const HOME_CHECKOUT_LINKS = {
  terms: 'https://life-scale.com/terms',
  privacy: 'https://life-scale.com/privacy',
  help: 'https://life-scale.com/help?section=cancel',
} as const;

/** Repairs the production widget's fragment-only legal links after each auto-render. */
export function repairHomeCheckoutLinks(host: ParentNode): void {
  const legalParagraphs = Array.from(host.querySelectorAll<HTMLElement>('.ls-funnel-legal'));

  legalParagraphs.forEach((paragraph) => {
    paragraph.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
      const label = link.textContent?.trim().toLowerCase();
      if (label === 'terms') link.setAttribute('href', HOME_CHECKOUT_LINKS.terms);
      if (label === 'privacy policy') link.setAttribute('href', HOME_CHECKOUT_LINKS.privacy);
      if (label === 'help center') link.setAttribute('href', HOME_CHECKOUT_LINKS.help);
    });

    const fullText = paragraph.textContent ?? '';
    if (!fullText.includes('Cancel in one click')) return;
    if (
      fullText.includes('Cancel in one click from our Help Center.') &&
      !fullText.includes('emailing support') &&
      !fullText.includes('your account')
    ) {
      return;
    }

    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.textContent ?? '';
      const start = text.indexOf('Cancel in one click');
      if (start !== -1) {
        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(paragraph, paragraph.childNodes.length);
        range.deleteContents();

        paragraph.append('Cancel in one click from our ');
        const helpLink = document.createElement('a');
        helpLink.href = HOME_CHECKOUT_LINKS.help;
        helpLink.textContent = 'Help Center';
        paragraph.append(helpLink, '.');
        return;
      }
      node = walker.nextNode();
    }
  });
}

function enforceHomeCheckoutLinkClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a');
  if (!link?.closest('.ls-funnel-legal')) return;
  const label = link.textContent?.trim().toLowerCase();
  const destination =
    label === 'terms'
      ? HOME_CHECKOUT_LINKS.terms
      : label === 'privacy policy'
        ? HOME_CHECKOUT_LINKS.privacy
        : label === 'help center'
          ? HOME_CHECKOUT_LINKS.help
          : null;
  if (!destination) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.location.assign(destination);
}

/** Keeps legal copy outside the widget's React tree so its reconciler cannot restore broken links. */
function renderStableHomeLegalCopy(host: HTMLElement, destination: HTMLElement): void {
  const checkout = host.querySelector<HTMLElement>('#ls-checkout');
  const searchRoot = checkout?.shadowRoot ?? host;
  const source = searchRoot.querySelector<HTMLElement>('.ls-funnel-legal:not([data-ls-stable-legal])');
  if (!source) return;

  source.style.setProperty('display', 'none', 'important');
  const replacement = source.cloneNode(true) as HTMLElement;
  replacement.removeAttribute('style');
  replacement.setAttribute('data-ls-stable-legal', '');
  repairHomeCheckoutLinks(replacement);

  const current = destination.querySelector<HTMLElement>('[data-ls-stable-legal]');
  if (current?.innerHTML === replacement.innerHTML) return;
  current?.remove();
  destination.appendChild(replacement);
}

type LifeScaleCheckoutProps = {
  offerId: string;
  /** Override the configured widget host for a specific checkout surface. */
  apiBaseUrl?: string;
  /** Absolute or relative path after upsell decline/accept chain. */
  successPath?: string;
  upsellUrl?: string;
  successUrl?: string;
  /** Funnel-only: partner upsell product id passed as data-upsell-offer-id. */
  upsellOfferId?: string;
  /** Prefill checkout form (logged-in home path passes Cognito email). */
  email?: string;
  name?: string;
  /** Matches staging embed default (`home-iframe`). */
  variant?: LifeScaleCheckoutVariant;
  className?: string;
};

/**
 * Embeds the Life-Scale checkout widget.
 * Home: direct pay → successUrl.
 * Funnel: pay → upsellUrl (then thank-you).
 */
export function LifeScaleCheckout({
  offerId,
  apiBaseUrl,
  successPath,
  upsellUrl = '/upsell',
  successUrl = '/thank-you',
  upsellOfferId,
  email,
  name,
  variant = 'home-iframe',
  className,
}: LifeScaleCheckoutProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stableLegalRef = useRef<HTMLDivElement>(null);
  const apiBase = apiBaseUrl?.trim() || lifeScaleApiBaseUrl();
  const isFunnel = variant === 'funnel-iframe';

  useEffect(() => {
    persistCheckoutOffer(offerId, successPath);
    if (isFunnel && upsellOfferId) persistUpsellOffer(upsellOfferId);
    try {
      sessionStorage.setItem(STORAGE_KEYS.LIFESCALE_OFFER_ID, offerId);
      if (successPath) sessionStorage.setItem(STORAGE_KEYS.LIFESCALE_SUCCESS_PATH, successPath);
      if (isFunnel && upsellOfferId) {
        sessionStorage.setItem(STORAGE_KEYS.LIFESCALE_UPSELL_OFFER_ID, upsellOfferId);
      }
    } catch {
      /* noop */
    }

    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    const stableLegalHost = stableLegalRef.current;

    host.replaceChildren();
    stableLegalHost?.replaceChildren();
    const el = document.createElement('div');
    el.id = 'ls-checkout';
    el.setAttribute('data-offer-id', offerId);
    el.setAttribute('data-variant', variant);
    el.setAttribute('data-success-url', withLifeScaleAttribution(successUrl));
    el.setAttribute('data-api-base-url', apiBase);
    if (!isFunnel) {
      el.setAttribute('data-terms-url', HOME_CHECKOUT_LINKS.terms);
      el.setAttribute('data-privacy-url', HOME_CHECKOUT_LINKS.privacy);
      el.setAttribute('data-help-center-url', HOME_CHECKOUT_LINKS.help);
    }
    if (email) el.setAttribute('data-email', email);
    if (name) el.setAttribute('data-name', name);

    if (isFunnel) {
      el.setAttribute('data-upsell-url', withLifeScaleAttribution(upsellUrl));
      if (upsellOfferId) el.setAttribute('data-upsell-offer-id', upsellOfferId);
      el.style.width = '100%';
      el.style.minHeight = '400px';
    }

    host.appendChild(el);

    // The UMD replaces the original mount node, so always repair through its stable React host.
    const repairLegalLinks = () => {
      repairHomeCheckoutLinks(el.shadowRoot ?? document.body);
      if (stableLegalHost) renderStableHomeLegalCopy(document.body, stableLegalHost);
    };
    const legalLinksObserver = !isFunnel
      ? new MutationObserver(repairLegalLinks)
      : null;
    legalLinksObserver?.observe(el.shadowRoot ?? document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    if (!isFunnel) document.addEventListener('click', enforceHomeCheckoutLinkClick, true);
    if (!isFunnel) repairLegalLinks();
    const legalLinksRepairTimer = !isFunnel
      ? window.setInterval(repairLegalLinks, 250)
      : undefined;

    const onMessage = (e: MessageEvent) => {
      if (!isFunnel) return;
      const data = e.data as { type?: string; height?: number } | null;
      if (data?.type === 'funnel:height' && typeof data.height === 'number') {
        el.style.height = `${data.height}px`;
      }
    };
    if (isFunnel) window.addEventListener('message', onMessage);

    loadAndBootWidget(apiBase)
      .then(() => {
        if (!cancelled && !isFunnel) repairLegalLinks();
      })
      .catch((err) => {
        if (!cancelled) console.error('[LifeScaleCheckout]', err);
      });

    return () => {
      cancelled = true;
      legalLinksObserver?.disconnect();
      if (!isFunnel) document.removeEventListener('click', enforceHomeCheckoutLinkClick, true);
      if (legalLinksRepairTimer !== undefined) window.clearInterval(legalLinksRepairTimer);
      if (isFunnel) window.removeEventListener('message', onMessage);
    };
  }, [
    offerId,
    successPath,
    upsellUrl,
    successUrl,
    upsellOfferId,
    email,
    name,
    apiBase,
    variant,
    isFunnel,
  ]);

  return (
    <>
      <div ref={hostRef} className={className} data-lifescale-checkout="" />
      <div ref={stableLegalRef} data-lifescale-stable-legal="" />
    </>
  );
}

type LifeScaleUpsellProps = {
  offerId: string;
  successUrl?: string;
  declineUrl?: string;
  checkoutUrl?: string;
  upsellSequence?: readonly string[];
  apiBaseUrl?: string;
  className?: string;
};

/** Embeds the Life-Scale one-click upsell widget (`#ls-upsell`). */
export function LifeScaleUpsell({
  offerId,
  successUrl = '/thank-you',
  declineUrl = '/thank-you',
  checkoutUrl = '/thank-you',
  upsellSequence,
  apiBaseUrl,
  className,
}: LifeScaleUpsellProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiBase = apiBaseUrl?.trim() || lifeScaleApiBaseUrl();
  const didTrackUpsellPurchase = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();
    const el = document.createElement('div');
    el.id = 'ls-upsell';
    // Partner reads offer from URL `offer_id` and from data-upsell-offer-id.
    el.setAttribute('data-upsell-offer-id', offerId);
    el.setAttribute('data-offer-id', offerId);
    el.setAttribute('data-success-url', withLifeScaleAttribution(successUrl));
    el.setAttribute('data-decline-url', withLifeScaleAttribution(declineUrl));
    el.setAttribute('data-checkout-url', withLifeScaleAttribution(checkoutUrl));
    el.setAttribute('data-api-base-url', apiBase);
    if (upsellSequence?.length) {
      el.setAttribute('data-upsell-sequence', upsellSequence.join(','));
    }
    host.appendChild(el);

    // Partner currently documents only `funnel:height`. Listen for purchase-like
    // messages if/when the widget emits them; accept vs decline share the same
    // redirect URL so pixel upsell Purchase cannot be inferred from navigation alone.
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; transaction_id?: string; amount_cents?: number } | null;
      const type = data?.type;
      if (
        type !== 'upsell:completed' &&
        type !== 'funnel:upsell_completed' &&
        type !== 'funnel:purchase'
      ) {
        return;
      }
      if (didTrackUpsellPurchase.current) return;
      didTrackUpsellPurchase.current = true;
      void import('@/lib/funnelPurchaseTracking').then(({ trackFunnelUpsellPurchase }) => {
        trackFunnelUpsellPurchase({
          amountCents: typeof data?.amount_cents === 'number' ? data.amount_cents : 100,
          productKey: offerId,
          orderIdFallback: data?.transaction_id,
        });
      });
    };
    window.addEventListener('message', onMessage);

    loadAndBootWidget(apiBase).catch((err) => {
      if (!cancelled) console.error('[LifeScaleUpsell]', err);
    });

    return () => {
      cancelled = true;
      window.removeEventListener('message', onMessage);
    };
  }, [offerId, successUrl, declineUrl, checkoutUrl, upsellSequence, apiBase]);

  return <div ref={hostRef} className={className} data-lifescale-upsell="" />;
}
