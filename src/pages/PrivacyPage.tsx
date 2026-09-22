import { Link } from "react-router-dom";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LegalEntityCard } from "@/components/legal/LegalEntityCard";

const PrivacyPage = () => {
  return (
    <div className="lifescale-root min-h-screen">
      <MarketingHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: July 2026</p>

        <LegalEntityCard label="Data Controller" intro="Life Scale is operated by:" contactEmail="privacy@life-scale.com" />

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">

          {/* Section 1 */}
          <section>
            <h2 id="information-we-collect" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We collect information you provide directly, including:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Account Information:</strong> Email address, display name, and authentication credentials.</li>
              <li><strong>Assessment Responses:</strong> Your answers to any scale, test, or check you take on the Platform.</li>
              <li><strong>Profile Data:</strong> Generated scores, scale breakdowns, archetypes, reports, and progress data.</li>
              <li><strong>Payment Information:</strong> Billing details are collected and processed by our third-party payment provider (see <Link to="/terms#billing" className="text-primary underline hover:text-primary/80">Billing</Link>). We do not store full credit card numbers — we retain only purchase, subscription, and add-on records (plan, amount, status, dates) needed to give you access and handle support.</li>
              <li><strong>Usage Data:</strong> How you interact with our platform, features accessed, puzzles completed, lessons viewed, and session information.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 id="how-we-use" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>To provide and personalize our scored assessments, reports, and improvement plans.</li>
              <li>To generate your reports, scores, and personalized improvement path.</li>
              <li>To process payments and manage your subscription, renewals, and one-time add-on purchases.</li>
              <li>To improve our assessment algorithms and platform features using anonymized, aggregated data.</li>
              <li>To communicate with you about your account, updates, and support inquiries.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 id="data-sharing" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">3. Data Sharing and Third Parties</h2>
            <p className="text-muted-foreground mb-2">We may sell, license, share, or otherwise disclose your information — including personal data, assessment responses, and usage data — to third parties. This includes:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Commercial Partners:</strong> We may sell, license, or share your data (individually or in aggregate) with third parties for marketing, advertising, research, product development, or other commercial purposes.</li>
              <li><strong>Service Providers:</strong> Payment processors, hosting providers, and analytics tools that help us operate the platform.</li>
              <li><strong>Merchant of Record:</strong> We may use a service as our merchant of record to process payments and manage transactions. As part of this arrangement, we may provide the merchant of record with information it reasonably determines is necessary to monitor end users, including all transaction activity. Subject to applicable law, the merchant of record may also provide us with end-user information that we reasonably determine is necessary to fulfill our obligations under our agreement with them.</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              By using the Platform, you acknowledge and consent to the potential sale and commercial use of your data as described herein.
            </p>
            <p className="text-muted-foreground mt-2">
              See our <Link to="/cookies#third-party-cookies" className="text-primary underline hover:text-primary/80">Cookie Policy</Link> for details on third-party tracking technologies.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 id="data-security" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 id="your-rights" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">5. Your Rights</h2>
            <p className="text-muted-foreground mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Access and receive a copy of your personal data.</li>
              <li>Correct inaccurate personal data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Data portability.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              To exercise any of these rights, please contact us at <strong>help@life-scale.com</strong> or visit your <Link to="/help" className="text-primary underline hover:text-primary/80">Account Settings</Link>.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 id="data-retention" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active or as needed to provide services. Upon <Link to="/terms#account-termination" className="text-primary underline hover:text-primary/80">account deletion</Link>, your data will be permanently removed within 30 days, except where retention is required by law.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 id="contact-us" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">7. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related inquiries, contact us at <strong>privacy@life-scale.com</strong>, or write to us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Digital Spider Research Inc.<br />
              2810 N Church St #305968<br />
              Wilmington, DE 19802-4447, USA
            </p>
          </section>


        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default PrivacyPage;
