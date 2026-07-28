/**
 * Body fluid and electrolyte constants for the 70 kg reference adult.
 *
 * Sources are given as work + chapter level; page-exact citations are added in
 * docs/model/constants.md once the editions in use are fixed.
 *   B&B  Boron & Boulpaep, Medical Physiology (Kap. Body Fluid Compartments)
 *   Si   Silbernagl/Despopoulos, Taschenatlas Physiologie (Wasser- und Salzhaushalt)
 *   G&H  Guyton & Hall, Textbook of Medical Physiology
 *
 * Values marked KALIBRIERT are not measurements. They were chosen so that the documented
 * normal values above reproduce themselves at rest, and they carry no textbook citation.
 */

import { DAY, HOUR } from '../../core/units';

/** Total body water, 60 % of body mass in a 70 kg man [L]. Source: B&B, Si. */
export const TOTAL_BODY_WATER_L = 42;

/** Extracellular fluid volume at rest [L]. Source: B&B (14 L, ein Drittel des KW). */
export const ECF_VOLUME_L = 14;

/**
 * Plasma volume at rest [L].
 *
 * The textbook round numbers (5.0 L blood, 3.0 L plasma, Hkt 0.45) are not mutually
 * consistent — 3.0 / (1 − 0.45) would be 5.45 L. We keep the blood volume and the
 * haematocrit and accept the plasma volume that follows, because both of those enter more
 * equations. 0.42 lies inside the documented normal range 0.37–0.47 (Si).
 */
export const HEMATOCRIT = 0.42;
export const BLOOD_VOLUME_L = 5.0;
export const PLASMA_VOLUME_L = BLOOD_VOLUME_L * (1 - HEMATOCRIT);

/** Red cell volume at rest [L]. Derived from blood volume and haematocrit. */
export const RED_CELL_VOLUME_L = BLOOD_VOLUME_L * HEMATOCRIT;

/** Plasma sodium at rest [mmol/L], normal range 135–145. Source: Si. */
export const PLASMA_SODIUM_MMOL_PER_L = 140;

/** Plasma potassium at rest [mmol/L], normal range 3.5–5.0. Source: Si. */
export const PLASMA_POTASSIUM_MMOL_PER_L = 4.2;

/** Plasma osmolality at rest [mosm/kg], normal range 280–300. Source: Si. */
export const PLASMA_OSMOLALITY_MOSM_PER_KG = 290;

/** Extracellular sodium content [mmol] = 140 mmol/L x 14 L. */
export const EXTRACELLULAR_SODIUM_MMOL = PLASMA_SODIUM_MMOL_PER_L * ECF_VOLUME_L;

/**
 * Osmotically active extracellular solute other than Na+ and its anions [mosm].
 * KALIBRIERT so that 2 x Na plus this equals ECF x osmolality (4060 mosm) at rest;
 * physiologically this stands for urea, glucose and the non-sodium cations.
 */
export const EXTRACELLULAR_OTHER_OSMOLES =
  ECF_VOLUME_L * PLASMA_OSMOLALITY_MOSM_PER_KG - 2 * EXTRACELLULAR_SODIUM_MMOL;

/**
 * Osmotically active intracellular solute [mosm], dominated by K+ and organic anions.
 * KALIBRIERT so that ICF = TBW - ECF = 28 L at 290 mosm/kg. Held constant: the model does
 * not track cell metabolism, only osmotic water shifts between the compartments.
 */
export const INTRACELLULAR_OSMOLES =
  (TOTAL_BODY_WATER_L - ECF_VOLUME_L) * PLASMA_OSMOLALITY_MOSM_PER_KG;

/** Extracellular potassium content [mmol]. */
export const EXTRACELLULAR_POTASSIUM_MMOL = PLASMA_POTASSIUM_MMOL_PER_L * ECF_VOLUME_L;

/**
 * Effective distribution volume for extracellular potassium [L].
 * KALIBRIERT (docs/adr/0006): the intracellular pool is treated as a large slow buffer
 * rather than a tracked compartment. A value above the ECF volume reproduces the observed
 * sluggishness of plasma potassium against gains and losses.
 */
export const POTASSIUM_BUFFER_VOLUME_L = 22;

/** Plasma colloid osmotic pressure at rest [mmHg]. Source: G&H (28 mmHg). */
export const PLASMA_ONCOTIC_MMHG = 28;

// --- daily turnover ---------------------------------------------------------

/** Water in food [L/d]. Source: Si (Wasserbilanz). */
export const FOOD_WATER_L_PER_DAY = 0.7;
/** Oxidation water [L/d]. Source: Si. */
export const METABOLIC_WATER_L_PER_DAY = 0.3;
/** Insensible loss through skin and lungs [L/d]. Source: Si. */
export const INSENSIBLE_LOSS_L_PER_DAY = 0.9;
/** Faecal water [L/d]. Source: Si. */
export const STOOL_WATER_L_PER_DAY = 0.15;

/**
 * Time constant of transcapillary refill [s]. KALIBRIERT against the clinical observation
 * that interstitial fluid restores plasma volume over hours, not minutes — which is why
 * the haematocrit after an acute bleed is still normal and only falls later.
 */
export const TAU_PLASMA_REFILL = 2 * HOUR;

/** Plasma share of the extracellular volume at rest. Derived: 2.9 L / 14 L. */
export const PLASMA_FRACTION_OF_ECF = PLASMA_VOLUME_L / ECF_VOLUME_L;

/**
 * Osmolality above which thirst adds drinking [mosm/kg]. Source: B&B (Durstschwelle liegt
 * wenige mosm/kg ueber der osmotischen ADH-Schwelle von 280–285).
 */
export const THIRST_THRESHOLD_MOSM_PER_KG = 292;

/**
 * Drinking added per mosm/kg above threshold [L/d]. KALIBRIERT so that a water deficit is
 * corrected within a day when drinking is unrestricted.
 */
export const THIRST_GAIN_L_PER_DAY_PER_MOSM = 0.45;

/** Maximum thirst-driven intake [L/d]. KALIBRIERT, entspricht grob dem klinisch Ueblichen. */
export const THIRST_MAX_L_PER_DAY = 6;

export const PER_DAY_TO_PER_SECOND = 1 / DAY;
