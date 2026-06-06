/**
 * Onboarding — Fase 4 polish
 * Scroll area estilitzada, checkbox visible, botó supressió RGPD discret.
 * Tota la lògica d'activació anònima i RGPD Art. 17 intacta.
 */
import { t, setLanguage, getLanguage, SUPPORTED } from '../i18n/index.js';
import { activateAnonymous, apiFetch, clearToken, getToken } from '../api/client.js';
import { initDb, clearAll } from '../storage/db.js';
import { initCrypto } from '../crypto/local.js';

export function render(container) {
  function draw() {
    const lang = getLanguage();

    const consentHtml = t('onboarding.consent_body')
      .split('\n\n')
      .map((para) => `<p style="margin:0 0 0.75rem">${para.replace(/\n/g, '<br>')}</p>`)
      .join('');

    container.innerHTML = `
      <section class="screen screen--onboarding">

        <div class="glass-card" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
          <span style="font-size:0.85rem;color:var(--text-muted);flex-shrink:0">
            ${t('onboarding.language_label')}:
          </span>
          <div style="display:flex;gap:0.5rem">
            ${SUPPORTED.map((l) => `
              <button
                type="button"
                class="btn ${l === lang ? '' : 'btn--ghost'}"
                data-lang="${l}"
                style="padding:0.4rem 0.85rem;font-size:0.8rem;min-width:3rem"
              >${l.toUpperCase()}</button>
            `).join('')}
          </div>
        </div>

        <h1 class="screen__title" style="margin-top:1.25rem">${t('onboarding.title')}</h1>

        <div class="glass-card">
          <h2 style="margin:0 0 0.75rem;font-size:1rem;font-weight:600">
            ${t('onboarding.consent_title')}
          </h2>

          <div class="consent-scroll" tabindex="0" role="region" aria-label="${t('onboarding.consent_title')}">
            ${consentHtml}
          </div>

          <label class="consent-label">
            <input type="checkbox" id="consent-check" class="consent-checkbox">
            <span>${t('onboarding.submit')}</span>
          </label>
        </div>

        <div class="glass-card">
          <label for="code-input" class="form-label" style="display:block;margin-bottom:0.5rem">
            ${t('onboarding.code_label')}
          </label>
          <input
            type="text"
            id="code-input"
            class="form-input"
            placeholder="${t('onboarding.code_placeholder')}"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          >
        </div>

        <div id="onboarding-error" class="inline-error" style="display:none"></div>

        <button
          type="button"
          class="btn btn-block"
          id="btn-submit"
          disabled
          style="opacity:0.45;cursor:not-allowed"
        >${t('onboarding.submit')}</button>

        <div id="onboarding-loading" class="inline-loading" style="display:none">
          ${t('common.loading')}
        </div>

        <div style="margin-top:2rem;text-align:center">
          <button
            type="button"
            id="btn-delete"
            class="btn btn--danger-ghost"
          >${t('onboarding.right_to_delete')}</button>
        </div>

        <div id="delete-loading" class="inline-loading" style="display:none">
          ${t('common.loading')}
        </div>

      </section>
    `;

    // ── Language buttons ──────────────────────────────────────────────────────
    container.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
        draw();
      });
    });

    // ── Form elements ─────────────────────────────────────────────────────────
    const consentCheck  = container.querySelector('#consent-check');
    const codeInput     = container.querySelector('#code-input');
    const submitBtn     = container.querySelector('#btn-submit');
    const errorDiv      = container.querySelector('#onboarding-error');
    const loadingDiv    = container.querySelector('#onboarding-loading');
    const deleteBtn     = container.querySelector('#btn-delete');
    const deleteLoading = container.querySelector('#delete-loading');

    function updateSubmitState() {
      const ready = consentCheck.checked && codeInput.value.trim().length > 0;
      submitBtn.disabled      = !ready;
      submitBtn.style.opacity = ready ? '1' : '0.45';
      submitBtn.style.cursor  = ready ? 'pointer' : 'not-allowed';
    }

    consentCheck.addEventListener('change', updateSubmitState);
    codeInput.addEventListener('input', updateSubmitState);

    // ── Submit ────────────────────────────────────────────────────────────────
    submitBtn.addEventListener('click', async () => {
      const code = codeInput.value.trim();
      if (!code || !consentCheck.checked) return;

      submitBtn.disabled       = true;
      submitBtn.style.opacity  = '0.45';
      errorDiv.style.display   = 'none';
      loadingDiv.style.display = 'block';

      try {
        await initDb();
        await initCrypto();
        await activateAnonymous(code, true, '1.0');
        window.dispatchEvent(new CustomEvent('pulsepath:auth-changed'));
      } catch (err) {
        const status = err?.status;
        const msg =
          status === 404 || status === 409 || status === 400
            ? t('errors.invalid_code')
            : t('errors.network');
        errorDiv.textContent    = msg;
        errorDiv.style.display  = 'block';
        submitBtn.disabled      = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor  = 'pointer';
      } finally {
        loadingDiv.style.display = 'none';
      }
    });

    // ── Derecho de supresión (RGPD Art. 17) ──────────────────────────────────
    deleteBtn.addEventListener('click', async () => {
      const confirmMsg = t('onboarding.delete_confirm');
      if (!confirm(confirmMsg)) return;

      deleteBtn.disabled          = true;
      deleteLoading.style.display = 'block';

      try {
        const token = await getToken();
        if (token) {
          await apiFetch('/me/delete', { method: 'POST' }).catch(() => {});
        }
      } finally {
        await clearToken();
        await clearAll();
        deleteLoading.style.display = 'none';
        window.dispatchEvent(new CustomEvent('pulsepath:auth-changed'));
      }
    });
  }

  draw();
}
