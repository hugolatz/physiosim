/**
 * Haemodynamic constants for the 70 kg reference adult at rest.
 *
 *   G&H  Guyton & Hall, Textbook of Medical Physiology (Kreislaufregulation, Herzminutenvolumen)
 *   B&B  Boron & Boulpaep, Medical Physiology (Cardiac Muscle, Integration of Circulation)
 *   Si   Silbernagl/Despopoulos, Taschenatlas Physiologie
 *
 * KALIBRIERT marks values that were set so the documented normal values reproduce
 * themselves at rest. They are not measurements and carry no textbook citation.
 */

import { DAY, HOUR, SECOND } from '../../core/units';

/** Mean arterial pressure at rest [mmHg], normal 70–105. Source: G&H, Si. */
export const MAP_MMHG = 93;
/** Heart rate at rest [1/min], normal 60–100. Source: Si. */
export const HEART_RATE_BPM = 70;
/** Stroke volume at rest [mL], normal 60–80. Source: B&B. */
export const STROKE_VOLUME_ML = 70;
/** Cardiac output at rest [L/min], normal 4.5–6.0. Source: G&H. */
export const CARDIAC_OUTPUT_L_PER_MIN = 5.0;
/** End-diastolic volume at rest [mL]. Source: B&B. */
export const EDV_ML = 120;
/** Ejection fraction at rest. Derived: 70 mL / 120 mL. Source: B&B (normal 55–70 %). */
export const EJECTION_FRACTION = STROKE_VOLUME_ML / EDV_ML;
/** Central venous pressure at rest [mmHg], normal 0–8. Source: Si. */
export const CENTRAL_VENOUS_PRESSURE_MMHG = 4;
/** Mean systemic filling pressure at rest [mmHg]. Source: G&H (7 mmHg). */
export const MEAN_SYSTEMIC_FILLING_PRESSURE_MMHG = 7;

/**
 * Total peripheral resistance at rest [mmHg·min/L].
 * Derived: (MAP − ZVD) / HZV = (93 − 4) / 5.0.
 */
export const TPR_MMHG_MIN_PER_L =
  (MAP_MMHG - CENTRAL_VENOUS_PRESSURE_MMHG) / CARDIAC_OUTPUT_L_PER_MIN;

/**
 * Arterial compliance [L/mmHg]. Source: G&H — the arterial windkessel time constant
 * R·C is about 1.6–2 s, and a pulse pressure of ~40 mmHg for a 70 mL stroke volume
 * requires ~1.8 mL/mmHg. Both agree on this value.
 */
export const ARTERIAL_COMPLIANCE_L_PER_MMHG = 0.0018;

/**
 * Systemic (mostly venous) compliance [L/mmHg].
 *
 * KALIBRIERT against the shape of Guyton's mean-systemic-filling-pressure curve: Pms is
 * 7 mmHg at 5.0 L and falls to roughly half that after a 1000 mL loss. Venous compliance
 * dominates it — G&H put it at about 24 times the arterial value, and 0.2 L/mmHg against
 * 0.0018 L/mmHg is of that order.
 */
export const SYSTEMIC_COMPLIANCE_L_PER_MMHG = 0.2;

/** Unstressed vascular volume [L]. KALIBRIERT against Pms = 7 mmHg at 5.0 L blood volume. */
export const UNSTRESSED_VOLUME_L =
  5.0 - MEAN_SYSTEMIC_FILLING_PRESSURE_MMHG * SYSTEMIC_COMPLIANCE_L_PER_MMHG;

/** Resistance to venous return [mmHg·min/L]. KALIBRIERT against ZVD = 4 mmHg at 5 L/min. */
export const VENOUS_RESISTANCE_MMHG_MIN_PER_L =
  (MEAN_SYSTEMIC_FILLING_PRESSURE_MMHG - CENTRAL_VENOUS_PRESSURE_MMHG) / CARDIAC_OUTPUT_L_PER_MIN;

/**
 * Frank-Starling filling curve: EDV = EDV_MAX · Pms / (Pms + EDV_HALF).
 * KALIBRIERT: saturating, passes through 120 mL at Pms = 7 mmHg, upper limit ~200 mL.
 */
export const EDV_MAX_ML = 200;
export const EDV_HALF_MMHG =
  (EDV_MAX_ML * MEAN_SYSTEMIC_FILLING_PRESSURE_MMHG) / EDV_ML - MEAN_SYSTEMIC_FILLING_PRESSURE_MMHG;

// --- baroreceptor reflex ----------------------------------------------------

/** Reflex time constant [s]. Source: Vorgabe/Literatur 5–15 s. */
export const TAU_BAROREFLEX = 10 * SECOND;

/**
 * Slope of the reflex characteristic [1/mmHg]. KALIBRIERT so that sympathetic tone runs
 * from ~1.8 at MAP 60 to ~0.3 at MAP 120 — the range over which the reflex operates.
 */
export const BAROREFLEX_SLOPE_PER_MMHG = 0.08;

/**
 * Time constant of baroreceptor resetting [s] and the fraction of a sustained pressure
 * change the set point eventually follows. KALIBRIERT to reproduce the didactic point that
 * the reflex buffers within seconds but does not correct chronic hypertension.
 */
export const TAU_BAROREFLEX_RESET = 36 * HOUR;
export const BAROREFLEX_RESET_FRACTION = 0.9;

/** Sympathetic gains. KALIBRIERT against the acute haemorrhage scenario. */
export const HR_SYMPATHETIC_GAIN = 0.7;
export const CONTRACTILITY_SYMPATHETIC_GAIN = 0.35;
export const TPR_SYMPATHETIC_GAIN = 0.45;
/** Venous tone: sympathetic activation recruits unstressed volume [L per tone unit]. */
export const VENOUS_TONE_GAIN_L = 0.35;

/**
 * Angiotensin II effect on total peripheral resistance, applied through the saturating
 * response curve. KALIBRIERT so that the RAAS activation of an acute 1000 mL blood loss
 * raises resistance by roughly a quarter rather than doubling it.
 */
export const TPR_ANGIOTENSIN_GAIN = 0.28;

/**
 * The same effect in the other direction, when angiotensin II falls below resting level.
 * Much weaker on purpose: in a salt-replete person the RAAS contributes little to resting
 * vascular tone — which is why an ACE inhibitor lowers the pressure of a salt-replete
 * normotensive only modestly, and why suppressing the RAAS does not by itself undo the
 * hypertension of mineralocorticoid excess. Source: B&B (RAAS-Beitrag zum Ruhetonus,
 * qualitativ); Groesse KALIBRIERT gegen das Conn-Szenario.
 */
export const TPR_ANGIOTENSIN_GAIN_LOW = 0.08;
/** ANP vasodilation. KALIBRIERT, deliberately small. */
export const TPR_ANP_GAIN = 0.04;

/**
 * Afterload sensitivity of the ejection fraction. KALIBRIERT: mild in the healthy heart,
 * and scaled by 1/contractility so that the failing heart is markedly afterload sensitive —
 * the reason afterload reduction helps in heart failure.
 */
export const AFTERLOAD_SENSITIVITY = 0.25;

/**
 * Whole-body autoregulation (Guyton).
 *
 * Tissues defend their own perfusion: if cardiac output stays above what the periphery
 * needs, the resistance vessels close down over days until flow is normal again. This is
 * what turns a volume-driven rise in cardiac output into a resistance-driven, sustained
 * rise in pressure — without it, chronic volume expansion (Conn, salt, mineralocorticoid
 * excess) barely moves the blood pressure at all, which is not what happens in patients.
 *
 * Gain and time constant are KALIBRIERT: strong enough to reproduce the transition from a
 * high-output to a high-resistance state, weak enough to keep the loop stable
 * (loop gain well below 1, checked by the 30-day stability test).
 */
export const AUTOREGULATION_GAIN = 2.0;
export const TAU_AUTOREGULATION = 2 * DAY;
export const AUTOREGULATION_MIN = 0.75;
export const AUTOREGULATION_MAX = 1.6;

/** Physiological limits used for clamping. Source: Si (Herzfrequenzbereich). */
export const HEART_RATE_MIN_BPM = 35;
export const HEART_RATE_MAX_BPM = 190;
