import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Progress } from './ui/progress';
import { calculateStroopMetrics } from '../tests/stroop';

interface StroopTestProps {
  onComplete: (metrics: any) => void;
}

const COLORS = [
  { id: 'red', hex: '#ef4444' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'green', hex: '#22c55e' },
  { id: 'yellow', hex: '#facc15' },
];

export const StroopTest: React.FC<StroopTestProps> = ({ onComplete }) => {
  const { t, language } = useTranslation();
  const [trialIndex, setTrialIndex] = useState(0); // 0 a 20
  const [currentWord, setCurrentWord] = useState('');
  const [currentInkHex, setCurrentInkHex] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [feedbackClass, setFeedbackClass] = useState<'ok' | 'err' | ''>('');

  const trialsRef = useRef<Array<{ wordColor: string; inkColor: string }>>([]);
  const timesRef = useRef<number[]>([]);
  const errorsRef = useRef(0);
  const stimulusAtRef = useRef(0);
  const timerRef = useRef<any>(null);

  const TRIALS = 20;

  // Cargar palabras y etiquetas según idioma
  const words: Record<string, Record<string, string>> = {
    ca: { red: 'VERMELL', blue: 'BLAU', green: 'VERD', yellow: 'GROC' },
    es: { red: 'ROJO', blue: 'AZUL', green: 'VERDE', yellow: 'AMARILLO' },
    en: { red: 'RED', blue: 'BLUE', green: 'GREEN', yellow: 'YELLOW' },
  };
  const currentWords = words[language] ?? words.en;

  const labels: Record<string, Record<string, string>> = {
    ca: { red: 'Vermell', blue: 'Blau', green: 'Verd', yellow: 'Groc' },
    es: { red: 'Rojo', blue: 'Azul', green: 'Verde', yellow: 'Amarillo' },
    en: { red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow' },
  };
  const currentLabels = labels[language] ?? labels.en;

  // Generar trials incongruentes al montar
  useEffect(() => {
    const ids = COLORS.map((c) => c.id);
    const generated = [];
    let consecutive = 0;
    let lastInk: string | null = null;

    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    for (let i = 0; i < TRIALS; i++) {
      let ink = pick(ids);
      if (ink === lastInk && consecutive >= 3) {
        ink = pick(ids.filter((id) => id !== lastInk));
      }

      const word = pick(ids.filter((id) => id !== ink)); // Garantizar incongruencia

      if (ink === lastInk) {
        consecutive += 1;
      } else {
        consecutive = 1;
        lastInk = ink;
      }
      generated.push({ wordColor: word, inkColor: ink });
    }

    trialsRef.current = generated;
    showTrial(0);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showTrial = (idx: number) => {
    if (idx >= TRIALS) return;
    const trial = trialsRef.current[idx];
    const ink = COLORS.find((c) => c.id === trial.inkColor)!;
    
    setCurrentWord(currentWords[trial.wordColor as keyof typeof currentWords]);
    setCurrentInkHex(ink.hex);
    setFeedbackClass('');
    setAccepting(true);
    stimulusAtRef.current = performance.now();
  };

  const handleAnswer = (colorId: string) => {
    if (!accepting) return;
    const rt = performance.now() - stimulusAtRef.current;
    const correct = colorId === trialsRef.current[trialIndex].inkColor;

    setAccepting(false);
    timesRef.current.push(rt);
    if (!correct) errorsRef.current += 1;

    setFeedbackClass(correct ? 'ok' : 'err');

    const nextIndex = trialIndex + 1;
    setTrialIndex(nextIndex);

    timerRef.current = setTimeout(() => {
      if (nextIndex >= TRIALS) {
        finish();
      } else {
        setCurrentWord('');
        timerRef.current = setTimeout(() => showTrial(nextIndex), 400); // INTER_TRIAL_MS
      }
    }, 350); // FEEDBACK_MS
  };

  const finish = () => {
    const metrics = calculateStroopMetrics(timesRef.current, errorsRef.current, TRIALS);
    onComplete(metrics);
  };

  const progressPct = Math.round((trialIndex / TRIALS) * 100);

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="space-y-1">
        <p className="text-center text-xs text-[#8b9bb8] px-4 leading-normal">
          {t('stroop.instruction')}
        </p>
        <Progress value={progressPct} className="h-1.5 bg-cyan-950/20 [&>div]:bg-gradient-to-r [&>div]:from-[#22d3ee] [&>div]:to-[#3b82f6]" />
        <div className="text-center text-[10px] font-bold text-[#8b9bb8] tracking-widest mt-1">
          {t('stroop.progress', { current: trialIndex, total: TRIALS })}
        </div>
      </div>

      {/* Escenario de palabra */}
      <div className="flex items-center justify-center min-h-[160px] bg-[#07090f] border border-white/5 rounded-xl p-6">
        <span
          className={`text-4xl font-extrabold tracking-wide uppercase transition-transform duration-100 select-none
            ${feedbackClass === 'ok' ? 'scale-110' : ''}
            ${feedbackClass === 'err' ? 'scale-90 opacity-60' : ''}`}
          style={{ color: currentInkHex }}
        >
          {currentWord || <span className="text-[#8b9bb8]/20">···</span>}
        </span>
      </div>

      {/* Botones de colores */}
      <div className="grid grid-cols-2 gap-3">
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleAnswer(c.id)}
            disabled={!accepting}
            className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl font-semibold text-sm transition-all duration-150"
          >
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
            {currentLabels[c.id as keyof typeof currentLabels]}
          </button>
        ))}
      </div>
    </div>
  );
};
