import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import StudyBlocked, { blockedMessage } from '../components/StudyBlocked';
import {
  CBI_QUESTIONS,
  CBI_SCALE_ORDER,
  calculateCbiScore,
  cbiValueForApi,
  type CbiScaleKey,
} from '../lib/cbi';
import { saveAssessment, APP_VERSION } from '../lib/db';
import { getOrCreateParticipantId } from '../lib/participant';
import { enqueueQuestionnaire } from '../lib/outbox';
import { type StudyTimepoint } from '../lib/studySchedule';
import { useStudyGuard } from '../lib/useStudyGuard';

export default function StudyCbi() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTp = (searchParams.get('tp') as StudyTimepoint) || 'D0';
  const { state, timepoint } = useStudyGuard('CBI', requestedTp);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CbiScaleKey>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = CBI_QUESTIONS[index];
  const progress = Math.round((index / CBI_QUESTIONS.length) * 100);
  const scaleLabels = t('study.cbiScale', { returnObjects: true }) as Record<CbiScaleKey, string>;

  const pick = async (key: CbiScaleKey) => {
    if (!timepoint) return;
    const next = { ...answers, [q.id]: key };
    setAnswers(next);
    if (index + 1 < CBI_QUESTIONS.length) {
      setIndex(index + 1);
      return;
    }
    if (saving) return;
    setSaving(true);
    const takenAt = new Date().toISOString();
    const record = await saveAssessment({
      participantId: getOrCreateParticipantId(),
      instrument: 'CBI',
      timepoint,
      takenAt,
    });

    await enqueueQuestionnaire({
      client_record_id: record.id,
      instrument: 'CBI',
      timepoint,
      timestamp: takenAt,
      items: CBI_QUESTIONS.map((item) => ({
        id: item.id,
        value: cbiValueForApi(next[item.id] ?? 'sometimes'),
      })),
      app_version: APP_VERSION,
    });

    setDone(true);
    setSaving(false);
  };

  const result = done ? calculateCbiScore(answers) : null;

  if (state === 'done' || state === 'ineligible') {
    return (
      <StudyBlocked
        title={t('study.instruments.CBI')}
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
      <Header variant="flow" title={t('study.instruments.CBI')} />
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col gap-lg">
        {!done ? (
          <>
            <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="font-caption text-caption text-outline-variant">
              {t('study.cbiProgress', { current: index + 1, total: CBI_QUESTIONS.length })}
            </p>
            <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-md">
              <p className="font-body-lg text-body-lg text-on-surface mb-md">
                {t(`study.cbiItems.${q.id}`)}
              </p>
              <div className="flex flex-col gap-xs">
                {CBI_SCALE_ORDER.map((key) => (
                  <button
                    key={key}
                    onClick={() => pick(key)}
                    disabled={saving}
                    className="text-left font-label-bold rounded-xl py-3 px-md border border-surface-variant hover:border-primary hover:bg-primary/5 transition"
                  >
                    {scaleLabels[key]}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-primary-container text-on-primary-container rounded-2xl p-md text-center flex flex-col gap-sm">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
            <h3 className="font-headline-md text-headline-md">{t('study.saved')}</h3>
            {result && (
              <p className="font-body-md text-body-md">
                {t('study.cbiScore', { score: result.globalScore })}
                {result.burnout ? ` · ${t('study.cbiBurnoutFlag')}` : ''}
              </p>
            )}
            <button onClick={() => navigate('/study')} className="mt-sm bg-primary text-on-primary font-label-bold rounded-xl py-3">
              {t('study.backHub')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
