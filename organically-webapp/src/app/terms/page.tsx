import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Organically",
  description: "Terms of Service for Organically - Instagram automation platform",
};

export default function TermsOfServicePage() {
  const lastUpdated = "December 10, 2024";
  const companyName = "Organically";
  const contactEmail = "legal@organically.app";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link 
          href="/" 
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using {companyName} (&quot;the Service&quot;), you agree to be bound by these 
              Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use 
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              {companyName} is a platform that provides Instagram automation tools, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Content scheduling and publishing to Instagram</li>
              <li>Automated responses to comments and direct messages</li>
              <li>Workflow automation based on triggers and actions</li>
              <li>AI-powered content assistance</li>
              <li>Analytics and performance tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use certain features of the Service, you must:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Create an account with accurate and complete information</li>
              <li>Be at least 18 years of age</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Instagram Account Connection</h2>
            <p className="text-muted-foreground leading-relaxed">
              By connecting your Instagram account to {companyName}, you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Authorize us to access your Instagram account through Meta&apos;s official APIs</li>
              <li>Grant us permission to perform actions on your behalf (posting, commenting, messaging)</li>
              <li>Confirm you have the authority to connect the Instagram account</li>
              <li>Agree to comply with Instagram&apos;s Terms of Use and Community Guidelines</li>
              <li>Understand you can revoke access at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">You agree NOT to use the Service to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Send spam, unsolicited messages, or harassing content</li>
              <li>Engage in fraudulent or deceptive practices</li>
              <li>Distribute malware, viruses, or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Circumvent rate limits or API restrictions</li>
              <li>Violate Instagram&apos;s terms of service or community guidelines</li>
              <li>Automate activities in a way that violates Meta&apos;s Platform Policies</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Collect user data without proper consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Content Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>All content you create, schedule, or publish through the Service</li>
              <li>Ensuring your content complies with applicable laws and platform policies</li>
              <li>Automated messages and responses configured in your workflows</li>
              <li>Obtaining necessary rights and permissions for content you upload</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not monitor or review your content before publishing and are not liable for 
              any content posted through your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its design, features, and content, is owned by {companyName} 
              and protected by intellectual property laws. You retain ownership of content you 
              create but grant us a license to use it as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service integrates with third-party platforms, including Instagram/Meta. Your use 
              of these integrations is subject to the respective platforms&apos; terms of service. We 
              are not responsible for the availability, accuracy, or content of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to maintain high availability but do not guarantee uninterrupted access. 
              The Service may be temporarily unavailable due to maintenance, updates, or 
              circumstances beyond our control, including changes to Instagram&apos;s API.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyName.toUpperCase()} SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Actions taken by Instagram/Meta regarding your account</li>
              <li>Content published through automated workflows</li>
              <li>Service interruptions or API changes by third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless {companyName}, its officers, directors, and 
              employees from any claims, damages, or expenses arising from your use of the Service, 
              violation of these Terms, or infringement of third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your account if you violate these Terms or engage in 
              conduct harmful to other users or the Service. You may terminate your account at 
              any time by disconnecting your Instagram account and requesting account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms at any time. We will notify you of significant changes 
              via email or through the Service. Continued use after changes constitutes acceptance 
              of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us at:{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                {contactEmail}
              </a>
            </p>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              By using {companyName}, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

