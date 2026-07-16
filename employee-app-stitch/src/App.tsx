import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import GlobalLayout from './components/GlobalLayout';
import Login from './screens/Login';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import Analytics from './screens/Analytics';
import Settings from './screens/Settings';
import CheckInContext from './screens/CheckInContext';
import CheckInKss from './screens/CheckInKss';
import CheckInPvtIntro from './screens/CheckInPvtIntro';
import CheckInPvt from './screens/CheckInPvt';
import CheckInResult from './screens/CheckInResult';
import WeeklyStress from './screens/WeeklyStress';
import WeeklyWellness from './screens/WeeklyWellness';
import NotificationOptIn from './screens/NotificationOptIn';

/**
 * Routing (HashRouter en main.tsx: subpath-safe).
 *  - Público: /login.
 *  - Autenticado (sin requerir onboarding): /onboarding.
 *  - App core (Header + BottomNav): /, /analytics, /settings.
 *  - Flujos (flow header / bare): /checkin/* y /weekly/*.
 */
export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/login" element={<Login />} />

      {/* Autenticado, pre-onboarding */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />

      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <NotificationOptIn />
          </RequireAuth>
        }
      />

      {/* App core con layout */}
      <Route
        element={
          <RequireAuth requireOnboarded>
            <GlobalLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Daily check-in flow (sin bottom nav; flow header en forms, bare en PVT) */}
      <Route
        path="/checkin/context"
        element={
          <RequireAuth requireOnboarded>
            <CheckInContext />
          </RequireAuth>
        }
      />
      <Route
        path="/checkin/kss"
        element={
          <RequireAuth requireOnboarded>
            <CheckInKss />
          </RequireAuth>
        }
      />
      <Route
        path="/checkin/pvt-intro"
        element={
          <RequireAuth requireOnboarded>
            <CheckInPvtIntro />
          </RequireAuth>
        }
      />
      <Route
        path="/checkin/pvt"
        element={
          <RequireAuth requireOnboarded>
            <CheckInPvt />
          </RequireAuth>
        }
      />
      <Route
        path="/checkin/result"
        element={
          <RequireAuth requireOnboarded>
            <CheckInResult />
          </RequireAuth>
        }
      />

      {/* Weekly flow */}
      <Route
        path="/weekly/stress"
        element={
          <RequireAuth requireOnboarded>
            <WeeklyStress />
          </RequireAuth>
        }
      />
      <Route
        path="/weekly/wellness"
        element={
          <RequireAuth requireOnboarded>
            <WeeklyWellness />
          </RequireAuth>
        }
      />

      {/* Redirects de rutas legacy → nuevas */}
      <Route path="/history" element={<Navigate to="/analytics" replace />} />
      <Route path="/check-in" element={<Navigate to="/checkin/context" replace />} />
      <Route path="/check-in/pvt" element={<Navigate to="/checkin/pvt" replace />} />
      <Route path="/check-in/result" element={<Navigate to="/checkin/result" replace />} />

      {/* Catch-all → Home (el guard rebota a /login si hace falta) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
