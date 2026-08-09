import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { calculatePvtIndex, calculateStroopIndex, calculateRiskIndex } from '../tests/risk_engine';
import { saveSession } from '../storage/db';
import { submitSession } from '../api/client';

interface CheckinResultsProps {
  microData: { sleepHours: number; stress: string; stimulants: string };
  pvtMetrics: any;
  stroopMetrics: any;
  cbiScore: number;
  onFinish: () => void;
}

export const CheckinResults: React.FC<CheckinResultsProps> = ({
  microData,
  pvtMetrics,
  stroopMetrics,
  cbiScore,
  onFinish,
}) => {
  const { t } = useTranslation();
  const [risk, setRisk] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<any>({ pvt: 0, stroop: 0, cbi: 0, sleep: 0 });

  useEffect(() => {
    const pvtIdx = calculatePvtIndex(pvtMetrics);
    const stroopIdx = calculateStroopIndex(stroopMetrics);
    const { riskIndex, breakdown: b } = calculateRiskIndex({
      pvtIndex: pvtIdx,
      stroopIndex: stroopIdx,
      cbiScore,
      sleepHours: microData.sleepHours,
    });

    setRisk(riskIndex);
    setBreakdown(b);

    // Persistir localmente
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('pulsepath_last_test_date', today);
    localStorage.setItem('pulsepath_last_risk_index', String(riskIndex));

    const takenAt = new Date().toISOString();
    const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    saveSession({
      id: sessionId,
      takenAt,
      riskIndex,
      pvtIndex: pvtIdx,
      stroopIndex: stroopIdx,
      cbiScore,
      sleepHours: microData.sleepHours,
      pvtMetrics,
      stroopMetrics,
    }).catch(() => {});

    // Enviar a la API bajo reglas de privacidad estrictas (exclusividad de campos de sesión)
    submitSession({
      timestamp: takenAt,
      risk_index: riskIndex,
      pvt_index: pvtIdx,
      stroop_index: stroopIdx,
      cbi_score: cbiScore,
      sleep_hours: microData.sleepHours,
    }).catch(() => {});

  }, [microData, pvtMetrics, stroopMetrics, cbiScore]);

  const riskColor = (idx: number) => {
    if (idx < 35) return 'text-[#4ade80]';
    if (idx < 60) return 'text-[#facc15]';
    return 'text-[#f87171]';
  };

  const riskSemaphore = (idx: number) => {
    if (idx < 35) return '🟢';
    if (idx < 60) return '🟡';
    return '🔴';
  };

  const components = [
    { label: 'PVT', weight: '40%', value: breakdown.pvt, raw: breakdown.pvt * 2.5 },
    { label: 'Stroop', weight: '25%', value: breakdown.stroop, raw: breakdown.stroop * 4 },
    { label: 'CBI', weight: '25%', value: breakdown.cbi, raw: breakdown.cbi * 4 },
    { label: '💤', weight: '10%', value: breakdown.sleep, raw: breakdown.sleep * 10 },
  ];

  return (
    <div className="space-y-4">
      
      {/* Tarjeta de Riesgo Principal */}
      <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-2">
          <span className="text-4xl select-none" role="img" aria-hidden="true">
            {riskSemaphore(risk)}
          </span>
          <p className="text-xs uppercase font-bold tracking-wider text-[#8b9bb8]">
            {t('results.risk_index')}
          </p>
          <div className="flex items-baseline justify-center">
            <span className={`text-6xl font-extrabold tracking-tighter ${riskColor(risk)}`}>
              {risk}
            </span>
            <span className="text-sm font-semibold text-[#8b9bb8] ml-1">/100</span>
          </div>
        </CardContent>
      </Card>

      {/* Desglose */}
      <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-[10px] font-bold text-[#8b9bb8] tracking-widest uppercase border-b border-white/5 pb-2">
            {t('results.breakdown')}
          </h3>

          <div className="space-y-3">
            {components.map(({ label, weight, value, raw }) => (
              <div key={label} className="grid grid-cols-[3.5rem_1fr_2rem] items-center gap-3">
                <span className="text-xs font-semibold text-[#f0f4fc]">
                  {label} <span className="text-[9px] text-[#8b9bb8] ml-0.5">{weight}</span>
                </span>
                <Progress value={Math.min(raw, 100)} className="h-1.5 bg-[#07090f] [&>div]:bg-[#22d3ee]" />
                <span className={`text-right text-xs font-bold ${riskColor(raw)}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs font-semibold text-[#f0f4fc]">
            <span>Total</span>
            <span className={riskColor(risk)}>{risk} / 100</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onFinish}
        variant="ghost"
        className="w-full h-11 text-sm font-bold border border-white/10 hover:bg-white/5 text-[#f0f4fc]"
      >
        {t('common.back')}
      </Button>

    </div>
  );
};
