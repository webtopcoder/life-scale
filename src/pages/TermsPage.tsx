import { Link } from "react-router-dom";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LegalEntityCard } from "@/components/legal/LegalEntityCard";
import { statementDescriptorNote, monthlyPriceList } from '@/content/legalCopy';

const TermsPage = () => {
  return (
    <div className="lifescale-root min-h-screen">
      <MarketingHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-muted-foreground mb-6">Last updated: July 2026</p>

        <LegalEntityCard intro="Life Scale is operated by:" contactEmail="help@life-scale.com" />

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">

          {/* Section 1 */}
          <section>
            <h2 id="definitions" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">1. Definitions</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>"Platform"</strong> refers to the Life Scale website, application, and all associated services.</li>
              <li><strong>"Service"</strong> refers to the scored assessments, reports, dashboards, improvement tasks, puzzles, lessons, and related features provided by Life Scale across its categories.</li>
              <li><strong>"User"</strong> refers to any individual who accesses or uses the Platform.</li>
              <li><strong>"Subscription"</strong> refers to a recurring payment plan granting access to premium features.</li>
              <li><strong>"One-Time Purchase"</strong> refers to a single payment for a specific feature or content unlock.</li>
              <li><strong>"Content"</strong> refers to all text, graphics, assessments, reports, puzzles, lessons, and other materials available on the Platform.</li>
              <li><strong>"User Content"</strong> refers to any data, responses, or materials submitted by Users through the Platform.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 id="welcome" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">2. Welcome and Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Life Scale, operated by <strong>Digital Spider Research Inc.</strong>, a Delaware corporation with offices at 2810 N Church St #305968, Wilmington, DE 19802-4447, USA ("Life Scale", "we", "us"). We provide scored assessments, reports, and improvement tools across categories such as Mind and Body, designed to help you measure where you stand and work on the areas you want to improve. Our platform combines established frameworks with modern technology to deliver personalized insights and a tailored improvement path.
            </p>

          </section>

          {/* Section 3 */}
          <section>
            <h2 id="assessment-disclaimers" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">3. Assessment Disclaimers</h2>
            <p className="text-muted-foreground mb-2">
              Life Scale's assessments, scales, reports, and improvement tools are designed for <strong>personal development and educational purposes only</strong>. By using our Service, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Our assessments are <strong>not clinical psychological evaluations</strong> and should not be used as a substitute for professional psychological, psychiatric, or medical advice.</li>
              <li>Scores and results are based on self-administered tests and established frameworks. They provide <strong>general insights</strong> and should not be considered definitive or diagnostic.</li>
              <li>Improvement tasks, exercises, and lessons are educational in nature and do not guarantee measurable improvements in any area of your life.</li>
              <li>Life Scale does not employ licensed psychologists or therapists in the delivery of assessment results. Our tools are educational and informational.</li>
              <li>If you are experiencing mental health concerns, please consult a qualified healthcare professional.</li>
              <li>Assessment results may vary based on the accuracy and honesty of your responses, your state at the time you answer, environmental conditions, and other factors.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 id="acceptance-of-terms" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">4. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Life Scale, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use the Platform.
            </p>
            <p className="text-muted-foreground mt-2">
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the modified Terms. We will make reasonable efforts to notify users of material changes via email or in-app notification.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 id="account-eligibility" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">5. Account Eligibility and Security</h2>
            <p className="text-muted-foreground mb-2">To use Life Scale, you must:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Be at least <strong>18 years of age</strong> or the age of majority in your jurisdiction.</li>
              <li>Provide accurate and complete information during registration.</li>
              <li>Maintain only <strong>one account per person</strong>. Duplicate accounts may be terminated.</li>
              <li>Keep your login credentials secure and confidential. You are responsible for all activity under your account.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              You must notify us immediately if you suspect unauthorized access to your account. Life Scale is not liable for losses resulting from unauthorized use of your account.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 id="subscription-services" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">6. Subscription Services</h2>
            <p className="text-muted-foreground mb-2">Life Scale offers introductory subscription offers, recurring monthly plans, and optional one-time purchases:</p>

            <h3 id="subscription-plans" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Introductory Offers and Plans</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Subscriptions provide access to premium features including detailed reports, advanced score breakdowns, guided challenges, improvement tasks, puzzles, and lessons.</li>
              <li>We run a variety of introductory offers. Depending on the offer presented to you at checkout, the introductory term may be <strong>3, 7, 14, 28, or 84 days</strong>, priced between <strong>$1 and $38.99</strong>. The exact term and price are displayed before you pay.</li>
              <li><strong>Automatic renewal:</strong> unless you cancel before the introductory term ends, your subscription automatically converts to a recurring <strong>monthly</strong> plan and renews every month until cancelled.</li>
              <li>We offer four recurring plans, which renew at <strong>{monthlyPriceList()} per month</strong>. The renewal price applicable to your subscription is shown at checkout and in your confirmation email.</li>
              <li>You may cancel your subscription at any time through the <Link to="/help" className="text-primary underline hover:text-primary/80">Help Center</Link>.</li>
              <li>Cancellation takes effect at the end of the current billing period. You retain access until then.</li>
            </ul>

            <h3 id="one-time-purchases" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">One-Time Purchases (Add-Ons)</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>In addition to subscriptions, we offer optional add-ons as <strong>one-time purchases priced between $1.00 and $8.00</strong>. Promotional pricing may apply and is shown before purchase.</li>
              <li>Add-ons are <strong>single charges only</strong>. They do not renew, and buying one never starts or extends a subscription.</li>
              <li>Add-on content is generated from your own assessment responses and delivered to your account immediately after purchase.</li>
              <li>A one-time purchase grants permanent access to that add-on for as long as your account remains active.</li>
              <li>Some add-ons require a completed assessment in the relevant scale before they can be generated.</li>
            </ul>

            <h3 id="billing" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Billing</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>All prices are in USD unless otherwise stated.</li>
              <li>Payment is processed at the time of purchase and, for subscriptions, in advance at each renewal.</li>
              <li>Payments are processed by our third-party payment provider. We do not store full card numbers.</li>
              <li>{statementDescriptorNote()}</li>
              <li>You are responsible for all applicable taxes.</li>
            </ul>

          </section>

          {/* Section 7 */}
          <section>
            <h2 id="refund-policy" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">7. Refund Policy</h2>
            <p className="text-muted-foreground mb-2">
              For complete details, see our <Link to="/refund-policy" className="text-primary underline hover:text-primary/80">Refund Policy</Link>.
            </p>

            <h3 id="trial-subscriptions" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Introductory Offers</h3>
            <p className="text-muted-foreground">
              If you are unsatisfied with your introductory offer, you may request a full refund within <strong>30 days</strong> of your initial purchase by contacting our support team. See our <Link to="/refund-policy#money-back-guarantee" className="text-primary underline hover:text-primary/80">30-Day Money-Back Guarantee</Link> for details.
            </p>

            <h3 id="standard-subscriptions" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Monthly Renewals</h3>
            <p className="text-muted-foreground mb-1">Refunds for monthly renewal charges may be granted in the following circumstances (see <Link to="/refund-policy#subscription-refunds" className="text-primary underline hover:text-primary/80">Subscription Refunds</Link>):</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Service was substantially unavailable during your billing period.</li>
              <li>A billing error occurred (duplicate charge, incorrect amount).</li>
              <li>You did not use the service and request cancellation within 24 hours of an automatic renewal.</li>
            </ul>

            <h3 id="one-time-purchases-refund" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">One-Time Purchases</h3>
            <p className="text-muted-foreground">
              One-time add-on purchases are generally non-refundable, as the report or planner is generated and delivered to your account immediately. Exceptions may be made where a technical issue prevented delivery or access, or where you were charged more than once for the same add-on.
            </p>

          </section>

          {/* Section 8 */}
          <section>
            <h2 id="intellectual-property" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-2">
              All content on the Platform — including assessments, reports, puzzles, lessons, text, graphics, logos, algorithms, and software — is the property of Life Scale or its licensors and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground mb-2">
              You are granted a <strong>limited, personal, non-commercial, non-transferable license</strong> to access and use the Platform for your own personal development. You may not:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Reproduce, distribute, or publicly display any Platform content without written permission.</li>
              <li>Use automated tools to scrape, extract, or collect data from the Platform.</li>
              <li>Reverse-engineer any assessment methodology or algorithm.</li>
              <li>Use Life Scale content for commercial purposes without a separate licensing agreement.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 id="user-content" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">9. User Content and Rights</h2>
            <p className="text-muted-foreground mb-2">
              You retain ownership of any content you submit through the Platform (e.g., assessment responses, profile information). By submitting User Content, you grant Life Scale a <strong>non-exclusive, worldwide, royalty-free, perpetual, irrevocable, transferable, sublicensable license</strong> to use, process, analyze, reproduce, distribute, sell, license, and commercially exploit your content — both individually and in aggregate — for any purpose, including but not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Providing and improving our services.</li>
              <li>Generating your personalized reports and insights.</li>
              <li>Conducting research to improve assessment accuracy.</li>
              <li>Selling, licensing, or sharing your data with third parties for marketing, advertising, research, product development, or other commercial purposes.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              By using the Platform, you acknowledge that your data — including personal information and assessment responses — may be sold, licensed, or shared with third parties. See our <Link to="/privacy#data-sharing" className="text-primary underline hover:text-primary/80">Privacy Policy</Link> for more details.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 id="service-level" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">10. Service Level Agreement</h2>
            <p className="text-muted-foreground mb-2">
              Life Scale strives to maintain <strong>95% uptime</strong> for the Platform, measured on a monthly basis.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Scheduled Maintenance:</strong> We will provide at least 24 hours' notice for planned maintenance windows, which will typically be scheduled during off-peak hours.</li>
              <li><strong>Unscheduled Downtime:</strong> In the event of unexpected outages, we will work to restore service as quickly as possible and communicate status updates.</li>
              <li><strong>Service Credits:</strong> If uptime falls below 95% in any calendar month, affected subscribers may request a pro-rated service credit for the impacted period.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section>
            <h2 id="technical-requirements" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">11. Technical Requirements</h2>
            <p className="text-muted-foreground mb-2">To use Life Scale effectively, you need:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Browser:</strong> Latest version of Chrome, Firefox, Safari, or Edge.</li>
              <li><strong>Mobile:</strong> iOS 15+ or Android 10+ with a modern mobile browser.</li>
              <li><strong>Internet:</strong> A stable broadband internet connection.</li>
              <li><strong>JavaScript:</strong> Must be enabled in your browser.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Life Scale is not responsible for issues arising from unsupported browsers, devices, or network conditions.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 id="customer-support" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">12. Customer Support</h2>
            <p className="text-muted-foreground mb-2">We offer support through the following channels:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Help Center:</strong> Visit our <Link to="/help" className="text-primary underline hover:text-primary/80">Help Center</Link> for FAQs, account management, and self-service tools.</li>
              <li><strong>Email:</strong> Contact us at <strong>help@life-scale.com</strong> for direct assistance.</li>
              <li><strong>Response Times:</strong> We aim to respond to all inquiries within 2 business days.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              For billing disputes or complaints, please contact us via email. We will acknowledge your complaint within 2 business days and provide a resolution or explanation within 10 business days.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 id="limitation-of-liability" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">13. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-2">To the maximum extent permitted by applicable law:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Life Scale's total liability to you for any claims arising from your use of the Platform shall not exceed the <strong>total fees paid by you in the 12 months preceding the claim</strong>.</li>
              <li>Life Scale shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill.</li>
              <li>Life Scale is not liable for any decisions you make based on assessment results, scores, or other Platform content.</li>
            </ul>

            <h3 id="indemnification" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Indemnification</h3>
            <p className="text-muted-foreground">
              You agree to indemnify, defend, and hold harmless Life Scale, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 id="dispute-resolution" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">14. Dispute Resolution</h2>
            <p className="text-muted-foreground mb-2">
              These Terms are governed by the laws of the <strong>State of Delaware</strong>, where Digital Spider Research Inc. is incorporated, without regard to conflict of law principles.
            </p>


            <h3 id="mandatory-arbitration" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Mandatory Arbitration</h3>
            <p className="text-muted-foreground">
              Any disputes arising from these Terms or your use of the Platform shall be resolved through <strong>binding arbitration</strong> administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration shall be conducted remotely.
            </p>

            <h3 id="class-action-waiver" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Class Action Waiver</h3>
            <p className="text-muted-foreground">
              You agree that any dispute resolution proceedings will be conducted only on an <strong>individual basis</strong> and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>

          {/* Section 15 */}
          <section>
            <h2 id="service-modifications" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">15. Service Modifications</h2>
            <p className="text-muted-foreground mb-2">
              Life Scale reserves the right to modify, suspend, or discontinue any aspect of the Platform at any time. We will provide:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>30 days' notice</strong> for material changes to paid features or pricing.</li>
              <li><strong>Reasonable notice</strong> for other changes via email or in-app notification.</li>
              <li>If a material change adversely affects your subscription, you may cancel and receive a pro-rated refund for the unused portion of your billing period.</li>
            </ul>
          </section>

          {/* Section 16 */}
          <section>
            <h2 id="account-termination" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">16. Account Termination</h2>

            <h3 className="scroll-mt-20 text-lg font-medium mt-4 mb-2">User-Initiated Termination</h3>
            <p className="text-muted-foreground mb-2">
              You may delete your account at any time. Upon deletion:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Your account and associated data will be permanently removed within 30 days (see our <Link to="/privacy#data-retention" className="text-primary underline hover:text-primary/80">Data Retention policy</Link>).</li>
              <li>Any active subscription will be cancelled.</li>
              <li>One-time purchases will be forfeited.</li>
            </ul>

            <h3 className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Life Scale-Initiated Termination</h3>
            <p className="text-muted-foreground mb-2">We may suspend or terminate your account if you:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Violate these Terms & Conditions.</li>
              <li>Engage in fraudulent activity or abuse of the Platform.</li>
              <li>Create multiple accounts.</li>
              <li>Use the Platform for unauthorized commercial purposes.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We will provide notice before termination when practicable, except in cases of fraud or serious violations.
            </p>
          </section>


        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default TermsPage;
