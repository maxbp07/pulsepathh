import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { registerPwa } from './pwa';
import './i18n'; // side-effect: inicializa react-i18next antes de renderizar
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

// Registra el Service Worker (PWA) de forma crash-safe. En origen HTTP
// (158.220.119.17) el navegador rechaza el registro y lo ignoramos sin error.
registerPwa();
