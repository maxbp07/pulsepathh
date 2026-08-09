import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';

/** Consentimiento informado v1.0 (resumen in-app). */
export default function ConsentInfo() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header variant="flow" title={t('consent.title')} />
      <main className="pt-24 pb-16 px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto flex flex-col gap-md">
        <p className="font-caption text-caption text-outline-variant">{t('consent.version')}</p>
        {(t('consent.sections', { returnObjects: true }) as string[]).map((section, i) => (
          <p key={i} className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">
            {section}
          </p>
        ))}
        <Link to="/onboarding" className="mt-md text-primary font-label-bold underline">
          {t('consent.back')}
        </Link>
      </main>
    </div>
  );
}
