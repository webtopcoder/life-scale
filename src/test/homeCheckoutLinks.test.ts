import { describe, expect, it } from 'vitest';
import { repairHomeCheckoutLinks } from '@/components/LifeScaleCheckout';

describe('home checkout legal links', () => {
  it('replaces widget fragments and email cancellation copy with Life Scale destinations', () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <p class="ls-funnel-legal">
        By continuing you agree to the <a href="#terms">Terms</a> and
        <a href="#privacy">Privacy Policy</a>. Your trial renews until you cancel.
        Cancel in one click from our <a href="#help">help center</a> or by emailing support.
      </p>
    `;

    repairHomeCheckoutLinks(host);

    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('a'));
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Terms', 'https://life-scale.com/terms'],
      ['Privacy Policy', 'https://life-scale.com/privacy'],
      ['Help Center', 'https://life-scale.com/help?section=cancel'],
    ]);
    expect(host.textContent).toContain('Cancel in one click from our Help Center.');
    expect(host.textContent).not.toContain('emailing support');
  });

  it('repairs the older unlinked cancellation sentence and remains idempotent', () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <p class="ls-funnel-legal">
        <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.
        Cancel in one click from your account or by emailing support.
      </p>
    `;

    repairHomeCheckoutLinks(host);
    repairHomeCheckoutLinks(host);

    expect(host.querySelectorAll('a[href="https://life-scale.com/help?section=cancel"]')).toHaveLength(1);
    expect(host.textContent).not.toContain('emailing support');
  });

  it('replaces every fragment link on repeated widget renders', () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <p class="ls-funnel-legal">
        <a href="#terms">Terms</a>, <a href="#privacy">Privacy Policy</a>,
        and <a href="#help">help center</a>.
      </p>
    `;

    repairHomeCheckoutLinks(host);

    expect(host.querySelectorAll('a[href^="#"]')).toHaveLength(0);
    expect(Array.from(host.querySelectorAll('a')).map((link) => link.href)).toEqual([
      'https://life-scale.com/terms',
      'https://life-scale.com/privacy',
      'https://life-scale.com/help?section=cancel',
    ]);
  });
});