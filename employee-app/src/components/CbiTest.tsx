import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Progress } from './ui/progress';
import { CBI_QUESTIONS, calculateCbiScore } from '../tests/cbi';

interface CbiTestProps {
  onComplete: (score: number) => void;
}

const SCALE_ORDER = ['always', 'often', 'sometimes', 'seldom', 'never'] as const;

export const CbiTest: React.FC<CbiTestProps> = ({ onComplete }) => {
  const { t, language } = useTranslation();
  const [index, setIndex] = useState(0);
  const answersRef = React.useRef<Record<string, string>>({});

  const q = CBI_QUESTIONS[index];
  const questionText = q.text[language as 'ca'|'es'|'en'] || q.text.en;

  const handleOptionClick = (key: string) => {
    answersRef.current[q.id] = key;
    const nextIndex = index + 1;
    
    if (nextIndex >= CBI_QUESTIONS.length) {
      const result = calculateCbiScore(answersRef.current);
      onComplete(result.globalScore);
    } else {
      setIndex(nextIndex);
    }
  };

  const progressPct = Math.round((index / CBI_QUESTIONS.length) * 100);

  return (
    <div className="space-y-4">
      
      {/* Progreso */}
      <div className="space-y-1">
        <p className="text-center text-xs text-[#8b9bb8] px-4 leading-normal">
          {t('cbi.instruction')}
        </p>
        <Progress value={progressPct} className="h-1.5 bg-cyan-950/20 [&>div]:bg-gradient-to-r [&>div]:from-[#22d3ee] [&>div]:to-[#3b82f6]" />
        <div className="text-center text-[10px] font-bold text-[#8b9bb8] tracking-widest mt-1">
          {t('cbi.progress', { current: index + 1, total: CBI_QUESTIONS.length })}
        </div>
      </div>

      {/* Pregunta */}
      <div className="flex flex-col items-center justify-center gap-2 min-h-[140px] bg-[#07090f] border border-white/5 rounded-xl p-6 text-center">
        <span className="text-[10px] font-bold tracking-widest text-[#22d3ee] uppercase">
          Pregunta {q.id}
        </span>
        <p className="text-base font-bold text-[#f0f4fc] max-w-[24ch] leading-snug">
          {questionText}
        </p>
      </div>

      {/* Opciones */}
      <div className="flex flex-col gap-2.5">
        {SCALE_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => handleOptionClick(key)}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 rounded-xl font-semibold text-sm transition-all text-center"
          >
            {t(`cbi.scale_${key}`)}
          </button>
        ))}
      </div>

    </div>
  );
};
