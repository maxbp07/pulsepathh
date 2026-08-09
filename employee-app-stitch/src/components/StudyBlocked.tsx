import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import type { StudyTimepoint } from '../lib/studySchedule';

export default function StudyBlocked({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={title} />
      <main className="pt-24 px-margin-mobile max-w-lg mx-auto flex flex-col gap-md">
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        <button onClick={onBack} className="bg-primary text-on-primary font-label-bold py-3 rounded-xl">
          {t('study.backHub')}
        </button>
      </main>
    </div>
  );
}

export function blockedMessage(
  state: 'done' | 'ineligible',
  tp: StudyTimepoint,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  return state === 'done'
    ? t('study.alreadyDone', { tp })
    : t('study.timepointNotEligible', { tp });
}
