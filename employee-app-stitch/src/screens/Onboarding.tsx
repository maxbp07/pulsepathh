import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setOnboarded } from '../lib/prefs';

/**
 * Onboarding (3 slides explicativos del PVT-BA) + consentimiento.
 * Persiste el flag "onboarded" en localStorage y va a Home.
 */
export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [agree, setAgree] = useState(false);

  const slides: { icon: string; title: string; body: string }[] = [
    { icon: 'biotech', title: t('onboarding.slide1Title'), body: t('onboarding.slide1Body') },
    { icon: 'lock', title: t('onboarding.slide2Title'), body: t('onboarding.slide2Body') },
    { icon: 'insights', title: t('onboarding.slide3Title'), body: t('onboarding.slide3Body') },
  ];

  const isLast = slide === slides.length - 1;

  const next = () => {
    if (!isLast) {
      setSlide((s) => s + 1);
      return;
    }
    if (!agree) return;
    setOnboarded();
    navigate('/notifications', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-margin-mobile">
      <div className="w-full max-w-lg flex flex-col gap-lg">
        <div className="flex flex-col items-center text-center gap-sm">
          <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg shadow-primary-container/30">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              monitor_heart
            </span>
          </div>
          {slide === 0 && (
            <>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mt-sm">
                {t('onboarding.title')}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">{t('onboarding.subtitle')}</p>
            </>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md min-h-[160px]">
          <Feature icon={slides[slide].icon} title={slides[slide].title}>
            {slides[slide].body}
          </Feature>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-primary' : 'w-2 bg-surface-variant'}`}
            />
          ))}
        </div>

        {isLast && (
          <label className="flex items-start gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 w-5 h-5 accent-[#264dd9]"
            />
            <span className="font-body-md text-body-md text-on-surface-variant">{t('onboarding.consent')}</span>
          </label>
        )}

        <button
          onClick={next}
          disabled={isLast && !agree}
          className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-2xl active:scale-95 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLast ? t('onboarding.getStarted') : t('common.next')}
        </button>
      </div>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-sm h-full">
      <span className="material-symbols-outlined text-primary mt-1">{icon}</span>
      <div>
        <div className="font-headline-md text-headline-md text-on-surface mb-xs">{title}</div>
        <p className="font-body-md text-body-md text-on-surface-variant">{children}</p>
      </div>
    </div>
  );
}
