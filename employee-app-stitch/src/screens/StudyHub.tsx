import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { getAssessments } from '../lib/db';
import type { AssessmentEntry } from '../lib/types';
import {
  dueTimepoints,
  getStudyDay0,
  instrumentKey,
  isTimepointComplete,
  isTimepointEligible,
  localDateISO,
  studyDay,
  type StudyTimepoint,
} from '../lib/studySchedule';

type InstrumentId = 'DASS21_FULL' | 'GAD7' | 'CBI';

const INSTRUMENTS: { id: InstrumentId; route: string; icon: string; minutes: number }[] = [
  { id: 'DASS21_FULL', route: '/study/dass', icon: 'psychology', minutes: 5 },
  { id: 'GAD7', route: '/study/gad7', icon: 'health_and_safety', minutes: 2 },
  { id: 'CBI', route: '/study/cbi', icon: 'whatshot', minutes: 5 },
];

function recommendedTimepoint(
  day: number | null,
  completed: Set<string>,
): StudyTimepoint {
  const due = dueTimepoints(getStudyDay0(), new Set(
    (['D0', 'D7', 'D14'] as const).filter((tp) => isTimepointComplete(completed, tp)),
  ));
  if (due.length > 0) return due[0];
  if (day === null || day < 7) return 'D0';
  if (day < 14) return 'D7';
  return 'D14';
}

export default function StudyHub() {
  const { t } = useTranslation();
  const [assessments, setAssessments] = useState<AssessmentEntry[]>([]);
  const studyDay0 = getStudyDay0();
  const day = studyDay(studyDay0);

  useEffect(() => {
    getAssessments(100).then(setAssessments);
  }, []);

  const completed = useMemo(
    () => new Set(assessments.map((r) => instrumentKey(r.instrument, r.timepoint))),
    [assessments],
  );

  const timepoint = recommendedTimepoint(day, completed);
  const due = dueTimepoints(studyDay0, new Set(
    (['D0', 'D7', 'D14'] as const).filter((tp) => isTimepointComplete(completed, tp)),
  ));
  const tpEligible = isTimepointEligible(timepoint);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={t('study.title')} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg">
        <section>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('study.body')}</p>
          <p className="font-caption text-caption text-outline-variant mt-sm">
            {t('study.dayInfo', { day: day ?? 0, date: localDateISO() })}
          </p>
          <p className="font-label-bold text-label-bold text-primary mt-sm">
            {t('study.timepoint', { tp: timepoint })}
          </p>
          {due.length > 0 && (
            <p className="font-caption text-caption text-tertiary mt-xs">
              {t('study.dueBanner')}: {due.join(', ')}
            </p>
          )}
          {!tpEligible && (
            <p className="font-caption text-caption text-error mt-xs">
              {t('study.timepointNotEligible', { tp: timepoint })}
            </p>
          )}
        </section>

        <div className="flex flex-col gap-sm">
          {INSTRUMENTS.map((inst) => {
            const done = completed.has(instrumentKey(inst.id, timepoint));
            const disabled = done || !tpEligible;
            const className =
              'flex items-center gap-md p-md bg-surface-container-lowest border border-surface-variant rounded-2xl transition ' +
              (disabled ? 'opacity-60 pointer-events-none' : 'hover:shadow-md active:scale-[0.99]');

            const inner = (
              <>
                <span className="material-symbols-outlined text-primary text-3xl">{inst.icon}</span>
                <div className="flex-grow">
                  <div className="font-body-md text-body-md text-on-surface">
                    {t(`study.instruments.${inst.id}`)}
                  </div>
                  <div className="font-caption text-caption text-outline-variant">
                    {t('study.estMinutes', { n: inst.minutes })}
                  </div>
                </div>
                <span
                  className={`font-caption px-2 py-1 rounded-full ${
                    done ? 'bg-tertiary-container/20 text-tertiary' : 'bg-primary-container/15 text-primary'
                  }`}
                >
                  {done ? t('study.done') : t('study.pending')}
                </span>
              </>
            );

            return disabled ? (
              <div key={inst.id} className={className}>
                {inner}
              </div>
            ) : (
              <Link key={inst.id} to={`${inst.route}?tp=${timepoint}`} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
