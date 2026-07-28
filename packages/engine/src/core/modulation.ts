/**
 * Drug and pathology action points.
 *
 * A drug never changes a displayed value directly. It changes one named point inside the
 * model, and everything else follows (see docs/adr/0005). That is what makes
 * "ACE inhibitor in bilateral renal artery stenosis drops GFR" emerge instead of being
 * scripted.
 */

export const MODULATION_SITES = [
  // RAAS
  'renin.secretion',
  'ace.activity',
  'at1.receptor',
  'aldosterone.secretion',
  'mr.receptor',
  // tubular transport
  'nhe3.transport', // proximal tubule, Na+/H+ exchanger
  'nkcc2.transport', // thick ascending limb, loop diuretics
  'ncc.transport', // distal convoluted tubule, thiazides
  'enac.transport', // collecting duct, amiloride / aldosterone effect
  'aqp2.insertion', // collecting duct water permeability
  'v2.receptor',
  'adh.secretion',
  // vessels and heart
  'beta1.receptor',
  'vsmc.calciumChannel',
  'pge2.afferentDilation', // blocked by NSAIDs
  'raff.tone',
  'reff.tone',
  // glomerulus and plasma
  'kf.filtration',
  'oncotic.plasma',
  'contractility.intrinsic',
] as const;

export type ModulationSite = (typeof MODULATION_SITES)[number];

/** Multiplicative factor per action point; 1 means untouched. */
export type Modulators = Readonly<Record<ModulationSite, number>>;

export const NEUTRAL_MODULATORS: Modulators = Object.freeze(
  Object.fromEntries(MODULATION_SITES.map((site) => [site, 1])) as Record<ModulationSite, number>,
);

/**
 * Effect of one intervention on one action point.
 *
 * `emax` is the factor reached at full intensity: 0.15 means "reduced to 15 %, i.e. 85 %
 * inhibition"; values above 1 mean stimulation. `ec50` is the intensity (in the same 0–100
 * scale the UI uses) at which half of the maximal effect is reached.
 */
export interface DrugEffect {
  readonly site: ModulationSite;
  readonly emax: number;
  readonly ec50: number;
  /** Source, or an explicit note that this is a didactic setting rather than a measurement. */
  readonly source: string;
}

/** Emax model: factor = 1 + (emax - 1) * intensity / (ec50 + intensity). */
export function effectFactor(effect: DrugEffect, intensity: number): number {
  if (intensity <= 0) return 1;
  const occupancy = intensity / (effect.ec50 + intensity);
  return 1 + (effect.emax - 1) * occupancy;
}

/** Combine effects multiplicatively — two drugs on the same site compound their action. */
export function applyEffects(
  base: Modulators,
  effects: readonly { effect: DrugEffect; intensity: number }[],
): Modulators {
  const next: Record<ModulationSite, number> = { ...base };
  for (const { effect, intensity } of effects) {
    next[effect.site] = next[effect.site] * effectFactor(effect, intensity);
  }
  return Object.freeze(next);
}
