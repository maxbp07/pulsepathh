import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearAll, getSessions } from '../lib/db';
import { buildBundle, downloadJson, exportPdf } from '../lib/export';
import { clearAccessCode, getAccessCode, getLang, setLang, type Lang } from '../lib/prefs';
import { APP_VERSION } from '../lib/db';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [lang, setLangState] = useState<Lang>(getLang());
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  const userId = getAccessCode() ?? '—';

  const changeLang = (next: Lang) => {
    setLangState(next);
    setLang(next);
    void i18n.changeLanguage(next);
  };

  const handleJson = async () => downloadJson(await buildBundle());
  const handlePdf = async () => {
    const sessions = await getSessions(90);
    exportPdf(sessions);
  };
  const handleClear = async () => {
    await clearAll();
    setCleared(true);
    setConfirmingClear(false);
  };
  const handleSignOut = () => {
    clearAccessCode();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col gap-gutter">
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
        {t('settings.title')}
      </h1>

      {/* Account */}
      <Section title={t('settings.account')}>
        <div className="px-md py-md flex items-center gap-md border-t border-surface-variant/60">
          <span className="material-symbols-outlined text-primary">badge</span>
          <div className="flex-grow">
            <div className="font-body-md text-body-md text-on-surface">{t('settings.userId')}</div>
            <div className="font-caption text-caption text-outline-variant">{t('settings.userIdHint')}</div>
          </div>
          <span className="font-headline-md text-headline-md text-primary tracking-wider">{userId}</span>
        </div>
      </Section>

      {/* Language */}
      <Section title={t('settings.appearance')}>
        <div className="px-md py-md flex items-center gap-xs border-t border-surface-variant/60">
          <LangBtn active={lang === 'en'} onClick={() => changeLang('en')} label={t('settings.languageEn')} />
          <LangBtn active={lang === 'es'} onClick={() => changeLang('es')} label={t('settings.languageEs')} />
        </div>
      </Section>

      {/* Sign out */}
      <Section title={t('settings.account')}>
        {!confirmingSignOut ? (
          <ActionRow icon="logout" label={t('settings.signOut')} onClick={() => setConfirmingSignOut(true)} />
        ) : (
          <div className="p-md flex flex-col gap-sm">
            <p className="font-body-md text-body-md text-on-surface-variant">{t('settings.signOutConfirm')}</p>
            <div className="flex gap-sm">
              <button
                onClick={handleSignOut}
                className="flex-1 bg-primary text-on-primary font-label-bold text-label-bold rounded-xl py-3 active:scale-95 transition"
              >
                {t('settings.signOut')}
              </button>
              <button
                onClick={() => setConfirmingSignOut(false)}
                className="flex-1 border border-outline text-on-surface-variant font-label-bold text-label-bold rounded-xl py-3"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Data & privacy */}
      <Section title={t('settings.data')}>
        <p className="font-body-md text-body-md text-on-surface-variant px-md pt-md">{t('settings.dataBody')}</p>
        <ActionRow icon="description" label={t('settings.exportPdf')} onClick={handlePdf} />
        <ActionRow icon="download" label={t('settings.exportJson')} onClick={handleJson} />
      </Section>

      {/* Danger zone */}
      <Section title={t('settings.danger')}>
        {!confirmingClear && !cleared && (
          <ActionRow icon="delete" label={t('settings.erase')} danger onClick={() => setConfirmingClear(true)} />
        )}
        {confirmingClear && (
          <div className="p-md flex flex-col gap-sm">
            <p className="font-body-md text-body-md text-error">{t('settings.eraseWarn')}</p>
            <div className="flex gap-sm">
              <button
                onClick={handleClear}
                className="flex-1 bg-error text-on-error font-label-bold text-label-bold rounded-xl py-3 active:scale-95 transition"
              >
                {t('settings.eraseConfirm')}
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                className="flex-1 border border-outline text-on-surface-variant font-label-bold text-label-bold rounded-xl py-3"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
        {cleared && (
          <div className="p-md flex items-center gap-sm text-tertiary">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-body-md text-body-md">{t('settings.erased')}</span>
          </div>
        )}
      </Section>

      <Link to="/" className="text-center font-caption text-caption text-primary">
        {t('nav.home')}
      </Link>
      <p className="font-caption text-caption text-outline-variant text-center pb-sm">
        {t('settings.footer', { v: APP_VERSION })}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
      <h2 className="font-label-bold text-label-bold uppercase tracking-wider text-on-surface-variant px-md pt-md">
        {title}
      </h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function LangBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 font-label-bold text-label-bold rounded-xl py-3 transition border-2 ${
        active ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-on-surface-variant border-surface-variant'
      }`}
    >
      {label}
    </button>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-md px-md py-md hover:bg-surface-container-low transition border-t border-surface-variant/60 text-left w-full"
    >
      <span className={`material-symbols-outlined ${danger ? 'text-error' : 'text-primary'}`}>{icon}</span>
      <span className={`font-body-md text-body-md flex-grow ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</span>
      <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
    </button>
  );
}
