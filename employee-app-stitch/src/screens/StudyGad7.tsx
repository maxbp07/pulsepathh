import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import StudyBlocked, { blockedMessage } from '../components/StudyBlocked';
import { gad7Index, gad7Severity, scoreGad7, GAD7_ITEM_COUNT } from '../lib/gad7';
import { saveAssessment, APP_VERSION } from '../lib/db';
import { getOrCreateParticipantId } from '../lib/participant';
import { enqueueQuestionnaire } from '../lib/outbox';
import { type StudyTimepoint } from '../lib/studySchedule';
import { useStudyGuard } from '../lib/useStudyGuard';

export default function StudyGad7() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTp = (searchParams.get('tp') as StudyTimepoint) || 'D0';
  const { state, timepoint } = useStudyGuard('GAD7', requestedTp);
  const items = t('study.gad7Items', { returnObjects: true }) as string[];
  const options = t('weekly.dassOptions', { returnObjects: true }) as string[];
  const [answers, setAnswers] = useState<number[]>(Array(GAD7_ITEM_COUNT).fill(-1));
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const allAnswered = answers.every((a) => a >= 0);
  const raw = scoreGad7(answers);
  const severity = gad7Severity(raw);

  const submit = async () => {
    if (!allAnswered || saving || !timepoint) return;
    setSaving(true);
    const takenAt = new Date().toISOString();
    const record = await saveAssessment({
      participantId: getOrCreateParticipantId(),
      instrument: 'GAD7',
      timepoint,
      takenAt,
    });

    await enqueueQuestionnaire({
      client_record_id: record.id,
      instrument: 'GAD7',
      timepoint,
      timestamp: takenAt,
      items: answers.map((value, i) => ({ id: `gad${i + 1}`, value })),
      app_version: APP_VERSION,
    });

    setDone(true);
    setSaving(false);
  };

  if (state === 'done' || state === 'ineligible') {
    return (
      <StudyBlocked
        title={t('study.instruments.GAD7')}
        message={blockedMessage(state, requestedTp, t)}
        onBack={() => navigate('/study')}
      />
    );
  }

  if (state === 'loading' || !timepoint) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <p className="font-body-md text-body-md text-on-surface-variant">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={t('study.instruments.GAD7')} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">{t('study.gad7Body')}</p>
        <p className="font-caption text-caption text-outline-variant">{t('study.notDiagnostic')}</p>

        {items.map((item, i) => (
          <div key={i} className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-md">
            <p className="font-body-md text-body-md text-on-surface mb-sm">{item}</p>
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
            <p className="font-body-md text-body-md">
              {t('study.gad7Score', { raw, index: gad7Index(raw) })} · {t(`study.gad7Severity.${severity}`)}
            </p>
            <button onClick={() => navigate('/study')} className="mt-sm bg-primary text-on-primary font-label-bold rounded-xl py-3">
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
