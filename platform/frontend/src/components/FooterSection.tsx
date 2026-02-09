import { useTranslation } from 'react-i18next'

export default function FooterSection() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-700 bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-lg font-bold mb-3">AI Dev Request</div>
            <p className="text-gray-400 text-sm">{t('footer.description')}</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-medium mb-3">{t('footer.services')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.link.getStarted')}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t('footer.link.pricing')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.link.mySites')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.link.suggestions')}</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium mb-3">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.link.faq')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.link.contact')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.link.terms')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.link.privacy')}</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-medium mb-3">{t('footer.newsletter')}</h4>
            <p className="text-gray-400 text-sm mb-3">{t('footer.newsletterDescription')}</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                {t('footer.subscribe')}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
