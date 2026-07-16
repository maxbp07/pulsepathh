import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Bottom Navigation Bar UNIFICADA (mobile only). Símbolos monocromáticos:
 * home / bar_chart (analytics) / settings. Estado activo = pill primary.
 */
function itemClass({ isActive }: { isActive: boolean }) {
  return [
    'flex flex-col items-center justify-center active:scale-90 duration-200 transition-all',
    isActive
      ? 'bg-primary text-on-primary rounded-2xl px-5 py-1.5'
      : 'text-on-surface-variant px-5 py-1 hover:bg-surface-container-high',
  ].join(' ');
}

export default function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-2 z-50 rounded-t-xl bg-surface-container-lowest border-t border-surface-variant shadow-[0px_-4px_20px_rgba(0,0,0,0.05)]">
      <NavLink to="/" className={itemClass} end>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
          home
        </span>
        <span className="font-label-bold text-caption">{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/analytics" className={itemClass}>
        <span className="material-symbols-outlined mb-1">bar_chart</span>
        <span className="font-caption text-caption">{t('nav.analytics')}</span>
      </NavLink>
      <NavLink to="/settings" className={itemClass}>
        <span className="material-symbols-outlined mb-1">settings</span>
        <span className="font-caption text-caption">{t('nav.settings')}</span>
      </NavLink>
    </nav>
  );
}
