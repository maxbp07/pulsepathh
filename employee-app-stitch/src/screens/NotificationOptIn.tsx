import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  requestNotificationPermission,
  setRemindersEnabled,
  subscribeToPush,
} from '../lib/notifications';

/**
 * /notifications — Opt-in de recordatorios Web Push.
 */
export default function NotificationOptIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const finish = (enable: boolean) => {
    setRemindersEnabled(enable);
    navigate('/', { replace: true });
  };

  const handleAllow = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      await subscribeToPush();
      finish(true);
    } else {
      finish(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-surface flex items-center justify-center">
      <div className="absolute inset-0 z-0 flex flex-col filter blur-[6px] pointer-events-none select-none opacity-40">
        <header className="w-full flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-xl">monitor_heart</span>
            </div>
            <span className="font-semibold text-sm text-on-surface">PulsePath</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-outline-variant" />
        </header>
        <main className="flex-1 p-6 grid grid-cols-1 gap-6 max-w-md mx-auto w-full">
          <div className="bg-surface-container border border-surface-variant rounded-3xl p-6 h-48" />
          <div className="bg-surface-container border border-surface-variant rounded-3xl p-6 h-40" />
        </main>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10 grid-pattern opacity-30" />

      <div className="relative z-20 w-full max-w-sm mx-4 modal-animate">
        <div className="glass-panel rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              notifications_active
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-background">{t('notifications.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('notifications.body')}</p>
          <button
            type="button"
            onClick={() => void handleAllow()}
            className="w-full bg-primary text-on-primary font-label-bold py-4 rounded-2xl shadow-lg active:scale-95 transition"
          >
            {t('notifications.allow')}
          </button>
          <button
            type="button"
            onClick={() => finish(false)}
            className="font-caption text-caption text-outline hover:text-on-surface-variant transition"
          >
            {t('notifications.later')}
          </button>
        </div>
      </div>
    </div>
  );
}
