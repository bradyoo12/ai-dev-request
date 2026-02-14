import { ArrowLeft, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {

  return (
    <div className="min-h-screen bg-warm-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-warm-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-accent-blue" />
          <h1 className="text-4xl font-bold gradient-text">Privacy Policy</h1>
        </div>

        <div className="prose prose-invert prose-warm max-w-none space-y-8">
          <section className="bg-warm-900/30 border border-warm-800/50 rounded-lg p-6">
            <p className="text-warm-300 text-sm mb-4">
              <strong>Last Updated:</strong> February 15, 2026
            </p>
            <p className="text-warm-400">
              At AI Dev Request Platform, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our platform and services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-warm-200">1.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Name, email address, password, and profile details</li>
              <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely through Stripe)</li>
              <li><strong>Development Requests:</strong> Natural language prompts, code requirements, and project specifications</li>
              <li><strong>Generated Content:</strong> Code, configurations, and files created through our platform</li>
              <li><strong>Support Communications:</strong> Messages sent through support channels or feedback forms</li>
            </ul>

            <h3 className="text-xl font-semibold text-warm-200 mt-6">1.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>Usage Data:</strong> Features used, requests submitted, generation history, and platform interactions</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, operating system</li>
              <li><strong>Analytics Data:</strong> Page views, session duration, feature usage patterns</li>
              <li><strong>Performance Data:</strong> API response times, error logs, system performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold text-warm-200 mt-6">1.3 OAuth and Social Authentication</h3>
            <p className="text-warm-400">
              When you authenticate via Google or GitHub, we receive basic profile information including your name,
              email address, and profile picture as permitted by the OAuth provider.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">2. How We Use Your Information</h2>
            <p className="text-warm-400">We use your information for the following purposes:</p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>Service Delivery:</strong> Process development requests, generate code, and deploy projects</li>
              <li><strong>Account Management:</strong> Create and maintain your account, authenticate users</li>
              <li><strong>Billing and Payments:</strong> Process transactions, manage subscriptions, and track credit usage</li>
              <li><strong>Platform Improvement:</strong> Analyze usage patterns to enhance features and performance</li>
              <li><strong>AI Model Training:</strong> Improve AI models and code generation quality (see Section 3)</li>
              <li><strong>Security:</strong> Detect fraud, prevent abuse, and protect platform integrity</li>
              <li><strong>Communications:</strong> Send service updates, security alerts, and marketing messages (with consent)</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">3. AI Training and Generated Content</h2>
            <p className="text-warm-400">
              <strong>Claude API Integration:</strong> We use Anthropic's Claude API for code generation. Your prompts
              and generated code may be processed by Anthropic's systems. Please review{' '}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                Anthropic's Privacy Policy
              </a>{' '}
              for details on their data practices.
            </p>
            <p className="text-warm-400">
              <strong>Model Training:</strong> We may use anonymized and aggregated data from development requests to
              improve our AI models and platform features. We do not use personally identifiable information or
              proprietary code for training without explicit consent.
            </p>
            <p className="text-warm-400">
              <strong>Opt-Out:</strong> You can opt out of having your data used for model training by contacting us
              at privacy@aidevrequest.com.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">4. Data Sharing and Disclosure</h2>
            <p className="text-warm-400">We may share your information in the following circumstances:</p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Third-party services including Anthropic (Claude API), Stripe (payments),
                Azure (hosting), and analytics providers</li>
              <li><strong>Legal Requirements:</strong> When required by law, legal process, or government request</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>With Consent:</strong> When you explicitly authorize us to share information</li>
              <li><strong>Public Content:</strong> Information you choose to make public (e.g., marketplace templates)</li>
            </ul>
            <p className="text-warm-400 mt-4">
              <strong>We do not sell your personal information to third parties.</strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">5. Data Storage and Security</h2>
            <p className="text-warm-400">
              <strong>Storage Location:</strong> Your data is stored on secure servers hosted by Microsoft Azure,
              with primary data centers in [REGION - TODO: Specify actual region].
            </p>
            <p className="text-warm-400">
              <strong>Database:</strong> We use PostgreSQL with encryption at rest. Vector embeddings for semantic
              search are stored using pgvector with HNSW indexing.
            </p>
            <p className="text-warm-400">
              <strong>Security Measures:</strong> We implement industry-standard security practices including:
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li>Encryption in transit (HTTPS/TLS) and at rest</li>
              <li>Regular security audits and vulnerability scanning</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure credential storage with JWT tokens</li>
              <li>Secret detection to prevent credential leaks in generated code</li>
            </ul>
            <p className="text-warm-400 mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot
              guarantee absolute security of your data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">6. Data Retention</h2>
            <p className="text-warm-400">
              We retain your information for as long as your account is active or as needed to provide services.
              Specific retention periods:
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>Account Data:</strong> Retained until account deletion, then anonymized after 90 days</li>
              <li><strong>Generated Code:</strong> Retained according to your project settings and storage plan</li>
              <li><strong>Usage Logs:</strong> Retained for 12 months for analytics and debugging</li>
              <li><strong>Billing Records:</strong> Retained for 7 years to comply with financial regulations</li>
              <li><strong>Support Communications:</strong> Retained for 3 years</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">7. Your Privacy Rights</h2>
            <p className="text-warm-400">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your personal data</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
            </ul>
            <p className="text-warm-400 mt-4">
              To exercise these rights, contact us at privacy@aidevrequest.com or through your account settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">8. Cookies and Tracking Technologies</h2>
            <p className="text-warm-400">
              We use cookies and similar tracking technologies to maintain sessions, remember preferences, and
              analyze platform usage. Types of cookies we use:
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Required for authentication and platform functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and customizations</li>
            </ul>
            <p className="text-warm-400 mt-4">
              You can control cookie preferences through your browser settings, though this may affect platform functionality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">9. Children's Privacy</h2>
            <p className="text-warm-400">
              Our platform is not intended for users under 13 years of age (or 16 in the European Economic Area).
              We do not knowingly collect personal information from children. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">10. International Data Transfers</h2>
            <p className="text-warm-400">
              Your information may be transferred to and processed in countries other than your country of residence.
              We ensure appropriate safeguards are in place for international transfers, including Standard Contractual
              Clauses where applicable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">11. Changes to This Privacy Policy</h2>
            <p className="text-warm-400">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email
              or platform notification. The "Last Updated" date at the top indicates when the policy was last revised.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">12. Contact Information</h2>
            <p className="text-warm-400">
              For privacy-related questions or to exercise your rights, contact us at:
              <br />
              Email: <a href="mailto:privacy@aidevrequest.com" className="text-accent-blue hover:underline">privacy@aidevrequest.com</a>
              <br />
              Data Protection Officer: <a href="mailto:dpo@aidevrequest.com" className="text-accent-blue hover:underline">dpo@aidevrequest.com</a>
              <br />
              Support: <a href="mailto:support@aidevrequest.com" className="text-accent-blue hover:underline">support@aidevrequest.com</a>
            </p>
          </section>

          <section className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mt-8">
            <p className="text-yellow-300 text-sm font-semibold">
              [TODO: Legal Review Required]
            </p>
            <p className="text-yellow-400 text-sm mt-2">
              This Privacy Policy is a template and must be reviewed by legal counsel before deployment. Specific
              compliance requirements for GDPR, CCPA, and other regulations should be verified. The actual data
              center region, DPO contact, and third-party processor agreements should be confirmed and documented.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
