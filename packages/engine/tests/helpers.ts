import { createSimulation, type Simulation } from '../src/index';
import { HOUR } from '../src/core/units';

/**
 * Advance the model while letting the event loop breathe.
 *
 * The engine is synchronous and CPU-bound: thirty simulated days are 1.3 million steps in
 * one uninterrupted block. That starves Vitest's worker RPC, which then reports
 * "Timeout calling onTaskUpdate" and fails the run even though every assertion passed —
 * exactly what happened on CI. Yielding between chunks costs nothing and keeps the result
 * bit-for-bit identical, which the determinism test in tests/invariants guarantees.
 */
export async function advanceChunked(
  sim: Simulation,
  seconds: number,
  chunk: number = 12 * HOUR,
): Promise<void> {
  let remaining = seconds;
  while (remaining > 0) {
    const step = Math.min(chunk, remaining);
    sim.advance(step);
    remaining -= step;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * A body at rest with the given parameters, run long enough for the slow loops to settle.
 * Every scenario is judged against this, never against the hard-coded resting constants —
 * so a change in the resting equilibrium cannot silently make a scenario "pass".
 */
export async function settled(
  overrides: Readonly<Record<string, number>> = {},
  seconds: number = 24 * HOUR,
): Promise<Simulation> {
  const sim = createSimulation(overrides);
  await advanceChunked(sim, seconds);
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
