import { ArrowLeft, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-warm-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-warm-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t('privacy.backToHome')}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-10 h-10 text-accent-blue" />
          <h1 className="text-4xl font-bold gradient-text">{t('privacy.title')}</h1>
        </div>

        <div className="prose prose-invert prose-warm max-w-none space-y-8">
          <section className="bg-warm-900/30 border border-warm-800/50 rounded-lg p-6">
            <p className="text-warm-300 text-sm mb-4">
              <strong>{t('privacy.lastUpdated')}</strong> {t('privacy.lastUpdatedDate')}
            </p>
            <p className="text-warm-400">
              {t('privacy.intro')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s1.title')}</h2>

            <h3 className="text-xl font-semibold text-warm-200">{t('privacy.s1.sub1.title')}</h3>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>{t('privacy.s1.sub1.item1Label')}</strong>{t('privacy.s1.sub1.item1Text')}</li>
              <li><strong>{t('privacy.s1.sub1.item2Label')}</strong>{t('privacy.s1.sub1.item2Text')}</li>
              <li><strong>{t('privacy.s1.sub1.item3Label')}</strong>{t('privacy.s1.sub1.item3Text')}</li>
              <li><strong>{t('privacy.s1.sub1.item4Label')}</strong>{t('privacy.s1.sub1.item4Text')}</li>
              <li><strong>{t('privacy.s1.sub1.item5Label')}</strong>{t('privacy.s1.sub1.item5Text')}</li>
            </ul>

            <h3 className="text-xl font-semibold text-warm-200 mt-6">{t('privacy.s1.sub2.title')}</h3>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>{t('privacy.s1.sub2.item1Label')}</strong>{t('privacy.s1.sub2.item1Text')}</li>
              <li><strong>{t('privacy.s1.sub2.item2Label')}</strong>{t('privacy.s1.sub2.item2Text')}</li>
              <li><strong>{t('privacy.s1.sub2.item3Label')}</strong>{t('privacy.s1.sub2.item3Text')}</li>
              <li><strong>{t('privacy.s1.sub2.item4Label')}</strong>{t('privacy.s1.sub2.item4Text')}</li>
            </ul>

            <h3 className="text-xl font-semibold text-warm-200 mt-6">{t('privacy.s1.sub3.title')}</h3>
            <p className="text-warm-400">
              {t('privacy.s1.sub3.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s2.title')}</h2>
            <p className="text-warm-400">{t('privacy.s2.intro')}</p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>{t('privacy.s2.item1Label')}</strong>{t('privacy.s2.item1Text')}</li>
              <li><strong>{t('privacy.s2.item2Label')}</strong>{t('privacy.s2.item2Text')}</li>
              <li><strong>{t('privacy.s2.item3Label')}</strong>{t('privacy.s2.item3Text')}</li>
              <li><strong>{t('privacy.s2.item4Label')}</strong>{t('privacy.s2.item4Text')}</li>
              <li><strong>{t('privacy.s2.item5Label')}</strong>{t('privacy.s2.item5Text')}</li>
              <li><strong>{t('privacy.s2.item6Label')}</strong>{t('privacy.s2.item6Text')}</li>
              <li><strong>{t('privacy.s2.item7Label')}</strong>{t('privacy.s2.item7Text')}</li>
              <li><strong>{t('privacy.s2.item8Label')}</strong>{t('privacy.s2.item8Text')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s3.title')}</h2>
            <p className="text-warm-400">
              <strong>{t('privacy.s3.claudeLabel')}</strong>{t('privacy.s3.claudeText')}
              <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                {t('privacy.s3.claudeLinkText')}
              </a>{t('privacy.s3.claudeTextAfter')}
            </p>
            <p className="text-warm-400">
              <strong>{t('privacy.s3.trainingLabel')}</strong>{t('privacy.s3.trainingText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('privacy.s3.optOutLabel')}</strong>{t('privacy.s3.optOutText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s4.title')}</h2>
            <p className="text-warm-400">{t('privacy.s4.intro')}</p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>{t('privacy.s4.item1Label')}</strong>{t('privacy.s4.item1Text')}</li>
              <li><strong>{t('privacy.s4.item2Label')}</strong>{t('privacy.s4.item2Text')}</li>
              <li><strong>{t('privacy.s4.item3Label')}</strong>{t('privacy.s4.item3Text')}</li>
              <li><strong>{t('privacy.s4.item4Label')}</strong>{t('privacy.s4.item4Text')}</li>
              <li><strong>{t('privacy.s4.item5Label')}</strong>{t('privacy.s4.item5Text')}</li>
            </ul>
            <p className="text-warm-400 mt-4">
              <strong>{t('privacy.s4.noSell')}</strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s5.title')}</h2>
            <p className="text-warm-400">
              <strong>{t('privacy.s5.storageLabel')}</strong>{t('privacy.s5.storageText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('privacy.s5.databaseLabel')}</strong>{t('privacy.s5.databaseText')}
            </p>
            <p className="text-warm-400">
              <strong>{t('privacy.s5.securityLabel')}</strong>{t('privacy.s5.securityText')}
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li>{t('privacy.s5.measure1')}</li>
              <li>{t('privacy.s5.measure2')}</li>
              <li>{t('privacy.s5.measure3')}</li>
              <li>{t('privacy.s5.measure4')}</li>
              <li>{t('privacy.s5.measure5')}</li>
            </ul>
            <p className="text-warm-400 mt-4">
              {t('privacy.s5.disclaimer')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s6.title')}</h2>
            <p className="text-warm-400">
              {t('privacy.s6.intro')}
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>{t('privacy.s6.item1Label')}</strong>{t('privacy.s6.item1Text')}</li>
              <li><strong>{t('privacy.s6.item2Label')}</strong>{t('privacy.s6.item2Text')}</li>
              <li><strong>{t('privacy.s6.item3Label')}</strong>{t('privacy.s6.item3Text')}</li>
              <li><strong>{t('privacy.s6.item4Label')}</strong>{t('privacy.s6.item4Text')}</li>
              <li><strong>{t('privacy.s6.item5Label')}</strong>{t('privacy.s6.item5Text')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s7.title')}</h2>
            <p className="text-warm-400">{t('privacy.s7.intro')}</p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>{t('privacy.s7.item1Label')}</strong>{t('privacy.s7.item1Text')}</li>
              <li><strong>{t('privacy.s7.item2Label')}</strong>{t('privacy.s7.item2Text')}</li>
              <li><strong>{t('privacy.s7.item3Label')}</strong>{t('privacy.s7.item3Text')}</li>
              <li><strong>{t('privacy.s7.item4Label')}</strong>{t('privacy.s7.item4Text')}</li>
              <li><strong>{t('privacy.s7.item5Label')}</strong>{t('privacy.s7.item5Text')}</li>
              <li><strong>{t('privacy.s7.item6Label')}</strong>{t('privacy.s7.item6Text')}</li>
              <li><strong>{t('privacy.s7.item7Label')}</strong>{t('privacy.s7.item7Text')}</li>
            </ul>
            <p className="text-warm-400 mt-4">
              {t('privacy.s7.exerciseRights')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s8.title')}</h2>
            <p className="text-warm-400">
              {t('privacy.s8.intro')}
            </p>
            <ul className="list-disc list-inside text-warm-400 space-y-2 ml-4">
              <li><strong>{t('privacy.s8.item1Label')}</strong>{t('privacy.s8.item1Text')}</li>
              <li><strong>{t('privacy.s8.item2Label')}</strong>{t('privacy.s8.item2Text')}</li>
              <li><strong>{t('privacy.s8.item3Label')}</strong>{t('privacy.s8.item3Text')}</li>
            </ul>
            <p className="text-warm-400 mt-4">
              {t('privacy.s8.control')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s9.title')}</h2>
            <p className="text-warm-400">
              {t('privacy.s9.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s10.title')}</h2>
            <p className="text-warm-400">
              {t('privacy.s10.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s11.title')}</h2>
            <p className="text-warm-400">
              {t('privacy.s11.p1')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-warm-100">{t('privacy.s12.title')}</h2>
            <p className="text-warm-400">
              {t('privacy.s12.intro')}
              <br />
              {t('privacy.s12.emailLabel')}<a href="mailto:privacy@aidevrequest.com" className="text-accent-blue hover:underline">privacy@aidevrequest.com</a>
              <br />
              {t('privacy.s12.dpoLabel')}<a href="mailto:dpo@aidevrequest.com" className="text-accent-blue hover:underline">dpo@aidevrequest.com</a>
              <br />
              {t('privacy.s12.supportLabel')}<a href="mailto:support@aidevrequest.com" className="text-accent-blue hover:underline">support@aidevrequest.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
