import { Link } from "react-router-dom";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LegalEntityCard } from "@/components/legal/LegalEntityCard";

const CookiesPage = () => {
  return (
    <div className="lifescale-root min-h-screen">
      <MarketingHeader />
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: July 2026</p>

        <LegalEntityCard intro="Life Scale is operated by:" contactEmail="admin@life-scale.com" />


        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          {/* What Are Cookies */}
          <section>
            <h2 id="what-are-cookies" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">1. What Are Cookies</h2>
            <p className="text-muted-foreground">
              Cookies are small text files stored on your device when you visit a website. They help us provide you with a better experience by remembering your preferences, keeping you signed in, and understanding how you use our platform.
            </p>
          </section>

          {/* How We Use Cookies */}
          <section>
            <h2 id="how-we-use-cookies" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">2. How We Use Cookies</h2>
            <p className="text-muted-foreground mb-2">We use the following types of cookies:</p>

            <h3 id="essential-cookies" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Essential Cookies</h3>
            <p className="text-muted-foreground">
              Required for the platform to function. These handle <Link to="/privacy#information-we-collect" className="text-primary underline hover:text-primary/80">authentication</Link>, session management, and security. You cannot opt out of these cookies.
            </p>

            <h3 id="functional-cookies" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Functional Cookies</h3>
            <p className="text-muted-foreground">
              Remember your preferences such as language settings, theme choices, and assessment progress so you don't have to re-enter them each visit.
            </p>

            <h3 id="analytics-cookies" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Analytics Cookies</h3>
            <p className="text-muted-foreground">
              Help us understand how visitors use the platform. We use this data in aggregate to improve our services. These cookies do not identify you personally.
            </p>

            <h3 id="marketing-cookies" className="scroll-mt-20 text-lg font-medium mt-4 mb-2">Marketing Cookies</h3>
            <p className="text-muted-foreground">
              Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns. These may be set by third-party advertising partners.
            </p>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 id="third-party-cookies" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">3. Third-Party Cookies</h2>
            <p className="text-muted-foreground mb-2">
              Some cookies are placed by third-party services that appear on our pages. We use the following third-party services:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Analytics:</strong> To track platform usage and performance.</li>
              <li><strong>Payment Processing:</strong> To securely handle transactions (see <Link to="/privacy#data-sharing" className="text-primary underline hover:text-primary/80">Data Sharing</Link>).</li>
              <li><strong>Authentication:</strong> To manage user sign-in sessions.</li>
            </ul>
          </section>

          {/* Managing Cookies */}
          <section>
            <h2 id="managing-cookies" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">4. Managing Cookies</h2>
            <p className="text-muted-foreground mb-2">
              You can control and manage cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>View what cookies are stored and delete them individually.</li>
              <li>Block third-party cookies.</li>
              <li>Block cookies from specific sites.</li>
              <li>Block all cookies from being set.</li>
              <li>Delete all cookies when you close your browser.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Please note that blocking essential cookies may prevent you from using certain features of the platform, including signing in and saving your assessment progress.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 id="updates" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">5. Updates to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the platform after changes constitutes acceptance.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 id="contact-us" className="scroll-mt-20 text-xl font-semibold mt-8 mb-3">6. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about our use of cookies, please contact us at <strong>admin@life-scale.com</strong>.
            </p>
          </section>


        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default CookiesPage;
