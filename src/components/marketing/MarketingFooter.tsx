import { Link } from 'react-router-dom';
import { LifeScaleWordmark } from './LifeScaleWordmark';
import { CATEGORIES, scalesInCategory } from '@/config/scales';
import { disclaimer } from '@/content/legalCopy';
import visaLogo from '@/assets/payment-methods/visa.svg';
import mastercardLogo from '@/assets/payment-methods/mastercard.svg';
import applePayLogo from '@/assets/payment-methods/apple-pay.svg';
import googlePayLogo from '@/assets/payment-methods/google-pay.svg';
import paypalLogo from '@/assets/payment-methods/paypal.svg';

const FOOTER_SCALES = CATEGORIES.filter((c) => c.status === 'live').flatMap((c) =>
  scalesInCategory(c.key),
);

const PAYMENT_METHODS = [
  { name: 'Visa', logo: visaLogo },
  { name: 'Mastercard', logo: mastercardLogo },
  { name: 'Apple Pay', logo: applePayLogo },
  { name: 'Google Pay', logo: googlePayLogo },
  { name: 'PayPal', logo: paypalLogo },
];

export const MarketingFooter = () => {
  return (
    <footer className="mt-24 border-t border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-surface))]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <LifeScaleWordmark />
            <p className="mt-4 text-sm text-[hsl(var(--iq-muted))]">
              We give you the IQ of You.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--iq-ink))]">Tests</div>
            <ul className="space-y-2 text-sm text-[hsl(var(--iq-muted))]">
              {FOOTER_SCALES.map((s) => (
                <li key={s.key}>
                  <a href={`/#scale-${s.key}`} className="hover:text-[hsl(var(--iq-cobalt))]">
                    {s.name}
                  </a>
                </li>
              ))}
              <li><Link to="/sample" className="hover:text-[hsl(var(--iq-cobalt))]">Sample profile</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--iq-ink))]">Account &amp; help</div>
            <ul className="space-y-2 text-sm text-[hsl(var(--iq-muted))]">
              <li>
                <Link
                  to="/help"
                  className="inline-flex items-center rounded-full bg-[hsl(var(--iq-cobalt))] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[hsl(var(--iq-cobalt-hover))]"
                >
                  Help center
                </Link>
              </li>
              <li><Link to="/auth-gate?mode=login" className="hover:text-[hsl(var(--iq-cobalt))]">Sign in</Link></li>
              <li><Link to="/careers" className="hover:text-[hsl(var(--iq-cobalt))]">Careers</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--iq-ink))]">Policies</div>
            <ul className="space-y-2 text-sm text-[hsl(var(--iq-muted))]">
              <li><Link to="/terms" className="hover:text-[hsl(var(--iq-cobalt))]">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-[hsl(var(--iq-cobalt))]">Privacy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-[hsl(var(--iq-cobalt))]">Refund policy</Link></li>
              <li><Link to="/cookies" className="hover:text-[hsl(var(--iq-cobalt))]">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-mint-wash))] p-5 text-[13px] leading-relaxed text-[hsl(var(--iq-ink-soft))]">
          <span className="font-semibold text-[hsl(var(--iq-ink))]">About Life Scale:</span> {disclaimer('productLong')}
        </div>

        <div className="mt-4 rounded-lg border border-[hsl(var(--iq-border))] bg-[hsl(var(--iq-mint-wash))] p-5 text-[13px] leading-relaxed text-[hsl(var(--iq-ink-soft))]">
          <span className="font-semibold text-[hsl(var(--iq-ink))]">Contact Life Scale:</span> We would love to hear from you. You can email us at{' '}
          <a href="mailto:help@life-scale.com" className="underline hover:text-[hsl(var(--iq-cobalt))]">help@life-scale.com</a>{' '}
          or call us at{' '}
          <a href="tel:+18885747017" className="underline hover:text-[hsl(var(--iq-cobalt))]">(888) 574-7017</a>.
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
          {PAYMENT_METHODS.map((method) => (
            <img
              key={method.name}
              src={method.logo}
              alt={method.name}
              className="h-10 w-[60px] rounded object-contain"
              loading="lazy"
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-[hsl(var(--iq-border))] pt-6 text-xs text-[hsl(var(--iq-muted))] md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <span>© {new Date().getFullYear()} Digital Spider Research Inc. All rights reserved. Life Scale is a product of Digital Spider Research Inc.</span>
            <span>2810 N Church St #305968, Wilmington, DE 19802-4447, USA</span>
          </div>
          <span>Built for personal reflection, not clinical use.</span>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
