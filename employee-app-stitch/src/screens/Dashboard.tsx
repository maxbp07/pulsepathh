import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VitalityRing from '../components/VitalityRing';
import { getLatestSession, getSessions, getWeekly } from '../lib/db';
import { bandMeta } from '../lib/fri';
import { localDateISO } from '../lib/studySchedule';
import type { DailySession, WeeklyEntry } from '../lib/types';

function mondayISO(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - day);
  return localDateISO(d);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [latest, setLatest] = useState<DailySession | null>(null);
  const [streak, setStreak] = useState(0);
  const [weeklyMean, setWeeklyMean] = useState<number | null>(null);
  const [doneToday, setDoneToday] = useState(false);
  const [sleepThreshold, setSleepThreshold] = useState<number | null>(null);
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [last, sessions, week] = await Promise.all([
        getLatestSession(),
        getSessions(60),
        getWeekly(12),
      ]);
      setLatest(last ?? null);
      setStreak(computeStreak(sessions));
      setWeekly(week);

      const today = localDateISO();
      setDoneToday(!!sessions.find((s) => s.dateLocal === today));

      const last7 = sessions.slice(0, 7);
      if (last7.length) {
        setWeeklyMean(
          Math.round(last7.reduce((a, s) => a + s.fri.vitality, 0) / last7.length),
        );
      }
      setSleepThreshold(computeSleepThreshold(sessions));
    })();
  }, []);

  const vitality = latest?.fri.vitality ?? null;
  const band = latest?.fri.band ?? 'optimal';
  const meta = bandMeta(band);

  const monday = mondayISO();
  const stressDone = weekly.some((w) => w.weekStart === monday && w.dassStressRaw > 0);
  const burnoutDone = weekly.some((w) => w.weekStart === monday && w.sib > 0);

  // Data-driven insight (primera tarjeta); las demás son consejos estáticos.
  const dataInsight =
    sleepThreshold != null
      ? t('home.insightSleep', { n: sleepThreshold })
      : weeklyMean != null
        ? t('home.insightAvg', { n: weeklyMean })
        : t('home.insightDefault');

  return (
    <>
      {/* Vitality Index */}
      <section className="flex flex-col items-center justify-center gap-sm mb-sm py-4">
        <h1 className="font-headline-md text-headline-md text-on-background">{t('home.vitalityIndex')}</h1>
        {vitality == null ? (
          <div className="w-48 h-48 flex items-center justify-center rounded-full bg-surface-container-high shadow-inner my-2">
            <span className="font-headline-lg-mobile text-on-surface-variant">--</span>
          </div>
        ) : (
          <VitalityRing vitality={vitality} band={band} />
        )}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-label-bold text-label-bold border ${meta.chipClass}`}
        >
          <span>{meta.emoji}</span> {vitality == null ? t('home.noData') : meta.label}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Today's status + CTA */}
        <div className="md:col-span-8 bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start mb-lg relative z-10">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-background mb-base">{t('home.todayStatus')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {doneToday ? t('home.doneToday') : t('home.pending')}
              </p>
            </div>
            <div className="bg-surface-variant text-on-surface-variant rounded-full p-xs">
              <span className="material-symbols-outlined">{doneToday ? 'task_alt' : 'assignment_late'}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-sm items-center sm:justify-between relative z-10 mt-auto w-full">
            <div className="hidden sm:flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                schedule
              </span>
              <span className="font-caption text-caption text-on-surface-variant">{t('home.pvtDurationHint')}</span>
            </div>
            <Link
              to="/checkin/context"
              className="w-full bg-primary text-on-primary hover:bg-surface-tint active:scale-95 transition-all duration-200 font-label-bold text-lg rounded-xl px-xl py-4 shadow-[0px_10px_30px_rgba(0,0,0,0.08)] text-center"
            >
              {doneToday ? t('home.retake') : t('home.startCheckin')}
            </Link>
          </div>
        </div>

        {/* Streak */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md flex flex-col justify-between relative">
          <div className="flex justify-between items-center mb-sm">
            <h3 className="font-headline-md text-headline-md text-on-background">{t('home.streak')}</h3>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="flex items-baseline gap-xs mb-md">
            <span className="font-display-xl text-display-xl text-primary">{streak}</span>
            <span className="font-body-md text-body-md text-on-surface-variant">{t('home.days')}</span>
          </div>
          <div className="flex items-center gap-sm bg-tertiary-container/20 p-sm rounded-xl border border-tertiary/10">
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <span className="font-label-bold text-label-bold text-tertiary">{t('home.keepGoing')}</span>
          </div>
        </div>

        {/* Insights carousel */}
        <div className="md:col-span-12 flex flex-col gap-sm">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline-md text-headline-md text-on-background">{t('home.insightsTitle')}</h3>
          </div>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-md pb-4 pt-2 hide-scrollbar w-full">
            <InsightCard>{dataInsight}</InsightCard>
            <InsightCard>{t('home.tipConsistency')}</InsightCard>
            <InsightCard>{t('home.tipKss')}</InsightCard>
          </div>
          <Link
            to="/analytics"
            className="w-full border-2 border-primary text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200 font-label-bold text-label-bold rounded-xl py-3 mt-2 text-center"
          >
            {t('home.viewAnalytics')}
          </Link>
        </div>

        {/* Study assessments (piloto ML) */}
        <div className="md:col-span-12 flex flex-col gap-sm">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline-md text-headline-md text-on-background">{t('study.cardTitle')}</h3>
          </div>
          <Link
            to="/study"
            className="flex items-center gap-md p-md bg-surface-container-lowest border border-primary/30 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:shadow-lg active:scale-95 transition"
          >
            <span className="material-symbols-outlined text-primary text-3xl">science</span>
            <div className="flex-grow">
              <div className="font-body-md text-body-md text-on-surface">{t('study.cardBody')}</div>
              <div className="font-caption text-caption text-outline-variant">{t('study.notDiagnostic')}</div>
            </div>
            <span className="font-label-bold text-label-bold text-primary">{t('study.cardCta')}</span>
          </Link>
        </div>

        {/* Weekly assessments */}
        <div className="md:col-span-12 flex flex-col gap-sm">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-headline-md text-headline-md text-on-background">{t('home.weeklyTitle')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <WeeklyCard
              to="/weekly/stress"
              icon="psychology"
              label={t('home.weeklyStress')}
              hint={t('home.weeklyStressHint')}
              done={stressDone}
              doneLabel={t('home.weeklyDone')}
              dueLabel={t('home.weeklyDue')}
            />
            <WeeklyCard
              to="/weekly/wellness"
              icon="whatshot"
              label={t('home.weeklyBurnout')}
              hint={t('home.weeklyBurnoutHint')}
              done={burnoutDone}
              doneLabel={t('home.weeklyDone')}
              dueLabel={t('home.weeklyDue')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function InsightCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-[280px] md:min-w-[320px] max-w-[85%] snap-center flex flex-col gap-sm p-md bg-surface-container-lowest border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] rounded-2xl">
      <p className="font-body-lg text-body-lg text-on-background leading-relaxed">{children}</p>
    </div>
  );
}

function WeeklyCard({
  to,
  icon,
  label,
  hint,
  done,
  doneLabel,
  dueLabel,
}: {
  to: string;
  icon: string;
  label: string;
  hint: string;
  done: boolean;
  doneLabel: string;
  dueLabel: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-md p-md bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] hover:shadow-lg active:scale-95 transition"
    >
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <div className="flex-grow">
        <div className="font-body-md text-body-md text-on-surface">{label}</div>
        <div className="font-caption text-caption text-outline-variant">{hint}</div>
      </div>
      <span
        className={`font-caption text-caption px-2 py-1 rounded-full ${
          done ? 'bg-tertiary-container/20 text-tertiary' : 'bg-primary-container/15 text-primary'
        }`}
      >
        {done ? doneLabel : dueLabel}
      </span>
    </Link>
  );
}

/** Racha de días consecutivos (hacia atrás desde hoy local) con sesión registrada. */
function computeStreak(sessions: DailySession[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map((s) => s.dateLocal));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = localDateISO(cursor);
    if (days.has(iso)) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Insight de sueño: si hay ≥5 sesiones con contexto, halla un umbral de horas
 * bajo el cual la vitalidad cae. Devuelve ese umbral (h) o null si no hay señal.
 */
function computeSleepThreshold(sessions: DailySession[]): number | null {
  const withSleep = sessions.filter(
    (s) => s.context && typeof s.context.sleepHours === 'number',
  );
  if (withSleep.length < 5) return null;

  const hours = withSleep.map((s) => s.context!.sleepHours).sort((a, b) => a - b);
  const median = hours[Math.floor(hours.length / 2)];
  const threshold = Math.floor(median);

  const below = withSleep.filter((s) => s.context!.sleepHours <= threshold);
  const above = withSleep.filter((s) => s.context!.sleepHours > threshold);
  if (!below.length || !above.length) return null;

  const avg = (arr: DailySession[]) =>
    arr.reduce((a, s) => a + s.fri.vitality, 0) / arr.length;
  const diff = avg(above) - avg(below);

  // Solo mostramos si dormir menos se asocia a menor vitalidad (margen > 5 pts).
  return diff > 5 ? threshold : null;
}
