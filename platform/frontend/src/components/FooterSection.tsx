import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'

export default function FooterSection() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-warm-800/50 bg-warm-950/80">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-lg font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-blue" />
              <span className="gradient-text">AI Dev Request</span>
            </div>
            <p className="text-warm-500 text-sm leading-relaxed">{t('footer.description')}</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-3 text-warm-200">{t('footer.services')}</h4>
            <ul className="space-y-2 text-sm text-warm-500">
              <li><Link to="/" className="hover:text-white transition-colors">{t('footer.link.getStarted')}</Link></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t('footer.link.pricing')}</a></li>
              <li><Link to="/sites" className="hover:text-white transition-colors">{t('footer.link.mySites')}</Link></li>
              <li><Link to="/suggestions" className="hover:text-white transition-colors">{t('footer.link.suggestions')}</Link></li>
              <li><Link to="/patents" className="hover:text-white transition-colors">{t('footer.link.patents')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-3 text-warm-200">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-warm-500">
              <li><a href="mailto:support@aidevrequest.com" className="hover:text-white transition-colors">{t('footer.link.contact')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-warm-800/50 pt-6 text-center text-sm text-warm-600">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
