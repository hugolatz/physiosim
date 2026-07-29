import { ALL_PARAMS } from '@physiosim/engine';

/**
 * The whole simulation state lives in the query string, so a situation can be shared as a
 * link. Only parameters that differ from their default are written — a shared URL stays
 * short and readable, and it says exactly what was changed.
 */

export interface SharedState {
  params: Record<string, number>;
  scenario: string | null;
}

export function encodeState(params: Record<string, number>, scenario: string | null): string {
  const query = new URLSearchParams();
  if (scenario !== null && scenario !== '') query.set('szenario', scenario);
  for (const def of ALL_PARAMS) {
    const value = params[def.id];
    if (value === undefined || value === def.default) continue;
    // Trim the float noise a slider can produce.
    query.set(def.id, String(Math.round(value * 1000) / 1000));
  }
  return query.toString();
}

export function decodeState(search: string): SharedState {
  const query = new URLSearchParams(search);
  const params: Record<string, number> = {};
  for (const def of ALL_PARAMS) {
    const raw = query.get(def.id);
    if (raw === null) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    params[def.id] = Math.min(Math.max(value, def.min), def.max);
  }
  return { params, scenario: query.get('szenario') };
}

/** Replace the address bar without adding a history entry. */
export function pushState(params: Record<string, number>, scenario: string | null): void {
  if (typeof window === 'undefined') return;
  const query = encodeState(params, scenario);
  const url = query === '' ? window.location.pathname : `${window.location.pathname}?${query}`;
  window.history.replaceState(null, '', url);
}

export function currentShareUrl(params: Record<string, number>, scenario: string | null): string {
  if (typeof window === 'undefined') return '';
  const query = encodeState(params, scenario);
  const { origin, pathname } = window.location;
  return query === '' ? `${origin}${pathname}` : `${origin}${pathname}?${query}`;
}
