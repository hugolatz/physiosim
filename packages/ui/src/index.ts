/**
 * Shared UI primitives and design token names.
 *
 * Kept deliberately small in M0/M1 — the simulator's look is built in M2. What lives here
 * are the names the rest of the app is allowed to use, so colours never get hardcoded.
 */

export const SEMANTIC_COLORS = {
  arterial: 'var(--color-arterial)',
  venous: 'var(--color-venous)',
  filtrate: 'var(--color-filtrate)',
  signal: 'var(--color-signal)',
} as const;

export type SemanticColor = keyof typeof SEMANTIC_COLORS;

/** Transition duration for value-driven visual changes, see docs (Abschnitt 8). */
export const SETTLE_MS = 300;
