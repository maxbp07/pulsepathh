import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { sibLevel, sibIndex } from '../lib/sib';
import { saveWeekly } from '../lib/db';
import { getOrCreateParticipantId } from '../lib/participant';
import { localDateISO } from '../lib/studySchedule';

function mondayISO(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return localDateISO(d);
}

export default function WeeklyWellness() {
  const { t } = useTranslation();
  const labels = t('weekly.sibLabels', { returnObjects: true }) as string[];
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (value: number) => {
    setSelected(value);
    await saveWeekly({
      participantId: getOrCreateParticipantId(),
      takenAt: new Date().toISOString(),
      weekStart: mondayISO(),
      dassStressRaw: 0,
      dassStressIndex: 0,
      sib: value,
    });
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={t('weekly.burnoutBadge')} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg">
        <section>
          <span className="inline-flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              whatshot
            </span>
            <span className="font-label-bold text-label-bold tracking-widest uppercase opacity-80">
              {t('weekly.burnoutBadge')}
            </span>
          </span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-sm">
            {t('weekly.burnoutTitle')}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">{t('weekly.burnoutBody')}</p>
        </section>

        <section className="flex flex-col gap-sm">
          {labels.map((label, i) => {
            const value = i + 1;
            const active = selected === value;
            return (
              <button
                key={value}
                disabled={done}
                onClick={() => submit(value)}
                className={`w-full text-left rounded-2xl p-4 md:p-6 flex items-center gap-4 transition-all border ${
                  active
                    ? 'bg-primary-container border-primary shadow-[0px_10px_30px_rgba(38,77,217,0.15)]'
                    : 'bg-surface border-surface-variant hover:border-outline-variant disabled:opacity-60'
                }`}
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-surface-container-low text-on-surface flex items-center justify-center font-headline-md border border-surface-variant">
                  {value}
                </div>
                <span className="font-body-lg text-body-lg text-on-surface font-medium">{label}</span>
              </button>
            );
          })}
        </section>

        {done && selected != null && (
          <div className="bg-primary-container text-on-primary-container rounded-2xl p-md text-center">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
            <h3 className="font-headline-md text-headline-md mt-xs">
              {t('weekly.burnoutSaved')} · {t(`weekly.sibLevel.${sibLevel(selected)}`)}
            </h3>
            <p className="font-body-md text-body-md">{t('weekly.burnoutIndex', { n: sibIndex(selected) })}</p>
          </div>
        )}
      </main>
    </div>
  );
}
