import { bandMeta } from '../lib/fri';
import type { FriBand } from '../lib/config';

interface Props {
  vitality: number; // 0-100
  band: FriBand;
  size?: number; // px
}

/** Anillo circular SVG del "Vitality Index" (1:1 del dashboard Stitch). */
export default function VitalityRing({ vitality, band, size = 192 }: Props) {
  const stroke = 8;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, vitality)) / 100);
  const meta = bandMeta(band);

  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-surface-container-high shadow-inner my-2"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          fill="none"
          r={r}
          className="text-surface-variant"
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <circle
          cx="50"
          cy="50"
          fill="none"
          r={r}
          stroke={meta.ringStroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span
          className="font-bold text-primary leading-none"
          style={{ fontSize: size * 0.25 }}
        >
          {Math.round(vitality)}
        </span>
        <span className="font-caption text-caption text-on-surface-variant mt-1">/100</span>
      </div>
    </div>
  );
}
