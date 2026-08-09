import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { MicroCheckin } from '../components/MicroCheckin';
import { PvtTest } from '../components/PvtTest';
import { StroopTest } from '../components/StroopTest';
import { CbiTest } from '../components/CbiTest';
import { CheckinResults } from '../components/CheckinResults';
import { initDb, getConfig, setConfig } from '../storage/db';

interface CheckinWizardProps {
  onFinish: () => void;
}

export const CheckinWizard: React.FC<CheckinWizardProps> = ({ onFinish }) => {
  const { t } = useTranslation();
  const [cbiDue, setCbiDue] = useState(false);
  const [cbiScore, setCbiScore] = useState(50);
  
  // Datos temporales de las pruebas
  const [microData, setMicroData] = useState<{ sleepHours: number; stress: string; stimulants: string } | null>(null);
  const [pvtMetrics, setPvtMetrics] = useState<any>(null);
  const [stroopMetrics, setStroopMetrics] = useState<any>(null);

  // Inicialización de la comprobación del CBI semanal
  useEffect(() => {
    const checkCbi = async () => {
      try {
        await initDb();
        const now = new Date();
        if (now.getDay() === 1) {
          setCbiDue(true);
          return;
        }
        const lastCbi = await getConfig('last_cbi_date');
        if (!lastCbi) {
          setCbiDue(true);
          return;
        }
        
        const isoWeekKey = (date: Date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const day = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - day);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          return `${d.getUTCFullYear()}-W${String(Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)).padStart(2, '0')}`;
        };

        setCbiDue(isoWeekKey(now) !== isoWeekKey(new Date(lastCbi as string)));
        const score = await getConfig('last_cbi_score');
        if (score !== null) setCbiScore(Number(score));
      } catch {
        setCbiDue(false);
      }
    };
    checkCbi();
  }, []);

  const stepsList = ['checkin', 'pvt', 'stroop', ...(cbiDue ? ['cbi'] : []), 'results'];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const totalSteps = stepsList.length;
  const currentStepName = stepsList[currentStepIdx];

  const handleMicroComplete = (data: typeof microData) => {
    setMicroData(data);
    setCurrentStepIdx((prev) => prev + 1);
  };

  const handlePvtComplete = (metrics: any) => {
    setPvtMetrics(metrics);
    setCurrentStepIdx((prev) => prev + 1);
  };

  const handleStroopComplete = (metrics: any) => {
    setStroopMetrics(metrics);
    setCurrentStepIdx((prev) => prev + 1);
  };

  const handleCbiComplete = async (score: number) => {
    setCbiScore(score);
    try {
      await setConfig('last_cbi_date', new Date().toISOString());
      await setConfig('last_cbi_score', score);
    } catch {}
    setCurrentStepIdx((prev) => prev + 1);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Header común del paso actual */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h1 className="text-base font-bold text-[#f0f4fc]">
          {currentStepName === 'checkin' && 'Check-in'}
          {currentStepName === 'pvt' && 'PVT-B'}
          {currentStepName === 'stroop' && 'Stroop'}
          {currentStepName === 'cbi' && t('checkin.cbi_step')}
          {currentStepName === 'results' && t('results.title')}
        </h1>
        <span className="text-xs font-semibold text-[#8b9bb8] px-2 py-0.5 rounded-full bg-white/5">
          {currentStepIdx + 1} / {totalSteps}
        </span>
      </div>

      {currentStepName === 'checkin' && <MicroCheckin onComplete={handleMicroComplete} />}
      {currentStepName === 'pvt' && <PvtTest onComplete={handlePvtComplete} />}
      {currentStepName === 'stroop' && <StroopTest onComplete={handleStroopComplete} />}
      {currentStepName === 'cbi' && <CbiTest onComplete={handleCbiComplete} />}
      {currentStepName === 'results' && (
        <CheckinResults
          microData={microData!}
          pvtMetrics={pvtMetrics}
          stroopMetrics={stroopMetrics}
          cbiScore={cbiScore}
          onFinish={onFinish}
        />
      )}
    </div>
  );
};
