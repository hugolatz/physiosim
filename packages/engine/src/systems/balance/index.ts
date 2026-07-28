import type { ParamDefinition, Params, Readout, State, SystemModel } from '../../core/types';
import type { OrganismSignals } from '../../core/signals';
import { clamp, nonNegative, relax } from '../../core/units';
import { param } from '../../core/params';
import * as C from './constants';

/**
 * Fluid, sodium and potassium balance.
 *
 * Two-compartment osmotic bookkeeping: we track total body water and extracellular sodium,
 * and let the compartments follow from osmotic equilibrium. That way drinking pure water
 * distributes across all 42 L while an infusion of saline stays extracellular — without
 * either case having to be special-cased.
 */
/** The five quantities that are actually integrated, plus the current intake for display. */
interface BalanceCore extends State {
  totalBodyWaterL: number;
  sodiumExtracellularMmol: number;
  potassiumExtracellularMmol: number;
  plasmaVolumeL: number;
  redCellVolumeL: number;
  waterIntakeLPerDay: number;
  thirstIntakeLPerDay: number;
}

/** Everything else follows from those, and is carried along so `derive` needs no context. */
export interface BalanceState extends BalanceCore {
  osmolalityMosmPerKg: number;
  ecfVolumeL: number;
  bloodVolumeL: number;
  hematocrit: number;
  plasmaSodiumMmolPerL: number;
  plasmaPotassiumMmolPerL: number;
  plasmaOncoticMmHg: number;
}

export const balanceParams: readonly ParamDefinition[] = [
  {
    id: 'sodiumIntake',
    label: 'Kochsalzzufuhr',
    group: 'physiology',
    unit: 'mmol/d',
    min: 10,
    max: 800,
    step: 10,
    default: 150,
    normal: { low: 100, high: 200 },
    hint: '150 mmol Na⁺ entsprechen etwa 8,8 g Kochsalz. Die DGE empfiehlt 6 g (100 mmol).',
    contentId: 'natriumbilanz',
    source: 'Uebliche Zufuhr in Deutschland; DGE-Referenzwert 6 g NaCl/d',
  },
  {
    id: 'waterIntake',
    label: 'Trinkmenge',
    group: 'physiology',
    unit: 'L/d',
    min: 0,
    max: 12,
    step: 0.1,
    default: 1.5,
    normal: { low: 1.2, high: 2.5 },
    hint: 'Dazu kommen 0,7 L Nahrungswasser und 0,3 L Oxidationswasser.',
    contentId: 'wasserbilanz',
    source: 'Silbernagl/Despopoulos, Wasserbilanz',
  },
  {
    id: 'potassiumIntake',
    label: 'Kaliumzufuhr',
    group: 'physiology',
    unit: 'mmol/d',
    min: 10,
    max: 250,
    step: 5,
    default: 70,
    normal: { low: 50, high: 100 },
    contentId: 'kaliumbilanz',
    source: 'Boron & Boulpaep, Kaliumhaushalt',
  },
  {
    id: 'infusionRate',
    label: 'Infusion (isoton)',
    group: 'physiology',
    unit: 'mL/min',
    min: 0,
    max: 100,
    step: 1,
    default: 0,
    hint: 'Isotone Kochsalzloesung, 154 mmol/L Na⁺ — bleibt extrazellulaer.',
    source: 'Klinische Standardloesung 0,9 % NaCl',
  },
  {
    id: 'thirstEnabled',
    label: 'Durst wirksam',
    group: 'physiology',
    unit: '1',
    min: 0,
    max: 1,
    step: 1,
    default: 1,
    hint: 'Abschalten simuliert den Patienten ohne Zugang zu Wasser.',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'hemorrhageRate',
    label: 'Blutung',
    group: 'pathology',
    unit: 'mL/min',
    min: 0,
    max: 500,
    step: 5,
    default: 0,
    hint: 'Vollblutverlust. 1000 mL entsprechen rund 20 % des Blutvolumens.',
    contentId: 'hypovolaemie',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'initialHematocrit',
    label: 'Hämatokrit (Start)',
    group: 'physiology',
    unit: '1',
    min: 0.15,
    max: 0.6,
    step: 0.01,
    default: 0.42,
    normal: { low: 0.37, high: 0.47 },
    hint: 'Wirkt beim Zuruecksetzen der Simulation.',
    source: 'Silbernagl/Despopoulos, Blut',
  },
  {
    id: 'nephroticSyndrome',
    label: 'Nephrotisches Syndrom',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint: 'Proteinverlust senkt den kolloidosmotischen Druck des Plasmas.',
    contentId: 'onkotischer-druck',
    source: 'Schalter, keine Messgroesse',
  },
];

/** Osmolality [mosm/kg] from the tracked solute and water content. */
function osmolality(state: Pick<BalanceState, 'totalBodyWaterL' | 'sodiumExtracellularMmol'>) {
  const osmoles =
    2 * state.sodiumExtracellularMmol + C.EXTRACELLULAR_OTHER_OSMOLES + C.INTRACELLULAR_OSMOLES;
  return osmoles / Math.max(state.totalBodyWaterL, 1);
}

/** Extracellular volume follows from the extracellular osmoles at the current osmolality. */
function ecfVolume(sodiumMmol: number, osm: number) {
  return (2 * sodiumMmol + C.EXTRACELLULAR_OTHER_OSMOLES) / osm;
}

function withDerived(base: BalanceCore, p: Params): BalanceState {
  const osm = osmolality(base);
  const ecf = ecfVolume(base.sodiumExtracellularMmol, osm);
  const blood = base.plasmaVolumeL + base.redCellVolumeL;
  const nephrotic = param(p, 'nephroticSyndrome') / 100;
  return {
    ...base,
    osmolalityMosmPerKg: osm,
    ecfVolumeL: ecf,
    bloodVolumeL: blood,
    hematocrit: blood > 0 ? base.redCellVolumeL / blood : 0,
    plasmaSodiumMmolPerL: base.sodiumExtracellularMmol / Math.max(ecf, 0.1),
    plasmaPotassiumMmolPerL: base.potassiumExtracellularMmol / C.POTASSIUM_BUFFER_VOLUME_L,
    // Protein mass is constant, so oncotic pressure rises when plasma is concentrated and
    // falls when it is diluted. Nephrotic syndrome removes protein outright.
    plasmaOncoticMmHg:
      (C.PLASMA_ONCOTIC_MMHG * C.PLASMA_VOLUME_L) / Math.max(base.plasmaVolumeL, 0.5) -
      C.PLASMA_ONCOTIC_MMHG * 0.55 * nephrotic,
  };
}

export const balanceSystem: SystemModel<BalanceState> = {
  id: 'balance',
  label: 'Wasser- und Elektrolythaushalt',
  timeScales: ['slow'],
  params: balanceParams,

  initialState(p: Params): BalanceState {
    const hct = param(p, 'initialHematocrit');
    const blood = C.PLASMA_VOLUME_L / (1 - hct);
    return withDerived(
      {
        t: 0,
        totalBodyWaterL: C.TOTAL_BODY_WATER_L,
        sodiumExtracellularMmol: C.EXTRACELLULAR_SODIUM_MMOL,
        potassiumExtracellularMmol: C.PLASMA_POTASSIUM_MMOL_PER_L * C.POTASSIUM_BUFFER_VOLUME_L,
        plasmaVolumeL: C.PLASMA_VOLUME_L,
        redCellVolumeL: blood - C.PLASMA_VOLUME_L,
        waterIntakeLPerDay: param(p, 'waterIntake'),
        thirstIntakeLPerDay: 0,
      },
      p,
    );
  },

  step(state, p, dt, bus): BalanceState {
    const s = bus.signals;

    // --- water in ----------------------------------------------------------
    const thirst =
      param(p, 'thirstEnabled') > 0
        ? clamp(
            (state.osmolalityMosmPerKg - C.THIRST_THRESHOLD_MOSM_PER_KG) *
              C.THIRST_GAIN_L_PER_DAY_PER_MOSM,
            0,
            C.THIRST_MAX_L_PER_DAY,
          )
        : 0;
    const infusionLPerDay = (param(p, 'infusionRate') / 1000) * 1440;
    const intakeLPerDay =
      param(p, 'waterIntake') +
      thirst +
      infusionLPerDay +
      C.FOOD_WATER_L_PER_DAY +
      C.METABOLIC_WATER_L_PER_DAY;

    // --- water out ---------------------------------------------------------
    const urineLPerDay = (s.urineFlowMlPerMin / 1000) * 1440;
    const lossLPerDay = urineLPerDay + C.INSENSIBLE_LOSS_L_PER_DAY + C.STOOL_WATER_L_PER_DAY;

    // --- solute ------------------------------------------------------------
    // Isotonic saline carries 154 mmol/L; oral intake is prescribed directly.
    const sodiumInMmolPerDay = param(p, 'sodiumIntake') + infusionLPerDay * 154;
    const sodiumOutMmolPerDay = s.sodiumExcretionMmolPerMin * 1440;
    const potassiumInMmolPerDay = param(p, 'potassiumIntake');
    const potassiumOutMmolPerDay = s.potassiumExcretionMmolPerMin * 1440;

    const perDay = dt * C.PER_DAY_TO_PER_SECOND;

    let totalBodyWaterL = state.totalBodyWaterL + (intakeLPerDay - lossLPerDay) * perDay;
    let sodiumExtracellularMmol =
      state.sodiumExtracellularMmol + (sodiumInMmolPerDay - sodiumOutMmolPerDay) * perDay;
    const potassiumExtracellularMmol = nonNegative(
      state.potassiumExtracellularMmol + (potassiumInMmolPerDay - potassiumOutMmolPerDay) * perDay,
    );

    // --- haemorrhage -------------------------------------------------------
    // Whole blood leaves: the plasma share takes extracellular water and sodium with it,
    // the cell share only reduces the red cell volume.
    let plasmaVolumeL = state.plasmaVolumeL;
    let redCellVolumeL = state.redCellVolumeL;
    const bleedMlPerMin = param(p, 'hemorrhageRate');
    if (bleedMlPerMin > 0) {
      const bleedL = (bleedMlPerMin / 1000) * (dt / 60);
      const plasmaLost = Math.min(bleedL * (1 - state.hematocrit), plasmaVolumeL * 0.5);
      const cellsLost = Math.min(bleedL * state.hematocrit, redCellVolumeL * 0.5);
      plasmaVolumeL -= plasmaLost;
      redCellVolumeL -= cellsLost;
      totalBodyWaterL -= plasmaLost;
      sodiumExtracellularMmol -= plasmaLost * state.plasmaSodiumMmolPerL;
    }

    // --- transcapillary refill --------------------------------------------
    // Plasma is a share of the extracellular volume, but it takes hours to re-equilibrate.
    // A low oncotic pressure shifts the equilibrium towards the interstitium (oedema).
    const osm = osmolality({ totalBodyWaterL, sodiumExtracellularMmol });
    const ecf = ecfVolume(sodiumExtracellularMmol, osm);
    const oncoticRatio = clamp(state.plasmaOncoticMmHg / C.PLASMA_ONCOTIC_MMHG, 0.3, 1.5);
    const targetPlasma = ecf * C.PLASMA_FRACTION_OF_ECF * oncoticRatio;
    plasmaVolumeL = relax(plasmaVolumeL, targetPlasma, C.TAU_PLASMA_REFILL, dt);

    return withDerived(
      {
        t: state.t + dt,
        totalBodyWaterL: nonNegative(totalBodyWaterL),
        sodiumExtracellularMmol: nonNegative(sodiumExtracellularMmol),
        potassiumExtracellularMmol,
        plasmaVolumeL: nonNegative(plasmaVolumeL),
        redCellVolumeL: nonNegative(redCellVolumeL),
        waterIntakeLPerDay: intakeLPerDay,
        thirstIntakeLPerDay: thirst,
      },
      p,
    );
  },

  derive(state): readonly Readout[] {
    return [
      {
        id: 'bloodVolume',
        label: 'Blutvolumen',
        value: state.bloodVolumeL,
        unit: 'L',
        precision: 2,
        group: 'bilanz',
        equation: 'eq:blutvolumen',
        normal: { low: 4.5, high: 5.5, source: 'Boron & Boulpaep, Body Fluid Compartments' },
        contentId: 'blutvolumen',
      },
      {
        id: 'plasmaVolume',
        label: 'Plasmavolumen',
        value: state.plasmaVolumeL,
        unit: 'L',
        precision: 2,
        group: 'bilanz',
        equation: 'eq:plasmavolumen',
        normal: { low: 2.7, high: 3.3, source: 'Boron & Boulpaep' },
      },
      {
        id: 'ecfVolume',
        label: 'Extrazellulärvolumen',
        value: state.ecfVolumeL,
        unit: 'L',
        precision: 2,
        group: 'bilanz',
        equation: 'eq:ezv',
        normal: { low: 13, high: 15, source: 'Boron & Boulpaep' },
      },
      {
        id: 'totalBodyWater',
        label: 'Gesamtkörperwasser',
        value: state.totalBodyWaterL,
        unit: 'L',
        precision: 1,
        group: 'bilanz',
        equation: 'eq:koerperwasser',
        normal: { low: 40, high: 44, source: 'Boron & Boulpaep' },
      },
      {
        id: 'hematocrit',
        label: 'Hämatokrit',
        value: state.hematocrit,
        unit: '1',
        precision: 2,
        group: 'labor',
        equation: 'eq:haematokrit',
        normal: { low: 0.37, high: 0.47, source: 'Silbernagl/Despopoulos, Blut' },
      },
      {
        id: 'plasmaSodium',
        label: 'Natrium im Plasma',
        value: state.plasmaSodiumMmolPerL,
        unit: 'mmol/L',
        precision: 1,
        group: 'labor',
        equation: 'eq:plasma-natrium',
        normal: { low: 135, high: 145, source: 'Silbernagl/Despopoulos' },
        contentId: 'natriumbilanz',
      },
      {
        id: 'plasmaPotassium',
        label: 'Kalium im Plasma',
        value: state.plasmaPotassiumMmolPerL,
        unit: 'mmol/L',
        precision: 2,
        group: 'labor',
        equation: 'eq:plasma-kalium',
        normal: { low: 3.5, high: 5.0, source: 'Silbernagl/Despopoulos' },
        contentId: 'kaliumbilanz',
      },
      {
        id: 'osmolality',
        label: 'Plasmaosmolalität',
        value: state.osmolalityMosmPerKg,
        unit: 'mosm/kg',
        precision: 0,
        group: 'labor',
        equation: 'eq:osmolalitaet',
        normal: { low: 280, high: 300, source: 'Silbernagl/Despopoulos' },
      },
      {
        id: 'plasmaOncotic',
        label: 'Kolloidosmotischer Druck',
        value: state.plasmaOncoticMmHg,
        unit: 'mmHg',
        precision: 1,
        group: 'labor',
        equation: 'eq:onkotischer-druck',
        normal: { low: 25, high: 30, source: 'Guyton & Hall' },
        contentId: 'onkotischer-druck',
      },
      {
        id: 'waterIntake',
        label: 'Wasseraufnahme gesamt',
        value: state.waterIntakeLPerDay,
        unit: 'L/d',
        precision: 2,
        group: 'bilanz',
        equation: 'eq:wasserbilanz',
      },
    ];
  },

  publish(state): Partial<OrganismSignals> {
    return {
      bloodVolumeL: state.bloodVolumeL,
      plasmaVolumeL: state.plasmaVolumeL,
      ecfVolumeL: state.ecfVolumeL,
      hematocrit: state.hematocrit,
      plasmaSodiumMmolPerL: state.plasmaSodiumMmolPerL,
      plasmaPotassiumMmolPerL: state.plasmaPotassiumMmolPerL,
      plasmaOsmolalityMosmPerKg: state.osmolalityMosmPerKg,
      plasmaOncoticMmHg: state.plasmaOncoticMmHg,
    };
  },
};
