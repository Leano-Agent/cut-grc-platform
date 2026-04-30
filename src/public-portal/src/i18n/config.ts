import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import enTranslations from './locales/en.json'
import afTranslations from './locales/af.json'
import zuTranslations from './locales/zu.json'
import xhTranslations from './locales/xh.json'
import nsoTranslations from './locales/nso.json'
import tnTranslations from './locales/tn.json'
import stTranslations from './locales/st.json'
import tsTranslations from './locales/ts.json'
import ssTranslations from './locales/ss.json'
import veTranslations from './locales/ve.json'
import nrTranslations from './locales/nr.json'

const resources = {
  en: { translation: enTranslations },
  af: { translation: afTranslations },
  zu: { translation: zuTranslations },
  xh: { translation: xhTranslations },
  nso: { translation: nsoTranslations },
  tn: { translation: tnTranslations },
  st: { translation: stTranslations },
  ts: { translation: tsTranslations },
  ss: { translation: ssTranslations },
  ve: { translation: veTranslations },
  nr: { translation: nrTranslations },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'af', 'zu', 'xh', 'nso', 'tn', 'st', 'ts', 'ss', 've', 'nr'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n