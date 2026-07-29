import type { KidneyState, OrganismSignals, RenalState } from '@physiosim/engine';
import { renalConstants, RESTING_SIGNALS } from '@physiosim/engine';

/**
 * Model quantities to visual properties.
 *
 * This module is the promise that the picture never lies: every width, colour, speed and
 * interval on screen is computed here from a number the engine produced. Nothing is chosen
 * for looks alone. If a quantity is not in the model, it does not get its own visual
 * channel — see `systemicPerfusion` for the one place where that rule bites.
 */

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return value < min ? min : value > max ? max : value;
}

/**
 * Vessel radius from resistance, via Hagen-Poiseuille: R ∝ 1/r⁴, so r ∝ R^(−1/4).
 *
 * This is why a doubling of resistance narrows a vessel visibly but not dramatically —
 * the fourth power means small calibre changes carry large resistance changes. Students
 * should see exactly that disproportion.
 */
export function radiusFromResistance(
  resistance: number,
  restingResistance: number,
  baseWidth: number,
  limits: readonly [number, number] = [0.45, 2.2],
): number {
  const ratio = clamp(resistance / restingResistance, 0.05, 20);
  return baseWidth * clamp(Math.pow(ratio, -0.25), limits[0], limits[1]);
}

/**
 * Radius of a compliant tube from the volume it holds: for a fixed length, cross-section
 * scales with volume, so radius scales with its square root.
 */
export function radiusFromVolume(
  volumeL: number,
  restingVolumeL: number,
  baseWidth: number,
): number {
  const ratio = clamp(volumeL / restingVolumeL, 0.2, 3);
  return baseWidth * clamp(Math.sqrt(ratio), 0.55, 1.6);
}

/** Seconds per cardiac cycle. Drives the pulse animation. */
export function beatSeconds(heartRateBpm: number): number {
  const bpm = clamp(heartRateBpm, 20, 240);
  // Quantised so that a jitter of 0.01 bpm does not retime the animation every frame.
  return Math.round((60 / bpm) * 50) / 50;
}

/**
 * How far the ventricle visibly contracts. Ejection fraction is the honest source: a
 * failing heart with EF 25 % barely moves, and that is the point.
 */
export function beatAmplitude(ejectionFractionPercent: number): number {
  const ef = clamp(ejectionFractionPercent / 100, 0.05, 0.9);
  return 1 + 0.16 * (ef / 0.58);
}

/** Seconds between urine drops at the bladder. Derived from urine flow. */
export function dropSeconds(urineFlowMlPerMin: number): number {
  // One drop stands for 0.05 mL of model urine; at 1.04 mL/min that is ~1.15 s per drop.
  const flow = clamp(urineFlowMlPerMin, 0.01, 40);
  return clamp(Math.round((0.05 / flow) * 60 * 20) / 20, 0.18, 6);
}

/**
 * Seconds for one dash of the flow marker to travel its vessel. Faster flow, faster dash.
 * `restingFlow` is the flow at which the dash takes `restingSeconds`.
 */
export function flowSeconds(flow: number, restingFlow: number, restingSeconds = 1.6): number {
  const ratio = clamp(flow / restingFlow, 0.02, 8);
  return clamp(Math.round((restingSeconds / ratio) * 20) / 20, 0.2, 14);
}

/**
 * Systemic perfusion index, 1 = resting.
 *
 * Honesty note: the model computes flow separately only for the kidneys. Cerebral, limb
 * and splanchnic flows are *not* individually modelled, so they must not get individual
 * colours. They all share this one index, derived from cardiac output, and the legend says
 * so. Giving them separate shades would be inventing data.
 */
export function systemicPerfusion(signals: Readonly<OrganismSignals>): number {
  return clamp(signals.cardiacOutputLPerMin / RESTING_SIGNALS.cardiacOutputLPerMin, 0.15, 2.2);
}

/** Per-kidney perfusion index, 1 = resting. This one *is* individually modelled. */
export function kidneyPerfusion(kidney: KidneyState): number {
  return clamp(kidney.renalBloodFlowMlPerMin / renalConstants.RBF_PER_KIDNEY, 0, 2.2);
}

/** Per-kidney filtration index, 1 = resting. */
export function kidneyFiltration(kidney: KidneyState): number {
  return clamp(kidney.gfrMlPerMin / renalConstants.GFR_PER_KIDNEY, 0, 2.2);
}

/**
 * Opacity for a perfusion-driven fill. Never goes fully transparent: an organ with no flow
 * must still be visible as an organ, marked as ischaemic by its label and its outline.
 */
export function perfusionOpacity(index: number): number {
  return clamp(0.1 + 0.62 * clamp(index, 0, 2), 0.08, 0.95);
}

/**
 * Perfusion also drives a hatch density, so the information survives on a monochrome
 * screen and for a viewer with a colour vision deficiency (colour is never the only
 * carrier — Abschnitt 8 der Vorgabe).
 */
export function perfusionHatchGap(index: number): number {
  return clamp(9 - 4 * clamp(index, 0, 2), 2.2, 11);
}

export interface KidneyVisual {
  perfusion: number;
  filtration: number;
  /** Stroke widths of the two arterioles — the heart of the ACE-inhibitor lesson. */
  afferentWidth: number;
  efferentWidth: number;
  glomerularPressureMmHg: number;
  filtrationFractionPercent: number;
  urineDropSeconds: number;
  renalArteryFlowSeconds: number;
  perfusionPressureMmHg: number;
  reninRelative: number;
  gfrMlPerMin: number;
  renalBloodFlowMlPerMin: number;
  urineFlowMlPerDay: number;
  /** Fractional reabsorption per segment, for the arrow lengths in the tubule view. */
  segments: {
    proximal: number;
    thickAscending: number;
    distal: number;
    collecting: number;
    excreted: number;
  };
  maculaDensaRelative: number;
}

export function kidneyVisual(kidney: KidneyState, baseArterioleWidth = 7): KidneyVisual {
  const filtered = Math.max(kidney.filteredSodiumMmolPerMin, 1e-6);
  return {
    perfusion: kidneyPerfusion(kidney),
    filtration: kidneyFiltration(kidney),
    afferentWidth: radiusFromResistance(
      kidney.afferentResistance,
      renalConstants.R_AFFERENT_BASE,
      baseArterioleWidth,
    ),
    efferentWidth: radiusFromResistance(
      kidney.efferentResistance,
      renalConstants.R_EFFERENT_BASE,
      baseArterioleWidth * 0.8,
    ),
    glomerularPressureMmHg: kidney.glomerularPressureMmHg,
    filtrationFractionPercent: kidney.filtrationFraction * 100,
    urineDropSeconds: dropSeconds(kidney.urineFlowMlPerMin),
    renalArteryFlowSeconds: flowSeconds(
      kidney.renalBloodFlowMlPerMin,
      renalConstants.RBF_PER_KIDNEY,
    ),
    perfusionPressureMmHg: kidney.perfusionPressureMmHg,
    reninRelative: kidney.reninSecretionRelative,
    gfrMlPerMin: kidney.gfrMlPerMin,
    renalBloodFlowMlPerMin: kidney.renalBloodFlowMlPerMin,
    urineFlowMlPerDay: (kidney.urineFlowMlPerMin * 1440) / 1000,
    segments: {
      proximal: kidney.proximalReabsorptionMmolPerMin / filtered,
      thickAscending: kidney.talReabsorptionMmolPerMin / filtered,
      distal: kidney.distalReabsorptionMmolPerMin / filtered,
      collecting: kidney.collectingDuctReabsorptionMmolPerMin / filtered,
      excreted: kidney.sodiumExcretionMmolPerMin / filtered,
    },
    maculaDensaRelative:
      kidney.maculaDensaDeliveryMmolPerMin / renalConstants.MACULA_DENSA_REFERENCE_MMOL_PER_MIN,
  };
}

export interface BodyVisual {
  beatSeconds: number;
  beatAmplitude: number;
  /** Linear scale of the ventricle from end-diastolic volume — a dilated heart looks it. */
  heartScale: number;
  /** Aortic and vena cava stroke widths. */
  arterialWidth: number;
  venousWidth: number;
  arterialFlowSeconds: number;
  systemicPerfusion: number;
  /** Venous filling as a fraction of the gauge, from blood volume. */
  volumeFill: number;
  left: KidneyVisual;
  right: KidneyVisual;
  totalUrineDropSeconds: number;
}

export function bodyVisual(
  signals: Readonly<OrganismSignals>,
  renal: RenalState,
  heart: { endDiastolicVolumeMl: number; ejectionFraction: number },
): BodyVisual {
  return {
    beatSeconds: beatSeconds(signals.heartRateBpm),
    beatAmplitude: beatAmplitude(heart.ejectionFraction * 100),
    // A volume scales with the cube of a length, so the drawn size follows the cube root.
    heartScale: clamp(Math.cbrt(heart.endDiastolicVolumeMl / 120), 0.72, 1.32),
    arterialWidth: radiusFromResistance(signals.tprMmHgMinPerL, RESTING_SIGNALS.tprMmHgMinPerL, 11),
    venousWidth: radiusFromVolume(signals.bloodVolumeL, RESTING_SIGNALS.bloodVolumeL, 13),
    arterialFlowSeconds: flowSeconds(
      signals.cardiacOutputLPerMin,
      RESTING_SIGNALS.cardiacOutputLPerMin,
      1.5,
    ),
    systemicPerfusion: systemicPerfusion(signals),
    // The gauge spans 3–7 L, so the resting 5 L sits in the middle and both directions
    // are visible.
    volumeFill: clamp((signals.bloodVolumeL - 3) / 4, 0.02, 1),
    left: kidneyVisual(renal.left),
    right: kidneyVisual(renal.right),
    totalUrineDropSeconds: dropSeconds(signals.urineFlowMlPerMin),
  };
}

/** Blend between two hex colours. Used for perfusion gradients. */
export function mix(from: string, to: string, t: number): string {
  const f = parseInt(from.slice(1), 16);
  const g = parseInt(to.slice(1), 16);
  const amount = clamp(t, 0, 1);
  const r = Math.round(((f >> 16) & 255) + (((g >> 16) & 255) - ((f >> 16) & 255)) * amount);
  const gr = Math.round(((f >> 8) & 255) + (((g >> 8) & 255) - ((f >> 8) & 255)) * amount);
  const b = Math.round((f & 255) + ((g & 255) - (f & 255)) * amount);
  return `#${((r << 16) | (gr << 8) | b).toString(16).padStart(6, '0')}`;
}
