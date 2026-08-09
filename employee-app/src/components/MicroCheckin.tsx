import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export const MicroCheckin: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const { t, language } = useTranslation();
  const [sleepHours, setSleepHours] = useState('');
  const [stress, setStress] = useState('medium');
  const [stimulants, setStimulants] = useState('no');

  const stressLabels: Record<string, { low: string; medium: string; high: string }> = {
    ca: { low: 'Baix', medium: 'Mitjà', high: 'Alt' },
    es: { low: 'Bajo', medium: 'Medio', high: 'Alto' },
    en: { low: 'Low', medium: 'Medium', high: 'High' },
  };
  const currentStressLabels = stressLabels[language] ?? stressLabels.en;

  const yesLabel = { ca: 'Sí', es: 'Sí', en: 'Yes' }[language] ?? 'Sí';

  const handleNext = () => {
    const hrs = parseFloat(sleepHours);
    onComplete({
      sleepHours: Number.isNaN(hrs) ? 7 : Math.min(12, Math.max(0, hrs)),
      stress,
      stimulants,
    });
  };

  return (
    <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md">
      <CardContent className="p-6 space-y-4">
        
        {/* Horas de Sueño */}
        <div className="space-y-1.5">
          <label htmlFor="sleep-input" className="text-xs font-semibold text-[#8b9bb8]">
            {t('checkin.sleep_label')}
          </label>
          <Input
            id="sleep-input"
            type="number"
            min="0"
            max="12"
            step="0.5"
            placeholder="7"
            className="bg-[#07090f]/80 border-white/15 text-[#f0f4fc]"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
          />
        </div>

        {/* Nivel de Estrés */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#8b9bb8]">
            {t('checkin.stress_label')}
          </label>
          <Select value={stress} onValueChange={setStress}>
            <SelectTrigger className="bg-[#07090f]/80 border-white/15 text-[#f0f4fc]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0e1424] border-white/15 text-[#f0f4fc]">
              <SelectItem value="low">{currentStressLabels.low}</SelectItem>
              <SelectItem value="medium">{currentStressLabels.medium}</SelectItem>
              <SelectItem value="high">{currentStressLabels.high}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estimulantes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#8b9bb8]">
            {t('checkin.stimulants_label')}
          </label>
          <Select value={stimulants} onValueChange={setStimulants}>
            <SelectTrigger className="bg-[#07090f]/80 border-white/15 text-[#f0f4fc]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0e1424] border-white/15 text-[#f0f4fc]">
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">{yesLabel}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleNext}
          className="w-full h-11 text-sm font-bold bg-[#22d3ee] text-[#07090f] hover:bg-[#22d3ee]/80 mt-4"
        >
          {t('checkin.continue')}
        </Button>

      </CardContent>
    </Card>
  );
};
