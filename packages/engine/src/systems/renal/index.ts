import type { ParamDefinition, Readout, State, SystemModel } from '../../core/types';
import type { OrganismSignals } from '../../core/signals';
import { param } from '../../core/params';
import type { KidneyState } from './kidney';
import { initialKidneyState, stepKidney } from './kidney';
import * as C from './constants';

/**
 * The kidneys. Two of them, computed separately (docs/adr/0004) — without that, a
 * unilateral renal artery stenosis has nothing to be unilateral about.
 */
export interface RenalState extends State {
  left: KidneyState;
  right: KidneyState;
  gfrMlPerMin: number;
  renalBloodFlowMlPerMin: number;
  urineFlowMlPerMin: number;
  sodiumExcretionMmolPerMin: number;
  potassiumExcretionMmolPerMin: number;
  reninSecretionRelative: number;
  filtrationFraction: number;
  urineSodiumMmolPerL: number;
  urineOsmolalityMosmPerKg: number;
  freeWaterClearanceMlPerMin: number;
}

export const renalParams: readonly ParamDefinition[] = [
  {
    id: 'filtrationCoefficient',
    label: 'Filtrationskoeffizient Kf',
    group: 'physiology',
    unit: '1',
    min: 0.2,
    max: 1.5,
    step: 0.05,
    default: 1,
    hint: 'Relativ zur Norm. Sinkt bei Verlust filtrierender Fläche.',
    contentId: 'filtrationskoeffizient',
    source: 'Relativgroesse zu Kf = 12,5 mL/min/mmHg (Guyton & Hall)',
  },
  {
    id: 'myogenicEnabled',
    label: 'Myogene Autoregulation (Bayliss)',
    group: 'physiology',
    unit: '1',
    min: 0,
    max: 1,
    step: 1,
    default: 1,
    contentId: 'bayliss-effekt',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'tgfEnabled',
    label: 'Tubuloglomeruläres Feedback',
    group: 'physiology',
    unit: '1',
    min: 0,
    max: 1,
    step: 1,
    default: 1,
    hint: 'Abschalten zeigt, wie stark die GFR sonst dem Blutdruck folgen würde.',
    contentId: 'tubuloglomerulaeres-feedback',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'pressureNatriuresisEnabled',
    label: 'Druck-Natriurese aktiv',
    group: 'physiology',
    unit: '1',
    min: 0,
    max: 1,
    step: 1,
    default: 1,
    hint: 'Abschalten nimmt der Niere den Langzeit-Blutdruckregler aus der Hand.',
    contentId: 'druck-natriurese',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'renalArteryStenosisLeft',
    label: 'Nierenarterienstenose links (Druckabfall)',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 60,
    step: 5,
    default: 0,
    hint: 'Anteil des Mitteldrucks, der über der Stenose verloren geht — nicht der Grad der Lumeneinengung. Ab etwa 20 % wird es hämodynamisch relevant.',
    contentId: 'nierenarterienstenose',
    source: 'Schalter, keine Messgroesse',
  },
  {
    id: 'renalArteryStenosisRight',
    label: 'Nierenarterienstenose rechts (Druckabfall)',
    group: 'pathology',
    unit: '%',
    min: 0,
    max: 60,
    step: 5,
    default: 0,
    hint: 'Anteil des Mitteldrucks, der über der Stenose verloren geht.',
    contentId: 'nierenarterienstenose',
    source: 'Schalter, keine Messgroesse',
  },
];

export const renalSystem: SystemModel<RenalState> = {
  id: 'renal',
  label: 'Nieren',
  timeScales: ['fast', 'medium', 'slow'],
  params: renalParams,

  initialState(): RenalState {
    const left = initialKidneyState();
    const right = initialKidneyState();
    return combine(0, left, right);
  },

  step(state, p, dt, bus): RenalState {
    const shared = {
      signals: bus.signals,
      mod: bus.mod,
      myogenicEnabled: param(p, 'myogenicEnabled') > 0,
      tgfEnabled: param(p, 'tgfEnabled') > 0,
      pressureNatriuresisEnabled: param(p, 'pressureNatriuresisEnabled') > 0,
      kfFactor: param(p, 'filtrationCoefficient'),
    };
    const left = stepKidney(
      state.left,
      { ...shared, stenosis: param(p, 'renalArteryStenosisLeft') / 100 },
      dt,
    );
    const right = stepKidney(
      state.right,
      { ...shared, stenosis: param(p, 'renalArteryStenosisRight') / 100 },
      dt,
    );
    return combine(state.t + dt, left, right);
  },

  derive(state): readonly Readout[] {
    const kidneyReadouts = (side: 'left' | 'right', label: string): Readout[] => {
      const k = state[side];
      return [
        {
          id: `gfr-${side}`,
          label: `GFR ${label}`,
          value: k.gfrMlPerMin,
          unit: 'mL/min',
          precision: 1,
          group: 'niere',
          equation: 'eq:gfr',
          normal: { low: 55, high: 70, source: 'Haelfte von 125 mL/min (Guyton & Hall)' },
        },
        {
          id: `rbf-${side}`,
          label: `Nierendurchblutung ${label}`,
          value: k.renalBloodFlowMlPerMin,
          unit: 'mL/min',
          precision: 0,
          group: 'niere',
          equation: 'eq:rbf',
          normal: { low: 480, high: 620, source: 'Haelfte von 1100 mL/min (Guyton & Hall)' },
        },
        {
          id: `pgc-${side}`,
          label: `P_GC ${label}`,
          value: k.glomerularPressureMmHg,
          unit: 'mmHg',
          precision: 1,
          group: 'niere',
          equation: 'eq:p-gc',
          normal: { low: 55, high: 65, source: 'Guyton & Hall' },
          contentId: 'glomerulaere-filtration',
        },
        {
          id: `perfusion-${side}`,
          label: `Perfusionsdruck ${label}`,
          value: k.perfusionPressureMmHg,
          unit: 'mmHg',
          precision: 0,
          group: 'niere',
          equation: 'eq:renaler-perfusionsdruck',
          contentId: 'nierenarterienstenose',
        },
        {
          id: `renin-${side}`,
          label: `Reninfreisetzung ${label}`,
          value: k.reninSecretionRelative,
          unit: '1',
          precision: 2,
          group: 'hormone',
          equation: 'eq:reninsekretion',
          normal: { low: 0.8, high: 1.2, source: 'Normiert, 1 entspricht Ruhe' },
          contentId: 'renin',
        },
        {
          id: `sodiumExcretion-${side}`,
          label: `Natriumausscheidung ${label}`,
          value: k.sodiumExcretionMmolPerMin * 1440,
          unit: 'mmol/d',
          precision: 0,
          group: 'bilanz',
          equation: 'eq:natriumausscheidung',
          contentId: 'druck-natriurese',
        },
        {
          id: `urineFlow-${side}`,
          label: `Urinfluss ${label}`,
          value: (k.urineFlowMlPerMin * 1440) / 1000,
          unit: 'L/d',
          precision: 2,
          group: 'niere',
          equation: 'eq:urinfluss',
        },
        {
          id: `ff-${side}`,
          label: `Filtrationsfraktion ${label}`,
          value: k.filtrationFraction * 100,
          unit: '%',
          precision: 1,
          group: 'niere',
          equation: 'eq:ff',
          contentId: 'filtrationsfraktion',
        },
        {
          id: `md-${side}`,
          label: `NaCl an der Macula densa ${label}`,
          value: k.maculaDensaDeliveryMmolPerMin,
          unit: 'mmol/min',
          precision: 2,
          group: 'niere',
          equation: 'eq:macula-densa',
          contentId: 'macula-densa',
        },
      ];
    };

    return [
      {
        id: 'gfr',
        label: 'GFR gesamt',
        value: state.gfrMlPerMin,
        unit: 'mL/min',
        precision: 0,
        group: 'niere',
        equation: 'eq:gfr',
        normal: { low: 90, high: 140, source: 'Guyton & Hall (125 mL/min)' },
        contentId: 'glomerulaere-filtration',
      },
      {
        id: 'rbf',
        label: 'Nierendurchblutung gesamt',
        value: state.renalBloodFlowMlPerMin,
        unit: 'mL/min',
        precision: 0,
        group: 'niere',
        equation: 'eq:rbf',
        normal: { low: 950, high: 1250, source: 'Guyton & Hall (1100 mL/min)' },
      },
      {
        id: 'filtrationFraction',
        label: 'Filtrationsfraktion',
        value: state.filtrationFraction * 100,
        unit: '%',
        precision: 1,
        group: 'niere',
        equation: 'eq:ff',
        normal: { low: 17, high: 23, source: 'Guyton & Hall (0,20)' },
        contentId: 'filtrationsfraktion',
      },
      {
        id: 'urineFlow',
        label: 'Urinfluss',
        value: (state.urineFlowMlPerMin * 1440) / 1000,
        unit: 'L/d',
        precision: 2,
        group: 'niere',
        equation: 'eq:urinfluss',
        normal: { low: 0.8, high: 2.5, source: 'Silbernagl/Despopoulos' },
      },
      {
        id: 'urineSodium',
        label: 'Natrium im Urin',
        value: state.urineSodiumMmolPerL,
        unit: 'mmol/L',
        precision: 0,
        group: 'niere',
        equation: 'eq:urin-natrium',
        normal: { low: 40, high: 220, source: 'Abhaengig von der Zufuhr' },
      },
      {
        id: 'sodiumExcretion',
        label: 'Natriumausscheidung',
        value: state.sodiumExcretionMmolPerMin * 1440,
        unit: 'mmol/d',
        precision: 0,
        group: 'bilanz',
        equation: 'eq:natriumausscheidung',
        normal: { low: 100, high: 200, source: 'Entspricht im Gleichgewicht der Zufuhr' },
        contentId: 'druck-natriurese',
      },
      {
        id: 'potassiumExcretion',
        label: 'Kaliumausscheidung',
        value: state.potassiumExcretionMmolPerMin * 1440,
        unit: 'mmol/d',
        precision: 0,
        group: 'bilanz',
        equation: 'eq:kaliumausscheidung',
        normal: { low: 50, high: 100, source: 'Entspricht im Gleichgewicht der Zufuhr' },
      },
      {
        id: 'urineOsmolality',
        label: 'Urinosmolalität',
        value: state.urineOsmolalityMosmPerKg,
        unit: 'mosm/kg',
        precision: 0,
        group: 'niere',
        equation: 'eq:urinosmolalitaet',
        normal: { low: 50, high: 1200, source: 'Boron & Boulpaep (Konzentrierungsbereich)' },
      },
      {
        id: 'freeWaterClearance',
        label: 'Freie Wasser-Clearance',
        value: state.freeWaterClearanceMlPerMin,
        unit: 'mL/min',
        precision: 2,
        group: 'niere',
        equation: 'eq:freie-wasser-clearance',
        contentId: 'freie-wasser-clearance',
      },
      ...kidneyReadouts('left', 'links'),
      ...kidneyReadouts('right', 'rechts'),
    ];
  },

  publish(state): Partial<OrganismSignals> {
    return {
      gfrMlPerMin: state.gfrMlPerMin,
      renalBloodFlowMlPerMin: state.renalBloodFlowMlPerMin,
      urineFlowMlPerMin: state.urineFlowMlPerMin,
      sodiumExcretionMmolPerMin: state.sodiumExcretionMmolPerMin,
      potassiumExcretionMmolPerMin: state.potassiumExcretionMmolPerMin,
      reninSecretionRelative: state.reninSecretionRelative,
    };
  },
};

function combine(t: number, left: KidneyState, right: KidneyState): RenalState {
  const gfrMlPerMin = left.gfrMlPerMin + right.gfrMlPerMin;
  const rpf = left.renalPlasmaFlowMlPerMin + right.renalPlasmaFlowMlPerMin;
  const urineFlowMlPerMin = left.urineFlowMlPerMin + right.urineFlowMlPerMin;
  const sodiumExcretionMmolPerMin =
    left.sodiumExcretionMmolPerMin + right.sodiumExcretionMmolPerMin;
  return {
    t,
    left,
    right,
    gfrMlPerMin,
    renalBloodFlowMlPerMin: left.renalBloodFlowMlPerMin + right.renalBloodFlowMlPerMin,
    urineFlowMlPerMin,
    sodiumExcretionMmolPerMin,
    potassiumExcretionMmolPerMin:
      left.potassiumExcretionMmolPerMin + right.potassiumExcretionMmolPerMin,
    // Both kidneys drain into the same plasma pool, so the pool sees the mean of the two
    // secretion rates — this is what makes "renin high from the stenosed side" meaningful.
    reninSecretionRelative: (left.reninSecretionRelative + right.reninSecretionRelative) / 2,
    filtrationFraction: rpf > 0 ? gfrMlPerMin / rpf : 0,
    urineSodiumMmolPerL:
      urineFlowMlPerMin > 0 ? (sodiumExcretionMmolPerMin / urineFlowMlPerMin) * 1000 : 0,
    urineOsmolalityMosmPerKg:
      urineFlowMlPerMin > 0
        ? (left.urineOsmolalityMosmPerKg * left.urineFlowMlPerMin +
            right.urineOsmolalityMosmPerKg * right.urineFlowMlPerMin) /
          urineFlowMlPerMin
        : left.urineOsmolalityMosmPerKg,
    freeWaterClearanceMlPerMin: left.freeWaterClearanceMlPerMin + right.freeWaterClearanceMlPerMin,
  };
}

export { C as renalConstants };
