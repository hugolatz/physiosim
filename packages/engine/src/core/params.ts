import type { ParamDefinition, Params } from './types';
import { clamp } from './units';

/**
 * Turn parameter definitions plus user overrides into a complete, validated set.
 *
 * Every declared id is present afterwards, so model code can read `p.naIntake` without
 * undefined checks, and out-of-range values from a shared URL cannot corrupt a run.
 */
export function resolveParams(
  definitions: readonly ParamDefinition[],
  overrides: Readonly<Record<string, number>> = {},
): Params {
  const resolved: Record<string, number> = {};
  for (const def of definitions) {
    const raw = overrides[def.id];
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : def.default;
    resolved[def.id] = clamp(value, def.min, def.max);
  }
  return Object.freeze(resolved);
}

/** Read a parameter that is known to be declared. Throws early if a model asks for a typo. */
export function param(p: Params, id: string): number {
  const value = p[id];
  if (value === undefined) {
    throw new Error(`Unknown parameter "${id}". Declare it in the system's params list.`);
  }
  return value;
}

/** Definitions of several systems merged; duplicate ids are a programming error. */
export function mergeParamDefinitions(
  groups: readonly (readonly ParamDefinition[])[],
): readonly ParamDefinition[] {
  const byId = new Map<string, ParamDefinition>();
  for (const group of groups) {
    for (const def of group) {
      const existing = byId.get(def.id);
      if (existing !== undefined && existing !== def) {
        throw new Error(`Duplicate parameter id "${def.id}" across systems.`);
      }
      byId.set(def.id, def);
    }
  }
  return [...byId.values()];
}
