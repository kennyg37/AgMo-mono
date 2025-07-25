import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import rwCommon from './locales/rw/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  fr: {
    common: frCommon,
  },
  rw: {
    common: rwCommon,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Namespace configuration
    ns: ['common'],
    defaultNS: 'common',
    
    // Key separator for nested translations
    keySeparator: '.',
    
    // Plural separator
    pluralSeparator: '_',
    
    // Context separator
    contextSeparator: '_',
  });

export default i18n; 