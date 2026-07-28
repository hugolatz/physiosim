import type { Modulators } from '../../core/modulation';
import type { OrganismSignals } from '../../core/signals';
import type { Seconds } from '../../core/units';
import { clamp, nonNegative, relax, respond } from '../../core/units';
import * as C from './constants';

/**
 * One kidney. Everything here is a pure function of perfusion pressure, hormonal state and
 * drug action — which is what makes running two of them cheap (docs/adr/0004).
 */
export interface KidneyState {
  /** Post-stenotic perfusion pressure [mmHg]. */
  perfusionPressureMmHg: number;
  /** Afferent resistance actually in force [mmHg·min/mL]. */
  afferentResistance: number;
  efferentResistance: number;
  /** Tubuloglomerular feedback state — relaxes with the adenosine time constant. */
  tgfFactor: number;

  renalBloodFlowMlPerMin: number;
  renalPlasmaFlowMlPerMin: number;
  glomerularPressureMmHg: number;
  oncoticMeanMmHg: number;
  gfrMlPerMin: number;
  filtrationFraction: number;

  filteredSodiumMmolPerMin: number;
  proximalReabsorptionMmolPerMin: number;
  talReabsorptionMmolPerMin: number;
  distalReabsorptionMmolPerMin: number;
  collectingDuctReabsorptionMmolPerMin: number;
  maculaDensaDeliveryMmolPerMin: number;
  sodiumExcretionMmolPerMin: number;
  potassiumExcretionMmolPerMin: number;

  urineFlowMlPerMin: number;
  urineOsmolalityMosmPerKg: number;
  urineSodiumMmolPerL: number;
  freeWaterClearanceMlPerMin: number;

  reninSecretionRelative: number;
}

export interface KidneyInput {
  signals: Readonly<OrganismSignals>;
  mod: Modulators;
  /**
   * Fraction of mean arterial pressure lost across the renal artery stenosis on this side,
   * 0–0.6. This is the translesional pressure gradient, not the degree of luminal
   * narrowing — a 70 % narrowing does not cost 70 % of the pressure.
   */
  stenosis: number;
  myogenicEnabled: boolean;
  tgfEnabled: boolean;
  /** Switching this off is the didactic demonstration that the kidney sets long-term pressure. */
  pressureNatriuresisEnabled: boolean;
  /** Relative filtration coefficient from the user parameter. */
  kfFactor: number;
}

export function initialKidneyState(): KidneyState {
  const rbf = C.RBF_PER_KIDNEY;
  const rpf = rbf * (1 - C.REFERENCE_HEMATOCRIT);
  const gfr = C.GFR_PER_KIDNEY;
  const filtered = (gfr * 140) / 1000;
  return {
    perfusionPressureMmHg: C.REFERENCE_MAP_MMHG,
    afferentResistance: C.R_AFFERENT_BASE,
    efferentResistance: C.R_EFFERENT_BASE,
    tgfFactor: 1,
    renalBloodFlowMlPerMin: rbf,
    renalPlasmaFlowMlPerMin: rpf,
    glomerularPressureMmHg: C.P_GLOMERULAR_MMHG,
    oncoticMeanMmHg: 31.4,
    gfrMlPerMin: gfr,
    filtrationFraction: gfr / rpf,
    filteredSodiumMmolPerMin: filtered,
    proximalReabsorptionMmolPerMin: filtered * C.PROXIMAL_FRACTION,
    talReabsorptionMmolPerMin: filtered * C.THICK_ASCENDING_FRACTION,
    distalReabsorptionMmolPerMin: filtered * C.DISTAL_FRACTION,
    collectingDuctReabsorptionMmolPerMin: filtered * C.COLLECTING_DUCT_FRACTION,
    maculaDensaDeliveryMmolPerMin: C.MACULA_DENSA_REFERENCE_MMOL_PER_MIN,
    sodiumExcretionMmolPerMin: 150 / 1440 / 2,
    potassiumExcretionMmolPerMin: C.POTASSIUM_EXCRETION_MMOL_PER_MIN / 2,
    urineFlowMlPerMin: C.URINE_FLOW_ML_PER_MIN / 2,
    urineOsmolalityMosmPerKg: C.URINE_OSMOLALITY_MOSM_PER_KG,
    urineSodiumMmolPerL: 0,
    freeWaterClearanceMlPerMin: 0,
    reninSecretionRelative: 1,
  };
}

/**
 * Saturating aldosterone response of distal potassium secretion, normalised to 1 at the
 * resting aldosterone level.
 */
function aldosteronePotassiumFactor(aldosteroneNgPerL: number): number {
  const a = Math.max(aldosteroneNgPerL, 1) / 80;
  const raw = C.POTASSIUM_ALDOSTERONE_FLOOR + (C.POTASSIUM_ALDOSTERONE_SPAN * a) / (a + 1);
  const atRest = C.POTASSIUM_ALDOSTERONE_FLOOR + C.POTASSIUM_ALDOSTERONE_SPAN / 2;
  return raw / atRest;
}

export function stepKidney(prev: KidneyState, input: KidneyInput, dt: Seconds): KidneyState {
  const { signals: s, mod } = input;
  const angII = s.angiotensinIiEffect;
  const anp = s.anpRelative;
  const tone = s.sympatheticTone;

  // --- perfusion pressure -------------------------------------------------
  // A renal artery stenosis drops the pressure the kidney actually sees. Everything
  // downstream — autoregulation, filtration, renin — reacts to this number, not to MAP.
  const perfusionPressureMmHg = Math.max(
    C.P_RENAL_VEIN_MMHG,
    s.mapMmHg * (1 - clamp(input.stenosis, 0, 0.6)),
  );

  // --- autoregulation ------------------------------------------------------
  const myogenic = input.myogenicEnabled
    ? clamp(
        1 +
          C.MYOGENIC_GAIN * ((perfusionPressureMmHg - C.REFERENCE_MAP_MMHG) / C.REFERENCE_MAP_MMHG),
        0.5,
        2.2,
      )
    : 1;

  // Asymmetric on purpose: a high load constricts hard, a low load can only release the
  // resting tone. See the note on TGF_DILATION_FRACTION in constants.ts.
  const deliveryDeviation =
    prev.maculaDensaDeliveryMmolPerMin / C.MACULA_DENSA_REFERENCE_MMOL_PER_MIN - 1;
  const tgfTarget = input.tgfEnabled
    ? clamp(
        1 +
          C.TGF_GAIN *
            (deliveryDeviation > 0
              ? deliveryDeviation
              : deliveryDeviation * C.TGF_DILATION_FRACTION),
        0.8,
        2.2,
      )
    : 1;
  const tgfFactor = relax(prev.tgfFactor, tgfTarget, C.TAU_TGF, dt);

  const afferentResistance = clamp(
    C.R_AFFERENT_BASE *
      myogenic *
      tgfFactor *
      respond(tone, C.RENAL_SYMPATHETIC_GAIN) *
      respond(angII, C.AFFERENT_ANGIOTENSIN_GAIN) *
      // NSAIDs remove the prostaglandin brake on afferent constriction.
      (1 + C.AFFERENT_PROSTAGLANDIN_GAIN * (1 - mod['pge2.afferentDilation'])) *
      mod['raff.tone'],
    C.R_AFFERENT_BASE * 0.3,
    C.R_AFFERENT_BASE * 6,
  );

  // The efferent arteriole is the angiotensin II arteriole. Take angiotensin II away and it
  // dilates — which is precisely why an ACE inhibitor drops GFR behind a stenosis.
  const efferentResistance = clamp(
    C.R_EFFERENT_BASE *
      respond(angII, C.EFFERENT_ANGIOTENSIN_GAIN, 0.4) *
      respond(tone, C.EFFERENT_SYMPATHETIC_GAIN) *
      mod['reff.tone'],
    C.R_EFFERENT_BASE * 0.3,
    C.R_EFFERENT_BASE * 4,
  );

  // --- filtration ----------------------------------------------------------
  const renalBloodFlowMlPerMin = nonNegative(
    (perfusionPressureMmHg - C.P_RENAL_VEIN_MMHG) / (afferentResistance + efferentResistance),
  );
  const renalPlasmaFlowMlPerMin = renalBloodFlowMlPerMin * (1 - s.hematocrit);
  const glomerularPressureMmHg =
    perfusionPressureMmHg - renalBloodFlowMlPerMin * afferentResistance;

  // Mean oncotic pressure rises along the capillary as plasma is concentrated by
  // filtration. Using the previous filtration fraction keeps this explicit and stable.
  const ff = clamp(prev.filtrationFraction, 0, 0.6);
  const oncoticMeanMmHg = s.plasmaOncoticMmHg * (1 + (0.5 * ff) / (1 - ff));

  const netFiltrationPressure = glomerularPressureMmHg - C.P_BOWMAN_MMHG - oncoticMeanMmHg;
  const gfrMlPerMin = nonNegative(
    C.KF_PER_KIDNEY * input.kfFactor * mod['kf.filtration'] * netFiltrationPressure,
  );
  const filtrationFraction =
    renalPlasmaFlowMlPerMin > 0 ? clamp(gfrMlPerMin / renalPlasmaFlowMlPerMin, 0, 0.6) : 0;

  // --- tubular sodium handling --------------------------------------------
  const filteredSodiumMmolPerMin = (gfrMlPerMin * s.plasmaSodiumMmolPerL) / 1000;

  // Pressure natriuresis lives here: a higher renal perfusion pressure lowers proximal
  // reabsorption. This is the mechanism that sets long-term arterial pressure.
  const pressureFactor = input.pressureNatriuresisEnabled
    ? clamp(
        1 -
          C.PRESSURE_NATRIURESIS_GAIN *
            ((perfusionPressureMmHg - C.REFERENCE_MAP_MMHG) / C.REFERENCE_MAP_MMHG),
        0.4,
        1.5,
      )
    : 1;
  const proximalFraction = clamp(
    C.PROXIMAL_FRACTION *
      pressureFactor *
      respond(angII, C.PROXIMAL_ANGIOTENSIN_GAIN) *
      (1 - C.PROXIMAL_ANP_GAIN * (anp - 1)) *
      mod['nhe3.transport'],
    0.2,
    0.85,
  );
  const proximalReabsorptionMmolPerMin = filteredSodiumMmolPerMin * proximalFraction;
  let remaining = filteredSodiumMmolPerMin - proximalReabsorptionMmolPerMin;

  const talFraction = clamp(
    C.THICK_ASCENDING_FRACTION *
      (1 + C.TAL_ANGIOTENSIN_GAIN * (angII - 1)) *
      mod['nkcc2.transport'],
    0,
    0.4,
  );
  const talReabsorptionMmolPerMin = Math.min(filteredSodiumMmolPerMin * talFraction, remaining);
  remaining -= talReabsorptionMmolPerMin;

  // The macula densa sits at the end of the thick ascending limb and senses what got past.
  const maculaDensaDeliveryMmolPerMin = remaining;

  const aldosteroneFactor = clamp(
    C.ALDOSTERONE_SODIUM_FLOOR +
      C.ALDOSTERONE_SODIUM_SPAN *
        Math.pow(Math.max(s.aldosteroneActionNgPerL, 0) / 80, C.ALDOSTERONE_SODIUM_EXPONENT),
    0.15,
    2.5,
  );

  const distalFraction = clamp(
    C.DISTAL_FRACTION *
      Math.pow(aldosteroneFactor, C.ALDOSTERONE_DISTAL_EXPONENT) *
      mod['ncc.transport'],
    0,
    0.15,
  );
  const distalReabsorptionMmolPerMin = Math.min(
    filteredSodiumMmolPerMin * distalFraction,
    remaining,
  );
  remaining -= distalReabsorptionMmolPerMin;

  const collectingFraction = clamp(
    C.COLLECTING_DUCT_FRACTION *
      aldosteroneFactor *
      (1 - C.COLLECTING_DUCT_ANP_GAIN * (anp - 1)) *
      mod['enac.transport'],
    0,
    0.2,
  );
  const collectingDuctReabsorptionMmolPerMin = Math.min(
    filteredSodiumMmolPerMin * collectingFraction,
    remaining,
  );
  remaining -= collectingDuctReabsorptionMmolPerMin;

  // No tubule is perfectly efficient: maximal avidity still lets a few tenths of a percent
  // of the filtered load through.
  const sodiumExcretionMmolPerMin = Math.max(
    nonNegative(remaining),
    filteredSodiumMmolPerMin * C.MIN_FRACTIONAL_SODIUM_EXCRETION,
  );

  // --- potassium -----------------------------------------------------------
  // Distal secretion, driven by aldosterone, distal flow and plasma potassium
  // (docs/adr/0006 — deliberately no transcellular shifts).
  const potassiumExcretionMmolPerMin = nonNegative(
    (C.POTASSIUM_EXCRETION_MMOL_PER_MIN / 2) *
      aldosteronePotassiumFactor(s.aldosteroneActionNgPerL) *
      Math.pow(
        Math.max(prev.urineFlowMlPerMin, 0.05) / (C.URINE_FLOW_ML_PER_MIN / 2),
        C.POTASSIUM_FLOW_EXPONENT,
      ) *
      Math.pow(Math.max(s.plasmaPotassiumMmolPerL, 1) / 4.2, C.POTASSIUM_PLASMA_EXPONENT) *
      mod['enac.transport'],
  );

  // --- water ---------------------------------------------------------------
  // Urine volume follows from the osmoles that have to leave and the concentration the
  // collecting duct can achieve. This keeps water and solute balance consistent by
  // construction and reproduces both diabetes insipidus and SIADH without special cases.
  const osmolesPerMin =
    2 * (sodiumExcretionMmolPerMin + potassiumExcretionMmolPerMin) +
    C.NON_ELECTROLYTE_OSMOLES_PER_DAY / 1440 / 2;

  // Loop diuretics dismantle the medullary gradient, so the maximum concentration falls
  // with NKCC2 activity.
  const maxConcentration =
    C.URINE_OSMOLALITY_MIN +
    (C.URINE_OSMOLALITY_MAX - C.URINE_OSMOLALITY_MIN) * clamp(mod['nkcc2.transport'], 0.1, 1);
  const permeability = Math.max(s.adhWaterPermeability, 0);
  const concentratingFraction = permeability / (permeability + C.CONCENTRATION_HALF_PERMEABILITY);
  const urineOsmolalityMosmPerKg = clamp(
    C.URINE_OSMOLALITY_MIN + (maxConcentration - C.URINE_OSMOLALITY_MIN) * concentratingFraction,
    C.URINE_OSMOLALITY_MIN,
    C.URINE_OSMOLALITY_MAX,
  );
  const urineFlowMlPerMin = (osmolesPerMin / urineOsmolalityMosmPerKg) * 1000;

  const urineSodiumMmolPerL =
    urineFlowMlPerMin > 0 ? (sodiumExcretionMmolPerMin / urineFlowMlPerMin) * 1000 : 0;
  const osmolarClearance =
    (urineFlowMlPerMin * urineOsmolalityMosmPerKg) / Math.max(s.plasmaOsmolalityMosmPerKg, 1);
  const freeWaterClearanceMlPerMin = urineFlowMlPerMin - osmolarClearance;

  // --- renin ---------------------------------------------------------------
  // Three stimuli, multiplicative, plus the short negative feedback of angiotensin II.
  const pressureArm =
    2 / (1 + Math.exp(C.RENIN_PRESSURE_SLOPE * (perfusionPressureMmHg - C.REFERENCE_MAP_MMHG)));
  const maculaDensaArm =
    2 /
    (1 +
      Math.exp(
        C.RENIN_MACULA_DENSA_SLOPE *
          (maculaDensaDeliveryMmolPerMin / C.MACULA_DENSA_REFERENCE_MMOL_PER_MIN - 1),
      ));
  const sympatheticArm = Math.max(
    0.1,
    1 + C.RENIN_SYMPATHETIC_GAIN * (tone - 1) * mod['beta1.receptor'],
  );
  const angiotensinFeedback = clamp(1 / (1 + C.RENIN_ANGIOTENSIN_FEEDBACK * (angII - 1)), 0.3, 3);
  const anpArm = clamp(1 - C.RENIN_ANP_GAIN * (anp - 1), 0.3, 2);

  const secretionTarget = clamp(
    pressureArm *
      maculaDensaArm *
      sympatheticArm *
      angiotensinFeedback *
      anpArm *
      mod['renin.secretion'],
    0,
    25,
  );
  const reninSecretionRelative = relax(
    prev.reninSecretionRelative,
    secretionTarget,
    C.TAU_RENIN_SECRETION,
    dt,
  );

  return {
    perfusionPressureMmHg,
    afferentResistance,
    efferentResistance,
    tgfFactor,
    renalBloodFlowMlPerMin,
    renalPlasmaFlowMlPerMin,
    glomerularPressureMmHg,
    oncoticMeanMmHg,
    gfrMlPerMin,
    filtrationFraction,
    filteredSodiumMmolPerMin,
    proximalReabsorptionMmolPerMin,
    talReabsorptionMmolPerMin,
    distalReabsorptionMmolPerMin,
    collectingDuctReabsorptionMmolPerMin,
    maculaDensaDeliveryMmolPerMin,
    sodiumExcretionMmolPerMin,
    potassiumExcretionMmolPerMin,
    urineFlowMlPerMin,
    urineOsmolalityMosmPerKg,
    urineSodiumMmolPerL,
    freeWaterClearanceMlPerMin,
    reninSecretionRelative,
  };
}
