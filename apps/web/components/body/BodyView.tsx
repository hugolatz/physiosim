'use client';

import type { CSSProperties } from 'react';
import type { OrganismSignals } from '@physiosim/engine';
import type { BodyVisual, KidneyVisual } from '@/lib/visuals';
import { perfusionHatchGap } from '@/lib/visuals';

export type OrganId = 'heart' | 'kidneyLeft' | 'kidneyRight' | 'vessels' | 'bladder';

/**
 * The silhouette geometry, defined once and used by both the tissue fill and the ink
 * contour so the two can never drift apart. Schematic, not anatomical drawing.
 */
const SILHOUETTE = {
  torso:
    'M172 94 C172 106 167 110 162 112 C138 118 122 132 120 158 C117 212 122 268 125 312 L128 372 L252 372 L255 312 C258 268 263 212 260 158 C258 132 242 118 218 112 C213 110 208 106 208 94 Z',
  arms: [
    'M126 136 C108 178 100 226 102 274 C103 302 106 322 110 340',
    'M254 136 C272 178 280 226 278 274 C277 302 274 322 270 340',
  ],
  legs: [
    'M158 372 C154 440 152 506 154 564 L156 620',
    'M222 372 C226 440 228 506 226 564 L224 620',
  ],
} as const;

interface BodyViewProps {
  visual: BodyVisual;
  signals: Readonly<OrganismSignals>;
  selected: OrganId | null;
  onSelect: (organ: OrganId) => void;
}

/** Tissue tint from perfusion. Deliberately restrained: the vessels carry the drawing. */
function tissueOpacity(perfusion: number): number {
  const p = Math.min(Math.max(perfusion, 0), 2);
  return 0.035 + 0.085 * p;
}

/**
 * The whole-body view — the signature element.
 *
 * A quiet ink drawing on paper in which only model-driven quantities move: the heart beats
 * at the computed rate and swells with end-diastolic volume, vessel calibre follows
 * resistance through r ∝ R^(−¼), the kidneys take their own perfusion, and drops leave the
 * bladder at the computed urine flow.
 *
 * Anterior view: the patient's LEFT kidney is drawn on the viewer's RIGHT, sits higher than
 * the right one, and its renal vein correctly crosses in front of the aorta.
 */
export function BodyView({ visual, signals, selected, onSelect }: BodyViewProps) {
  const tissue = tissueOpacity(visual.systemicPerfusion);

  return (
    <svg
      viewBox="0 0 380 700"
      className="mx-auto block h-full w-auto max-w-full"
      role="img"
      aria-label={`Ganzkörperansicht. Blutdruck ${signals.systolicMmHg.toFixed(0)} zu ${signals.diastolicMmHg.toFixed(0)} mmHg, Herzfrequenz ${signals.heartRateBpm.toFixed(0)} pro Minute, GFR ${signals.gfrMlPerMin.toFixed(0)} Milliliter pro Minute, Urinfluss ${((signals.urineFlowMlPerMin * 1440) / 1000).toFixed(2)} Liter pro Tag.`}
    >
      <defs>
        <pattern
          id="hatch-l"
          patternUnits="userSpaceOnUse"
          width={perfusionHatchGap(visual.left.perfusion)}
          height={perfusionHatchGap(visual.left.perfusion)}
          patternTransform="rotate(40)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="12"
            stroke="var(--color-filtrate)"
            strokeWidth="1"
            opacity="0.5"
          />
        </pattern>
        <pattern
          id="hatch-r"
          patternUnits="userSpaceOnUse"
          width={perfusionHatchGap(visual.right.perfusion)}
          height={perfusionHatchGap(visual.right.perfusion)}
          patternTransform="rotate(40)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="12"
            stroke="var(--color-filtrate)"
            strokeWidth="1"
            opacity="0.5"
          />
        </pattern>
      </defs>

      {/* ---- silhouette: tissue tint + thin ink contour ------------------- */}
      <g className="physio-settle">
        <g fill="var(--color-arterial)" fillOpacity={tissue}>
          <ellipse cx="190" cy="58" rx="31" ry="37" />
          <path d={SILHOUETTE.torso} />
        </g>
        <g
          fill="none"
          stroke="var(--color-arterial)"
          strokeOpacity={tissue * 1.9}
          strokeLinecap="round"
        >
          <g strokeWidth="18">
            {SILHOUETTE.arms.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g strokeWidth="28">
            {SILHOUETTE.legs.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
        <g
          fill="none"
          stroke="var(--color-ink)"
          strokeOpacity="0.26"
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          <ellipse cx="190" cy="58" rx="31" ry="37" />
          <path d={SILHOUETTE.torso} />
          {[...SILHOUETTE.arms, ...SILHOUETTE.legs].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>

      {/* ---- venous return (behind the arteries) -------------------------- */}
      <g fill="none" strokeLinecap="round">
        <Vessel
          d="M180 366 C176 316 172 256 174 210 L178 184"
          color="var(--color-venous)"
          width={visual.venousWidth}
          flowSeconds={visual.arterialFlowSeconds}
        />
        {/* left renal vein crossing anterior to the aorta */}
        <Vessel
          d="M238 290 C214 296 194 296 180 290"
          color="var(--color-venous)"
          width={visual.venousWidth * 0.4}
          flowSeconds={visual.left.renalArteryFlowSeconds}
        />
        <Vessel
          d="M158 300 C166 300 172 296 178 292"
          color="var(--color-venous)"
          width={visual.venousWidth * 0.4}
          flowSeconds={visual.right.renalArteryFlowSeconds}
        />
      </g>

      {/* ---- arteries ------------------------------------------------------ */}
      <g fill="none" strokeLinecap="round">
        <Vessel
          d="M192 160 C190 138 190 120 190 106"
          color="var(--color-arterial)"
          width={visual.arterialWidth * 0.4}
          flowSeconds={visual.arterialFlowSeconds}
        />
        <Vessel
          d="M204 152 C184 142 152 144 128 158 C120 200 114 250 116 290"
          color="var(--color-arterial)"
          width={visual.arterialWidth * 0.32}
          flowSeconds={visual.arterialFlowSeconds}
        />
        <Vessel
          d="M216 146 C236 146 252 152 258 162 C264 202 268 252 266 292"
          color="var(--color-arterial)"
          width={visual.arterialWidth * 0.32}
          flowSeconds={visual.arterialFlowSeconds}
        />
        <Vessel
          d="M198 162 C202 140 218 134 228 146 C236 156 234 170 229 182 C218 216 210 262 206 312 L202 366"
          color="var(--color-arterial)"
          width={visual.arterialWidth}
          flowSeconds={visual.arterialFlowSeconds}
        />
        <Vessel
          d="M202 366 C190 378 172 386 158 394 C154 452 152 512 153 566"
          color="var(--color-arterial)"
          width={visual.arterialWidth * 0.5}
          flowSeconds={visual.arterialFlowSeconds}
        />
        <Vessel
          d="M202 366 C208 378 216 386 222 394 C226 452 228 512 227 566"
          color="var(--color-arterial)"
          width={visual.arterialWidth * 0.5}
          flowSeconds={visual.arterialFlowSeconds}
        />
        {/* renal arteries carry their own kidney's flow */}
        <Vessel
          d="M209 292 C190 296 168 296 156 294"
          color="var(--color-arterial)"
          width={visual.arterialWidth * 0.38}
          flowSeconds={visual.right.renalArteryFlowSeconds}
        />
        <Vessel
          d="M210 280 C220 279 228 279 236 280"
          color="var(--color-arterial)"
          width={visual.arterialWidth * 0.38}
          flowSeconds={visual.left.renalArteryFlowSeconds}
        />
      </g>

      {/* ---- kidneys -------------------------------------------------------- */}
      <Kidney
        cx={140}
        cy={288}
        mirrored
        visual={visual.right}
        patternId="hatch-r"
        label="rechts"
        selected={selected === 'kidneyRight'}
        onSelect={() => onSelect('kidneyRight')}
      />
      <Kidney
        cx={240}
        cy={278}
        visual={visual.left}
        patternId="hatch-l"
        label="links"
        selected={selected === 'kidneyLeft'}
        onSelect={() => onSelect('kidneyLeft')}
      />

      {/* ---- ureters and bladder --------------------------------------------- */}
      <g
        fill="none"
        stroke="var(--color-filtrate)"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      >
        <path d="M150 316 C156 344 166 372 180 388" />
        <path d="M238 306 C232 338 214 368 200 388" />
      </g>

      <g
        onClick={() => onSelect('bladder')}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Harnblase, Urinfluss ${((signals.urineFlowMlPerMin * 1440) / 1000).toFixed(2)} Liter pro Tag`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect('bladder');
        }}
      >
        <ellipse
          cx="190"
          cy="398"
          rx="22"
          ry="16"
          fill="var(--color-filtrate)"
          fillOpacity="0.2"
          stroke="var(--color-filtrate)"
          strokeWidth={selected === 'bladder' ? 2.6 : 1.5}
          className="physio-settle"
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="190"
            cy="418"
            r="3"
            fill="var(--color-filtrate)"
            className="physio-drop"
            style={
              {
                '--drop-seconds': `${visual.totalUrineDropSeconds}s`,
                '--drop-delay': `${(visual.totalUrineDropSeconds / 3) * i}s`,
                '--drop-distance': '22px',
              } as CSSProperties
            }
          />
        ))}
      </g>

      {/* ---- heart ------------------------------------------------------------ */}
      <g
        onClick={() => onSelect('heart')}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Herz, ${signals.heartRateBpm.toFixed(0)} Schläge pro Minute, Herzzeitvolumen ${signals.cardiacOutputLPerMin.toFixed(1)} Liter pro Minute`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect('heart');
        }}
      >
        <g
          transform={`translate(190 191) scale(${visual.heartScale.toFixed(3)}) translate(-190 -191)`}
          className="physio-settle"
        >
          <g
            className="physio-beat"
            style={
              {
                '--beat-seconds': `${visual.beatSeconds}s`,
                '--beat-peak': visual.beatAmplitude.toFixed(3),
              } as CSSProperties
            }
          >
            <path
              d="M190 160 C203 157 214 168 215 185 C216 204 205 218 190 224 C175 218 164 204 165 185 C166 168 177 157 190 160 Z"
              fill="var(--color-arterial)"
              fillOpacity="0.72"
              stroke="var(--color-ink)"
              strokeOpacity={selected === 'heart' ? 0.85 : 0.3}
              strokeWidth={selected === 'heart' ? 2.2 : 1}
              className="physio-settle"
            />
            <path
              d="M186 162 C180 180 181 202 189 221"
              fill="none"
              stroke="var(--color-paper)"
              strokeOpacity="0.4"
              strokeWidth="1.6"
            />
          </g>
        </g>
      </g>

      {/* ---- labels outside the silhouette ------------------------------------ */}
      <g fontSize="11" className="tabular" style={{ fontFamily: 'var(--font-sans)' }}>
        <Label
          x={296}
          y={182}
          value={`${signals.heartRateBpm.toFixed(0)} /min`}
          caption="Herzfrequenz"
        />
        <Label
          x={296}
          y={214}
          value={`${signals.cardiacOutputLPerMin.toFixed(2)} L/min`}
          caption="Herzzeitvolumen"
        />
        <Label
          x={84}
          y={182}
          anchor="end"
          value={`${signals.systolicMmHg.toFixed(0)}/${signals.diastolicMmHg.toFixed(0)}`}
          caption="Blutdruck (mmHg)"
        />
        <Label
          x={84}
          y={296}
          anchor="end"
          value={`${visual.right.gfrMlPerMin.toFixed(0)} mL/min`}
          caption="GFR rechts"
        />
        <Label
          x={296}
          y={286}
          value={`${visual.left.gfrMlPerMin.toFixed(0)} mL/min`}
          caption="GFR links"
        />
        <Label
          x={296}
          y={410}
          value={`${((signals.urineFlowMlPerMin * 1440) / 1000).toFixed(2)} L/d`}
          caption="Urinfluss"
        />
      </g>

      {/* ---- blood volume gauge ------------------------------------------------ */}
      <g transform="translate(30 452)">
        <text
          x="0"
          y="-10"
          fontSize="10"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Blutvolumen
        </text>
        <rect
          x="0"
          y="0"
          width="13"
          height="110"
          rx="6.5"
          fill="var(--color-venous)"
          fillOpacity="0.1"
          stroke="var(--color-rule)"
          strokeWidth="1"
        />
        <rect
          x="0"
          y={110 - visual.volumeFill * 110}
          width="13"
          height={visual.volumeFill * 110}
          rx="6.5"
          fill="var(--color-venous)"
          fillOpacity="0.7"
          className="physio-settle"
        />
        <line
          x1="-4"
          y1="55"
          x2="17"
          y2="55"
          stroke="var(--color-ink)"
          strokeWidth="1"
          opacity="0.45"
        />
        <text
          x="21"
          y="59"
          fontSize="9"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          5 L
        </text>
        <text
          x="0"
          y="128"
          fontSize="11"
          fill="var(--color-ink)"
          className="tabular"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {signals.bloodVolumeL.toFixed(2)} L
        </text>
      </g>

      {/* ---- vessel hotspot ----------------------------------------------------- */}
      <rect
        x="196"
        y="200"
        width="26"
        height="160"
        fill="transparent"
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Gefäße, peripherer Widerstand ${signals.tprMmHgMinPerL.toFixed(1)} mmHg mal Minute pro Liter`}
        onClick={() => onSelect('vessels')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect('vessels');
        }}
      />
    </svg>
  );
}

function Label({
  x,
  y,
  value,
  caption,
  anchor = 'start',
}: {
  x: number;
  y: number;
  value: string;
  caption: string;
  anchor?: 'start' | 'end';
}) {
  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fill="var(--color-ink)"
        fontSize="12.5"
        fontWeight="500"
      >
        {value}
      </text>
      <text x={x} y={y + 12} textAnchor={anchor} fill="var(--color-ink-faint)" fontSize="9.5">
        {caption}
      </text>
    </g>
  );
}

/** A vessel: the lumen plus a travelling marker whose speed is that vessel's flow. */
function Vessel({
  d,
  color,
  width,
  flowSeconds,
}: {
  d: string;
  color: string;
  width: number;
  flowSeconds: number;
}) {
  return (
    <>
      <path
        d={d}
        stroke={color}
        strokeWidth={width}
        strokeOpacity="0.42"
        className="physio-settle"
      />
      <path
        d={d}
        stroke={color}
        strokeWidth={Math.max(width * 0.42, 1.2)}
        strokeDasharray="3 22"
        strokeOpacity="0.95"
        className="physio-flow physio-settle"
        style={{ '--flow-seconds': `${flowSeconds}s`, '--flow-shift': '-25' } as CSSProperties}
      />
    </>
  );
}

function Kidney({
  cx,
  cy,
  mirrored = false,
  visual,
  patternId,
  label,
  selected,
  onSelect,
}: {
  cx: number;
  cy: number;
  mirrored?: boolean;
  visual: KidneyVisual;
  patternId: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  // Bean with the hilum notch on the right, mirrored on the other side so both hila face
  // the aorta.
  const bean =
    'M0 -27 C13 -28 21 -19 21 -7 C21 -3 17 -2 13 0 C17 2 21 3 21 7 C21 19 13 28 0 27 C-14 26 -22 14 -22 0 C-22 -14 -14 -28 0 -27 Z';
  return (
    <g
      transform={`translate(${cx} ${cy}) scale(${mirrored ? -1 : 1} 1)`}
      onClick={onSelect}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`Niere ${label}, GFR ${visual.gfrMlPerMin.toFixed(0)} Milliliter pro Minute, Perfusionsdruck ${visual.perfusionPressureMmHg.toFixed(0)} mmHg`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
    >
      <path
        d={bean}
        fill="var(--color-filtrate)"
        fillOpacity={0.12 + 0.34 * Math.min(visual.perfusion, 2)}
        stroke="var(--color-filtrate)"
        strokeWidth={selected ? 2.6 : 1.5}
        className="physio-settle"
      />
      {/* hatch density carries the same perfusion value without relying on colour */}
      <path d={bean} fill={`url(#${patternId})`} className="physio-settle" />
      <ellipse
        cx="-2"
        cy="0"
        rx="8"
        ry="13"
        fill="var(--color-filtrate)"
        fillOpacity={0.1 + 0.3 * Math.min(visual.filtration, 2)}
        className="physio-settle"
      />
    </g>
  );
}
