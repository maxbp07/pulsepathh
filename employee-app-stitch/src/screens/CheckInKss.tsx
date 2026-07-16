import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { useCheckin } from '../store';

/** /checkin/kss — Karolinska Sleepiness Scale (1-9). Paso 2 del check-in. */
export default function CheckInKss() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setKss = useCheckin((s) => s.setKss);
  const [selected, setSelected] = useState<number | null>(null);

  const labels = t('checkin.kss.labels', { returnObjects: true }) as string[];

  const continue_ = () => {
    if (selected == null) return;
    setKss(selected);
    navigate('/checkin/pvt-intro');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      <Header variant="flow" title={t('checkin.stepOf', { step: 2, total: 4 })} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg">
        <section className="flex flex-col gap-xs text-center md:text-left mt-sm">
          <div className="inline-flex items-center justify-center md:justify-start gap-2 text-primary mb-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              vital_signs
            </span>
            <span className="font-label-bold text-label-bold tracking-widest uppercase opacity-80">
              {t('checkin.flowTitle')}
            </span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
            {t('checkin.kss.title')}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto md:mx-0">
            {t('checkin.kss.body')}
          </p>
        </section>

        <section className="flex flex-col gap-sm">
          {labels.map((label, i) => {
            const value = i + 1;
            const isActive = selected === value;
            return (
              <button
                key={value}
                onClick={() => setSelected(value)}
                className={`group w-full text-left rounded-2xl p-4 md:p-6 flex items-center gap-4 transition-all duration-200 relative overflow-hidden border ${
                  isActive
                    ? 'bg-primary-container border-primary shadow-[0px_10px_30px_rgba(38,77,217,0.15)]'
                    : 'bg-surface border-surface-variant hover:shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:border-outline-variant'
                }`}
              >
                <div
                  className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-headline-md text-headline-md shadow-sm border ${
                    isActive
                      ? 'bg-primary text-on-primary border-primary shadow-md'
                      : 'bg-surface-container-low text-on-surface border-surface-variant'
                  }`}
                >
                  {value}
                </div>
                <div className="flex-grow">
                  <span
                    className={`font-body-lg text-body-lg ${
                      isActive ? 'font-bold text-on-primary-fixed-variant' : 'font-medium text-on-surface'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                <div
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isActive ? 'border-primary' : 'border-outline-variant'
                  }`}
                >
                  {isActive && <div className="w-3 h-3 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-xl border-t border-surface-variant p-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom))] z-40 shadow-[0px_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:block flex-grow text-on-surface-variant font-body-md text-body-md">
            {t('checkin.stepOf', { step: 2, total: 4 })}
          </div>
          <button
            disabled={selected == null}
            onClick={continue_}
            className="w-full md:w-auto flex-grow md:flex-grow-0 bg-primary hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed text-on-primary font-label-bold text-label-bold py-4 px-xl rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {t('common.next')}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
