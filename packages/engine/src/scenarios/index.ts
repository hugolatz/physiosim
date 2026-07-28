import { DAY, HOUR, MINUTE } from '../core/units';

/**
 * The teaching scenarios. Each one is a preset plus a task, and each one is also an
 * acceptance test of the engine (docs/model/validation.md).
 *
 * `settleSeconds` is how long the scenario should be run before the expected picture is
 * fair to judge — the point of the whole simulator is that seconds, minutes and days give
 * different answers to the same question.
 */
export interface Scenario {
  readonly id: string;
  readonly label: string;
  /** The question the student is asked to answer. */
  readonly task: string;
  /** What should happen, in words — the same statement the test checks numerically. */
  readonly expectation: string;
  readonly params: Readonly<Record<string, number>>;
  readonly settleSeconds: number;
  /** Readouts the interface should put in front first. */
  readonly focus: readonly string[];
  readonly contentId?: string;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'acute-hemorrhage',
    label: 'Akuter Blutverlust 1000 mL',
    task: 'Verfolge, was in den ersten Minuten den Druck hält — und was die Niere danach tut.',
    expectation:
      'MAP fällt, aber abgefedert. HF ↑, TPR ↑, Renin ↑↑, Aldosteron ↑, Urin ↓↓, ' +
      'Urin-Na⁺ ↓↓, Filtrationsfraktion ↑.',
    // 100 mL/min over 10 min = 1000 mL. The test stops the bleed afterwards.
    params: { hemorrhageRate: 100 },
    settleSeconds: 10 * MINUTE,
    focus: ['map', 'heartRate', 'tpr', 'plasmaReninActivity', 'urineFlow', 'urineSodium'],
    contentId: 'hypovolaemie',
  },
  {
    id: 'high-salt',
    label: 'Chronisch hohe Kochsalzzufuhr',
    task: 'Warum steigt der Blutdruck bei viel Salz nur mäßig — und was zahlt dafür?',
    expectation:
      'Volumen ↑, Renin ↓, MAP nur mäßig ↑. Die Druck-Natriurese bringt die Ausscheidung ' +
      'wieder auf die Zufuhr.',
    params: { sodiumIntake: 400 },
    settleSeconds: 14 * DAY,
    focus: ['map', 'ecfVolume', 'plasmaReninActivity', 'sodiumExcretion'],
    contentId: 'druck-natriurese',
  },
  {
    id: 'unilateral-stenosis',
    label: 'Einseitige Nierenarterienstenose',
    task: 'Vergleiche beide Nieren. Welche macht Renin, welche macht Urin?',
    expectation:
      'Renin ↑↑ aus der stenosierten Niere, systemischer MAP ↑, die Gegenniere ' +
      'scheidet vermehrt Natrium aus.',
    params: { renalArteryStenosisLeft: 30 },
    settleSeconds: 7 * DAY,
    focus: ['map', 'renin-left', 'renin-right', 'gfr-left', 'gfr-right'],
    contentId: 'nierenarterienstenose',
  },
  {
    id: 'ace-inhibitor-bilateral-stenosis',
    label: 'ACE-Hemmer bei beidseitiger Stenose',
    task: 'Gib den ACE-Hemmer und beobachte die GFR. Warum bricht sie ein?',
    expectation:
      'Die GFR fällt deutlich ab: ohne Angiotensin II dilatiert das Vas efferens, ' +
      'der glomeruläre Kapillardruck bricht weg.',
    params: {
      renalArteryStenosisLeft: 30,
      renalArteryStenosisRight: 30,
      aceInhibitor: 100,
    },
    settleSeconds: 2 * HOUR,
    focus: ['gfr', 'pgc-left', 'angiotensinIIEffect', 'filtrationFraction'],
    contentId: 'ace-hemmer',
  },
  {
    id: 'conn',
    label: 'Conn-Syndrom',
    task: 'Aldosteron und Renin zeigen in verschiedene Richtungen. Warum?',
    expectation: 'Aldosteron ↑↑, Renin ↓↓ (supprimiert), Kalium ↓, MAP ↑.',
    params: { primaryAldosteronism: 100 },
    settleSeconds: 14 * DAY,
    focus: ['aldosterone', 'plasmaReninActivity', 'plasmaPotassium', 'map'],
    contentId: 'conn-syndrom',
  },
  {
    id: 'loop-diuretic',
    label: 'Schleifendiuretikum',
    task: 'Was passiert mit Urin, Volumen, Renin und Kalium?',
    expectation: 'Urin ↑↑, Volumen ↓, Renin ↑ reaktiv, Kalium ↓.',
    params: { loopDiuretic: 100 },
    settleSeconds: 2 * DAY,
    focus: ['urineFlow', 'ecfVolume', 'plasmaReninActivity', 'plasmaPotassium'],
    contentId: 'schleifendiuretikum',
  },
  {
    id: 'triple-whammy',
    label: 'NSAR + ACE-Hemmer + Diuretikum',
    task: 'Drei harmlose Medikamente. Warum ist die Kombination gefährlich?',
    expectation:
      'Die GFR bricht ein: das Vas afferens kann nicht mehr dilatieren, das Vas efferens ' +
      'nicht mehr konstringieren, und das Volumen fehlt.',
    params: { nsaid: 100, aceInhibitor: 100, loopDiuretic: 100 },
    settleSeconds: 2 * DAY,
    focus: ['gfr', 'pgc-left', 'rbf', 'ecfVolume'],
    contentId: 'nsar',
  },
  {
    id: 'tgf-off',
    label: 'Autoregulation abgeschaltet',
    task: 'Schalte TGF und Bayliss ab und ändere den Blutdruck. Was leistet die Autoregulation?',
    expectation: 'Ohne Autoregulation folgt die GFR dem Druck nahezu linear.',
    params: { tgfEnabled: 0, myogenicEnabled: 0 },
    settleSeconds: 30 * MINUTE,
    focus: ['gfr', 'rbf', 'pgc-left'],
    contentId: 'tubuloglomerulaeres-feedback',
  },
  {
    id: 'pressure-step',
    label: 'Drucksprung 80 → 120 mmHg',
    task: 'Sieh dir dieselbe Störung zweimal an: einmal über Sekunden, einmal über Tage.',
    expectation:
      'Sekunden: der Barorezeptorreflex fängt ab. Tage: die Druck-Natriurese bringt das ' +
      'System zum Ausgangsdruck zurück.',
    params: { sympatheticBaseline: 1.35 },
    settleSeconds: 14 * DAY,
    focus: ['map', 'sympatheticTone', 'sodiumExcretion', 'ecfVolume'],
    contentId: 'druck-natriurese',
  },
];

export function scenarioById(id: string): Scenario {
  const found = SCENARIOS.find((s) => s.id === id);
  if (found === undefined) throw new Error(`Unknown scenario "${id}".`);
  return found;
}
