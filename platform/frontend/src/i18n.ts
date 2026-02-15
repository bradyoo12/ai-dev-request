import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ko from './locales/ko.json'
import en from './locales/en.json'

// Check localStorage availability
let useLocalStorage = true
try {
  localStorage.setItem('__test__', '1')
  localStorage.removeItem('__test__')
} catch {
  useLocalStorage = false
  console.warn('localStorage is not available, language detection will use navigator only')
}

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    detection: useLocalStorage ? {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    } : {
      order: ['navigator'],
      caches: [],
    },
  })
  .catch((error) => {
    console.error('Failed to initialize i18n:', error)
  })

export default i18n
