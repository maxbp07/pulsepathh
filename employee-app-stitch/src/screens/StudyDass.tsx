import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import {
  scoreDassFull,
  dassSubscaleSeverity,
  dassSubscaleIndex,
  type DassSubscale,
} from '../lib/dass';
import { hasAssessment, saveAssessment } from '../lib/db';
import { getOrCreateParticipantId } from '../lib/participant';
import { enqueueQuestionnaire } from '../lib/outbox';
import { isTimepointEligible, type StudyTimepoint } from '../lib/studySchedule';
import { APP_VERSION } from '../lib/db';

const ITEM_COUNT = 21;

export default function StudyDass() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTp = (searchParams.get('tp') as StudyTimepoint) || 'D0';
  const [timepoint, setTimepoint] = useState<StudyTimepoint | null>(null);
  const [blocked, setBlocked] = useState<'done' | 'ineligible' | null>(null);
  const items = t('study.dassFullItems', { returnObjects: true }) as string[];
  const options = t('weekly.dassOptions', { returnObjects: true }) as string[];
  const [answers, setAnswers] = useState<number[]>(Array(ITEM_COUNT).fill(-1));
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      if (await hasAssessment('DASS21_FULL', requestedTp)) {
        setBlocked('done');
        return;
      }
      if (!isTimepointEligible(requestedTp)) {
        setBlocked('ineligible');
        return;
      }
      setTimepoint(requestedTp);
    })();
  }, [requestedTp]);

  const allAnswered = answers.every((a) => a >= 0);
  const scores = scoreDassFull(answers);

  const submit = async () => {
    if (!allAnswered || saving || !timepoint) return;
    setSaving(true);
    const takenAt = new Date().toISOString();
    const record = await saveAssessment({
      participantId: getOrCreateParticipantId(),
      instrument: 'DASS21_FULL',
      timepoint,
      takenAt,
    });

    const itemsPayload = answers.map((value, i) => ({
      id: `dass_${i + 1}`,
      value,
    }));

    await enqueueQuestionnaire({
      client_record_id: record.id,
      instrument: 'DASS21_FULL',
      timepoint,
      timestamp: takenAt,
      items: itemsPayload,
      app_version: APP_VERSION,
    });

    setDone(true);
    setSaving(false);
  };

  if (blocked === 'done') {
    return (
      <BlockedView
        title={t('study.instruments.DASS21_FULL')}
        message={t('study.alreadyDone', { tp: requestedTp })}
        onBack={() => navigate('/study')}
        backLabel={t('study.backHub')}
      />
    );
  }

  if (blocked === 'ineligible') {
    return (
      <BlockedView
        title={t('study.instruments.DASS21_FULL')}
        message={t('study.timepointNotEligible', { tp: requestedTp })}
        onBack={() => navigate('/study')}
        backLabel={t('study.backHub')}
      />
    );
  }

  if (!timepoint) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <p className="font-body-md text-body-md text-on-surface-variant">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={t('study.instruments.DASS21_FULL')} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">{t('study.dassFullBody')}</p>
        <p className="font-caption text-caption text-outline-variant">{t('study.notDiagnostic')}</p>

        {items.map((item, i) => (
          <div key={i} className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-md">
            <p className="font-body-md text-body-md text-on-surface mb-sm">
              {i + 1}. {item}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs">
              {options.map((opt, v) => (
                <button
                  key={v}
                  onClick={() => setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)))}
                  className={`text-xs font-label-bold rounded-xl py-2 border transition ${
                    answers[i] === v
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-on-surface-variant border-surface-variant hover:border-primary'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {done ? (
          <div className="bg-primary-container text-on-primary-container rounded-2xl p-md text-center flex flex-col gap-sm">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
            <h3 className="font-headline-md text-headline-md">{t('study.saved')}</h3>
            {(['depression', 'anxiety', 'stress'] as DassSubscale[]).map((sub) => {
              const raw = scores[sub];
              const sev = dassSubscaleSeverity(sub, raw);
              const sevKey = sev === 'extremely severe' ? 'extreme' : sev;
              return (
                <p key={sub} className="font-body-md text-body-md">
                  {t(`study.dassSubscales.${sub}`)}: {raw}/21 · {t(`weekly.dassSeverity.${sevKey}`)} ·{' '}
                  {dassSubscaleIndex(raw)}/100
                </p>
              );
            })}
            <button
              onClick={() => navigate('/study')}
              className="mt-sm bg-primary text-on-primary font-label-bold rounded-xl py-3"
            >
              {t('study.backHub')}
            </button>
          </div>
        ) : (
          <button
            disabled={!allAnswered || saving}
            onClick={submit}
            className="w-full bg-primary text-on-primary font-label-bold py-4 rounded-2xl disabled:opacity-40"
          >
            {saving ? t('common.loading') : t('weekly.saveWeekly')}
          </button>
        )}
      </main>
    </div>
  );
}

function BlockedView({
  title,
  message,
  onBack,
  backLabel,
}: {
  title: string;
  message: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={title} />
      <main className="pt-24 px-margin-mobile max-w-lg mx-auto flex flex-col gap-md">
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        <button onClick={onBack} className="bg-primary text-on-primary font-label-bold py-3 rounded-xl">
          {backLabel}
        </button>
      </main>
    </div>
  );
}
