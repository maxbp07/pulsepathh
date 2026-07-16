import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';

/**
 * /checkin/pvt-intro — paso 3. Pantalla de transición blanca que explica la
 * mecánica antes del PVT-BA (pantalla negra fullscreen, sin chrome).
 */
export default function CheckInPvtIntro() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface text-on-background">
      <Header variant="flow" title={t('checkin.stepOf', { step: 3, total: 4 })} />
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-margin-mobile gap-lg -mt-16">
        <div className="w-24 h-24 rounded-full bg-error-container/50 text-error flex items-center justify-center shadow-lg shadow-error-container/30">
          <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            touch_app
          </span>
        </div>
        <div className="flex flex-col items-center gap-sm">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
            {t('checkin.pvtIntro.title')}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
            {t('checkin.pvtIntro.body')}
          </p>
        </div>
        <button
          onClick={() => navigate('/checkin/pvt')}
          className="mt-md bg-primary text-on-primary font-label-bold text-label-bold px-xl py-4 rounded-2xl active:scale-95 transition shadow-lg hover:bg-surface-tint flex items-center gap-2"
        >
          {t('checkin.pvtIntro.start')}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </main>
    </div>
  );
}
