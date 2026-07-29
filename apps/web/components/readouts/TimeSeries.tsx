'use client';

import { useId } from 'react';
import type { Sample } from '@/lib/useSimulation';

export interface SeriesDef {
  key: keyof Omit<Sample, 't'>;
  label: string;
  unit: string;
  color: string;
  /** Normal range, shaded behind the curve. */
  normal?: readonly [number, number];
  precision: number;
}

export const DEFAULT_SERIES: readonly SeriesDef[] = [
  {
    key: 'map',
    label: 'MAP',
    unit: 'mmHg',
    color: 'var(--color-arterial)',
    normal: [70, 105],
    precision: 0,
  },
  {
    key: 'heartRate',
    label: 'Herzfrequenz',
    unit: '1/min',
    color: 'var(--color-arterial)',
    normal: [60, 100],
    precision: 0,
  },
  {
    key: 'gfr',
    label: 'GFR',
    unit: 'mL/min',
    color: 'var(--color-filtrate)',
    normal: [90, 140],
    precision: 0,
  },
  {
    key: 'urineFlow',
    label: 'Urinfluss',
    unit: 'L/d',
    color: 'var(--color-filtrate)',
    normal: [0.8, 2.5],
    precision: 2,
  },
  {
    key: 'renin',
    label: 'Plasma-Renin-Aktivität',
    unit: 'ng/mL/h',
    color: 'var(--color-signal)',
    normal: [0.5, 2],
    precision: 2,
  },
  {
    key: 'aldosterone',
    label: 'Aldosteron',
    unit: 'ng/L',
    color: 'var(--color-signal)',
    normal: [30, 150],
    precision: 0,
  },
  {
    key: 'ecfVolume',
    label: 'Extrazellulärvolumen',
    unit: 'L',
    color: 'var(--color-venous)',
    normal: [13, 15],
    precision: 2,
  },
  {
    key: 'sodiumExcretion',
    label: 'Na⁺-Ausscheidung',
    unit: 'mmol/d',
    color: 'var(--color-venous)',
    normal: [100, 200],
    precision: 0,
  },
  {
    key: 'potassium',
    label: 'Kalium',
    unit: 'mmol/L',
    color: 'var(--color-venous)',
    normal: [3.5, 5],
    precision: 2,
  },
];

/**
 * Small multiples rather than one crowded axis: each quantity keeps its own scale, so a
 * change of 2 mmol/L in potassium is as legible as a change of 40 mmHg in pressure.
 */
export function TimeSeries({
  history,
  series = DEFAULT_SERIES,
}: {
  history: readonly Sample[];
  series?: readonly SeriesDef[];
}) {
  return (
    <div className="space-y-3">
      {series.map((def) => (
        <Sparkline key={def.key} history={history} def={def} />
      ))}
    </div>
  );
}

function Sparkline({ history, def }: { history: readonly Sample[]; def: SeriesDef }) {
  const gradientId = useId();
  const width = 260;
  const height = 40;

  const values = history.map((s) => s[def.key]);
  const current = values[values.length - 1] ?? 0;

  // Scale includes the normal band so "inside the range" is visible at a glance.
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (def.normal !== undefined) {
    min = Math.min(min, def.normal[0]);
    max = Math.max(max, def.normal[1]);
  }
  const pad = (max - min) * 0.12 || Math.abs(max) * 0.05 || 1;
  min -= pad;
  max += pad;
  const span = max - min || 1;

  const toY = (v: number) => height - ((v - min) / span) * height;
  const toX = (i: number) => (values.length <= 1 ? width : (i / (values.length - 1)) * width);

  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');

  const outOfRange =
    def.normal !== undefined && (current < def.normal[0] || current > def.normal[1]);

  return (
    <figure className="space-y-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-xs">
        <span style={{ color: 'var(--color-ink-muted)' }}>{def.label}</span>
        <span
          className="tabular font-medium"
          style={{ color: outOfRange ? def.color : 'var(--color-ink)' }}
        >
          {current.toLocaleString('de-DE', {
            minimumFractionDigits: def.precision,
            maximumFractionDigits: def.precision,
          })}{' '}
          <span style={{ color: 'var(--color-ink-faint)' }}>{def.unit}</span>
          {outOfRange && (
            <span
              aria-label={
                current > (def.normal?.[1] ?? 0) ? 'über dem Normbereich' : 'unter dem Normbereich'
              }
            >
              {current > (def.normal?.[1] ?? 0) ? ' ↑' : ' ↓'}
            </span>
          )}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: 40 }}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Verlauf ${def.label}: aktuell ${current.toFixed(def.precision)} ${def.unit}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={def.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={def.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {def.normal !== undefined && (
          <rect
            x="0"
            y={toY(def.normal[1])}
            width={width}
            height={Math.max(toY(def.normal[0]) - toY(def.normal[1]), 1)}
            fill="var(--color-ink)"
            opacity="0.06"
          />
        )}
        <path d={`${path} L${width} ${height} L0 ${height} Z`} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke={def.color}
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </figure>
  );
}
