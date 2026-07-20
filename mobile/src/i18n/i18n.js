/**
 * i18n.js — PashuSetu Internationalization Configuration
 *
 * Single source of truth for all translations.
 * Supports: English (en), Hindi (hi), Marathi (mr)
 *
 * Usage:
 *   import i18n from '../i18n/i18n';
 *   i18n.changeLanguage('hi'); // switch to Hindi
 *
 *   In components:
 *   const { t } = useTranslation();
 *   t('settings.title') // → 'Settings' or 'सेटिंग्स' etc.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

i18n
  .use(initReactI18next)
  .init({
    // Bundled resources — no async loading needed for React Native
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    lng: 'en',           // default language (overridden by AppContext on boot)
    fallbackLng: 'en',   // fall back to English if a key is missing
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Suppress missing key warnings in production
    saveMissing: false,
    missingKeyHandler: false,
  });

export default i18n;
