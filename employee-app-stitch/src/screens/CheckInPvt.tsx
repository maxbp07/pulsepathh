import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PVT } from '../lib/config';
import { calculatePvtMetrics } from '../lib/pvt';
import { calculateFri } from '../lib/fri';
import {
  createPvtBaState,
  updatePvtBa,
  classifyByLpfs,
  type PvtBaState,
} from '../lib/pvtBa';
import { getOrCreateParticipantId } from '../lib/participant';
import { saveSession } from '../lib/db';
import { syncDailySession } from '../lib/sync';
import { useCheckin } from '../store';

type Phase = 'START' | 'WAIT' | 'STIMULUS' | 'FEEDBACK' | 'SAVING';

const MAX_STIMULUS_MS = 3000; // ventana de respuesta; si pasa = lapse por no-respuesta

export default function CheckInPvt() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const kss = useCheckin((s) => s.kss);
  const context = useCheckin((s) => s.context);
  const setPvt = useCheckin((s) => s.setPvt);

  const [phase, setPhase] = useState<Phase>('START');
  const [counter, setCounter] = useState('000');
  const [feedback, setFeedback] = useState('');
  const [lapseFlag, setLapseFlag] = useState(false);
  const [falseStartFlag, setFalseStartFlag] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Refs (no re-renderizan)
  const timesRef = useRef<number[]>([]);
  const falseStartsRef = useRef(0);
  const stimulusAtRef = useRef(0);
  const testStartAtRef = useRef(0);
  const baRef = useRef<PvtBaState>(createPvtBaState());
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('START');
  const finishedRef = useRef(false);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const clearAllTimers = useCallback(() => {
    [waitTimer, responseTimer, feedbackTimer].forEach((t) => {
      if (t.current) clearTimeout(t.current);
    });
    [counterTimer, tickTimer].forEach((t) => {
      if (t.current) clearInterval(t.current);
    });
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const elapsedSecNow = () =>
    Math.floor((performance.now() - testStartAtRef.current) / 1000);

  // Tick global del cronómetro de sesión (cap duro de 3 min)
  const startGlobalTick = useCallback(() => {
    testStartAtRef.current = performance.now();
    tickTimer.current = setInterval(() => {
      const sec = elapsedSecNow();
      setElapsedSec(sec);
      if (performance.now() - testStartAtRef.current >= PVT.durationMs) {
        finishTest('timeout');
      }
    }, 250);
  }, []);

  const beginTrial = useCallback(() => {
    if (performance.now() - testStartAtRef.current >= PVT.durationMs) {
      finishTest('timeout');
      return;
    }
    setPhaseBoth('WAIT');
    setCounter('000');
    setFeedback('');
    setLapseFlag(false);
    setFalseStartFlag(false);
    const isi = PVT.isiMinMs + Math.random() * (PVT.isiMaxMs - PVT.isiMinMs);
    waitTimer.current = setTimeout(showStimulus, isi);
  }, []);

  const showStimulus = useCallback(() => {
    setPhaseBoth('STIMULUS');
    stimulusAtRef.current = performance.now();
    counterTimer.current = setInterval(() => {
      const elapsed = performance.now() - stimulusAtRef.current;
      setCounter(String(Math.floor(elapsed)).padStart(3, '0'));
    }, 10);
    responseTimer.current = setTimeout(() => {
      recordReaction(MAX_STIMULUS_MS, true);
    }, MAX_STIMULUS_MS);
  }, []);

  // Motor adaptativo: actualiza y, si decidió, termina.
  const maybeStop = useCallback((): boolean => {
    const s = baRef.current;
    if (s.stopped) {
      finishTest(s.stopReason === 'lpfs_low' ? 'lpfs_low' : 'threshold');
      return true;
    }
    return false;
  }, []);

  const recordReaction = useCallback(
    (rtOverride?: number, isMiss = false) => {
      if (counterTimer.current) clearInterval(counterTimer.current);
      if (responseTimer.current) clearTimeout(responseTimer.current);
      setPhaseBoth('FEEDBACK');

      const rt = rtOverride ?? Math.floor(performance.now() - stimulusAtRef.current);
      timesRef.current.push(rt);

      const isLapse = rt > PVT.lapseThresholdMs;
      setLapseFlag(isLapse);
      setFeedback(isMiss ? `${MAX_STIMULUS_MS} ms · lapse` : `${rt} ms`);

      // PVT-BA Bayesian update (cuenta como respuesta al estímulo)
      baRef.current = updatePvtBa(baRef.current, isLapse, elapsedSecNow(), false);
      if (maybeStop()) return;

      feedbackTimer.current = setTimeout(() => {
        if (performance.now() - testStartAtRef.current >= PVT.durationMs) {
          finishTest('timeout');
        } else {
          beginTrial();
        }
      }, PVT.feedbackMs);
    },
    [beginTrial, maybeStop],
  );

  const triggerFalseStart = useCallback(() => {
    if (waitTimer.current) clearTimeout(waitTimer.current);
    falseStartsRef.current += 1;
    setPhaseBoth('FEEDBACK');
    setFalseStartFlag(true);
    setFeedback('FALSE START');

    // Un false start cuenta como LpFS en el motor PVT-BA
    baRef.current = updatePvtBa(baRef.current, true, elapsedSecNow(), true);
    if (maybeStop()) return;

    feedbackTimer.current = setTimeout(() => {
      if (performance.now() - testStartAtRef.current >= PVT.durationMs) {
        finishTest('timeout');
      } else {
        beginTrial();
      }
    }, PVT.feedbackMs);
  }, [beginTrial, maybeStop]);

  const handleInteraction = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'WAIT') {
      triggerFalseStart();
      return;
    }
    if (p === 'STIMULUS') {
      const rt = performance.now() - stimulusAtRef.current;
      if (rt < PVT.falseStartMinMs) {
        triggerFalseStart();
        return;
      }
      recordReaction();
    }
  }, [recordReaction, triggerFalseStart]);

  const startTest = () => {
    timesRef.current = [];
    falseStartsRef.current = 0;
    baRef.current = createPvtBaState();
    finishedRef.current = false;
    startGlobalTick();
    beginTrial();
  };

  function finishTest(_reason: 'timeout' | 'threshold' | 'lpfs_low') {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearAllTimers();
    setPhaseBoth('SAVING');
    void persist();
  }

  async function persist() {
    const durationMs = Math.min(
      PVT.durationMs,
      Math.floor(performance.now() - testStartAtRef.current),
    );
    const metrics = calculatePvtMetrics(
      timesRef.current,
      falseStartsRef.current,
      durationMs,
    );

    // Categoría final: la que decidió el motor, o por LpFS real si se llegó a 3 min.
    const ba = baRef.current;
    const category = ba.stopped && ba.category ? ba.category : classifyByLpfs(ba.lpfs);
    const stoppedEarly = ba.stopped && ba.stopReason !== 'timeout';
    metrics.category = category;
    metrics.stoppedEarly = stoppedEarly;
    metrics.lpfs = ba.lpfs;

    const kssValue = kss ?? 5;
    const fri = calculateFri(metrics, kssValue);
    setPvt(metrics, fri);

    const now = new Date();
    const saved = await saveSession({
      participantId: getOrCreateParticipantId(),
      takenAt: now.toISOString(),
      dateLocal: now.toISOString().slice(0, 10),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pvt: metrics,
      kss: kssValue,
      context: context ?? undefined,
      fri,
    });

    void syncDailySession(saved);

    navigate('/checkin/result');
  }

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const totalMin = PVT.durationMs / 60000;

  return (
    <div
      onPointerDown={phase === 'START' ? undefined : handleInteraction}
      className="relative w-screen h-screen overflow-hidden bg-black text-white select-none cursor-pointer"
      style={{ touchAction: 'manipulation' }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(184,195,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(184,195,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-2xl px-margin-mobile text-center">
        {phase === 'START' && (
          <div className="flex flex-col items-center space-y-lg">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary-fixed-dim">
              {t('checkin.pvt.startTitle')}
            </h1>
            <p className="font-body-md text-body-md text-outline-variant max-w-md mx-auto">
              {t('checkin.pvt.startBody')}
            </p>
            <div className="mt-lg px-8 py-4 rounded-xl bg-surface-tint/10 border border-primary-fixed-dim/20 text-primary-fixed-dim font-label-bold text-label-bold uppercase tracking-wider">
              {t('checkin.pvt.startBadge')}
            </div>
            <button
              onClick={startTest}
              className="mt-md px-xl py-4 bg-primary text-on-primary font-label-bold text-label-bold rounded-xl active:scale-95 transition"
            >
              {t('checkin.pvt.startBtn')}
            </button>
          </div>
        )}

        {(phase === 'WAIT' || phase === 'STIMULUS' || phase === 'FEEDBACK') && (
          <>
            <div className="absolute top-margin-mobile right-margin-mobile font-mono text-caption text-outline-variant/50">
              {String(mins).padStart(1, '0')}:{String(secs).padStart(2, '0')} / {totalMin}:00
            </div>
            <div className="absolute top-margin-mobile left-margin-mobile font-caption text-outline-variant/40 uppercase tracking-widest">
              {t('checkin.pvt.timerLabel')}
            </div>

            {phase === 'WAIT' && (
              <span className="text-outline-variant/60 font-label-bold tracking-widest uppercase animate-pulse">
                {t('checkin.pvt.wait')}
              </span>
            )}

            {phase === 'STIMULUS' && (
              <div className="counter-text text-[120px] md:text-[180px] font-bold text-[#ff3333] leading-none drop-shadow-[0_0_15px_rgba(255,51,51,0.5)]">
                {counter}
              </div>
            )}

            {phase === 'FEEDBACK' && (
              <div className="space-y-sm">
                <div
                  className={`counter-text text-5xl md:text-6xl font-bold ${
                    falseStartFlag ? 'text-[#ff3333]' : lapseFlag ? 'text-outline' : 'text-primary-fixed-dim'
                  }`}
                >
                  {feedback}
                </div>
                {falseStartFlag && (
                  <p className="font-headline-md text-[#ff3333] uppercase tracking-widest">
                    False start
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {phase === 'SAVING' && (
          <div className="space-y-md">
            <span className="material-symbols-outlined text-primary-fixed-dim text-5xl animate-spin">
              progress_activity
            </span>
            <p className="text-outline-variant font-label-bold tracking-widest uppercase">
              {t('checkin.pvt.saving')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
