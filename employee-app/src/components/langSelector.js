import { getLanguage, setLanguage, SUPPORTED, t } from '../i18n/index.js';

const LANG_LABELS = { ca: 'CA', es: 'ES', en: 'EN' };

/**
 * Renderiza el selector CA | ES | EN en el contenedor dado.
 * @param {HTMLElement | null} container
 */
export function renderLangSwitcher(container) {
  if (!container) {
    return;
  }

  const active = getLanguage();
  container.className = 'lang-switcher';
  container.setAttribute('role', 'group');
  container.setAttribute('aria-label', t('onboarding.language_label'));

  container.replaceChildren(
    ...SUPPORTED.flatMap((lang, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-switcher__btn';
      btn.dataset.lang = lang;
      btn.textContent = LANG_LABELS[lang];
      btn.setAttribute('aria-pressed', lang === active ? 'true' : 'false');
      if (lang === active) {
        btn.classList.add('lang-switcher__btn--active');
      }

      if (index === 0) {
        return [btn];
      }

      const sep = document.createElement('span');
      sep.className = 'lang-switcher__sep';
      sep.textContent = '|';
      sep.setAttribute('aria-hidden', 'true');
      return [sep, btn];
    }),
  );
}

/**
 * Enlaza clics del selector y delega el cambio de idioma.
 * @param {HTMLElement | null} container
 * @param {() => void} onChange
 */
export function bindLangSwitcher(container, onChange) {
  container?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-lang]');
    if (!btn?.dataset.lang) {
      return;
    }

    const lang = btn.dataset.lang;
    if (lang === getLanguage()) {
      return;
    }

    setLanguage(lang);
    onChange?.();
  });
}
