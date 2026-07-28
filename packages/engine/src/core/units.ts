/**
 * Units and small numeric helpers.
 *
 * Every quantity that leaves the engine carries its unit, so the UI never has to guess
 * and no value can be silently mixed up (mL/min vs L/min has caused real bugs).
 */

export type Seconds = number;

export const SECOND = 1;
export const MINUTE = 60;
export const HOUR = 3600;
export const DAY = 86_400;

export type Unit =
  | '1'
  | '%'
  | '1/min'
  | 'mmHg'
  | 'mL'
  | 'L'
  | 'mL/min'
  | 'L/min'
  | 'L/d'
  | 'mL/min/mmHg'
  | 'mmHg·min/L'
  | 'mmHg·min/mL'
  | 'mmol'
  | 'mmol/L'
  | 'mmol/d'
  | 'mmol/min'
  | 'mosm/kg'
  | 'mosm/d'
  | 'ng/L'
  | 'ng/mL/h'
  | 'd'
  | 's';

/** Restrict a value to a range. Used everywhere a physiological quantity has hard bounds. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return value < min ? min : value > max ? max : value;
}

/** Non-negative floor — volumes, concentrations and flows may never go below zero. */
export function nonNegative(value: number): number {
  return Number.isNaN(value) || value < 0 ? 0 : value;
}

/**
 * First-order relaxation towards `target` with time constant `tau` (seconds).
 * The workhorse of every hormone pool and every reflex in this model.
 */
export function relax(current: number, target: number, tau: Seconds, dt: Seconds): number {
  if (tau <= 0) return target;
  return current + ((target - current) * dt) / tau;
}

/**
 * Sigmoid response curve, normalised so that `f(x50) = 0.5`.
 * `steepness` > 0; larger values make the transition sharper.
 */
export function sigmoid(x: number, x50: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (x - x50)));
}

/** Linear interpolation, `t` clamped to [0, 1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}
