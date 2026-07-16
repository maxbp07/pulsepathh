import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { scoreDassStress, dassStressIndex, dassStressSeverity } from '../lib/dass';
import { saveWeekly } from '../lib/db';
import { getOrCreateParticipantId } from '../lib/participant';

function mondayISO(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export default function WeeklyStress() {
  const { t } = useTranslation();
  const items = t('weekly.dassItems', { returnObjects: true }) as string[];
  const options = t('weekly.dassOptions', { returnObjects: true }) as string[];
  const [answers, setAnswers] = useState<number[]>(Array(items.length).fill(-1));
  const [done, setDone] = useState(false);

  const allAnswered = answers.every((a) => a >= 0);

  const submit = async () => {
    const raw = scoreDassStress(answers);
    await saveWeekly({
      participantId: getOrCreateParticipantId(),
      takenAt: new Date().toISOString(),
      weekStart: mondayISO(),
      dassStressRaw: raw,
      dassStressIndex: dassStressIndex(raw),
      sib: 0,
    });
    setDone(true);
  };

  const raw = scoreDassStress(answers);
  const severity = dassStressSeverity(raw);
  const sevKey = severity === 'extremely severe' ? 'extreme' : severity;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={t('weekly.stressTitle')} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg">
        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-xs">
            {t('weekly.stressTitle')}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('weekly.stressBody')}</p>
        </section>

        {items.map((item, i) => (
          <div key={i} className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-md">
            <p className="font-body-md text-body-md text-on-surface mb-sm">{item}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs">
              {options.map((opt, v) => {
                const active = answers[i] === v;
                return (
                  <button
                    key={v}
                    onClick={() => setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)))}
                    className={`text-xs font-label-bold rounded-xl py-2 border transition ${
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface text-on-surface-variant border-surface-variant hover:border-primary'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {done ? (
          <div className="bg-primary-container text-on-primary-container rounded-2xl p-md text-center">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
            <h3 className="font-headline-md text-headline-md mt-xs">{t('weekly.stressSaved')}</h3>
            <p className="font-body-md text-body-md">
              {t('weekly.stressScore', { raw })} · <strong>{t(`weekly.dassSeverity.${sevKey}`)}</strong>
            </p>
          </div>
        ) : (
          <button
            disabled={!allAnswered}
            onClick={submit}
            className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-2xl active:scale-95 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('weekly.saveWeekly')}
          </button>
        )}
      </main>
    </div>
  );
}
