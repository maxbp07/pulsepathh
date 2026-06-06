import { setSession } from '../api/client.js';

export function renderLogin(container, { onSuccess }) {
  container.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <h1>PulsePath</h1>
          <p>Dashboard del empleador · Piloto BCN</p>
        </div>
        <form id="login-form" novalidate>
          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="rrhh@bcn.cat"
              autocomplete="username"
              required
            />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary" id="login-submit">
            Iniciar sesión
          </button>
          <div id="login-error" class="form-error" hidden></div>
        </form>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');
  const submitBtn = container.querySelector('#login-submit');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    errorEl.textContent = '';

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      errorEl.textContent = 'Introduce correo y contraseña.';
      errorEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Accediendo…';

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      if (!data.token) {
        throw new Error('Respuesta del servidor incompleta');
      }

      setSession({
        token: data.token,
        orgId: data.org_id,
        role: data.role,
      });

      onSuccess();
    } catch (err) {
      errorEl.textContent = err.message || 'No se pudo iniciar sesión';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar sesión';
    }
  });
}
