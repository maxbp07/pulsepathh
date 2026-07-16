import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getSessions } from '../lib/db';
import ExportModal from '../components/ExportModal';
import type { DailySession } from '../lib/types';

export default function Analytics() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    getSessions(90).then(setSessions);
  }, []);

  const chartData = useMemo(
    () =>
      sessions
        .slice(0, 14)
        .reverse()
        .map((s) => ({ date: s.dateLocal.slice(5), vitality: s.fri.vitality, meanRt: s.pvt.meanRt })),
    [sessions],
  );

  const stats = useMemo(() => {
    if (!sessions.length) return null;
    const n = sessions.length;
    const avgRt = Math.round(sessions.reduce((a, s) => a + s.pvt.meanRt, 0) / n);
    const avgLapses = +(sessions.reduce((a, s) => a + s.pvt.lapses, 0) / n).toFixed(1);
    const optimalDays = sessions.filter((s) => s.fri.band === 'optimal').length;
    const sleeps = sessions
      .map((s) => s.context?.sleepHours)
      .filter((v): v is number => typeof v === 'number');
    const avgSleep = sleeps.length
      ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1)
      : null;
    return { n, avgRt, avgLapses, optimalDays, avgSleep };
  }, [sessions]);

  if (!sessions.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-md py-xl">
        <span className="material-symbols-outlined text-5xl text-outline-variant">bar_chart</span>
        <h2 className="font-headline-md text-headline-md text-on-background">{t('analytics.empty')}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">{t('analytics.emptyBody')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-gutter">
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
        {t('analytics.title')}
      </h1>

      {/* Vitality trend */}
      <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-md">
        <div className="flex justify-between items-start mb-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-background">{t('analytics.trend')}</h2>
          </div>
          <div className="bg-surface-container-low px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant">
            {t('analytics.lastN', { n: chartData.length })}
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#264dd9" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#264dd9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(116,118,134,0.15)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#747686' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#747686' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #dae2fd', fontSize: 12 }}
                labelStyle={{ color: '#444655' }}
              />
              <Area type="monotone" dataKey="vitality" stroke="#264dd9" strokeWidth={3} fill="url(#vitFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Metric
          icon="bedtime"
          iconColor="primary"
          label={t('analytics.cardSleep')}
          value={stats?.avgSleep != null ? `${stats.avgSleep}` : t('analytics.noSleep')}
          unit={stats?.avgSleep != null ? t('analytics.cardSleepUnit') : undefined}
          barPct={stats?.avgSleep != null ? Math.min(100, (stats.avgSleep / 8) * 100) : 0}
          barColor="bg-primary"
        />
        <Metric
          icon="timer"
          iconColor="tertiary"
          label={t('analytics.cardRt')}
          value={`${stats?.avgRt ?? '--'}`}
          unit={t('analytics.cardRtUnit')}
          barPct={Math.min(100, Math.max(10, ((stats?.avgRt ?? 300) - 200) / 2))}
          barColor="bg-tertiary"
        />
        <Metric
          icon="warning"
          iconColor="error"
          label={t('analytics.cardLapses')}
          value={`${stats?.avgLapses ?? '--'}`}
          unit={t('analytics.cardLapsesUnit')}
          barPct={Math.min(100, (stats?.avgLapses ?? 0) * 25)}
          barColor="bg-error"
        />
        <Metric
          icon="check_circle"
          iconColor="tertiary"
          label={t('analytics.cardOptimal')}
          value={`${stats?.optimalDays ?? '--'}`}
          unit={t('analytics.cardOptimalUnit')}
          barPct={Math.min(100, ((stats?.optimalDays ?? 0) / Math.max(1, stats?.n ?? 1)) * 100)}
          barColor="bg-tertiary"
        />
      </div>

      {/* Export */}
      <button
        onClick={() => setExportOpen(true)}
        className="w-full bg-primary text-on-primary font-label-bold text-label-bold rounded-xl py-3.5 active:scale-95 transition flex items-center justify-center gap-2 shadow-lg"
      >
        <span className="material-symbols-outlined">description</span>
        {t('analytics.export')}
      </button>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} sessions={sessions} />
    </div>
  );
}

function Metric({
  icon,
  iconColor,
  label,
  value,
  unit,
  barPct,
  barColor,
}: {
  icon: string;
  iconColor: 'primary' | 'tertiary' | 'error';
  label: string;
  value: string;
  unit?: string;
  barPct: number;
  barColor: string;
}) {
  const chip =
    iconColor === 'primary'
      ? 'text-primary bg-primary-container/20'
      : iconColor === 'tertiary'
        ? 'text-tertiary bg-tertiary-container/20'
        : 'text-error bg-error-container/20';
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-4 flex flex-col justify-between md:h-32">
      <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
        <span className={`material-symbols-outlined p-1.5 rounded-lg text-lg ${chip}`}>{icon}</span>
        <span className="font-caption text-caption uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <div className="font-headline-md text-headline-md text-on-surface">
          {value} {unit && <span className="text-sm font-normal text-outline">{unit}</span>}
        </div>
        <div className="w-full bg-surface-variant h-1.5 rounded-full mt-2 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
      </div>
    </div>
  );
}
