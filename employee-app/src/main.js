import './styles.css';
import { render as renderOnboarding } from './screens/onboarding.js';
import { render as renderHome } from './screens/home.js';
import { render as renderCheckin } from './screens/checkin.js';
import { render as renderHistory } from './screens/history.js';
import { initDb } from './storage/db.js';
import { initCrypto } from './crypto/local.js';
import { getToken } from './api/client.js';
import { getLanguage, t } from './i18n/index.js';
import { bindLangSwitcher, renderLangSwitcher } from './components/langSelector.js';

const TAB_ROUTES = new Set(['home', 'history']);

const screens = {
  onboarding: renderOnboarding,
  home: renderHome,
  checkin: renderCheckin,
  history: renderHistory,
};

let currentRoute = null;

/**
 * Flag de sesión en memoria. Se establece durante init() y se actualiza
 * en cada evento pulsepath:auth-changed. navigate() lo lee de forma síncrona.
 */
let _authenticated = false;

const viewEl = document.getElementById('view');
const bottomNav = document.getElementById('bottom-nav');
const langSwitcherEl = document.getElementById('lang-switcher');

function hasToken() {
  return _authenticated;
}

function defaultRoute() {
  return _authenticated ? 'home' : 'onboarding';
}

function setBottomNavVisible(visible) {
  bottomNav?.classList.toggle('bottom-nav--hidden', !visible);
  viewEl?.classList.toggle('view--no-nav', !visible);
}

function updateNavActive(route) {
  bottomNav?.querySelectorAll('.bottom-nav__item').forEach((btn) => {
    const isActive = btn.dataset.route === route;
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function updateNavLabels() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = t(key);
    }
  });
}

function updateDocumentLanguage() {
  document.documentElement.lang = getLanguage();
}

function refreshLanguageUI() {
  updateDocumentLanguage();
  updateNavLabels();
  renderLangSwitcher(langSwitcherEl);
}

function handleLanguageChange() {
  refreshLanguageUI();

  if (currentRoute && viewEl) {
    const renderScreen = screens[currentRoute];
    if (renderScreen) {
      renderScreen(viewEl, { navigate });
    }
  }
}

export function navigate(route) {
  if (!hasToken() && route !== 'onboarding') {
    route = 'onboarding';
  }

  if (hasToken() && route === 'onboarding') {
    route = 'home';
  }

  const renderScreen = screens[route];
  if (!renderScreen || !viewEl) {
    return;
  }

  currentRoute = route;
  const showNav = hasToken() && TAB_ROUTES.has(route);
  setBottomNavVisible(showNav);

  if (showNav) {
    updateNavActive(route);
  }

  renderScreen(viewEl, { navigate });
}

function bindBottomNav() {
  bottomNav?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-route]');
    if (!btn?.dataset.route) {
      return;
    }
    navigate(btn.dataset.route);
  });
}

function bindAuthChanges() {
  window.addEventListener('pulsepath:auth-changed', async () => {
    const token = await getToken();
    _authenticated = Boolean(token);
    navigate(defaultRoute());
  });
}

function bindLanguageChanges() {
  window.addEventListener('languageChanged', () => {
    handleLanguageChange();
  });
}

async function init() {
  await initDb();
  await initCrypto();

  // getToken() resuelve también la migración legacy (plaintext → cifrado).
  const token = await getToken();
  _authenticated = Boolean(token);

  refreshLanguageUI();
  bindLangSwitcher(langSwitcherEl);
  bindBottomNav();
  bindAuthChanges();
  bindLanguageChanges();
  navigate(defaultRoute());
}

init();
