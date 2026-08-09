import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAccessCode, hasConsent, isOnboarded } from '../lib/prefs';

/**
 * Guard de autenticación/onboarding/consentimiento (localStorage).
 *  - Sin código de acceso → /login.
 *  - Con código pero sin consentimiento/onboarding (requireOnboarded) → /onboarding.
 * Ninguna ruta de estudio (check-in, weekly, study) es accesible sin consentimiento.
 */
interface Props {
  children: ReactNode;
  requireOnboarded?: boolean;
}

export default function RequireAuth({ children, requireOnboarded = false }: Props) {
  const code = getAccessCode();
  if (!code) return <Navigate to="/login" replace />;
  if (requireOnboarded && (!isOnboarded() || !hasConsent())) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}
