import type { DrugEffect, ModulationSite } from '../core/modulation';
import type { Intervention, ParamDefinition, Params } from '../core/types';
import { applyEffects, NEUTRAL_MODULATORS } from '../core/modulation';
import type { Modulators } from '../core/modulation';

/**
 * Drugs, defined by where they act — never by what they do to a displayed number
 * (docs/adr/0005).
 *
 * The Emax and EC50 values below are **didaktische Setzungen**: they were chosen so that a
 * full dose produces the degree of blockade a textbook describes qualitatively ("nahezu
 * vollstaendige ACE-Hemmung", "Thiazide wirken schwaecher als Schleifendiuretika, weil der
 * distale Tubulus nur 5 % der filtrierten Last resorbiert"). They are not pharmacokinetic
 * measurements and must not be read as such.
 */

const didactic = 'Didaktische Setzung — kein pharmakokinetischer Messwert';

export interface DrugDefinition extends Intervention {
  readonly kind: 'drug';
  readonly paramId: string;
  readonly param: ParamDefinition;
}

function drugParam(id: string, label: string, hint: string, contentId: string): ParamDefinition {
  return {
    id,
    label,
    group: 'drug',
    unit: '%',
    min: 0,
    max: 100,
    step: 5,
    default: 0,
    hint,
    contentId,
    source: didactic,
  };
}

function effect(site: ModulationSite, emax: number, ec50 = 35): DrugEffect {
  return { site, emax, ec50, source: didactic };
}

export const DRUGS: readonly DrugDefinition[] = [
  {
    id: 'aceInhibitor',
    kind: 'drug',
    label: 'ACE-Hemmer',
    paramId: 'aceInhibitor',
    param: drugParam(
      'aceInhibitor',
      'ACE-Hemmer',
      'Hemmt die Umwandlung von Angiotensin I zu Angiotensin II.',
      'ace-hemmer',
    ),
    // Not to zero: alternative conversion routes (Chymase) keep a residual, which is the
    // model's version of the clinically observed "angiotensin escape".
    effects: [effect('ace.activity', 0.15)],
    contentId: 'ace-hemmer',
    source: didactic,
  },
  {
    id: 'arb',
    kind: 'drug',
    label: 'AT1-Blocker (Sartan)',
    paramId: 'arb',
    param: drugParam(
      'arb',
      'AT1-Blocker (Sartan)',
      'Blockiert den Rezeptor. Angiotensin II steigt dabei an — die Wirkung fällt trotzdem.',
      'at1-blocker',
    ),
    effects: [effect('at1.receptor', 0.1)],
    contentId: 'at1-blocker',
    source: didactic,
  },
  {
    id: 'reninInhibitor',
    kind: 'drug',
    label: 'Reninhemmer (Aliskiren)',
    paramId: 'reninInhibitor',
    param: drugParam(
      'reninInhibitor',
      'Reninhemmer (Aliskiren)',
      'Hemmt die enzymatische Aktivität des Renins am Beginn der Kaskade.',
      'reninhemmer',
    ),
    effects: [effect('renin.secretion', 0.2)],
    contentId: 'reninhemmer',
    source: didactic,
  },
  {
    id: 'mra',
    kind: 'drug',
    label: 'MR-Antagonist (Spironolacton)',
    paramId: 'mra',
    param: drugParam(
      'mra',
      'MR-Antagonist (Spironolacton)',
      'Blockiert den Mineralokortikoidrezeptor im Sammelrohr — kaliumsparend.',
      'spironolacton',
    ),
    effects: [effect('mr.receptor', 0.25)],
    contentId: 'spironolacton',
    source: didactic,
  },
  {
    id: 'thiazide',
    kind: 'drug',
    label: 'Thiazid',
    paramId: 'thiazide',
    param: drugParam(
      'thiazide',
      'Thiazid',
      'Hemmt den NCC im distalen Konvolut — dort werden nur 5 % der filtrierten Last resorbiert.',
      'thiazid',
    ),
    effects: [effect('ncc.transport', 0.35)],
    contentId: 'thiazid',
    source: didactic,
  },
  {
    id: 'loopDiuretic',
    kind: 'drug',
    label: 'Schleifendiuretikum',
    paramId: 'loopDiuretic',
    param: drugParam(
      'loopDiuretic',
      'Schleifendiuretikum',
      'Hemmt den NKCC2 im dicken aufsteigenden Ast — und damit auch den Markgradienten.',
      'schleifendiuretikum',
    ),
    effects: [effect('nkcc2.transport', 0.25)],
    contentId: 'schleifendiuretikum',
    source: didactic,
  },
  {
    id: 'betaBlocker',
    kind: 'drug',
    label: 'β-Blocker',
    paramId: 'betaBlocker',
    param: drugParam(
      'betaBlocker',
      'β-Blocker',
      'Blockiert β1: Herzfrequenz, Kontraktilität und Reninfreisetzung. Die α1-Wirkung bleibt.',
      'beta-blocker',
    ),
    effects: [effect('beta1.receptor', 0.2)],
    contentId: 'beta-blocker',
    source: didactic,
  },
  {
    id: 'calciumAntagonist',
    kind: 'drug',
    label: 'Ca-Antagonist',
    paramId: 'calciumAntagonist',
    param: drugParam(
      'calciumAntagonist',
      'Ca-Antagonist',
      'Senkt den Tonus der glatten Gefäßmuskulatur und damit den peripheren Widerstand.',
      'calciumantagonist',
    ),
    effects: [effect('vsmc.calciumChannel', 0.7)],
    contentId: 'calciumantagonist',
    source: didactic,
  },
  {
    id: 'nsaid',
    kind: 'drug',
    label: 'NSAR',
    paramId: 'nsaid',
    param: drugParam(
      'nsaid',
      'NSAR',
      'Hemmt die PGE₂-vermittelte Weitstellung des Vas afferens.',
      'nsar',
    ),
    effects: [effect('pge2.afferentDilation', 0.15)],
    contentId: 'nsar',
    source: didactic,
  },
  {
    id: 'vasopressinAnalog',
    kind: 'drug',
    label: 'Vasopressin-Analogon (Desmopressin)',
    paramId: 'vasopressinAnalog',
    param: drugParam(
      'vasopressinAnalog',
      'Vasopressin-Analogon',
      'V2-Agonist: erhöht die Wasserdurchlässigkeit des Sammelrohrs auch ohne eigenes ADH.',
      'desmopressin',
    ),
    // An agonist, so the factor rises above 1.
    effects: [effect('v2.receptor', 3.5)],
    contentId: 'desmopressin',
    source: didactic,
  },
];

export const drugParams: readonly ParamDefinition[] = DRUGS.map((d) => d.param);

/** Turn the current drug doses into the multiplicative factors the systems read. */
export function buildModulators(p: Params): Modulators {
  const active: { effect: DrugEffect; intensity: number }[] = [];
  for (const drug of DRUGS) {
    const intensity = p[drug.paramId] ?? 0;
    if (intensity <= 0) continue;
    for (const e of drug.effects) active.push({ effect: e, intensity });
  }
  return applyEffects(NEUTRAL_MODULATORS, active);
}
