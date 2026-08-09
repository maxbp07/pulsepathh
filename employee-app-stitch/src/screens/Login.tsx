import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isValidAccessCode, setAccessCode, isOnboarded } from '../lib/prefs';


/**
 * /login — Privacy-first. Solo pide un "Access Code" (formato ABC-123).
 * El código SE convierte en la identidad del participante (sin contraseña,
 * pseudónimo local). La activación en servidor ocurre tras el consentimiento. Si el dispositivo ya está onboarding-do, va a Home.
 */
export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!isValidAccessCode(normalized)) {
      setError(true);
      return;
    }
    setLoading(true);
    setAccessCode(normalized);
    setLoading(false);
    navigate(isOnboarded() ? '/' : '/onboarding', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-margin-mobile">
      <form
        onSubmit={submit}
        className="w-full max-w-md flex flex-col items-center gap-md"
      >
        <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg shadow-primary-container/30">
          <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            monitor_heart
          </span>
        </div>

        <div className="text-center flex flex-col gap-xs">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
            {t('login.title')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
            {t('login.subtitle')}
          </p>
        </div>

        <div className="w-full bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md flex flex-col gap-sm mt-sm">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(false);
            }}
            placeholder={t('login.placeholder')}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            className={`w-full text-center font-headline-md text-headline-md tracking-[0.2em] bg-surface rounded-xl px-md py-4 border-2 outline-none transition ${
              error
                ? 'border-error text-error'
                : 'border-surface-variant focus:border-primary text-on-background'
            }`}
          />
          {error && (
            <p className="font-caption text-caption text-error text-center">{t('login.error')}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-2xl active:scale-95 transition shadow-lg hover:bg-surface-tint disabled:opacity-60"
          >
            {loading ? t('common.loading') : t('login.button')}
          </button>
        </div>

        <p className="font-caption text-caption text-outline-variant text-center max-w-xs flex items-center gap-1 justify-center">
          <span className="material-symbols-outlined text-sm">lock</span>
          {t('login.privacy')}
        </p>
      </form>
    </div>
  );
}
