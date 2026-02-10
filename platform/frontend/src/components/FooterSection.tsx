import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function FooterSection() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-700 bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-lg font-bold mb-3">AI Dev Request</div>
            <p className="text-gray-400 text-sm">{t('footer.description')}</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-medium mb-3">{t('footer.services')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">{t('footer.link.getStarted')}</Link></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t('footer.link.pricing')}</a></li>
              <li><Link to="/sites" className="hover:text-white transition-colors">{t('footer.link.mySites')}</Link></li>
              <li><Link to="/suggestions" className="hover:text-white transition-colors">{t('footer.link.suggestions')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium mb-3">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="mailto:support@aidevrequest.com" className="hover:text-white transition-colors">{t('footer.link.contact')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
