import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function TermsPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-warm-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-warm-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t('terms.backToHome')}
        </Link>

        <h1 className="text-4xl font-bold mb-8 gradient-text">{t('terms.title')}</h1>

        <div className="prose prose-invert prose-warm max-w-none space-y-8">
          <section className="bg-warm-900/30 border border-warm-800/50 rounded-lg p-6">
            <p className="text-warm-300 text-sm mb-4">
              <strong>{t('terms.lastUpdated')}</strong> {t('terms.lastUpdatedDate')}
            </p>
            <p className="text-warm-400">
              {t('terms.intro')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s1.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s1.p1')}
            </p>
            <p className="text-warm-400">
              {t('terms.s1.p2')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s2.title')}</h2>
            <p className="text-warm-400">
              <strong>{t('terms.s2.accountCreation')}</strong>{t('terms.s2.accountCreationText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('terms.s2.acceptableUse')}</strong>{t('terms.s2.acceptableUseText')}
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li>{t('terms.s2.prohibited1')}</li>
              <li>{t('terms.s2.prohibited2')}</li>
              <li>{t('terms.s2.prohibited3')}</li>
              <li>{t('terms.s2.prohibited4')}</li>
              <li>{t('terms.s2.prohibited5')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s3.title')}</h2>
            <p className="text-warm-400">
              <strong>{t('terms.s3.codeOwnership')}</strong>{t('terms.s3.codeOwnershipText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('terms.s3.license')}</strong>{t('terms.s3.licenseText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('terms.s3.noWarranty')}</strong>{t('terms.s3.noWarrantyText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s4.title')}</h2>
            <p className="text-warm-400">
              <strong>{t('terms.s4.pricing')}</strong>{t('terms.s4.pricingText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('terms.s4.paymentProcessing')}</strong>{t('terms.s4.paymentProcessingText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('terms.s4.refunds')}</strong>{t('terms.s4.refundsText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s5.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s5.p1')}
            </p>
            <p className="text-warm-400">
              <strong>{t('terms.s5.usageLimits')}</strong>{t('terms.s5.usageLimitsText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s6.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s6.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s7.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s7.p1')}
            </p>
            <p className="text-warm-400">
              {t('terms.s7.p2')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s8.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s8.p1')}
            </p>
            <p className="text-warm-400">
              {t('terms.s8.p2')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s9.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s9.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s10.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s10.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s11.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s11.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('terms.s12.title')}</h2>
            <p className="text-warm-400">
              {t('terms.s12.p1')}
              <br />
              {t('terms.s12.emailLabel')}<a href="mailto:legal@aidevrequest.com" className="text-accent-blue hover:underline">legal@aidevrequest.com</a>
              <br />
              {t('terms.s12.supportLabel')}<a href="mailto:support@aidevrequest.com" className="text-accent-blue hover:underline">support@aidevrequest.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
