import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { initDb, getSessions } from '../storage/db';

interface Session {
  id: string;
  takenAt: string;
  riskIndex: number;
}

export const HistoryPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t, language } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
  const currentLocale = localeMap[language] ?? 'ca-ES';

  useEffect(() => {
    const loadHistory = async () => {
      try {
        await initDb();
        const data = await getSessions(30);
        setSessions(data as Session[]);
      } catch (e) {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const formatSessionDate = (takenAt: string) => {
    const d = new Date(takenAt);
    if (Number.isNaN(d.getTime())) return takenAt;
    return new Intl.DateTimeFormat(currentLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getRiskColor = (idx: number) => {
    if (idx < 35) return 'text-[#4ade80]';
    if (idx < 60) return 'text-[#facc15]';
    return 'text-[#f87171]';
  };

  const getRiskHex = (idx: number) => {
    if (idx < 35) return '#4ade80';
    if (idx < 60) return '#facc15';
    return '#f87171';
  };

  // Lógica del sparkline SVG nativo
  const renderSparkline = () => {
    const values = [...sessions]
      .reverse()
      .map((s) => Number(s.riskIndex))
      .filter((v) => Number.isFinite(v));
    
    if (values.length === 0) return null;

    const w = 320;
    const h = 80;
    const pad = { t: 10, r: 12, b: 10, l: 12 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    const points = values.map((v, i) => {
      const x = values.length === 1 
        ? pad.l + innerW / 2 
        : pad.l + (i / (values.length - 1)) * innerW;
      const y = pad.t + innerH - (v / 100) * innerH;
      return { x, y, val: v };
    });

    const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const baseY = pad.t + innerH;
    const areaPoints = `${pad.l},${baseY} ${linePoints} ${points[points.length - 1].x},${baseY}`;

    // Líneas auxiliares de umbral en 35 y 60
    const thresholds = [35, 60].map((tVal) => {
      const y = pad.t + innerH - (tVal / 100) * innerH;
      return (
        <line
          key={tVal}
          x1={pad.l}
          y1={y}
          x2={w - pad.r}
          y2={y}
          stroke="rgba(139, 155, 184, 0.15)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      );
    });

    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="mt-4" role="img" aria-label={t('history.trend_title')}>
        <defs>
          <linearGradient id="react-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.25)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
          </linearGradient>
        </defs>
        {thresholds}
        {values.length > 1 ? (
          <>
            <polygon points={areaPoints} fill="url(#react-spark-fill)" />
            <polyline
              points={linePoints}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <circle cx={points[0].x} cy={points[0].y} r="5" fill="#22d3ee" />
        )}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={getRiskHex(p.val)}
            stroke="rgba(7, 9, 15, 0.6)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    );
  };

  // Calcular métricas agregadas
  const getMetrics = () => {
    if (sessions.length === 0) return { avg: null, best: null, worst: null };
    
    // Promedio de los últimos 7 días
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 6);
    
    const weekSessions = sessions.filter(s => new Date(s.takenAt) >= cutoff);
    const weekValues = weekSessions.map(s => s.riskIndex).filter(v => Number.isFinite(v));
    const avg = weekValues.length > 0 ? Math.round(weekValues.reduce((a, b) => a + b, 0) / weekValues.length) : null;

    // Mejor y peor día (mínimo 3 registros requeridos para mostrar extremos)
    if (sessions.length < 3) return { avg, best: null, worst: null };

    // Agrupar medias por día
    const byDay = new Map<string, number[]>();
    sessions.forEach(s => {
      const day = s.takenAt.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(s.riskIndex);
    });

    const dailyAvgs = [...byDay.entries()].map(([day, values]) => ({
      day,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }));

    let best = dailyAvgs[0];
    let worst = dailyAvgs[0];
    dailyAvgs.forEach(entry => {
      if (entry.avg < best.avg) best = entry;
      if (entry.avg > worst.avg) worst = entry;
    });

    return { avg, best, worst };
  };

  const { avg, best, worst } = getMetrics();

  const formatDayLabel = (dayKey: string) => {
    const [y, m, d] = dayKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return dayKey;
    return new Intl.DateTimeFormat(currentLocale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <span className="text-xs text-[#8b9bb8]">{t('common.loading')}</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <h1 className="text-xl font-bold text-[#f0f4fc]">{t('history.title')}</h1>
        <p className="text-xs text-[#8b9bb8]">{t('history.subtitle')}</p>
        <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            {/* SVG pulso cardíaco */}
            <svg className="w-48 h-12 stroke-[#22d3ee]/35" fill="none" viewBox="0 0 200 56">
              <path d="M0 28 H60 L72 8 L84 48 L96 20 L108 36 L120 28 H200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-sm font-bold text-[#f0f4fc]">{t('history.empty_title')}</h3>
            <p className="text-xs text-[#8b9bb8] max-w-[24ch] leading-relaxed">{t('history.empty_body')}</p>
          </CardContent>
        </Card>
        <Button onClick={onBack} variant="ghost" className="w-full border border-white/10 text-xs font-semibold">{t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-xl font-bold text-[#f0f4fc]">{t('history.title')}</h1>
        <p className="text-xs text-[#8b9bb8]">{t('history.subtitle')}</p>
      </div>

      {/* Gráfico Sparkline */}
      <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#8b9bb8]">
            {t('history.trend_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {renderSparkline()}
          
          {/* Leyenda */}
          <div className="flex justify-center gap-4 text-[9px] font-bold text-[#8b9bb8] tracking-wider uppercase mt-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4ade80]" />&lt;35</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#facc15]" />&lt;60</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f87171]" />&ge;60</span>
          </div>
        </CardContent>
      </Card>

      {/* Resumen Agregado */}
      {(avg !== null || best || worst) && (
        <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#8b9bb8]">
              {t('history.summary_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-3 gap-2">
            {avg !== null && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#8b9bb8] leading-tight">{t('history.week_avg')}</span>
                <span className={`text-base font-bold ${getRiskColor(avg)}`}>{avg}</span>
              </div>
            )}
            {best && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#8b9bb8] leading-tight">{t('history.best_day')}</span>
                <span className={`text-xs font-bold truncate ${getRiskColor(best.avg)}`}>
                  {formatDayLabel(best.day)} <span className="text-[9px] text-[#8b9bb8] font-medium">({Math.round(best.avg)})</span>
                </span>
              </div>
            )}
            {worst && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#8b9bb8] leading-tight">{t('history.worst_day')}</span>
                <span className={`text-xs font-bold truncate ${getRiskColor(worst.avg)}`}>
                  {formatDayLabel(worst.day)} <span className="text-[9px] text-[#8b9bb8] font-medium">({Math.round(worst.avg)})</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Listado de Sesiones Recientes */}
      <Card className="border-white/10 bg-[#0e1424]/60 backdrop-blur-md">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#8b9bb8]">
            {t('history.sessions_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2 max-h-64 overflow-y-auto pr-1">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-[#07090f]/50 border border-white/5 rounded-xl transition-colors hover:border-white/10">
              <span className="text-xs text-[#8b9bb8]">{formatSessionDate(s.takenAt)}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#8b9bb8] uppercase tracking-wider font-semibold">{t('history.risk_label')}</span>
                <span className={`text-sm font-extrabold ${getRiskColor(s.riskIndex)}`}>
                  {s.riskIndex ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={onBack}
        variant="ghost"
        className="w-full h-11 text-sm font-bold border border-white/10 hover:bg-white/5 text-[#f0f4fc]"
      >
        {t('common.back')}
      </Button>

    </div>
  );
};
