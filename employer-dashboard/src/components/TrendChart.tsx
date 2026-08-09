import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DepartmentGroup } from '@/lib/types';
import { formatDepartment } from '@/lib/format';

const COLORS = ['#2dd4bf', '#818cf8', '#f43f5e', '#fbbf24', '#a78bfa', '#34d399'];

/** Tendencia semanal del índice de riesgo, una línea por departamento. */
export function TrendChart({ groups }: { groups: DepartmentGroup[] }) {
  const visible = groups
    .filter((g) => !g.kanon_protected && Array.isArray(g.trend) && g.trend.length >= 2)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  if (!visible.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin tendencia temporal (necesita al menos 2 semanas de datos).
      </p>
    );
  }

  const maxLen = Math.max(...visible.map((g) => g.trend!.length));
  const data = Array.from({ length: maxLen }, (_, i) => {
    const row: Record<string, number | string | null> = { week: `S-${maxLen - 1 - i}` };
    for (const g of visible) {
      row[formatDepartment(g.department)] = g.trend![i] ?? null;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 30% 22%)" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: 'hsl(220 14% 64%)', fontSize: 11 }}
          axisLine={{ stroke: 'hsl(225 30% 22%)' }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'hsl(220 14% 64%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(226 43% 9%)',
            border: '1px solid hsl(225 30% 24%)',
            borderRadius: 10,
            fontSize: 12,
            color: 'hsl(228 33% 93%)',
          }}
          labelStyle={{ color: 'hsl(220 14% 64%)' }}
        />
        <ReferenceLine y={50} stroke="hsl(349 89% 60%)" strokeDasharray="5 4" strokeOpacity={0.35} />
        <ReferenceLine y={35} stroke="hsl(43 96% 58%)" strokeDasharray="5 4" strokeOpacity={0.3} />
        {visible.map((g, i) => (
          <Line
            key={g.department}
            type="monotone"
            dataKey={formatDepartment(g.department)}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
