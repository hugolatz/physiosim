import type { Simulation } from '../src/index';
import { createSimulation } from '../src/index';
import { HOUR } from '../src/core/units';

/**
 * A body at rest with the given parameters, run long enough for the slow loops to settle.
 * Every scenario is judged against this, never against the hard-coded resting constants —
 * so a change in the resting equilibrium cannot silently make a scenario "pass".
 */
export function settled(
  overrides: Readonly<Record<string, number>> = {},
  seconds: number = 24 * HOUR,
): Simulation {
  const sim = createSimulation(overrides);
  sim.advance(seconds);
  return sim;
}

/** All readouts as a plain id -> value map, for compact assertions. */
export function values(sim: Simulation): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of sim.readouts()) out[r.id] = r.value;
  return out;
}

/** Relative change from `before` to `after`, e.g. 0.25 for a 25 % rise. */
export function change(before: number, after: number): number {
  if (before === 0) return after === 0 ? 0 : Number.POSITIVE_INFINITY;
  return (after - before) / Math.abs(before);
}
