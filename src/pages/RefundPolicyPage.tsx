import { Link } from "react-router-dom";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LegalEntityCard } from "@/components/legal/LegalEntityCard";
import { renewalTermsAll } from '@/content/legalCopy';

const RefundPolicyPage = () => {
  return (
    <div className="lifescale-root min-h-screen">
      <MarketingHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: July 2026</p>

        <LegalEntityCard intro="Life Scale is operated by:" contactEmail="help@life-scale.com" />

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          {/* 30-Day Guarantee */}
          <section>
            <h2 id="money-back-guarantee" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">30-Day Money-Back Guarantee</h2>
            <p className="text-muted-foreground">
              We want you to be completely satisfied with Life Scale. If you are not happy with your introductory offer you may request a full refund within 30 days of that initial purchase, no questions asked.
            </p>
          </section>

          {/* Renewal Charges */}
          <section>
            <h2 id="renewal-charges" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">Renewal Charges</h2>
            <p className="text-muted-foreground mb-2">
              {renewalTermsAll()} Renewals are billed in advance for the upcoming month.
            </p>
            <p className="text-muted-foreground">
              Cancelling before your renewal date prevents the next charge. Cancelling after a renewal stops future charges but does not automatically refund the current period — see the conditions below.
            </p>
          </section>

          {/* Subscription Refunds */}
          <section>
            <h2 id="subscription-refunds" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">Subscription Refunds</h2>
            <p className="text-muted-foreground mb-2">
              Refunds for monthly renewals may only be granted in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Service Unavailability:</strong> The platform was substantially unavailable during your billing period.</li>
              <li><strong>Billing Errors:</strong> You were charged an incorrect amount or experienced a duplicate charge.</li>
              <li><strong>Prompt Cancellation:</strong> You did not use the service and request cancellation within 24 hours of an automatic renewal.</li>
            </ul>
          </section>

          {/* One-Time Purchases */}
          <section>
            <h2 id="one-time-purchases" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">One-Time Add-On Purchases</h2>
            <p className="text-muted-foreground mb-2">
              Add-ons (focused reports, deep dives, and 30-day planners, priced between <strong>$1.00 and $8.00</strong>) are single, non-recurring charges. Because each add-on is generated from your own responses and delivered to your account immediately, they are <strong>non-refundable once generated</strong>.
            </p>
            <p className="text-muted-foreground mb-2">Exceptions may be made if:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>A technical issue prevented the add-on from being generated or accessed.</li>
              <li>You were charged more than once for the same add-on.</li>
              <li>The content was not delivered as described.</li>
            </ul>
          </section>


          {/* How to Request */}
          <section>
            <h2 id="how-to-request" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">How to Request a Refund</h2>
            <p className="text-muted-foreground mb-2">To request a refund, please:</p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Visit our <Link to="/help" className="text-primary underline hover:text-primary/80">Help Center</Link>.</li>
              <li>Or email us directly at <strong>help@life-scale.com</strong> (see <Link to="/terms#customer-support" className="text-primary underline hover:text-primary/80">our support channels</Link>).</li>
            </ol>
            <p className="text-muted-foreground mt-2">
              We aim to process all refund requests within <strong>5-10 business days</strong>. Approved refunds will be credited to your original payment method.
            </p>
          </section>

          {/* Cancellation vs Refund */}
          <section>
            <h2 id="cancellation-vs-refund" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">Cancellation vs. Refund</h2>
            <p className="text-muted-foreground mb-2">
              Cancelling your subscription and requesting a refund are separate actions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Cancellation</strong> stops future billing. You retain access until the end of your current billing period. Cancel anytime via the <Link to="/help" className="text-primary underline hover:text-primary/80">Help Center</Link> (see <Link to="/terms#subscription-services" className="text-primary underline hover:text-primary/80">Subscription Services</Link> for details).</li>
              <li><strong>Refund</strong> returns payment already made, subject to the conditions above.</li>
            </ul>
          </section>


        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default RefundPolicyPage;
