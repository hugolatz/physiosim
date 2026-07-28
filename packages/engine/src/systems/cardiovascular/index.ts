import type { ParamDefinition, Readout, State, SystemModel } from '../../core/types';
import type { OrganismSignals } from '../../core/signals';
import { clamp, relax, respond } from '../../core/units';
import { param } from '../../core/params';
import * as C from './constants';

/**
 * Systemic haemodynamics and the baroreceptor reflex.
 *
 * Mean arterial pressure is not assigned, it is integrated: the arterial windkessel fills
 * with cardiac output and empties through the peripheral resistance. In the steady state
 * that reduces to MAP = HZV x TPR + ZVD, but during a transient it shows the real time
 * course — which is the whole point of the seconds-scale part of this simulator.
 */
export interface CardiovascularState extends State {
  mapMmHg: number;
  sympatheticTone: number;
  baroreflexSetpointMmHg: number;

  heartRateBpm: number;
  strokeVolumeMl: number;
  endDiastolicVolumeMl: number;
  ejectionFraction: number;
  cardiacOutputLPerMin: number;
  tprMmHgMinPerL: number;
  centralVenousPressureMmHg: number;
  meanSystemicFillingPressureMmHg: number;
  /** Slow whole-body autoregulation of the resistance vessels, 1 = resting. */
  autoregulationFactor: number;
  systolicMmHg: number;
  diastolicMmHg: number;
}

export const cardiovascularParams: readonly ParamDefinition[] = [
  {
    id: 'contractility',
    label: 'Herzkontraktilität',
    group: 'physiology',
    unit: '1',
    min: 0.2,
    max: 1.6,
    step: 0.05,
    default: 1,
    normal: { low: 0.9, high: 1.1 },
    hint: 'Relativ zur Norm. Werte unter 1 machen das Herz zugleich nachlastempfindlicher.',
    contentId: 'frank-starling',
    source: 'Relativgroesse, keine Messgroesse',
  },
  {
    id: 'vascularCompliance',
    label: 'Gefäßcompliance',
    group: 'physiology',
    unit: '1',
    min: 0.4,
    max: 1.6,
    step: 0.05,
    default: 1,
    hint: 'Relativ zur Norm. Niedrige Werte entsprechen der steifen Aorta im Alter.',
    contentId: 'windkessel',
    source: 'Relativgroesse, keine Messgroesse',
  },
  {
    id: 'vascularTone',
    label: 'Gefäßtonus (relativ)',
    group: 'physiology',
    unit: '1',
    min: 0.6,
    max: 1.8,
    step: 0.05,
    default: 1,
    hint: 'Direkter Faktor auf den peripheren Widerstand — für den reinen Drucksprung ohne Umweg über Nerven oder Hormone.',
    contentId: 'peripherer-widerstand',
    source: 'Relativgroesse, keine Messgroesse',
  },
  {
    id: 'sympatheticBaseline',
    label: 'Sympathikotonus (Grundlage)',
    group: 'physiology',
    unit: '1',
    min: 0.5,
    max: 2,
    step: 0.05,
    default: 1,
    hint: 'Multiplikativ auf den Reflexausgang — 1 ist Ruhe.',
    contentId: 'barorezeptorreflex',
    source: 'Relativgroesse, keine Messgroesse',
  },
  {
    id: 'baroreflexEnabled',
    label: 'Barorezeptorreflex aktiv',
    group: 'physiology',
    unit: '1',
    min: 0,
    max: 1,
    step: 1,
    default: 1,
    hint: 'Abschalten zeigt, was der Reflex leistet.',
    contentId: 'barorezeptorreflex',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'heartFailure',
    label: 'Herzinsuffizienz',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint: 'Senkt die Kontraktilität und damit die Auswurffraktion.',
    contentId: 'herzinsuffizienz',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'pheochromocytoma',
    label: 'Phäochromozytom',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint: 'Autonome Katecholaminfreisetzung, unabhängig vom Reflex.',
    contentId: 'phaeochromozytom',
    source: 'Schalter, keine Messgroesse',
  },
];

/** Sympathetic tone the reflex aims for at the given pressure. 1 at the set point. */
function baroreflexTarget(mapMmHg: number, setpointMmHg: number): number {
  return 2 / (1 + Math.exp(C.BAROREFLEX_SLOPE_PER_MMHG * (mapMmHg - setpointMmHg)));
}

export const cardiovascularSystem: SystemModel<CardiovascularState> = {
  id: 'cardiovascular',
  label: 'Herz und Kreislauf',
  timeScales: ['fast', 'slow'],
  params: cardiovascularParams,

  initialState(): CardiovascularState {
    return {
      t: 0,
      mapMmHg: C.MAP_MMHG,
      sympatheticTone: 1,
      baroreflexSetpointMmHg: C.MAP_MMHG,
      heartRateBpm: C.HEART_RATE_BPM,
      strokeVolumeMl: C.STROKE_VOLUME_ML,
      endDiastolicVolumeMl: C.EDV_ML,
      ejectionFraction: C.EJECTION_FRACTION,
      cardiacOutputLPerMin: C.CARDIAC_OUTPUT_L_PER_MIN,
      tprMmHgMinPerL: C.TPR_MMHG_MIN_PER_L,
      centralVenousPressureMmHg: C.CENTRAL_VENOUS_PRESSURE_MMHG,
      meanSystemicFillingPressureMmHg: C.MEAN_SYSTEMIC_FILLING_PRESSURE_MMHG,
      autoregulationFactor: 1,
      systolicMmHg: 120,
      diastolicMmHg: 80,
    };
  },

  step(state, p, dt, bus): CardiovascularState {
    const s = bus.signals;
    const mod = bus.mod;

    // --- baroreceptor reflex ----------------------------------------------
    const reflexActive = param(p, 'baroreflexEnabled') > 0;
    const pheo = param(p, 'pheochromocytoma') / 100;
    const toneTarget = clamp(
      (reflexActive ? baroreflexTarget(state.mapMmHg, state.baroreflexSetpointMmHg) : 1) *
        param(p, 'sympatheticBaseline') +
        pheo, // autonomous catecholamine release, independent of the reflex
      0,
      3,
    );
    const sympatheticTone = relax(state.sympatheticTone, toneTarget, C.TAU_BAROREFLEX, dt);

    // The set point drifts towards the prevailing pressure over a day and a half. This is
    // why a chronically raised pressure is no longer "seen" as an error by the reflex.
    const setpointTarget = C.MAP_MMHG + C.BAROREFLEX_RESET_FRACTION * (state.mapMmHg - C.MAP_MMHG);
    const baroreflexSetpointMmHg = relax(
      state.baroreflexSetpointMmHg,
      setpointTarget,
      C.TAU_BAROREFLEX_RESET,
      dt,
    );

    // Beta-1 blockade weakens the chronotropic and inotropic arm of the reflex but leaves
    // the alpha-1 arm (resistance, venous tone) untouched.
    const beta1 = mod['beta1.receptor'];
    const toneDelta = sympatheticTone - 1;

    // --- filling ------------------------------------------------------------
    const compliance = C.SYSTEMIC_COMPLIANCE_L_PER_MMHG * param(p, 'vascularCompliance');
    const unstressed = C.UNSTRESSED_VOLUME_L - C.VENOUS_TONE_GAIN_L * toneDelta;
    const meanSystemicFillingPressureMmHg = Math.max(0, (s.bloodVolumeL - unstressed) / compliance);
    const centralVenousPressureMmHg = Math.max(
      0,
      meanSystemicFillingPressureMmHg -
        state.cardiacOutputLPerMin * C.VENOUS_RESISTANCE_MMHG_MIN_PER_L,
    );
    const endDiastolicVolumeMl =
      (C.EDV_MAX_ML * meanSystemicFillingPressureMmHg) /
      (meanSystemicFillingPressureMmHg + C.EDV_HALF_MMHG);

    // --- contraction --------------------------------------------------------
    const contractility = clamp(
      param(p, 'contractility') *
        (1 - 0.7 * (param(p, 'heartFailure') / 100)) *
        mod['contractility.intrinsic'] *
        (1 + C.CONTRACTILITY_SYMPATHETIC_GAIN * toneDelta * beta1),
      0.1,
      2.5,
    );
    // A weak ventricle loses more stroke volume per mmHg of afterload than a strong one.
    const afterloadFactor = clamp(
      1 - (C.AFTERLOAD_SENSITIVITY / contractility) * ((state.mapMmHg - C.MAP_MMHG) / C.MAP_MMHG),
      0.25,
      1.4,
    );
    const ejectionFraction = clamp(
      C.EJECTION_FRACTION * contractility * afterloadFactor,
      0.05,
      0.9,
    );
    const strokeVolumeMl = endDiastolicVolumeMl * ejectionFraction;

    const heartRateBpm = clamp(
      C.HEART_RATE_BPM * (1 + C.HR_SYMPATHETIC_GAIN * toneDelta * beta1),
      C.HEART_RATE_MIN_BPM,
      C.HEART_RATE_MAX_BPM,
    );
    const cardiacOutputLPerMin = (heartRateBpm * strokeVolumeMl) / 1000;

    // --- resistance ---------------------------------------------------------
    // Whole-body autoregulation: the periphery closes down when it is over-perfused.
    // Days, not seconds — this is the mechanism behind the shift from high output to high
    // resistance in volume-dependent hypertension.
    const autoregulationTarget = clamp(
      1 + C.AUTOREGULATION_GAIN * (state.cardiacOutputLPerMin / C.CARDIAC_OUTPUT_L_PER_MIN - 1),
      C.AUTOREGULATION_MIN,
      C.AUTOREGULATION_MAX,
    );
    const autoregulationFactor = relax(
      state.autoregulationFactor,
      autoregulationTarget,
      C.TAU_AUTOREGULATION,
      dt,
    );

    const tprMmHgMinPerL = clamp(
      C.TPR_MMHG_MIN_PER_L *
        autoregulationFactor *
        param(p, 'vascularTone') *
        (1 + C.TPR_SYMPATHETIC_GAIN * toneDelta) *
        respond(
          s.angiotensinIiEffect,
          s.angiotensinIiEffect >= 1 ? C.TPR_ANGIOTENSIN_GAIN : C.TPR_ANGIOTENSIN_GAIN_LOW,
        ) *
        (1 - C.TPR_ANP_GAIN * (s.anpRelative - 1)) *
        mod['vsmc.calciumChannel'],
      4,
      60,
    );

    // --- arterial windkessel ------------------------------------------------
    // dP/dt = (inflow - outflow) / C, with outflow = (MAP - ZVD) / TPR.
    // Steady state: MAP = HZV x TPR + ZVD. Time constant tau = TPR x C ~ 2 s.
    const arterialCompliance = C.ARTERIAL_COMPLIANCE_L_PER_MMHG * param(p, 'vascularCompliance');
    const tau = tprMmHgMinPerL * arterialCompliance * 60; // mmHg·min/L x L/mmHg -> min -> s
    const mapTarget = cardiacOutputLPerMin * tprMmHgMinPerL + centralVenousPressureMmHg;
    const mapMmHg = clamp(relax(state.mapMmHg, mapTarget, tau, dt), 10, 260);

    // Pulse pressure from stroke volume and arterial compliance (windkessel estimate).
    const pulsePressure = strokeVolumeMl / (arterialCompliance * 1000);
    const systolicMmHg = mapMmHg + (2 / 3) * pulsePressure;
    const diastolicMmHg = mapMmHg - (1 / 3) * pulsePressure;

    return {
      t: state.t + dt,
      mapMmHg,
      sympatheticTone,
      baroreflexSetpointMmHg,
      heartRateBpm,
      strokeVolumeMl,
      endDiastolicVolumeMl,
      ejectionFraction,
      cardiacOutputLPerMin,
      tprMmHgMinPerL,
      centralVenousPressureMmHg,
      meanSystemicFillingPressureMmHg,
      autoregulationFactor,
      systolicMmHg,
      diastolicMmHg,
    };
  },

  derive(state): readonly Readout[] {
    return [
      {
        id: 'map',
        label: 'Mittlerer arterieller Druck',
        value: state.mapMmHg,
        unit: 'mmHg',
        precision: 0,
        group: 'haemodynamik',
        equation: 'eq:map',
        normal: { low: 70, high: 105, source: 'Guyton & Hall; Silbernagl/Despopoulos' },
        contentId: 'mittlerer-arterieller-druck',
      },
      {
        id: 'bloodPressure',
        label: 'Blutdruck systolisch/diastolisch',
        value: state.systolicMmHg,
        unit: 'mmHg',
        precision: 0,
        group: 'haemodynamik',
        equation: 'eq:pulsdruck',
        normal: { low: 100, high: 140, source: 'Silbernagl/Despopoulos' },
      },
      {
        id: 'heartRate',
        label: 'Herzfrequenz',
        value: state.heartRateBpm,
        unit: '1/min',
        precision: 0,
        group: 'haemodynamik',
        equation: 'eq:herzfrequenz',
        normal: { low: 60, high: 100, source: 'Silbernagl/Despopoulos' },
      },
      {
        id: 'strokeVolume',
        label: 'Schlagvolumen',
        value: state.strokeVolumeMl,
        unit: 'mL',
        precision: 0,
        group: 'haemodynamik',
        equation: 'eq:schlagvolumen',
        normal: { low: 60, high: 80, source: 'Boron & Boulpaep' },
        contentId: 'frank-starling',
      },
      {
        id: 'cardiacOutput',
        label: 'Herzzeitvolumen',
        value: state.cardiacOutputLPerMin,
        unit: 'L/min',
        precision: 2,
        group: 'haemodynamik',
        equation: 'eq:hzv',
        normal: { low: 4.5, high: 6.0, source: 'Guyton & Hall' },
      },
      {
        id: 'tpr',
        label: 'Peripherer Gesamtwiderstand',
        value: state.tprMmHgMinPerL,
        unit: 'mmHg·min/L',
        precision: 1,
        group: 'haemodynamik',
        equation: 'eq:tpr',
        normal: { low: 15, high: 21, source: 'Abgeleitet aus MAP, ZVD und HZV' },
      },
      {
        id: 'cvp',
        label: 'Zentraler Venendruck',
        value: state.centralVenousPressureMmHg,
        unit: 'mmHg',
        precision: 1,
        group: 'haemodynamik',
        equation: 'eq:zvd',
        normal: { low: 0, high: 8, source: 'Silbernagl/Despopoulos' },
      },
      {
        id: 'edv',
        label: 'Enddiastolisches Volumen',
        value: state.endDiastolicVolumeMl,
        unit: 'mL',
        precision: 0,
        group: 'haemodynamik',
        equation: 'eq:edv',
        normal: { low: 100, high: 150, source: 'Boron & Boulpaep' },
      },
      {
        id: 'ejectionFraction',
        label: 'Auswurffraktion',
        value: state.ejectionFraction * 100,
        unit: '%',
        precision: 0,
        group: 'haemodynamik',
        equation: 'eq:ef',
        normal: { low: 55, high: 70, source: 'Boron & Boulpaep' },
      },
      {
        id: 'autoregulationFactor',
        label: 'Ganzkörper-Autoregulation',
        value: state.autoregulationFactor,
        unit: '1',
        precision: 3,
        group: 'haemodynamik',
        equation: 'eq:ganzkoerper-autoregulation',
        normal: { low: 0.98, high: 1.02, source: 'Normiert, 1 entspricht Ruhe' },
        contentId: 'peripherer-widerstand',
      },
      {
        id: 'sympatheticTone',
        label: 'Sympathikusaktivität',
        value: state.sympatheticTone,
        unit: '1',
        precision: 2,
        group: 'hormone',
        equation: 'eq:barorezeptorreflex',
        normal: { low: 0.9, high: 1.1, source: 'Normiert, 1 entspricht Ruhe' },
        contentId: 'barorezeptorreflex',
      },
      {
        id: 'baroreflexSetpoint',
        label: 'Sollwert des Barorezeptorreflexes',
        value: state.baroreflexSetpointMmHg,
        unit: 'mmHg',
        precision: 0,
        group: 'hormone',
        equation: 'eq:baro-resetting',
        contentId: 'barorezeptorreflex',
      },
    ];
  },

  publish(state): Partial<OrganismSignals> {
    return {
      mapMmHg: state.mapMmHg,
      systolicMmHg: state.systolicMmHg,
      diastolicMmHg: state.diastolicMmHg,
      heartRateBpm: state.heartRateBpm,
      strokeVolumeMl: state.strokeVolumeMl,
      cardiacOutputLPerMin: state.cardiacOutputLPerMin,
      tprMmHgMinPerL: state.tprMmHgMinPerL,
      centralVenousPressureMmHg: state.centralVenousPressureMmHg,
      sympatheticTone: state.sympatheticTone,
    };
  },
};
