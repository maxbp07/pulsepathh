import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCheckin } from '../store';
import { bandMeta } from '../lib/fri';
import { categoryMeta } from '../lib/pvtBa';

/** /checkin/result — resumen: Vitality + Mean RT + Lapses + Fastest 10%. */
export default function CheckInResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fri = useCheckin((s) => s.fri);
  const pvt = useCheckin((s) => s.pvt);
  const kss = useCheckin((s) => s.kss);
  const reset = useCheckin((s) => s.reset);

  // Si alguien entra directo sin datos, vuelve a Home.
  useEffect(() => {
    if (!fri || !pvt) navigate('/', { replace: true });
  }, [fri, pvt, navigate]);

  if (!fri || !pvt) return null;

  const meta = bandMeta(fri.band);
  const cat = pvt.category ? categoryMeta(pvt.category) : null;
  const durationSec = Math.round(pvt.durationMs / 1000);
  const headline =
    fri.band === 'optimal'
      ? t('checkin.result.headlineOptimal')
      : fri.band === 'moderate'
        ? t('checkin.result.headlineModerate')
        : t('checkin.result.headlineHigh');

  const goHome = () => {
    reset();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4">
      <main className="w-full max-w-lg mx-auto bg-surface-container-lowest rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-container-high overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary-container/10 to-transparent pointer-events-none" />
        <div className="p-8 relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4 shadow-lg shadow-primary-container/20">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-2">{t('checkin.result.title')}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('checkin.result.recorded')}</p>
          </div>

          <div className="bg-primary-container rounded-2xl p-6 mb-8 text-on-primary-container relative overflow-hidden shadow-lg shadow-primary-container/30">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="font-caption text-caption text-on-primary-container/80 uppercase tracking-wider mb-1">
                  {t('checkin.result.current')}
                </p>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile">{headline}</h2>
                <p className="font-caption text-caption text-on-primary-container/80 mt-1">
                  {t('checkin.result.fri', { n: fri.fri })}
                </p>
                {cat && (
                  <p className="font-caption text-caption text-on-primary-container/80 mt-1">
                    {t('checkin.pvt.timerLabel')}: <strong>{pvt.category}</strong> · {cat.label} ·{' '}
                    {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
                    {pvt.stoppedEarly ? '' : ''}
                  </p>
                )}
              </div>
              <div className="bg-on-primary-container text-primary-container px-4 py-2 rounded-full font-label-bold text-label-bold flex items-center gap-1 shadow-sm shrink-0">
                <span className="material-symbols-outlined text-sm">bolt</span> {meta.label}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <MetricCard
              icon="timer"
              iconClass="text-primary"
              label={t('checkin.result.meanRt')}
              value={`${pvt.meanRt}`}
              unit="ms"
              barPct={Math.max(10, Math.min(100, ((pvt.meanRt - 200) / 4)))}
            />
            <MetricCard
              icon="warning"
              iconClass="text-error"
              label={t('checkin.result.lapses')}
              value={`${pvt.lapses}`}
              barPct={Math.max(0, Math.min(100, 100 - pvt.lapses * 15))}
            />
            <MetricCard
              icon="speed"
              iconClass="text-tertiary"
              label={t('checkin.result.fastest10')}
              value={`${pvt.fastest10}`}
              unit="ms"
              barPct={Math.max(10, Math.min(100, 100 - Math.max(0, (pvt.fastest10 - 200) / 3)))}
            />
            <MetricCard
              icon="block"
              iconClass="text-outline"
              label={t('checkin.result.falseStarts')}
              value={`${pvt.falseStarts}`}
              barPct={Math.max(0, 100 - pvt.falseStarts * 20)}
            />
          </div>

          <button
            onClick={goHome}
            className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-2xl hover:bg-surface-tint active:scale-95 transition-all shadow-lg"
          >
            {t('checkin.result.done')}
          </button>
          <p className="text-center font-caption text-caption text-outline-variant mt-4">
            {t('checkin.result.savedLocally')}
          </p>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  icon,
  iconClass,
  label,
  value,
  unit,
  barPct,
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: string;
  unit?: string;
  barPct: number;
}) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-surface-container-high">
      <div className="flex items-center text-on-surface-variant mb-2">
        <span className={`material-symbols-outlined text-sm mr-2 ${iconClass}`}>{icon}</span>
        <span className="font-caption text-caption">{label}</span>
      </div>
      <div className="flex items-baseline">
        <span className="font-headline-md text-headline-md text-on-surface mr-1">{value}</span>
        {unit && <span className="font-caption text-caption text-on-surface-variant">{unit}</span>}
      </div>
      <div className="mt-2 w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
        <div className="bg-tertiary h-full rounded-full" style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}
