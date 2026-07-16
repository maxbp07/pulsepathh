import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportPdf, sessionsInLastDays, buildAiPrompt, openClaude, openChatgpt } from '../lib/export';
import type { DailySession } from '../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  sessions: DailySession[];
}

const MIN_DAYS = 7;
const MAX_DAYS = 90;

/**
 * Modal de exportación: slider de periodo, email (etiqueta del PDF), descarga
 * PDF local (jspdf) y enlaces "Interpret with AI" (Claude ?q= / ChatGPT copiar+
 * abrir) tras consentimiento explícito (los datos salen del dispositivo).
 */
export default function ExportModal({ open, onClose, sessions }: Props) {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const windowed = sessionsInLastDays(sessions, days);

  const handlePdf = () => exportPdf(windowed, { email });

  const handleClaude = () => {
    if (!consent) return;
    openClaude(buildAiPrompt(windowed));
  };

  const handleChatgpt = async () => {
    if (!consent) return;
    const ok = await openChatgpt(buildAiPrompt(windowed));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-on-background/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-md"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl border border-surface-variant shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-md sticky top-0 bg-surface border-b border-surface-variant">
          <h2 className="font-headline-md text-headline-md text-on-background">{t('export.title')}</h2>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-on-surface-variant hover:text-primary active:scale-95 transition"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-md flex flex-col gap-lg">
          {/* Timeframe */}
          <div className="flex flex-col gap-sm">
            <div className="flex justify-between items-center">
              <span className="font-label-bold text-label-bold text-on-surface">{t('export.timeframe')}</span>
              <span className="font-headline-md text-headline-md text-primary">
                {t('export.days', { n: days })}
              </span>
            </div>
            <input
              type="range"
              min={MIN_DAYS}
              max={MAX_DAYS}
              step={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-[#264dd9]"
            />
            <div className="flex justify-between font-caption text-caption text-outline-variant">
              <span>{t('export.days', { n: MIN_DAYS })}</span>
              <span>{t('export.days', { n: MAX_DAYS })}</span>
            </div>
          </div>

          {/* Email */}
          <label className="flex flex-col gap-xs">
            <span className="font-label-bold text-label-bold text-on-surface">{t('export.emailLabel')}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('export.emailPlaceholder')}
              className="w-full bg-surface-container-low rounded-xl px-md py-3 border border-surface-variant focus:border-primary outline-none font-body-md text-body-md text-on-background"
            />
          </label>

          <button
            onClick={handlePdf}
            className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-2xl active:scale-95 transition shadow-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">description</span>
            {t('export.download')}
          </button>

          {/* AI interpretation */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-md flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">smart_toy</span>
              <h3 className="font-label-bold text-label-bold text-on-surface">{t('export.aiTitle')}</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('export.aiBody')}</p>
            <label className="flex items-start gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#264dd9]"
              />
              <span className="font-body-md text-body-md text-on-surface-variant">{t('export.aiConsent')}</span>
            </label>
            <div className="grid grid-cols-2 gap-sm">
              <button
                onClick={handleClaude}
                disabled={!consent}
                className="bg-surface-container-high disabled:opacity-40 text-on-background font-label-bold text-label-bold py-3 rounded-xl active:scale-95 transition flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                {t('export.aiClaude')}
              </button>
              <button
                onClick={handleChatgpt}
                disabled={!consent}
                className="bg-surface-container-high disabled:opacity-40 text-on-background font-label-bold text-label-bold py-3 rounded-xl active:scale-95 transition flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                {t('export.aiChatgpt')}
              </button>
            </div>
            {copied && (
              <p className="font-caption text-caption text-tertiary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {t('export.copied')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
