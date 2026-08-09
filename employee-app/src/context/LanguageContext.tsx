import React, { createContext, useContext, useState, useEffect } from 'react';
import ca from '../i18n/ca.json';
import es from '../i18n/es.json';
import en from '../i18n/en.json';

export type Language = 'ca' | 'es' | 'en';
const SUPPORTED_LANGUAGES: Language[] = ['ca', 'es', 'en'];
const DEFAULT_LANG: Language = 'ca';
const STORAGE_KEY = 'pulsepath_lang';

const translations: Record<Language, any> = { ca, es, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Language;
      if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
    }
    return DEFAULT_LANG;
  });

  const setLanguage = (lang: Language) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    setLangState(lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    if (!key) return '';
    const parts = key.split('.');
    let current: any = translations[language] || translations[DEFAULT_LANG];

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return key; // Clave no encontrada
      }
    }

    if (typeof current !== 'string') return key;

    // Sustitución de variables dinámicas (Ej: "pvt.progress": "{current} de {total}")
    if (variables) {
      let resolved = current;
      Object.entries(variables).forEach(([k, val]) => {
        resolved = resolved.replace(new RegExp(`{${k}}`, 'g'), String(val));
      });
      return resolved;
    }

    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation debe ser usado con LanguageProvider');
  return context;
};
