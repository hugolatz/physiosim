/**
 * Renal constants. All flow and resistance values are **per kidney** unless stated —
 * the model runs two kidneys (docs/adr/0004), so each carries half of the documented
 * whole-organ values.
 *
 *   G&H  Guyton & Hall, Textbook of Medical Physiology (Kap. Nierenfunktion, Harnbildung)
 *   B&B  Boron & Boulpaep, Medical Physiology (Kap. Glomerular Filtration, Transport)
 *   Si   Silbernagl/Despopoulos, Taschenatlas Physiologie
 *
 * KALIBRIERT marks values set so that the documented normal values reproduce themselves
 * at rest. They are not measurements and carry no textbook citation.
 */

import { MINUTE, SECOND } from '../../core/units';

// --- documented whole-organ normal values -----------------------------------

/** Renal blood flow, both kidneys [mL/min], about 22 % of cardiac output. Source: G&H. */
export const RENAL_BLOOD_FLOW_ML_PER_MIN = 1100;
/** Glomerular filtration rate, both kidneys [mL/min]. Source: G&H. */
export const GFR_ML_PER_MIN = 125;
/** Glomerular capillary pressure [mmHg]. Source: G&H. */
export const P_GLOMERULAR_MMHG = 60;
/** Bowman capsule pressure [mmHg]. Source: G&H. */
export const P_BOWMAN_MMHG = 18;
/** Renal vein pressure [mmHg]. Source: G&H. */
export const P_RENAL_VEIN_MMHG = 8;
/** Urine flow at rest [mL/min] = 1.5 L/d. Source: Si. */
export const URINE_FLOW_ML_PER_MIN = (1.5 * 1000) / 1440;
/** Urine osmolality at rest [mosm/kg], range 50–1200. Source: B&B. */
export const URINE_OSMOLALITY_MOSM_PER_KG = 600;
export const URINE_OSMOLALITY_MIN = 50;
export const URINE_OSMOLALITY_MAX = 1200;

/** Reference arterial pressure the renal constants are calibrated at [mmHg]. */
export const REFERENCE_MAP_MMHG = 93;
/** Reference haematocrit used when calibrating the resistances. */
export const REFERENCE_HEMATOCRIT = 0.42;

// --- per-kidney calibration -------------------------------------------------

/** Per-kidney blood flow at rest [mL/min]. */
export const RBF_PER_KIDNEY = RENAL_BLOOD_FLOW_ML_PER_MIN / 2;
/** Per-kidney GFR at rest [mL/min]. */
export const GFR_PER_KIDNEY = GFR_ML_PER_MIN / 2;

/**
 * Afferent arteriolar resistance [mmHg·min/mL], per kidney.
 * KALIBRIERT from P_GC = MAP − RBF · R_aff with the documented P_GC of 60 mmHg.
 */
export const R_AFFERENT_BASE = (REFERENCE_MAP_MMHG - P_GLOMERULAR_MMHG) / RBF_PER_KIDNEY;

/**
 * Efferent arteriolar resistance [mmHg·min/mL], per kidney.
 * KALIBRIERT from RBF = (MAP − P_ven) / (R_aff + R_eff).
 * The resulting split (39 % afferent / 61 % efferent) matches the order of magnitude
 * G&H give for the shares of total renal vascular resistance (26 % vs 43 %).
 */
export const R_EFFERENT_BASE =
  (REFERENCE_MAP_MMHG - P_RENAL_VEIN_MMHG) / RBF_PER_KIDNEY - R_AFFERENT_BASE;

/** Plasma colloid osmotic pressure entering the glomerulus [mmHg]. Source: G&H. */
export const ONCOTIC_AFFERENT_MMHG = 28;

/**
 * Filtration coefficient [mL/min/mmHg], per kidney.
 * KALIBRIERT so that GFR = 62.5 mL/min at the documented pressures. G&H give 12.5 for both
 * kidneys; the small difference stems from the mean oncotic pressure, which this model
 * computes from the filtration fraction rather than taking as a fixed 32 mmHg.
 */
export const KF_PER_KIDNEY = 5.9;

// --- autoregulation ---------------------------------------------------------

/**
 * Myogenic (Bayliss) gain: relative rise in afferent resistance per relative rise in
 * perfusion pressure. KALIBRIERT so that autoregulation holds GFR within about 10 % over
 * 80–160 mmHg, the range documented by G&H.
 */
export const MYOGENIC_GAIN = 0.9;

/**
 * Tubuloglomerular feedback gain and its adenosine-mediated time constant. KALIBRIERT.
 *
 * The feedback is asymmetric: a high sodium load at the macula densa constricts the
 * afferent arteriole strongly, while a low load can only relax the resting tone that is
 * already there. Without that asymmetry the loop would raise GFR during hypovolaemia,
 * which is the opposite of what a kidney does.
 */
export const TGF_GAIN = 0.6;
export const TGF_DILATION_FRACTION = 0.2;
export const TAU_TGF = 15 * SECOND;

/**
 * Sympathetic constriction of the afferent and efferent arteriole. KALIBRIERT so that the
 * efferent constricts slightly more than the afferent — that difference is what lifts the
 * filtration fraction during hypovolaemia while renal blood flow falls.
 */
export const RENAL_SYMPATHETIC_GAIN = 0.5;
export const EFFERENT_SYMPATHETIC_GAIN = 0.7;
/**
 * Angiotensin II on the afferent arteriole. Source: B&B — angiotensin II constricts both
 * arterioles, the efferent markedly more. Leaving the afferent almost untouched (as a first
 * draft of this model did) lets the glomerular capillary pressure run away whenever
 * angiotensin II is high, and the GFR rises during hypovolaemia. It does not.
 */
export const AFFERENT_ANGIOTENSIN_GAIN = 0.38;
/** Angiotensin II on the efferent arteriole — the dominant effect. KALIBRIERT. */
export const EFFERENT_ANGIOTENSIN_GAIN = 0.5;
/**
 * Loss of prostaglandin-mediated afferent dilation under full COX inhibition.
 * KALIBRIERT so that an NSAID alone barely matters but becomes dangerous once the efferent
 * arteriole can no longer constrict (ACE inhibitor) and the volume is low (diuretic).
 */
export const AFFERENT_PROSTAGLANDIN_GAIN = 0.35;

// --- tubular reabsorption ---------------------------------------------------

/** Fractional reabsorption of the filtered sodium load per segment. Source: B&B. */
export const PROXIMAL_FRACTION = 0.67;
export const THICK_ASCENDING_FRACTION = 0.25;
export const DISTAL_FRACTION = 0.05;
/**
 * Collecting duct fraction. KALIBRIERT so that sodium excretion equals the default intake
 * of 150 mmol/d at rest — the model's resting state has to be a true steady state.
 * B&B give "about 3 %" for this segment.
 */
export const COLLECTING_DUCT_FRACTION = 0.0241;

/**
 * Lowest fraction of the filtered sodium load that still leaves in the urine.
 * KALIBRIERT: maximal renal sodium avidity reaches a fractional excretion of a few tenths
 * of a percent, never zero — no tubular segment is perfectly efficient.
 */
export const MIN_FRACTIONAL_SODIUM_EXCRETION = 0.0015;

/**
 * Pressure natriuresis gain: relative fall in proximal reabsorption per relative rise in
 * renal perfusion pressure. This single number carries the long-term blood pressure
 * behaviour of the whole model (Guyton). KALIBRIERT against the salt-loading scenario.
 */
export const PRESSURE_NATRIURESIS_GAIN = 0.7;

/**
 * Angiotensin II on proximal (NHE3) and thick ascending limb reabsorption. KALIBRIERT.
 *
 * Deliberately weaker than the pressure natriuresis gain. If suppressing angiotensin II
 * could carry the whole escape from a mineralocorticoid load on its own, chronic
 * aldosterone excess would leave the blood pressure untouched — and Conn's syndrome would
 * not be a cause of hypertension.
 */
export const PROXIMAL_ANGIOTENSIN_GAIN = 0.04;
export const TAL_ANGIOTENSIN_GAIN = 0.05;
/** ANP inhibits proximal and collecting duct sodium reabsorption. KALIBRIERT. */
export const PROXIMAL_ANP_GAIN = 0.02;
export const COLLECTING_DUCT_ANP_GAIN = 0.1;

/**
 * Aldosterone also acts on the connecting tubule, i.e. on the distal segment, with a
 * weaker grip than on the collecting duct. Source: B&B (ENaC im Verbindungstubulus);
 * Exponent KALIBRIERT.
 */
export const ALDOSTERONE_DISTAL_EXPONENT = 0.5;

/** Aldosterone dependence of collecting duct sodium reabsorption. KALIBRIERT. */
export const ALDOSTERONE_SODIUM_FLOOR = 0.35;
export const ALDOSTERONE_SODIUM_SPAN = 0.65;
export const ALDOSTERONE_SODIUM_EXPONENT = 0.6;

/** NaCl delivery to the macula densa at rest [mmol/min], per kidney. Derived. */
export const MACULA_DENSA_REFERENCE_MMOL_PER_MIN =
  ((GFR_PER_KIDNEY * 140) / 1000) * (1 - PROXIMAL_FRACTION - THICK_ASCENDING_FRACTION);

// --- water ------------------------------------------------------------------

/**
 * Daily urinary osmoles that are not sodium, potassium or their anions [mosm/d] — urea
 * above all. Derived: 900 mosm/d total urinary osmoles (1.5 L at 600 mosm/kg, Si) minus
 * 2 x (150 + 70) mosm from the electrolytes.
 */
export const NON_ELECTROLYTE_OSMOLES_PER_DAY = 460;

/**
 * Shape constant of the concentrating curve. KALIBRIERT so that resting ADH permeability
 * (normalised to 1) yields the documented urine osmolality of 600 mosm/kg.
 */
export const CONCENTRATION_HALF_PERMEABILITY = 1.09;

// --- potassium --------------------------------------------------------------

/** Potassium excretion at rest [mmol/min], both kidneys. Derived: 70 mmol/d. */
export const POTASSIUM_EXCRETION_MMOL_PER_MIN = 70 / 1440;
/**
 * Drivers of distal potassium secretion. KALIBRIERT (docs/adr/0006).
 *
 * The aldosterone arm saturates: ENaC and the Na/K-ATPase can only be up-regulated so far.
 * With an unbounded power law a sixfold aldosterone level drove plasma potassium below
 * 2 mmol/L, which is not what a Conn patient shows.
 */
export const POTASSIUM_ALDOSTERONE_FLOOR = 0.5;
export const POTASSIUM_ALDOSTERONE_SPAN = 1.5;
export const POTASSIUM_FLOW_EXPONENT = 0.35;
export const POTASSIUM_PLASMA_EXPONENT = 1.5;

// --- renin ------------------------------------------------------------------

/** Slope of the renal baroreceptor arm of renin release [1/mmHg]. KALIBRIERT. */
export const RENIN_PRESSURE_SLOPE = 0.07;
/** Slope of the macula densa arm. KALIBRIERT. */
export const RENIN_MACULA_DENSA_SLOPE = 2.5;
/** Sympathetic (beta-1) stimulation of renin release. KALIBRIERT. */
export const RENIN_SYMPATHETIC_GAIN = 0.8;
/** Short negative feedback of angiotensin II on renin release. KALIBRIERT. */
export const RENIN_ANGIOTENSIN_FEEDBACK = 0.4;
/** ANP inhibition of renin release. KALIBRIERT. */
export const RENIN_ANP_GAIN = 0.35;

/** Time constant of the juxtaglomerular secretion response [s]. KALIBRIERT. */
export const TAU_RENIN_SECRETION = 2 * MINUTE;
