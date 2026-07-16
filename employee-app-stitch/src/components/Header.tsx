import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Header compartido y UNIFICADO: el logo es SIEMPRE monitor_heart + wordmark
 * "PulsePath", idéntico en todas las pantallas.
 *
 * variant="main"  → TopAppBar del dashboard (brand + nav desktop + account).
 * variant="flow"  → cabecera de tarea (back + brand + subtítulo), para el
 *                   check-in. El subtítulo `title` suele llevar "Step X of 4".
 */
interface HeaderProps {
  variant?: 'main' | 'flow';
  title?: string;
}

function BrandMark() {
  return (
    <Link
      to="/"
      className="flex items-center gap-xs cursor-pointer hover:scale-95 duration-100 transition-transform"
    >
      <span
        className="material-symbols-outlined text-primary"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        monitor_heart
      </span>
      <span className="font-headline-md text-headline-md font-bold text-primary">PulsePath</span>
    </Link>
  );
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'font-caption text-caption flex flex-col items-center justify-center px-5 py-1 transition-colors',
    isActive
      ? 'text-primary font-bold bg-primary-container text-on-primary-container rounded-2xl'
      : 'text-on-surface-variant hover:text-primary',
  ].join(' ');

export default function Header({ variant = 'main', title }: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (variant === 'flow') {
    return (
      <header className="fixed top-0 w-full z-50 shadow-sm bg-surface/90 backdrop-blur-md flex justify-between items-center px-margin-mobile h-16">
        <button
          aria-label={t('common.back')}
          onClick={() => navigate(-1)}
          className="text-on-surface-variant hover:text-primary active:scale-95 transition"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <BrandMark />
          {title && (
            <span className="font-label-bold text-caption tracking-widest uppercase opacity-70 -mt-1">
              {title}
            </span>
          )}
        </div>
        <span className="w-6" />
      </header>
    );
  }

  return (
    <header className="bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 max-w-[1440px] mx-auto">
        <BrandMark />
        <nav className="hidden md:flex items-center gap-md">
          <NavLink to="/" className={navItemClass} end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/analytics" className={navItemClass}>
            {t('nav.analytics')}
          </NavLink>
          <NavLink to="/settings" className={navItemClass}>
            {t('nav.settings')}
          </NavLink>
        </nav>
        <Link
          to="/settings"
          className="hover:scale-95 duration-100 transition-transform hover:text-primary text-on-surface-variant"
        >
          <span className="material-symbols-outlined">account_circle</span>
        </Link>
      </div>
    </header>
  );
}
