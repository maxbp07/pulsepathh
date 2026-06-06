/**
 * PulsePath — Sistema d'internacionalització (ca / es / en).
 * Català per defecte (piloto Ajuntament de Barcelona).
 */

import ca from './ca.json';
import es from './es.json';
import en from './en.json';

export const DEFAULT_LANG = 'ca';
export const SUPPORTED = ['ca', 'es', 'en'];

const STORAGE_KEY = 'pulsepath_lang';

const catalogs = { ca, es, en };

let activeLang = DEFAULT_LANG;
let strings = catalogs[DEFAULT_LANG];

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) {
      return stored;
    }
  } catch {
    // localStorage no disponible (mode privat, restriccions del navegador)
  }
  return DEFAULT_LANG;
}

function applyLanguage(lang) {
  activeLang = lang;
  strings = catalogs[lang] ?? catalogs[DEFAULT_LANG];
}

applyLanguage(readStoredLanguage());

/**
 * Retorna l'idioma actiu ('ca' | 'es' | 'en').
 * @returns {string}
 */
export function getLanguage() {
  return activeLang;
}

/**
 * Canvia l'idioma, el persisteix a localStorage i dispara l'esdeveniment 'languageChanged'.
 * @param {string} lang
 */
export function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) {
    throw new Error(`Idioma no suportat: ${lang}. Suportats: ${SUPPORTED.join(', ')}`);
  }

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Continua sense persistència si localStorage falla
  }

  applyLanguage(lang);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('languageChanged', { detail: { language: lang } }),
    );
  }
}

/**
 * Obté una cadena traduïda per clau amb notació de punt ('onboarding.title').
 * Retorna la clau si no es troba la traducció.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  if (!key || typeof key !== 'string') {
    return String(key ?? '');
  }

  const parts = key.split('.');
  let node = strings;

  for (const part of parts) {
    if (node == null || typeof node !== 'object' || !(part in node)) {
      return key;
    }
    node = node[part];
  }

  return typeof node === 'string' ? node : key;
}
