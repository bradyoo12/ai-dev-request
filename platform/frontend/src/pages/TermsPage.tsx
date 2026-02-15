import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TermsPage() {

  return (
    <div className="min-h-screen bg-warm-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-warm-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8 gradient-text">Terms of Service</h1>

        <div className="prose prose-invert prose-warm max-w-none space-y-8">
          <section className="bg-warm-900/30 border border-warm-800/50 rounded-lg p-6">
            <p className="text-warm-300 text-sm mb-4">
              <strong>Last Updated:</strong> February 15, 2026
            </p>
            <p className="text-warm-400">
              Welcome to AI Dev Request Platform. By accessing or using our services, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">1. Service Description</h2>
            <p className="text-warm-400">
              AI Dev Request Platform is an AI-powered development platform that enables users to submit natural language
              development requests and automatically generates software solutions using advanced AI models including Claude API.
            </p>
            <p className="text-warm-400">
              Our platform provides code generation, project deployment, hosting services, and related developer tools
              through a combination of automated AI systems and cloud infrastructure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">2. User Accounts and Responsibilities</h2>
            <p className="text-warm-400">
              <strong>Account Creation:</strong> You must create an account to access certain features. You are responsible
              for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p className="text-warm-400">
              <strong>Acceptable Use:</strong> You agree to use the platform only for lawful purposes and in accordance with
              these Terms. You may not:
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li>Use the service to generate malicious code, malware, or harmful software</li>
              <li>Attempt to reverse engineer, decompile, or hack the platform</li>
              <li>Share, sell, or transfer your account to third parties</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">3. AI-Generated Code and Intellectual Property</h2>
            <p className="text-warm-400">
              <strong>Code Ownership:</strong> You retain ownership of the code generated through your requests. However,
              the AI Dev Request Platform retains ownership of the underlying AI models, algorithms, and platform technology.
            </p>
            <p className="text-warm-400">
              <strong>License:</strong> We grant you a non-exclusive, non-transferable license to use the generated code
              for your projects. You are responsible for reviewing and validating all AI-generated code before deployment
              to production environments.
            </p>
            <p className="text-warm-400">
              <strong>No Warranty:</strong> AI-generated code is provided "as is" without warranties of any kind. We do not
              guarantee that generated code will be error-free, secure, or suitable for your specific use case.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">4. Billing and Payments</h2>
            <p className="text-warm-400">
              <strong>Pricing:</strong> Our platform operates on a credit-based system. Pricing for credits and subscription
              plans is available on our pricing page and may be updated from time to time.
            </p>
            <p className="text-warm-400">
              <strong>Payment Processing:</strong> Payments are processed through Stripe. By providing payment information,
              you authorize us to charge the applicable fees to your payment method.
            </p>
            <p className="text-warm-400">
              <strong>Refunds:</strong> Credits are generally non-refundable except as required by law or at our sole discretion
              in cases of service outages or billing errors.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">5. Service Availability and Limitations</h2>
            <p className="text-warm-400">
              We strive to maintain high service availability but do not guarantee uninterrupted access. The platform may
              experience downtime for maintenance, updates, or due to circumstances beyond our control.
            </p>
            <p className="text-warm-400">
              <strong>Usage Limits:</strong> We may implement rate limits, usage quotas, or other restrictions to ensure
              fair access and platform stability. Excessive usage may result in temporary suspension or additional charges.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">6. Data and Privacy</h2>
            <p className="text-warm-400">
              Your use of the platform is also governed by our Privacy Policy, which describes how we collect, use, and
              protect your data. By using our services, you consent to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">7. Termination</h2>
            <p className="text-warm-400">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms,
              non-payment, or any other reason at our sole discretion. You may terminate your account at any time
              through your account settings.
            </p>
            <p className="text-warm-400">
              Upon termination, your access to the platform will be revoked, but data retention will be governed by
              our Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">8. Limitation of Liability</h2>
            <p className="text-warm-400">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI DEV REQUEST PLATFORM SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
              INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-warm-400">
              Our total liability for any claims arising from your use of the platform shall not exceed the amount
              you paid to us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">9. Indemnification</h2>
            <p className="text-warm-400">
              You agree to indemnify and hold harmless AI Dev Request Platform, its affiliates, and their respective
              officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses
              arising from your use of the platform or violation of these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">10. Changes to Terms</h2>
            <p className="text-warm-400">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via
              email or platform notifications. Your continued use of the platform after changes constitutes acceptance
              of the updated Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">11. Governing Law</h2>
            <p className="text-warm-400">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
              AI Dev Request Platform operates, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">12. Contact Information</h2>
            <p className="text-warm-400">
              If you have questions about these Terms, please contact us at:
              <br />
              Email: <a href="mailto:legal@aidevrequest.com" className="text-accent-blue hover:underline">legal@aidevrequest.com</a>
              <br />
              Support: <a href="mailto:support@aidevrequest.com" className="text-accent-blue hover:underline">support@aidevrequest.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
