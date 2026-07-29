import type { OrganismSignals } from '../core/signals';
import { RESTING_SIGNALS } from '../core/signals';
import type { CardiovascularState } from '../systems/cardiovascular';
import type { RenalState } from '../systems/renal';
import type { KidneyState } from '../systems/renal/kidney';
import { renalConstants } from '../systems/renal';

/**
 * The causal explanation layer.
 *
 * Rule 1: this module never recomputes anything. It reads the multiplicative factors the
 * systems recorded while they were stepping, ranks them by how far they are from 1, and
 * puts the winners into words. A student who reads "Angiotensin II ↑ konstringiert das Vas
 * efferens, Faktor 1,42" is being shown the number that actually produced the GFR on
 * screen, not a plausible-sounding retelling of it.
 *
 * Rule 2: an influence that is doing nothing is not mentioned. The chain shows what is
 * driving the situation right now, which changes as the situation does.
 */

export type Direction = 'up' | 'down' | 'neutral';

export interface CausalStep {
  id: string;
  /** German name of the influence, e.g. "Angiotensin II". */
  label: string;
  /** What it is doing, e.g. "konstringiert das Vas efferens". */
  mechanism: string;
  direction: Direction;
  /** Contribution strength, 0–1, for ranking and for the bar in the interface. */
  weight: number;
  /** The factor as the model used it, e.g. 1.42. */
  factor: number;
  /** Node in the learning content this link explains. */
  contentId?: string;
  /**
   * If this influence is itself a modelled quantity, the target to explain next. Following
   * these is what turns a list of contributors into a walkable causal chain.
   */
  drillTo?: ExplainTargetId;
}

export interface Explanation {
  targetId: string;
  targetLabel: string;
  /** One sentence naming the state of the target quantity. */
  headline: string;
  value: number;
  unit: string;
  direction: Direction;
  steps: readonly CausalStep[];
  /** Named when nothing is deviating: the system is simply at rest. */
  atRest: boolean;
}

/** How far a multiplicative factor is from neutral, as a 0–1 weight. */
function weightOf(factor: number): number {
  if (!Number.isFinite(factor) || factor <= 0) return 0;
  // A factor of 2 (or 0.5) counts as a full-strength influence.
  return Math.min(Math.abs(Math.log(factor)) / Math.LN2, 1);
}

function directionOf(factor: number, invert = false): Direction {
  const raised = factor > 1.02;
  const lowered = factor < 0.98;
  if (!raised && !lowered) return 'neutral';
  const up = invert ? lowered : raised;
  return up ? 'up' : 'down';
}

interface Candidate {
  id: string;
  label: string;
  mechanism: string;
  factor: number;
  /** True when a factor above 1 means the *target* goes down. */
  invert?: boolean;
  contentId?: string;
  drillTo?: ExplainTargetId;
}

function rank(candidates: readonly Candidate[], limit = 5): CausalStep[] {
  return candidates
    .map((c) => ({
      id: c.id,
      label: c.label,
      mechanism: c.mechanism,
      direction: directionOf(c.factor, c.invert),
      weight: weightOf(c.factor),
      factor: c.factor,
      ...(c.contentId !== undefined ? { contentId: c.contentId } : {}),
      ...(c.drillTo !== undefined ? { drillTo: c.drillTo } : {}),
    }))
    .filter((s) => s.weight > 0.012)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

function relativeDirection(value: number, reference: number, tolerance = 0.02): Direction {
  const ratio = value / reference;
  if (ratio > 1 + tolerance) return 'up';
  if (ratio < 1 - tolerance) return 'down';
  return 'neutral';
}

const ARROW: Record<Direction, string> = { up: '↑', down: '↓', neutral: '→' };

export function arrowFor(direction: Direction): string {
  return ARROW[direction];
}

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

export interface ExplainContext {
  signals: Readonly<OrganismSignals>;
  cardiovascular: CardiovascularState;
  renal: RenalState;
}

function explainMap(ctx: ExplainContext): Explanation {
  const f = ctx.cardiovascular.factors;
  const s = ctx.signals;
  const direction = relativeDirection(s.mapMmHg, RESTING_SIGNALS.mapMmHg);

  const steps = rank([
    {
      id: 'tpr-sympathetic',
      label: 'Sympathikus',
      mechanism: 'erhöht über α₁ den peripheren Widerstand',
      factor: f.tprSympathetic,
      contentId: 'barorezeptorreflex',
    },
    {
      id: 'tpr-angiotensin',
      label: 'Angiotensin II',
      mechanism: 'verengt die Widerstandsgefäße',
      factor: f.tprAngiotensin,
      contentId: 'ang-ii',
      drillTo: 'renin',
    },
    {
      id: 'tpr-autoregulation',
      label: 'Ganzkörper-Autoregulation',
      mechanism: 'stellt den Widerstand nach, bis die Gewebedurchblutung wieder stimmt',
      factor: f.tprAutoregulation,
      contentId: 'peripherer-widerstand',
    },
    {
      id: 'tpr-tone',
      label: 'Gefäßtonus (eingestellt)',
      mechanism: 'wirkt direkt auf den peripheren Widerstand',
      factor: f.tprVascularTone,
      contentId: 'peripherer-widerstand',
    },
    {
      id: 'tpr-ca',
      label: 'Ca-Antagonist',
      mechanism: 'senkt den Tonus der glatten Gefäßmuskulatur',
      factor: f.tprCalciumAntagonist,
      contentId: 'calciumantagonist',
    },
    {
      id: 'tpr-anp',
      label: 'ANP',
      mechanism: 'wirkt vasodilatierend',
      factor: f.tprAnp,
      contentId: 'anp',
    },
    {
      id: 'volume',
      label: 'Blutvolumen',
      mechanism: 'bestimmt die Vorlast und damit das Schlagvolumen',
      factor: s.bloodVolumeL / RESTING_SIGNALS.bloodVolumeL,
      contentId: 'blutvolumen',
    },
    {
      id: 'hr',
      label: 'Herzfrequenz',
      mechanism: 'geht direkt in das Herzzeitvolumen ein',
      factor: f.hrSympathetic,
      contentId: 'barorezeptorreflex',
    },
    {
      id: 'contractility',
      label: 'Kontraktilität',
      mechanism: 'bestimmt die Auswurffraktion',
      factor: f.contractilityDisease * f.contractilitySympathetic,
      contentId: 'frank-starling',
    },
  ]);

  return {
    targetId: 'map',
    targetLabel: 'Mittlerer arterieller Druck',
    headline:
      direction === 'neutral'
        ? 'Der Druck liegt im Bereich des Ausgangswerts.'
        : `Der Druck ist ${direction === 'up' ? 'erhöht' : 'erniedrigt'} — MAP = HZV × TPR + ZVD.`,
    value: s.mapMmHg,
    unit: 'mmHg',
    direction,
    steps,
    atRest: steps.length === 0,
  };
}

function explainGfr(ctx: ExplainContext, side: 'left' | 'right'): Explanation {
  const kidney: KidneyState = ctx.renal[side];
  const f = kidney.factors;
  const direction = relativeDirection(kidney.gfrMlPerMin, renalConstants.GFR_PER_KIDNEY);

  const steps = rank([
    {
      id: 'perfusion',
      label: 'Renaler Perfusionsdruck',
      mechanism: 'ist der Antrieb der ganzen Filtration',
      factor: kidney.perfusionPressureMmHg / renalConstants.REFERENCE_MAP_MMHG,
      contentId: 'nierenarterienstenose',
      drillTo: 'map',
    },
    {
      id: 'eff-angiotensin',
      label: 'Angiotensin II',
      mechanism: 'konstringiert das Vas efferens und hält damit den Kapillardruck',
      factor: f.efferentAngiotensin,
      contentId: 'ang-ii',
      drillTo: 'renin',
    },
    {
      id: 'aff-angiotensin',
      label: 'Angiotensin II',
      mechanism: 'konstringiert auch das Vas afferens — schwächer',
      factor: f.afferentAngiotensin,
      invert: true,
      contentId: 'ang-ii',
      drillTo: 'renin',
    },
    {
      id: 'aff-myogenic',
      label: 'Bayliss-Effekt',
      mechanism: 'passt den afferenten Tonus dem Druck an',
      factor: f.afferentMyogenic,
      invert: true,
      contentId: 'bayliss-effekt',
    },
    {
      id: 'aff-tgf',
      label: 'Tubuloglomeruläres Feedback',
      mechanism: 'stellt das Vas afferens nach dem NaCl-Angebot an der Macula densa',
      factor: f.afferentTgf,
      invert: true,
      contentId: 'tubuloglomerulaeres-feedback',
    },
    {
      id: 'aff-sympathetic',
      label: 'Sympathikus',
      mechanism: 'verengt das Vas afferens',
      factor: f.afferentSympathetic,
      invert: true,
      contentId: 'barorezeptorreflex',
    },
    {
      id: 'aff-prostaglandin',
      label: 'NSAR',
      mechanism: 'nimmt dem Vas afferens die PGE₂-vermittelte Weitstellung',
      factor: f.afferentProstaglandin,
      invert: true,
      contentId: 'nsar',
    },
    {
      id: 'eff-drug',
      label: 'RAAS-Blockade',
      mechanism: 'lässt das Vas efferens dilatieren',
      factor: f.efferentDrug,
      contentId: 'ace-hemmer',
    },
    {
      id: 'oncotic',
      label: 'Kolloidosmotischer Druck',
      mechanism: 'wirkt der Filtration entgegen',
      factor: ctx.signals.plasmaOncoticMmHg / 28,
      invert: true,
      contentId: 'onkotischer-druck',
    },
  ]);

  return {
    targetId: `gfr-${side}`,
    targetLabel: `GFR ${side === 'left' ? 'links' : 'rechts'}`,
    headline:
      direction === 'neutral'
        ? 'Die Filtration liegt im Bereich des Ausgangswerts.'
        : `Die Filtration ist ${direction === 'up' ? 'gesteigert' : 'vermindert'} — GFR = Kf × (P_GC − P_Bowman − π_GC).`,
    value: kidney.gfrMlPerMin,
    unit: 'mL/min',
    direction,
    steps,
    atRest: steps.length === 0,
  };
}

function explainRenin(ctx: ExplainContext): Explanation {
  const left = ctx.renal.left.factors;
  const right = ctx.renal.right.factors;
  const mean = (a: number, b: number) => (a + b) / 2;
  const direction = relativeDirection(ctx.signals.plasmaReninActivity, 1);

  const steps = rank([
    {
      id: 'renin-pressure',
      label: 'Renaler Perfusionsdruck',
      mechanism: 'wird vom Barorezeptor der afferenten Arteriole gemessen',
      factor: mean(left.reninPressure, right.reninPressure),
      contentId: 'renin',
      drillTo: 'map',
    },
    {
      id: 'renin-md',
      label: 'NaCl an der Macula densa',
      mechanism: 'meldet dem juxtaglomerulären Apparat die distale Salzlast',
      factor: mean(left.reninMaculaDensa, right.reninMaculaDensa),
      contentId: 'macula-densa',
      drillTo: 'sodiumExcretion',
    },
    {
      id: 'renin-sympathetic',
      label: 'Sympathikus (β₁)',
      mechanism: 'stimuliert die Reninfreisetzung unmittelbar',
      factor: mean(left.reninSympathetic, right.reninSympathetic),
      contentId: 'barorezeptorreflex',
    },
    {
      id: 'renin-feedback',
      label: 'Angiotensin II',
      mechanism: 'bremst die eigene Kaskade über die kurze Rückkopplung',
      factor: mean(left.reninAngiotensinFeedback, right.reninAngiotensinFeedback),
      contentId: 'ang-ii',
      drillTo: 'renin',
    },
    {
      id: 'renin-anp',
      label: 'ANP',
      mechanism: 'hemmt die Reninfreisetzung',
      factor: mean(left.reninAnp, right.reninAnp),
      contentId: 'anp',
    },
    {
      id: 'renin-drug',
      label: 'Reninhemmer',
      mechanism: 'blockiert die enzymatische Aktivität am Beginn der Kaskade',
      factor: mean(left.reninDrug, right.reninDrug),
      contentId: 'reninhemmer',
    },
  ]);

  return {
    targetId: 'renin',
    targetLabel: 'Plasma-Renin-Aktivität',
    headline:
      direction === 'neutral'
        ? 'Die Reninfreisetzung entspricht dem Ruhewert.'
        : `Die Reninfreisetzung ist ${direction === 'up' ? 'gesteigert' : 'supprimiert'} — drei Stimuli wirken multiplikativ.`,
    value: ctx.signals.plasmaReninActivity,
    unit: 'ng/mL/h',
    direction,
    steps,
    atRest: steps.length === 0,
  };
}

function explainSodiumExcretion(ctx: ExplainContext): Explanation {
  const left = ctx.renal.left.factors;
  const right = ctx.renal.right.factors;
  const mean = (a: number, b: number) => (a + b) / 2;
  const perDay = ctx.signals.sodiumExcretionMmolPerMin * 1440;
  const direction = relativeDirection(perDay, 150, 0.08);

  const steps = rank([
    {
      id: 'pressure-natriuresis',
      label: 'Druck-Natriurese',
      mechanism: 'drosselt die proximale Rückresorption, wenn der Perfusionsdruck steigt',
      factor: mean(left.proximalPressure, right.proximalPressure),
      invert: true,
      contentId: 'druck-natriurese',
    },
    {
      id: 'pt-angiotensin',
      label: 'Angiotensin II',
      mechanism: 'steigert die proximale Na⁺-Resorption über NHE3',
      factor: mean(left.proximalAngiotensin, right.proximalAngiotensin),
      invert: true,
      contentId: 'ang-ii',
      drillTo: 'renin',
    },
    {
      id: 'cd-aldosterone',
      label: 'Aldosteron',
      mechanism: 'öffnet ENaC im Sammelrohr',
      factor: mean(left.collectingAldosterone, right.collectingAldosterone),
      invert: true,
      contentId: 'aldosteron',
      drillTo: 'renin',
    },
    {
      id: 'loop-drug',
      label: 'Schleifendiuretikum',
      mechanism: 'blockiert NKCC2 im dicken aufsteigenden Ast',
      factor: mean(left.thickAscendingDrug, right.thickAscendingDrug),
      invert: true,
      contentId: 'schleifendiuretikum',
    },
    {
      id: 'thiazide-drug',
      label: 'Thiazid',
      mechanism: 'blockiert NCC im distalen Konvolut',
      factor: mean(left.distalDrug, right.distalDrug),
      invert: true,
      contentId: 'thiazid',
    },
    {
      id: 'mra-drug',
      label: 'ENaC-Blockade',
      mechanism: 'hemmt die aldosteronabhängige Resorption im Sammelrohr',
      factor: mean(left.collectingDrug, right.collectingDrug),
      invert: true,
      contentId: 'spironolacton',
    },
    {
      id: 'anp',
      label: 'ANP',
      mechanism: 'hemmt die Na⁺-Resorption proximal und im Sammelrohr',
      factor: mean(left.collectingAnp, right.collectingAnp),
      invert: true,
      contentId: 'anp',
    },
    {
      id: 'filtered-load',
      label: 'Filtrierte Na⁺-Last',
      mechanism: 'ist das Angebot, aus dem überhaupt ausgeschieden werden kann',
      factor: ctx.signals.gfrMlPerMin / RESTING_SIGNALS.gfrMlPerMin,
      contentId: 'glomerulaere-filtration',
      drillTo: 'gfr-left',
    },
  ]);

  return {
    targetId: 'sodiumExcretion',
    targetLabel: 'Natriumausscheidung',
    headline:
      direction === 'neutral'
        ? 'Die Ausscheidung entspricht der Zufuhr — die Bilanz ist ausgeglichen.'
        : `Die Ausscheidung ist ${direction === 'up' ? 'gesteigert' : 'vermindert'} und damit ${direction === 'up' ? 'über' : 'unter'} der Zufuhr.`,
    value: perDay,
    unit: 'mmol/d',
    direction,
    steps,
    atRest: steps.length === 0,
  };
}

function explainUrine(ctx: ExplainContext): Explanation {
  const s = ctx.signals;
  const perDay = (s.urineFlowMlPerMin * 1440) / 1000;
  const direction = relativeDirection(perDay, 1.5, 0.1);

  const steps = rank([
    {
      id: 'adh',
      label: 'ADH',
      mechanism: 'bestimmt über AQP2 die Wasserdurchlässigkeit des Sammelrohrs',
      factor: s.adhWaterPermeability,
      invert: true,
      contentId: 'adh',
    },
    {
      id: 'osmoles',
      label: 'Auszuscheidende Osmole',
      mechanism: 'ziehen Wasser mit sich — je mehr Salz hinaus muss, desto mehr Volumen',
      factor:
        (2 * (s.sodiumExcretionMmolPerMin + s.potassiumExcretionMmolPerMin) + 0.32) /
        (2 * (0.104 + 0.049) + 0.32),
      contentId: 'freie-wasser-clearance',
      drillTo: 'sodiumExcretion',
    },
    {
      id: 'gradient',
      label: 'Markgradient',
      mechanism: 'begrenzt, wie stark der Urin überhaupt konzentriert werden kann',
      factor: ctx.renal.left.factors.thickAscendingDrug,
      contentId: 'schleifendiuretikum',
    },
  ]);

  return {
    targetId: 'urineFlow',
    targetLabel: 'Urinfluss',
    headline:
      direction === 'neutral'
        ? 'Die Urinmenge liegt im üblichen Bereich.'
        : `Die Urinmenge ist ${direction === 'up' ? 'gesteigert' : 'vermindert'} — Volumen = auszuscheidende Osmole ÷ Urinosmolalität.`,
    value: perDay,
    unit: 'L/d',
    direction,
    steps,
    atRest: steps.length === 0,
  };
}

function explainPotassium(ctx: ExplainContext): Explanation {
  const s = ctx.signals;
  const direction = relativeDirection(s.plasmaPotassiumMmolPerL, 4.2, 0.03);
  const left = ctx.renal.left.factors;
  const right = ctx.renal.right.factors;
  const mean = (a: number, b: number) => (a + b) / 2;

  const steps = rank([
    {
      id: 'aldosterone',
      label: 'Aldosteron',
      mechanism: 'treibt die distale K⁺-Sekretion an',
      factor: mean(left.collectingAldosterone, right.collectingAldosterone),
      invert: true,
      contentId: 'aldosteron',
      drillTo: 'renin',
    },
    {
      id: 'flow',
      label: 'Distaler Tubulusfluss',
      mechanism: 'spült sezerniertes K⁺ fort und hält den Gradienten steil',
      factor: s.urineFlowMlPerMin / 1.04,
      invert: true,
      contentId: 'kaliumbilanz',
      drillTo: 'urineFlow',
    },
    {
      id: 'enac',
      label: 'ENaC-Blockade',
      mechanism: 'spart Kalium, weil die Na⁺-Resorption die K⁺-Sekretion antreibt',
      factor: mean(left.collectingDrug, right.collectingDrug),
      contentId: 'spironolacton',
    },
  ]);

  return {
    targetId: 'plasmaPotassium',
    targetLabel: 'Kalium im Plasma',
    headline:
      direction === 'neutral'
        ? 'Das Kalium liegt im Normbereich.'
        : `Das Kalium ist ${direction === 'up' ? 'erhöht' : 'erniedrigt'}.`,
    value: s.plasmaPotassiumMmolPerL,
    unit: 'mmol/L',
    direction,
    steps,
    atRest: steps.length === 0,
  };
}

/** Every quantity the "Warum?" panel can explain. */
export const EXPLAIN_TARGETS = [
  { id: 'map', label: 'Blutdruck' },
  { id: 'gfr-left', label: 'GFR links' },
  { id: 'gfr-right', label: 'GFR rechts' },
  { id: 'renin', label: 'Renin' },
  { id: 'sodiumExcretion', label: 'Na⁺-Ausscheidung' },
  { id: 'urineFlow', label: 'Urinfluss' },
  { id: 'plasmaPotassium', label: 'Kalium' },
] as const;

export type ExplainTargetId = (typeof EXPLAIN_TARGETS)[number]['id'];

export function explain(targetId: ExplainTargetId, ctx: ExplainContext): Explanation {
  switch (targetId) {
    case 'map':
      return explainMap(ctx);
    case 'gfr-left':
      return explainGfr(ctx, 'left');
    case 'gfr-right':
      return explainGfr(ctx, 'right');
    case 'renin':
      return explainRenin(ctx);
    case 'sodiumExcretion':
      return explainSodiumExcretion(ctx);
    case 'urineFlow':
      return explainUrine(ctx);
    case 'plasmaPotassium':
      return explainPotassium(ctx);
  }
}
