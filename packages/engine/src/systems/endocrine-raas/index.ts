import type { ParamDefinition, Readout, State, SystemModel } from '../../core/types';
import type { OrganismSignals } from '../../core/signals';
import { clamp, nonNegative, relax } from '../../core/units';
import { param } from '../../core/params';
import * as C from './constants';

/**
 * Renin, angiotensin II, aldosterone, ADH and ANP.
 *
 * Each hormone is a pool that relaxes towards a secretion-determined target with its own
 * time constant. That is what produces the model's separation of time scales: angiotensin
 * II follows renin within a minute, aldosterone within half an hour, and its effect at the
 * target cell only after another hour and a half.
 */
export interface EndocrineState extends State {
  plasmaReninActivity: number;
  angiotensinIiNgPerL: number;
  angiotensinIiEffect: number;
  aldosteroneNgPerL: number;
  aldosteroneActionNgPerL: number;
  adhNgPerL: number;
  adhWaterPermeability: number;
  anpNgPerL: number;
  anpRelative: number;
}

export const endocrineParams: readonly ParamDefinition[] = [
  {
    id: 'primaryAldosteronism',
    label: 'Primärer Hyperaldosteronismus (Conn)',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint: 'Autonome Aldosteronproduktion, unabhängig vom Renin.',
    contentId: 'conn-syndrom',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'adrenalInsufficiency',
    label: 'M. Addison',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint: 'Ausfall der Nebennierenrinde: Aldosteron fällt weg.',
    contentId: 'morbus-addison',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'diabetesInsipidus',
    label: 'Diabetes insipidus (zentral)',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint: 'ADH-Sekretion fällt aus — der Urin kann nicht konzentriert werden.',
    contentId: 'diabetes-insipidus',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'siadh',
    label: 'SIADH',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint: 'ADH wird unabhängig von der Osmolalität freigesetzt.',
    contentId: 'siadh',
    source: 'Schalter, keine Messgroesse',
  },
];

export const endocrineSystem: SystemModel<EndocrineState> = {
  id: 'endocrine-raas',
  label: 'RAAS, ADH und ANP',
  timeScales: ['medium', 'slow'],
  params: endocrineParams,

  initialState(): EndocrineState {
    return {
      t: 0,
      plasmaReninActivity: C.PLASMA_RENIN_ACTIVITY,
      angiotensinIiNgPerL: C.ANGIOTENSIN_II_NG_PER_L,
      angiotensinIiEffect: 1,
      aldosteroneNgPerL: C.ALDOSTERONE_NG_PER_L,
      aldosteroneActionNgPerL: C.ALDOSTERONE_NG_PER_L,
      adhNgPerL: C.ADH_NG_PER_L,
      adhWaterPermeability: 1,
      anpNgPerL: C.ANP_NG_PER_L,
      anpRelative: 1,
    };
  },

  step(state, p, dt, bus): EndocrineState {
    const s = bus.signals;
    const mod = bus.mod;

    // --- renin -> angiotensin II -------------------------------------------
    const plasmaReninActivity = nonNegative(
      relax(
        state.plasmaReninActivity,
        C.PLASMA_RENIN_ACTIVITY * s.reninSecretionRelative,
        C.TAU_RENIN,
        dt,
      ),
    );

    // ACE inhibition acts here, on the conversion, not on the concentration of renin.
    const angiotensinTarget =
      C.ANGIOTENSIN_II_NG_PER_L *
      (plasmaReninActivity / C.PLASMA_RENIN_ACTIVITY) *
      mod['ace.activity'];
    const angiotensinIiNgPerL = nonNegative(
      relax(state.angiotensinIiNgPerL, angiotensinTarget, C.TAU_ANGIOTENSIN_II, dt),
    );

    // An AT1 blocker leaves the concentration high — it lowers the *signal*. Showing both
    // numbers side by side is one of the things this simulator is for.
    const angiotensinIiEffect = nonNegative(
      (angiotensinIiNgPerL / C.ANGIOTENSIN_II_NG_PER_L) * mod['at1.receptor'],
    );

    // --- aldosterone --------------------------------------------------------
    const potassiumFactor = clamp(
      1 + C.ALDOSTERONE_POTASSIUM_GAIN * ((s.plasmaPotassiumMmolPerL - 4.2) / 4.2),
      0.2,
      3,
    );
    const regulated =
      C.ALDOSTERONE_NG_PER_L *
      (C.ALDOSTERONE_ANGIOTENSIN_FLOOR +
        C.ALDOSTERONE_ANGIOTENSIN_SPAN *
          Math.pow(angiotensinIiEffect, C.ALDOSTERONE_ANGIOTENSIN_EXPONENT)) *
      potassiumFactor *
      mod['aldosterone.secretion'] *
      // Addison: the adrenal cortex itself fails, so the regulated part falls away.
      (1 - 0.95 * (param(p, 'adrenalInsufficiency') / 100));
    // Conn: an adenoma secretes on its own account, on top of and independent of the loop.
    const autonomous = C.ALDOSTERONE_NG_PER_L * 6 * (param(p, 'primaryAldosteronism') / 100);
    const aldosteroneNgPerL = nonNegative(
      relax(state.aldosteroneNgPerL, regulated + autonomous, C.TAU_ALDOSTERONE, dt),
    );

    // The mineralocorticoid receptor is a transcription factor: the effect lags the level.
    const aldosteroneActionNgPerL = nonNegative(
      relax(
        state.aldosteroneActionNgPerL,
        aldosteroneNgPerL * mod['mr.receptor'],
        C.TAU_ALDOSTERONE_ACTION,
        dt,
      ),
    );

    // --- ADH ----------------------------------------------------------------
    const osmoticDrive = Math.max(
      0,
      (s.plasmaOsmolalityMosmPerKg - C.ADH_OSMOTIC_THRESHOLD) * C.ADH_OSMOTIC_SLOPE,
    );
    const pressureDeficit = Math.max(0, (93 - s.mapMmHg) / 93 - C.ADH_VOLUME_THRESHOLD_FRACTION);
    const volumeFactor = 1 + C.ADH_VOLUME_GAIN * pressureDeficit;
    const angiotensinFactor = 1 + C.ADH_ANGIOTENSIN_GAIN * (angiotensinIiEffect - 1);
    const regulatedAdh =
      osmoticDrive *
      volumeFactor *
      Math.max(angiotensinFactor, 0.2) *
      mod['adh.secretion'] *
      // Central diabetes insipidus: the hormone is simply not released.
      (1 - 0.97 * (param(p, 'diabetesInsipidus') / 100));
    // SIADH is release *regardless* of osmolality, so it is a floor, not a factor —
    // otherwise the falling osmolality it causes would switch it off again.
    const siadhFloor = C.ADH_NG_PER_L * 3 * (param(p, 'siadh') / 100);
    const adhTarget = Math.max(C.ADH_MIN_NG_PER_L, regulatedAdh, siadhFloor);
    const adhNgPerL = nonNegative(relax(state.adhNgPerL, adhTarget, C.TAU_ADH, dt));

    // Water permeability of the collecting duct: hormone times receptor times channel.
    // Central DI removes the hormone, nephrogenic DI the receptor, desmopressin adds an
    // agonist — all three land here.
    const adhWaterPermeability = nonNegative(
      (adhNgPerL / C.ADH_NG_PER_L) * mod['v2.receptor'] * mod['aqp2.insertion'],
    );

    // --- ANP ----------------------------------------------------------------
    const anpTarget =
      C.ANP_NG_PER_L *
      Math.max(
        0.2,
        1 +
          C.ANP_CVP_GAIN *
            ((s.centralVenousPressureMmHg - C.ANP_CVP_REFERENCE_MMHG) / C.ANP_CVP_REFERENCE_MMHG),
      );
    const anpNgPerL = nonNegative(relax(state.anpNgPerL, anpTarget, C.TAU_ANP, dt));

    return {
      t: state.t + dt,
      plasmaReninActivity,
      angiotensinIiNgPerL,
      angiotensinIiEffect,
      aldosteroneNgPerL,
      aldosteroneActionNgPerL,
      adhNgPerL,
      adhWaterPermeability,
      anpNgPerL,
      anpRelative: anpNgPerL / C.ANP_NG_PER_L,
    };
  },

  derive(state): readonly Readout[] {
    return [
      {
        id: 'plasmaReninActivity',
        label: 'Plasma-Renin-Aktivität',
        value: state.plasmaReninActivity,
        unit: 'ng/mL/h',
        precision: 2,
        group: 'hormone',
        equation: 'eq:renin-pool',
        normal: { low: 0.5, high: 2.0, source: 'Klinke/Pape/Kurtz/Silbernagl' },
        contentId: 'renin',
      },
      {
        id: 'angiotensinII',
        label: 'Angiotensin II',
        value: state.angiotensinIiNgPerL,
        unit: 'ng/L',
        precision: 1,
        group: 'hormone',
        equation: 'eq:angiotensin-ii',
        normal: { low: 10, high: 30, source: 'Boron & Boulpaep' },
        contentId: 'ang-ii',
      },
      {
        id: 'angiotensinIIEffect',
        label: 'AT1-Signal (Wirkung)',
        value: state.angiotensinIiEffect,
        unit: '1',
        precision: 2,
        group: 'hormone',
        equation: 'eq:at1-signal',
        normal: { low: 0.8, high: 1.2, source: 'Normiert, 1 entspricht Ruhe' },
        contentId: 'ang-ii',
      },
      {
        id: 'aldosterone',
        label: 'Aldosteron',
        value: state.aldosteroneNgPerL,
        unit: 'ng/L',
        precision: 0,
        group: 'hormone',
        equation: 'eq:aldosteron',
        normal: { low: 30, high: 150, source: 'Klinke/Pape/Kurtz/Silbernagl' },
        contentId: 'aldosteron',
      },
      {
        id: 'aldosteroneAction',
        label: 'Aldosteronwirkung am Sammelrohr',
        value: state.aldosteroneActionNgPerL,
        unit: 'ng/L',
        precision: 0,
        group: 'hormone',
        equation: 'eq:aldosteron-wirkung',
        contentId: 'aldosteron',
      },
      {
        id: 'adh',
        label: 'ADH (Vasopressin)',
        value: state.adhNgPerL,
        unit: 'ng/L',
        precision: 2,
        group: 'hormone',
        equation: 'eq:adh',
        normal: { low: 1, high: 5, source: 'Boron & Boulpaep' },
        contentId: 'adh',
      },
      {
        id: 'anp',
        label: 'ANP',
        value: state.anpNgPerL,
        unit: 'ng/L',
        precision: 0,
        group: 'hormone',
        equation: 'eq:anp',
        normal: { low: 10, high: 40, source: 'Klinke/Pape/Kurtz/Silbernagl' },
        contentId: 'anp',
      },
    ];
  },

  publish(state): Partial<OrganismSignals> {
    return {
      plasmaReninActivity: state.plasmaReninActivity,
      angiotensinIiNgPerL: state.angiotensinIiNgPerL,
      angiotensinIiEffect: state.angiotensinIiEffect,
      aldosteroneNgPerL: state.aldosteroneNgPerL,
      aldosteroneActionNgPerL: state.aldosteroneActionNgPerL,
      adhNgPerL: state.adhNgPerL,
      adhWaterPermeability: state.adhWaterPermeability,
      anpNgPerL: state.anpNgPerL,
      anpRelative: state.anpRelative,
    };
  },
};
