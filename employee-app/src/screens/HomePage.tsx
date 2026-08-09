import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Check, Info, ShieldAlert } from 'lucide-react';
import { initDb, getConfig } from '../storage/db';

interface HomePageProps {
  onStartTest: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartTest }) => {
  const { t } = useTranslation();
  
  const [doneToday, setDoneToday] = useState(false);
  const [cbiPending, setCbiPending] = useState(false);
  const [riskIndex, setRiskIndex] = useState<number | null>(null);

  // Obtener fecha YYYY-MM-DD
  const getTodayKey = () => new Date().toISOString().slice(0, 10);

  // Clave ISO de la semana para comparar CBI pendiente
  const isoWeekKey = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  };

  useEffect(() => {
    const checkStatus = async () => {
      const today = getTodayKey();
      const lastDate = localStorage.getItem('pulsepath_last_test_date');
      const isDone = lastDate === today;
      setDoneToday(isDone);

      if (isDone) {
        const lastRisk = localStorage.getItem('pulsepath_last_risk_index');
        if (lastRisk !== null) setRiskIndex(parseInt(lastRisk, 10));
      }

      // Check CBI
      try {
        await initDb();
        const now = new Date();
        if (now.getDay() === 1) {
          setCbiPending(true);
          return;
        }
        const lastCbi = await getConfig('last_cbi_date');
        if (!lastCbi) {
          setCbiPending(true);
        } else {
          setCbiPending(isoWeekKey(now) !== isoWeekKey(new Date(lastCbi as string)));
        }
      } catch {
        setCbiPending(false);
      }
    };

    checkStatus();
  }, []);

  const getRiskColor = (idx: number | null) => {
    if (idx === null) return 'text-[#8b9bb8]';
    if (idx < 35) return 'text-emerald-400';
    if (idx < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBg = (idx: number | null) => {
    if (idx === null) return 'bg-[#8b9bb8]/10 border-white/5';
    if (idx < 35) return 'bg-emerald-500/10 border-emerald-500/20';
    if (idx < 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getSemaphoreEmoji = (idx: number | null) => {
    if (idx === null) return '⚪';
    if (idx < 35) return '🟢';
    if (idx < 60) return '🟡';
    return '🔴';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      <h1 className="text-xl font-bold tracking-tight text-[#f0f4fc]">
        {t('home.title')}
      </h1>

      <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          
          {/* Indicador de Semáforo */}
          <span className="text-5xl select-none" role="img" aria-hidden="true">
            {getSemaphoreEmoji(doneToday ? riskIndex : null)}
          </span>

          {doneToday ? (
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-wider text-[#8b9bb8]">
                {t('results.risk_index')}
              </span>
              
              {riskIndex !== null && (
                <div className="flex items-baseline justify-center">
                  <span className={`text-6xl font-extrabold tracking-tighter ${getRiskColor(riskIndex)}`}>
                    {riskIndex}
                  </span>
                  <span className="text-sm font-semibold text-[#8b9bb8] ml-1">/100</span>
                </div>
              )}

              <span className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold text-sm pt-2">
                <Check className="w-4 h-4" />
                {t('home.test_done')}
              </span>

              {riskIndex !== null && (
                <div className="pt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBg(riskIndex)} ${getRiskColor(riskIndex)}`}>
                    {riskIndex < 35
                      ? t('home.risk_low') || 'Risc baix'
                      : riskIndex < 60
                      ? t('home.risk_medium') || 'Risc moderat'
                      : t('home.risk_high') || 'Risc alt'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-[#8b9bb8] max-w-[20ch]">
                {t('home.test_pending')}
              </p>
            </div>
          )}

          {/* Badge de CBI Pendiente */}
          {cbiPending && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full mt-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('home.cbi_pending')}</span>
            </div>
          )}

          {/* Acciones de Test */}
          {(!doneToday || cbiPending) && (
            <Button
              className="w-full h-11 text-sm font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-400/90 hover:to-indigo-500/90 text-white mt-4"
              onClick={onStartTest}
            >
              {doneToday ? t('home.continue_weekly') : t('home.start_test')}
            </Button>
          )}

        </CardContent>
      </Card>

      {/* Banner de alerta informativa */}
      {(!doneToday || cbiPending) && (
        <Alert className="bg-amber-950/20 border-amber-500/25 text-amber-300">
          <Info className="h-4 w-4 stroke-amber-400" />
          <AlertDescription className="text-xs">
            {doneToday 
              ? t('home.cbi_reminder') || t('home.cbi_pending') 
              : t('home.daily_reminder') || t('home.test_pending')}
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
};
