import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface LanguageOption {
  code: string
  name: string
  nativeName: string
  isDefault: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [languages, setLanguages] = useState<LanguageOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/languages`)
      .then(res => res.json())
      .then(data => setLanguages(data))
      .catch(() => {
        // Fallback languages if API unavailable
        setLanguages([
          { code: 'ko', name: 'Korean', nativeName: '한국어', isDefault: true },
          { code: 'en', name: 'English', nativeName: 'English', isDefault: false },
        ])
      })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  if (languages.length === 0) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
      >
        <span>🌐</span>
        <span>{currentLang?.nativeName || i18n.language}</span>
        <span className="text-xs">▾</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${
                i18n.language === lang.code ? 'text-blue-400' : 'text-white'
              }`}
            >
              <span>{lang.nativeName}</span>
              {i18n.language === lang.code && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
