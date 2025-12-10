import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Organically",
  description: "Privacy Policy for Organically - Instagram automation platform",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 10, 2024";
  const companyName = "Organically";
  const contactEmail = "privacy@organically.app";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {lastUpdated}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to {companyName} (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;). We are committed to protecting your privacy and
              ensuring the security of your personal information. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our Instagram automation platform and
              related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-medium mb-3">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Account information (email address, name, profile picture) when
                you sign up
              </li>
              <li>Organization details you create within the platform</li>
              <li>
                Content you create, including posts, automation workflows, and
                messages
              </li>
              <li>Payment information when you subscribe to paid plans</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              2.2 Information from Instagram
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              When you connect your Instagram account, we receive:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Your Instagram username and account type</li>
              <li>Profile picture URL</li>
              <li>Access tokens to perform actions on your behalf</li>
              <li>Comments and direct messages for automation processing</li>
              <li>Media information for content publishing</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">
              2.3 Automatically Collected Information
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device information and browser type</li>
              <li>IP address and general location</li>
              <li>Usage data and interaction with our services</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process your Instagram automation workflows</li>
              <li>Schedule and publish content to your Instagram account</li>
              <li>Send automated responses to comments and direct messages</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about updates and support</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your
              information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Service Providers:</strong> Third parties that help us
                operate our platform (hosting, analytics, payment processing)
              </li>
              <li>
                <strong>Instagram/Meta:</strong> As required to provide our
                services through their APIs
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a
                merger, acquisition, or sale of assets
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your
              data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Encryption of sensitive data (including access tokens) using
                AES-256-GCM
              </li>
              <li>Secure HTTPS connections for all data transmission</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as your account is active
              or as needed to provide services. You can request deletion of your
              data at any time through our{" "}
              <Link
                href="/data-deletion"
                className="text-primary hover:underline"
              >
                data deletion page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Withdraw consent at any time</li>
              <li>Disconnect your Instagram account from our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Instagram Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our use of Instagram data is governed by Meta&apos;s Platform
              Terms and Developer Policies. We only access data necessary to
              provide our automation services, and you can revoke our access at
              any time through Instagram&apos;s app settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for users under 18 years of age. We
              do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or our data
              practices, please contact us at:{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary hover:underline"
              >
                {contactEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
