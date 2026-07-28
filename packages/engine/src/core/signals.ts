/**
 * The shared signal space of the "organism".
 *
 * This is the coupling surface between body systems. The cardiovascular module publishes
 * MAP and cardiac output; the renal module reads MAP and publishes GFR and excretion; a
 * later pulmonary module will read `cardiacOutputLPerMin` and write `arterialPh`, which
 * the kidney answers with renal compensation.
 *
 * Signals that no current module produces are kept at their resting value, so the types
 * (and the readouts built on them) do not have to change when a module is added.
 */
export interface OrganismSignals {
  // --- haemodynamics -------------------------------------------------------
  /** Mean arterial pressure [mmHg]. */
  mapMmHg: number;
  /** Systolic / diastolic estimates [mmHg], derived from stroke volume and compliance. */
  systolicMmHg: number;
  diastolicMmHg: number;
  heartRateBpm: number;
  strokeVolumeMl: number;
  cardiacOutputLPerMin: number;
  /** Total peripheral resistance [mmHg·min/L]. */
  tprMmHgMinPerL: number;
  centralVenousPressureMmHg: number;

  // --- volumes and composition --------------------------------------------
  bloodVolumeL: number;
  plasmaVolumeL: number;
  /** Extracellular fluid volume [L]. */
  ecfVolumeL: number;
  hematocrit: number;
  plasmaSodiumMmolPerL: number;
  plasmaPotassiumMmolPerL: number;
  plasmaOsmolalityMosmPerKg: number;
  /** Plasma colloid osmotic pressure [mmHg] — falls in nephrotic syndrome. */
  plasmaOncoticMmHg: number;

  // --- neural / hormonal ---------------------------------------------------
  /** Sympathetic tone, normalised: 1 = rest, 0 = fully withdrawn, 2 = maximal. */
  sympatheticTone: number;
  /** Plasma renin activity [ng/mL/h]. */
  plasmaReninActivity: number;
  angiotensinIiNgPerL: number;
  aldosteroneNgPerL: number;
  adhNgPerL: number;
  anpNgPerL: number;

  // --- renal ---------------------------------------------------------------
  /** Sum of both kidneys [mL/min]. */
  gfrMlPerMin: number;
  renalBloodFlowMlPerMin: number;
  urineFlowMlPerMin: number;
  sodiumExcretionMmolPerMin: number;
  potassiumExcretionMmolPerMin: number;

  // --- reserved for future systems (kept constant in the MVP) --------------
  /** Arterial pH — written by a future acid-base / pulmonary module. */
  arterialPh: number;
  paCO2MmHg: number;
  paO2MmHg: number;
  oxygenDemandMlPerMin: number;
}

/**
 * Resting values for a 70 kg adult. Sources for each number are listed in
 * docs/model/constants.md; the module that owns a signal overwrites it on the first step.
 */
export const RESTING_SIGNALS: Readonly<OrganismSignals> = Object.freeze({
  mapMmHg: 93,
  systolicMmHg: 120,
  diastolicMmHg: 80,
  heartRateBpm: 70,
  strokeVolumeMl: 70,
  cardiacOutputLPerMin: 5.0,
  tprMmHgMinPerL: 17.8,
  centralVenousPressureMmHg: 4,

  bloodVolumeL: 5.0,
  plasmaVolumeL: 3.0,
  ecfVolumeL: 14,
  hematocrit: 0.45,
  plasmaSodiumMmolPerL: 140,
  plasmaPotassiumMmolPerL: 4.2,
  plasmaOsmolalityMosmPerKg: 290,
  plasmaOncoticMmHg: 28,

  sympatheticTone: 1,
  plasmaReninActivity: 1.0,
  angiotensinIiNgPerL: 15,
  aldosteroneNgPerL: 80,
  adhNgPerL: 2,
  anpNgPerL: 20,

  gfrMlPerMin: 125,
  renalBloodFlowMlPerMin: 1100,
  urineFlowMlPerMin: 1.04, // 1.5 L/d
  sodiumExcretionMmolPerMin: 0.104, // 150 mmol/d
  potassiumExcretionMmolPerMin: 0.049, // 70 mmol/d

  arterialPh: 7.4,
  paCO2MmHg: 40,
  paO2MmHg: 95,
  oxygenDemandMlPerMin: 250,
});

/** Merge the contributions of all systems into the next signal state. */
export function mergeSignals(
  base: Readonly<OrganismSignals>,
  contributions: readonly Partial<OrganismSignals>[],
): Readonly<OrganismSignals> {
  const next: OrganismSignals = { ...base };
  for (const contribution of contributions) {
    for (const key of Object.keys(contribution) as (keyof OrganismSignals)[]) {
      const value = contribution[key];
      if (typeof value === 'number') next[key] = value;
    }
  }
  return next;
}
