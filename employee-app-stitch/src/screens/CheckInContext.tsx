import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { useCheckin } from '../store';

/**
 * /checkin/context — paso 1 del check-in.
 * Sueño (slider 0-12h), calidad (1-5★), café (sí/no).
 * Son METADATOS: no entran en el FRI validado; alimentan insights/correlaciones.
 */
export default function CheckInContext() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setContext = useCheckin((s) => s.setContext);

  const [sleep, setSleep] = useState(7);
  const [quality, setQuality] = useState(3);
  const [coffee, setCoffee] = useState(false);

  const next = () => {
    setContext({ sleepHours: sleep, quality, coffee });
    navigate('/checkin/kss');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      <Header variant="flow" title={t('checkin.stepOf', { step: 1, total: 4 })} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-gutter">
        <section className="flex flex-col gap-xs text-center md:text-left">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
            {t('checkin.context.title')}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto md:mx-0">
            {t('checkin.context.body')}
          </p>
        </section>

        {/* Sleep duration */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md flex flex-col gap-sm">
          <div className="flex justify-between items-center">
            <span className="font-label-bold text-label-bold text-on-surface">{t('checkin.context.sleep')}</span>
            <span className="font-headline-md text-headline-md text-primary">
              {t('checkin.context.sleepVal', { n: sleep })}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full accent-[#264dd9]"
          />
          <div className="flex justify-between font-caption text-caption text-outline-variant">
            <span>0h</span>
            <span>12h</span>
          </div>
        </div>

        {/* Sleep quality (stars) */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md flex flex-col gap-sm">
          <span className="font-label-bold text-label-bold text-on-surface">{t('checkin.context.quality')}</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = quality >= n;
              return (
                <button
                  key={n}
                  onClick={() => setQuality(n)}
                  aria-label={`${n}`}
                  className="active:scale-90 transition-transform"
                >
                  <span
                    className={`material-symbols-outlined text-4xl ${active ? 'text-primary' : 'text-outline-variant'}`}
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coffee toggle */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md flex items-center justify-between gap-md">
          <span className="font-label-bold text-label-bold text-on-surface">{t('checkin.context.coffee')}</span>
          <div className="flex gap-xs p-xs bg-surface-container-high rounded-xl">
            <button
              onClick={() => setCoffee(true)}
              className={`px-md py-2 rounded-lg font-label-bold text-label-bold transition ${
                coffee ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
              }`}
            >
              {t('checkin.context.yes')}
            </button>
            <button
              onClick={() => setCoffee(false)}
              className={`px-md py-2 rounded-lg font-label-bold text-label-bold transition ${
                !coffee ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
              }`}
            >
              {t('checkin.context.no')}
            </button>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-xl border-t border-surface-variant p-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom))] z-40 shadow-[0px_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:block flex-grow text-on-surface-variant font-body-md text-body-md">
            {t('checkin.stepOf', { step: 1, total: 4 })}
          </div>
          <button
            onClick={next}
            className="w-full md:w-auto flex-grow md:flex-grow-0 bg-primary hover:bg-surface-tint text-on-primary font-label-bold text-label-bold py-4 px-xl rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {t('common.next')}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
