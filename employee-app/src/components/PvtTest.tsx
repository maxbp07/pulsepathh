import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Progress } from './ui/progress';
import { calculatePvtMetrics } from '../tests/pvt';

interface PvtTestProps {
  onComplete: (metrics: any) => void;
}

type Phase = 'ready' | 'waiting' | 'stimulus' | 'feedback' | 'done';

export const PvtTest: React.FC<PvtTestProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('ready');
  const [trialIndex, setTrialIndex] = useState(0); // 0 a 30
  const [feedbackText, setFeedbackText] = useState('');
  const [isLapse, setIsLapse] = useState(false);
  const [falseStartOccurred, setFalseStartOccurred] = useState(false);

  const timesRef = useRef<number[]>([]);
  const falseStartsRef = useRef(0);
  const stimulusAtRef = useRef(0);
  const timerRef = useRef<any>(null);

  const TRIALS = 30;

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startTest = () => {
    timesRef.current = [];
    falseStartsRef.current = 0;
    setTrialIndex(0);
    beginTrial();
  };

  const beginTrial = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('waiting');
    setFeedbackText('');
    setFalseStartOccurred(false);

    // Intervalo inter-estímulo aleatorio (1000ms a 4000ms)
    const isi = 1000 + Math.random() * 3000;
    timerRef.current = setTimeout(showStimulus, isi);
  };

  const showStimulus = () => {
    setPhase('stimulus');
    stimulusAtRef.current = performance.now();
  };

  const handleInteraction = (e: React.PointerEvent | React.KeyboardEvent) => {
    if (phase !== 'waiting' && phase !== 'stimulus') return;
    e.preventDefault();

    const now = performance.now();

    if (phase === 'waiting') {
      // False start: interactuar antes de ver el verde
      triggerFalseStart();
      return;
    }

    const rt = now - stimulusAtRef.current;

    // Toque menor a 100ms se considera anticipación implausible (false start)
    if (rt < 100) {
      triggerFalseStart();
      return;
    }

    // Respuesta válida
    timesRef.current.push(rt);
    const nextTrial = trialIndex + 1;
    setTrialIndex(nextTrial);
    showRtFeedback(rt, nextTrial);
  };

  const triggerFalseStart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    falseStartsRef.current += 1;
    setPhase('feedback');
    setFalseStartOccurred(true);
    setFeedbackText(t('pvt.false_start'));

    // Repetir el mismo ensayo tras retrasar feedback
    timerRef.current = setTimeout(() => {
      beginTrial();
    }, 1300);
  };

  const showRtFeedback = (rt: number, nextTrial: number) => {
    setPhase('feedback');
    const slow = rt > 355; // LAPSE_THRESHOLD
    setIsLapse(slow);
    setFeedbackText(`${Math.round(rt)} ms`);

    timerRef.current = setTimeout(() => {
      if (nextTrial >= TRIALS) {
        finishTest();
      } else {
        beginTrial();
      }
    }, 650);
  };

  const finishTest = () => {
    setPhase('done');
    const finalMetrics = calculatePvtMetrics(timesRef.current, falseStartsRef.current);
    onComplete(finalMetrics);
  };

  // Keyboard shortcut listener para accesibilidad (Espacio/Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      handleInteraction(e);
    }
  };

  const progressPct = Math.round((trialIndex / TRIALS) * 100);

  return (
    <div className="space-y-4">
      {/* Barra de Progreso */}
      <div className="space-y-1">
        <Progress value={progressPct} className="h-1.5 bg-cyan-950/20 [&>div]:bg-gradient-to-r [&>div]:from-[#22d3ee] [&>div]:to-[#3b82f6]" />
        <div className="text-center text-[10px] font-bold text-[#8b9bb8] tracking-widest mt-1">
          {t('pvt.progress', { current: phase === 'done' ? TRIALS : Math.min(trialIndex + 1, TRIALS), total: TRIALS })}
        </div>
      </div>

      {/* Escenario de Interacción */}
      <div
        onPointerDown={phase !== 'ready' && phase !== 'done' ? handleInteraction : undefined}
        onKeyDown={phase !== 'ready' && phase !== 'done' ? handleKeyDown : undefined}
        tabIndex={0}
        className={`flex flex-col items-center justify-center min-h-[320px] rounded-xl border border-white/5 p-6 text-center select-none outline-none cursor-pointer transition-all duration-200
          ${phase === 'stimulus' ? 'bg-[#0a1410]' : 'bg-[#05060b]'}
          ${phase === 'ready' ? 'cursor-default' : ''}
          focus-visible:border-[#22d3ee]/40`}
      >
        {phase === 'ready' && (
          <div className="space-y-5">
            <p className="text-xs text-[#8b9bb8] max-w-[28ch] leading-relaxed">
              {t('pvt.instruction')}
            </p>
            <button
              onClick={startTest}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-[#07090f] font-bold rounded-lg shadow-lg shadow-cyan-400/25 active:scale-98 transition-transform"
            >
              {t('pvt.start')}
            </button>
          </div>
        )}

        {phase === 'waiting' && (
          <span className="text-sm font-semibold text-[#8b9bb8] animate-pulse">
            {t('pvt.wait')}
          </span>
        )}

        {phase === 'stimulus' && (
          <div className="w-32 h-32 rounded-full bg-radial-green animate-scale-up shadow-glow-green" />
        )}

        {phase === 'feedback' && (
          <div className="space-y-2">
            <span className={`text-4xl font-extrabold tracking-tight ${falseStartOccurred ? 'text-rose-400' : 'text-[#f0f4fc]'}`}>
              {feedbackText}
            </span>
            {isLapse && !falseStartOccurred && (
              <p className="text-amber-400 text-xs font-semibold tracking-wider uppercase animate-bounce">
                {t('pvt.lapse')}
              </p>
            )}
          </div>
        )}

        {phase === 'done' && (
          <span className="text-sm font-semibold text-[#22d3ee]">
            {t('pvt.done')}
          </span>
        )}
      </div>
    </div>
  );
};
