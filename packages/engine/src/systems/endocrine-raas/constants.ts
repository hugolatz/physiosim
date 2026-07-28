/**
 * Hormone constants of the renin-angiotensin-aldosterone system, ADH and ANP.
 *
 *   B&B  Boron & Boulpaep, Medical Physiology (Kap. Integration of Salt and Water Balance)
 *   KPS  Klinke/Pape/Kurtz/Silbernagl, Physiologie
 *   G&H  Guyton & Hall, Textbook of Medical Physiology
 *
 * KALIBRIERT marks values set so that the documented resting values reproduce themselves.
 */

import { HOUR, MINUTE, SECOND } from '../../core/units';

/** Plasma renin activity at rest [ng/mL/h], normal 0.5–2.0. Source: KPS. */
export const PLASMA_RENIN_ACTIVITY = 1.0;
/** Angiotensin II at rest [ng/L], normal 10–30. Source: B&B. */
export const ANGIOTENSIN_II_NG_PER_L = 15;
/** Aldosterone at rest, supine [ng/L], normal 30–150. Source: KPS. */
export const ALDOSTERONE_NG_PER_L = 80;
/** ADH at rest [ng/L], normal 1–5. Source: B&B. */
export const ADH_NG_PER_L = 2;
/** ANP at rest [ng/L]. Source: KPS (Groessenordnung). */
export const ANP_NG_PER_L = 20;

/**
 * Plasma half-life of renin, about 15 min, converted to a time constant (t½ / ln 2).
 * Source: KPS.
 */
export const TAU_RENIN = (15 / Math.LN2) * MINUTE;

/** Angiotensin II half-life is under a minute — it follows renin almost instantly. Source: B&B. */
export const TAU_ANGIOTENSIN_II = (30 / Math.LN2) * SECOND;

/** Aldosterone plasma turnover. Source: KPS (Halbwertszeit rund 20 min). */
export const TAU_ALDOSTERONE = (20 / Math.LN2) * MINUTE;

/**
 * Delay of the aldosterone *effect* at the target cell. The receptor is a transcription
 * factor, so the response needs protein synthesis: 1–2 h latency. Source: B&B.
 */
export const TAU_ALDOSTERONE_ACTION = 1.5 * HOUR;

/** ADH turnover [s]. Source: B&B (Halbwertszeit 10–20 min). */
export const TAU_ADH = (15 / Math.LN2) * MINUTE;

/** ANP turnover [s]. Source: KPS (Halbwertszeit wenige Minuten). */
export const TAU_ANP = (3 / Math.LN2) * MINUTE;

/**
 * Aldosterone response to angiotensin II: floor plus span, so that a fully blocked RAAS
 * still leaves a residual (ACTH-driven) secretion. KALIBRIERT.
 */
export const ALDOSTERONE_ANGIOTENSIN_FLOOR = 0.3;
export const ALDOSTERONE_ANGIOTENSIN_SPAN = 0.7;
export const ALDOSTERONE_ANGIOTENSIN_EXPONENT = 0.9;

/**
 * Potassium is the second, independent stimulus of aldosterone secretion — the reason
 * hyperkalaemia and hypovolaemia both raise it. KALIBRIERT.
 */
export const ALDOSTERONE_POTASSIUM_GAIN = 2.0;

/** Osmotic threshold of ADH release [mosm/kg]. Source: B&B (280–285). */
export const ADH_OSMOTIC_THRESHOLD = 280;
/**
 * Slope of osmotic ADH release [ng/L per mosm/kg]. KALIBRIERT so that 290 mosm/kg gives the
 * documented resting concentration of 2 ng/L.
 */
export const ADH_OSMOTIC_SLOPE = ADH_NG_PER_L / (290 - ADH_OSMOTIC_THRESHOLD);

/**
 * Non-osmotic (baroreceptor) ADH release. It only engages once mean arterial pressure has
 * fallen by more than about 5–10 %, and then rises steeply — which is why ADH can override
 * osmolality in hypovolaemia. Source: B&B (qualitativ); Steigung KALIBRIERT.
 */
export const ADH_VOLUME_THRESHOLD_FRACTION = 0.05;
export const ADH_VOLUME_GAIN = 4.0;

/** Angiotensin II stimulates ADH release. KALIBRIERT, bewusst schwach. */
export const ADH_ANGIOTENSIN_GAIN = 0.2;

/** Lower bound of ADH [ng/L] — secretion is never exactly zero. KALIBRIERT. */
export const ADH_MIN_NG_PER_L = 0.05;

/**
 * ANP release with atrial stretch, indexed to central venous pressure. KALIBRIERT against
 * the qualitative statement that atrial distension is the trigger.
 */
export const ANP_CVP_REFERENCE_MMHG = 4;
export const ANP_CVP_GAIN = 1.5;
