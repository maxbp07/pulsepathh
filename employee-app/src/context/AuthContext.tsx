import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, clearToken, activateAnonymous } from '../api/client';

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        setAuthenticated(!!token);
      } catch (e) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();

    // Escucha eventos globales para sincronizar múltiples pestañas/flujos
    const handleAuthChange = async () => {
      const token = await getToken();
      setAuthenticated(!!token);
    };
    window.addEventListener('pulsepath:auth-changed', handleAuthChange);
    return () => window.removeEventListener('pulsepath:auth-changed', handleAuthChange);
  }, []);

  const login = async (code: string) => {
    setLoading(true);
    try {
      await activateAnonymous(code, true, '1.0');
      setAuthenticated(true);
      window.dispatchEvent(new CustomEvent('pulsepath:auth-changed'));
    } catch (err) {
      // Fallback demo: si no hay backend o crypto.subtle (HTTP sin HTTPS),
      // aceptar códigos BCN-2026-* y entrar en modo demo offline.
      const isDemo = /^BCN-\d{4}-[A-Z]\d{3}$/i.test(code.trim());
      if (isDemo) {
        localStorage.setItem('pulsepath_token', 'demo-token-offline');
        localStorage.setItem('pulsepath_department', 'Atención Ciudadana');
        localStorage.setItem('pulsepath_shift', 'mañana');
        setAuthenticated(true);
        window.dispatchEvent(new CustomEvent('pulsepath:auth-changed'));
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await clearToken();
      setAuthenticated(false);
      window.dispatchEvent(new CustomEvent('pulsepath:auth-changed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado con AuthProvider');
  return context;
};
