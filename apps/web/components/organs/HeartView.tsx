'use client';

import type { CSSProperties } from 'react';
import type { CardiovascularState } from '@physiosim/engine';
import { beatAmplitude, beatSeconds } from '@/lib/visuals';

/**
 * Heart detail with a live pressure-volume loop.
 *
 * The loop is **constructed** from the current mean values, not integrated beat by beat —
 * the model works with mean quantities and a fixed 2 s step (docs/adr/0002). Its four
 * corners are nevertheless real model values: EDV, ESV, and the diastolic and systolic
 * pressures. When contractility falls, the loop visibly narrows and shifts to the right.
 */
export function HeartView({ heart }: { heart: CardiovascularState }) {
  const edv = heart.endDiastolicVolumeMl;
  const esv = edv - heart.strokeVolumeMl;
  const fillingPressure = Math.max(heart.centralVenousPressureMmHg, 1);

  // Volume axis 0–220 mL, pressure axis 0–200 mmHg.
  const x = (v: number) => 40 + (v / 220) * 250;
  const y = (p: number) => 210 - (p / 200) * 180;

  const loop = [
    `M${x(esv)} ${y(2)}`, // filling starts
    `L${x(edv)} ${y(fillingPressure)}`, // filling
    `L${x(edv)} ${y(heart.diastolicMmHg)}`, // isovolumetric contraction
    `L${x(esv)} ${y(heart.systolicMmHg)}`, // ejection
    'Z', // isovolumetric relaxation
  ].join(' ');

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[220px_1fr]">
      <div className="flex items-center justify-center">
        <svg
          viewBox="0 0 160 200"
          className="h-full max-h-[240px] w-full"
          role="img"
          aria-label={`Herz, ${heart.heartRateBpm.toFixed(0)} pro Minute`}
        >
          <g
            className="physio-beat"
            style={
              {
                '--beat-seconds': `${beatSeconds(heart.heartRateBpm)}s`,
                '--beat-peak': beatAmplitude(heart.ejectionFraction * 100).toFixed(3),
              } as CSSProperties
            }
          >
            <path
              d="M80 30 C112 24 138 46 140 80 C142 120 116 152 80 164 C44 152 18 120 20 80 C22 46 48 24 80 30 Z"
              fill="var(--color-arterial)"
              fillOpacity="0.8"
              stroke="var(--color-ink)"
              strokeOpacity="0.35"
              strokeWidth="1.4"
            />
            <path
              d="M74 36 C64 70 66 118 82 158"
              fill="none"
              stroke="var(--color-paper)"
              strokeOpacity="0.5"
              strokeWidth="2.4"
            />
          </g>
        </svg>
      </div>

      <svg viewBox="0 0 320 240" className="w-full" role="img" aria-label="Druck-Volumen-Schleife">
        {/* axes */}
        <line x1="40" y1="210" x2="300" y2="210" stroke="var(--color-rule)" strokeWidth="1" />
        <line x1="40" y1="30" x2="40" y2="210" stroke="var(--color-rule)" strokeWidth="1" />
        <text
          x="170"
          y="232"
          fontSize="10"
          textAnchor="middle"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Volumen (mL)
        </text>
        <text
          x="12"
          y="120"
          fontSize="10"
          textAnchor="middle"
          fill="var(--color-ink-faint)"
          transform="rotate(-90 12 120)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Druck (mmHg)
        </text>
        {[0, 50, 100, 150, 200].map((v) => (
          <text
            key={v}
            x={x(v)}
            y="222"
            fontSize="9"
            textAnchor="middle"
            fill="var(--color-ink-faint)"
            className="tabular"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {v}
          </text>
        ))}
        {[0, 50, 100, 150].map((p) => (
          <text
            key={p}
            x="34"
            y={y(p) + 3}
            fontSize="9"
            textAnchor="end"
            fill="var(--color-ink-faint)"
            className="tabular"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {p}
          </text>
        ))}

        <path
          d={loop}
          fill="var(--color-arterial)"
          fillOpacity="0.14"
          stroke="var(--color-arterial)"
          strokeWidth="2"
          className="physio-settle"
        />
        <circle
          cx={x(edv)}
          cy={y(fillingPressure)}
          r="3.5"
          fill="var(--color-venous)"
          className="physio-settle"
        />
        <circle
          cx={x(esv)}
          cy={y(heart.systolicMmHg)}
          r="3.5"
          fill="var(--color-arterial)"
          className="physio-settle"
        />

        <g
          fontSize="10"
          fill="var(--color-ink-muted)"
          className="tabular"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <text x={x(edv) + 6} y={y(fillingPressure) + 14}>
            EDV {edv.toFixed(0)}
          </text>
          <text x={x(esv) - 6} y={y(heart.systolicMmHg) - 8} textAnchor="end">
            ESV {esv.toFixed(0)}
          </text>
          <text x="180" y="48">
            SV {heart.strokeVolumeMl.toFixed(0)} mL · EF {(heart.ejectionFraction * 100).toFixed(0)}{' '}
            %
          </text>
          <text x="180" y="62">
            HZV {heart.cardiacOutputLPerMin.toFixed(2)} L/min
          </text>
        </g>
      </svg>
    </div>
  );
}
