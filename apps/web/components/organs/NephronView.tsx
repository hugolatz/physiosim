'use client';

import type { CSSProperties } from 'react';
import type { Modulators } from '@physiosim/engine';
import type { KidneyVisual } from '@/lib/visuals';

interface NephronViewProps {
  visual: KidneyVisual;
  modulation: Modulators;
  sideLabel: string;
  plasmaOncoticMmHg: number;
}

const P_BOWMAN = 18;

/**
 * The nephron, one zoom level below the body.
 *
 * The two arterioles carry separate widths taken from the two resistances the model
 * actually computes. That is the whole point: give an ACE inhibitor behind a stenosis and
 * you watch the efferent arteriole open, the glomerular pressure fall, and the net
 * filtration pressure bar collapse to nothing.
 *
 * Layout keeps the drawing on the left and all numbers in a column on the right, so
 * nothing overlaps the tubule.
 */
export function NephronView({
  visual,
  modulation,
  sideLabel,
  plasmaOncoticMmHg,
}: NephronViewProps) {
  const oncotic = oncoticMean(visual, plasmaOncoticMmHg);
  const net = visual.glomerularPressureMmHg - P_BOWMAN - oncotic;

  const segments = [
    {
      label: 'Proximaler Tubulus',
      short: 'PT',
      fraction: visual.segments.proximal,
      inhibited: modulation['nhe3.transport'] < 0.95,
    },
    {
      label: 'Dicker aufsteigender Ast',
      short: 'TAL',
      fraction: visual.segments.thickAscending,
      inhibited: modulation['nkcc2.transport'] < 0.95,
    },
    {
      label: 'Distales Konvolut',
      short: 'DCT',
      fraction: visual.segments.distal,
      inhibited: modulation['ncc.transport'] < 0.95,
    },
    {
      label: 'Sammelrohr',
      short: 'SR',
      fraction: visual.segments.collecting,
      inhibited: modulation['enac.transport'] < 0.95 || modulation['mr.receptor'] < 0.95,
    },
  ];

  return (
    <svg
      viewBox="0 0 560 390"
      className="mx-auto block h-full w-full"
      role="img"
      aria-label={`Nephron ${sideLabel}. Glomerulärer Kapillardruck ${visual.glomerularPressureMmHg.toFixed(0)} mmHg, Netto-Filtrationsdruck ${net.toFixed(1)} mmHg, GFR ${visual.gfrMlPerMin.toFixed(1)} Milliliter pro Minute, Filtrationsfraktion ${visual.filtrationFractionPercent.toFixed(1)} Prozent.`}
    >
      {/* ================= drawing ================= */}
      {/* arterioles */}
      <g fill="none" strokeLinecap="round">
        <Arteriole
          d="M20 62 C52 56 74 62 92 74"
          width={visual.afferentWidth}
          flowSeconds={visual.renalArteryFlowSeconds}
        />
        <Arteriole
          d="M130 98 C150 110 162 124 170 140"
          width={visual.efferentWidth}
          flowSeconds={visual.renalArteryFlowSeconds}
        />
      </g>
      <text
        x="20"
        y="44"
        fontSize="11"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Vas afferens · {visual.afferentWidth.toFixed(1)}
      </text>
      <text
        x="178"
        y="150"
        fontSize="11"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Vas efferens · {visual.efferentWidth.toFixed(1)}
      </text>

      {/* Bowman capsule and glomerulus */}
      <circle
        cx="110"
        cy="88"
        r="35"
        fill="var(--color-filtrate)"
        fillOpacity="0.12"
        stroke="var(--color-filtrate)"
        strokeWidth="1.5"
      />
      <circle
        cx="110"
        cy="88"
        r="24"
        fill="var(--color-arterial)"
        fillOpacity="0.28"
        stroke="var(--color-arterial)"
        strokeWidth="1.3"
      />
      <path
        d="M96 78 C104 70 116 72 122 80 M94 90 C104 84 118 86 124 94 M98 100 C106 96 116 98 122 102"
        fill="none"
        stroke="var(--color-arterial)"
        strokeWidth="1.5"
        opacity="0.75"
      />
      {/* filtrate crossing the barrier at the computed filtration rate */}
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={98 + i * 7}
          cy="110"
          r="2.4"
          fill="var(--color-filtrate)"
          className="physio-filter"
          style={
            {
              '--filter-seconds': `${(1.3 / Math.max(visual.filtration, 0.06)).toFixed(2)}s`,
              '--filter-delay': `${i * 0.26}s`,
              '--filter-dx': '9px',
              '--filter-dy': '15px',
            } as CSSProperties
          }
        />
      ))}

      {/* tubule */}
      <g
        fill="none"
        stroke="var(--color-filtrate)"
        strokeWidth="7.5"
        strokeLinecap="round"
        opacity="0.5"
      >
        <path d="M122 116 C144 126 158 140 166 158 C172 172 178 178 182 190" />
        <path d="M182 190 C188 218 192 238 194 262" />
        <path d="M194 262 C196 284 220 284 222 262" />
        <path d="M222 262 C224 228 218 194 210 170 C202 146 176 130 150 124" />
        <path d="M150 124 C178 116 210 116 238 124" />
        <path d="M238 124 C262 132 270 152 272 180 L278 302" />
      </g>

      {/* macula densa: the sensor that closes the TGF loop */}
      <circle
        cx="148"
        cy="123"
        r="5.5"
        fill="var(--color-signal)"
        stroke="var(--color-ink)"
        strokeWidth="0.9"
      />
      <path
        d="M144 119 C130 110 112 100 100 84"
        fill="none"
        stroke="var(--color-signal)"
        strokeWidth="1.3"
        strokeDasharray="3 4"
        opacity="0.8"
      />

      {/* reabsorption arrows: length is the fractional reabsorption, labels live right */}
      <ReabsorptionArrow
        x={152}
        y={150}
        dx={-50}
        dy={34}
        fraction={segments[0]!.fraction}
        short="PT"
        inhibited={segments[0]!.inhibited}
      />
      <ReabsorptionArrow
        x={234}
        y={232}
        dx={46}
        dy={16}
        fraction={segments[1]!.fraction}
        short="TAL"
        inhibited={segments[1]!.inhibited}
      />
      <ReabsorptionArrow
        x={194}
        y={116}
        dx={0}
        dy={-38}
        fraction={segments[2]!.fraction}
        short="DCT"
        inhibited={segments[2]!.inhibited}
      />
      <ReabsorptionArrow
        x={276}
        y={244}
        dx={44}
        dy={2}
        fraction={segments[3]!.fraction}
        short="SR"
        inhibited={segments[3]!.inhibited}
      />

      {/* urine leaving */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx="278"
          cy="312"
          r="3.4"
          fill="var(--color-filtrate)"
          className="physio-drop"
          style={
            {
              '--drop-seconds': `${visual.urineDropSeconds}s`,
              '--drop-delay': `${(visual.urineDropSeconds / 3) * i}s`,
              '--drop-distance': '22px',
            } as CSSProperties
          }
        />
      ))}
      <text
        x="20"
        y="330"
        fontSize="11"
        fill="var(--color-signal)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Macula densa: {(visual.maculaDensaRelative * 100).toFixed(0)} % der Norm → TGF
      </text>
      <text
        x="20"
        y="348"
        fontSize="11"
        fill="var(--color-ink-faint)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        gestrichelt: Rückkopplung auf das Vas afferens
      </text>

      {/* ================= numbers column ================= */}
      <g transform="translate(354 18)">
        <SectionTitle y={0}>Filtrationsdrücke (mmHg)</SectionTitle>
        <PressureBar y={20} label="P_GC" value={visual.glomerularPressureMmHg} sign={1} />
        <PressureBar y={40} label="P_Bowman" value={P_BOWMAN} sign={-1} />
        <PressureBar y={60} label="π_GC" value={oncotic} sign={-1} />
        <line x1="0" y1="72" x2="180" y2="72" stroke="var(--color-rule)" strokeWidth="1" />
        <PressureBar y={90} label="netto" value={net} sign={net >= 0 ? 1 : -1} emphasis />

        <SectionTitle y={126}>Na⁺-Rückresorption (Anteil filtriert)</SectionTitle>
        {segments.map((s, i) => (
          <FractionBar
            key={s.short}
            y={146 + i * 22}
            label={s.label}
            fraction={s.fraction}
            inhibited={s.inhibited}
          />
        ))}
        <FractionBar
          y={146 + segments.length * 22}
          label="ausgeschieden"
          fraction={visual.segments.excreted}
          highlight
        />

        <SectionTitle y={264}>Fluss und Regelung</SectionTitle>
        <Stat y={282} label="GFR" value={`${visual.gfrMlPerMin.toFixed(1)} mL/min`} />
        <Stat
          y={298}
          label="Nierendurchblutung"
          value={`${visual.renalBloodFlowMlPerMin.toFixed(0)} mL/min`}
        />
        <Stat
          y={314}
          label="Filtrationsfraktion"
          value={`${visual.filtrationFractionPercent.toFixed(1)} %`}
        />
        <Stat
          y={330}
          label="Perfusionsdruck"
          value={`${visual.perfusionPressureMmHg.toFixed(0)} mmHg`}
        />
        <Stat
          y={346}
          label="Reninfreisetzung"
          value={`${visual.reninRelative.toFixed(2)} × Ruhe`}
        />
        <Stat y={362} label="Urin" value={`${visual.urineFlowMlPerDay.toFixed(2)} L/d`} />
      </g>
    </svg>
  );
}

/** Mean glomerular oncotic pressure — the same expression the engine uses. */
function oncoticMean(visual: KidneyVisual, plasmaOncoticMmHg: number): number {
  const ff = Math.min(Math.max(visual.filtrationFractionPercent / 100, 0), 0.6);
  return plasmaOncoticMmHg * (1 + (0.5 * ff) / (1 - ff));
}

function SectionTitle({ y, children }: { y: number; children: string }) {
  return (
    <text
      x="0"
      y={y}
      fontSize="10"
      fill="var(--color-ink-faint)"
      letterSpacing="0.08em"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {children.toUpperCase()}
    </text>
  );
}

function Stat({ y, label, value }: { y: number; label: string; value: string }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <text
        x="0"
        y="0"
        fontSize="11"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </text>
      <text
        x="180"
        y="0"
        fontSize="11.5"
        textAnchor="end"
        fill="var(--color-ink)"
        className="tabular"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {value}
      </text>
    </g>
  );
}

function PressureBar({
  y,
  label,
  value,
  sign,
  emphasis = false,
}: {
  y: number;
  label: string;
  value: number;
  sign: 1 | -1;
  emphasis?: boolean;
}) {
  const width = Math.max(Math.min(Math.abs(value) * 1.5, 110), 2);
  const color = sign > 0 ? 'var(--color-arterial)' : 'var(--color-venous)';
  return (
    <g transform={`translate(0 ${y})`}>
      <rect
        x="0"
        y="-8"
        width={width}
        height="11"
        rx="2"
        fill={color}
        fillOpacity={emphasis ? 0.9 : 0.45}
        className="physio-settle"
      />
      <text
        x="180"
        y="1"
        fontSize="11"
        textAnchor="end"
        fill={emphasis ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
        className="tabular"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label} {value.toFixed(1)}
      </text>
    </g>
  );
}

function FractionBar({
  y,
  label,
  fraction,
  inhibited = false,
  highlight = false,
}: {
  y: number;
  label: string;
  fraction: number;
  inhibited?: boolean;
  highlight?: boolean;
}) {
  const width = Math.max(Math.min(fraction * 150, 150), 0.5);
  const color = inhibited
    ? 'var(--color-signal)'
    : highlight
      ? 'var(--color-arterial)'
      : 'var(--color-filtrate)';
  return (
    <g transform={`translate(0 ${y})`}>
      <text
        x="0"
        y="0"
        fontSize="10"
        fill={inhibited ? 'var(--color-signal)' : 'var(--color-ink-muted)'}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label}
        {inhibited ? ' · gehemmt' : ''}
      </text>
      <text
        x="180"
        y="0"
        fontSize="11"
        textAnchor="end"
        fill="var(--color-ink)"
        className="tabular"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {(fraction * 100).toFixed(fraction < 0.02 ? 2 : 1)} %
      </text>
      <rect
        x="0"
        y="4"
        width={width}
        height="5"
        rx="2.5"
        fill={color}
        fillOpacity="0.7"
        className="physio-settle"
      />
    </g>
  );
}

function Arteriole({ d, width, flowSeconds }: { d: string; width: number; flowSeconds: number }) {
  return (
    <>
      <path
        d={d}
        stroke="var(--color-arterial)"
        strokeWidth={width}
        strokeOpacity="0.8"
        className="physio-settle"
      />
      <path
        d={d}
        stroke="var(--color-arterial)"
        strokeWidth={Math.max(width * 0.42, 1.1)}
        strokeDasharray="3.5 20"
        className="physio-flow physio-settle"
        style={{ '--flow-seconds': `${flowSeconds}s`, '--flow-shift': '-23.5' } as CSSProperties}
      />
    </>
  );
}

/** Arrow whose length is the fraction of the filtered sodium load this segment reabsorbs. */
function ReabsorptionArrow({
  x,
  y,
  dx,
  dy,
  fraction,
  short,
  inhibited,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  fraction: number;
  short: string;
  inhibited: boolean;
}) {
  const scale = Math.min(Math.max(fraction / 0.67, 0.02), 1.4);
  const ex = x + dx * scale;
  const ey = y + dy * scale;
  const color = inhibited ? 'var(--color-signal)' : 'var(--color-filtrate)';
  return (
    <g className="physio-settle">
      <line
        x1={x}
        y1={y}
        x2={ex}
        y2={ey}
        stroke={color}
        strokeWidth={inhibited ? 3 : 2.4}
        strokeLinecap="round"
        className="physio-settle"
      />
      <circle cx={ex} cy={ey} r="2.8" fill={color} className="physio-settle" />
      <text
        x={ex + (dx < 0 ? -7 : dx > 0 ? 7 : 0)}
        y={ey + (dy < 0 ? -7 : 13)}
        fontSize="9.5"
        textAnchor={dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle'}
        fill={color}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {short}
      </text>
    </g>
  );
}
