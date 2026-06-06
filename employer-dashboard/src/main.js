import { isAuthenticated } from './api/client.js';
import { renderLogin } from './auth/login.js';
import { renderDashboard } from './views/dashboard.js';

const app = document.getElementById('app');

function showLogin() {
  renderLogin(app, {
    onSuccess: () => showDashboard(),
  });
}

function showDashboard() {
  renderDashboard(app);
}

if (isAuthenticated()) {
  showDashboard();
} else {
  showLogin();
}
