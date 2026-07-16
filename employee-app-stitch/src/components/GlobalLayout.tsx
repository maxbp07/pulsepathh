import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

/**
 * Layout principal (Header arriba, contenido, BottomNav móvil abajo).
 * Envuelve las pantallas "core" (Home, Analytics, Settings).
 */
export default function GlobalLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background relative font-sans antialiased overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-grid-motif" />
      <Header />
      <main className="w-full px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto pt-md pb-[7.5rem] md:pb-lg flex flex-col gap-gutter">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
