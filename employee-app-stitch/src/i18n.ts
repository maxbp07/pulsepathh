/**
 * PulsePath — i18n (EN / ES) vía react-i18next.
 * El idioma se lee de prefs (localStorage) y se puede cambiar en Ajustes;
 * al cambiar, se persiste y se aplica inmediatamente.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLang } from './lib/prefs';
import en from './locales/en';
import es from './locales/es';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: getLang(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
