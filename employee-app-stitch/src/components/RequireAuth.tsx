import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAccessCode, isOnboarded } from '../lib/prefs';

/**
 * Guard de autenticación/onboarding basado en prefs síncronas (localStorage).
 *  - Sin código de acceso → /login.
 *  - Con código pero sin onboarding (y requireOnboarded) → /onboarding.
 * Las prefs se leen en cada render, así que Sign Out (que borra el código)
 * rebotá al instante a /login.
 */
interface Props {
  children: ReactNode;
  requireOnboarded?: boolean;
}

export default function RequireAuth({ children, requireOnboarded = false }: Props) {
  const code = getAccessCode();
  if (!code) return <Navigate to="/login" replace />;
  if (requireOnboarded && !isOnboarded()) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
