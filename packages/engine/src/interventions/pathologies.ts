import type { Intervention } from '../core/types';

/**
 * Pathologies.
 *
 * Unlike drugs, these do not act through the shared modulation sites — each one changes a
 * quantity inside the system that owns it (a resistance, a secretion rate, a loss term).
 * This registry exists so the interface and the learning content have one place that says
 * *where* a pathology acts, and so the "Warum?" panel can name it.
 */
export interface PathologyDefinition extends Intervention {
  readonly kind: 'pathology';
  readonly paramId: string;
  /** Which system implements it, and how — for the model documentation. */
  readonly actsOn: string;
}

const switchOnly = 'Schalter, keine Messgroesse';

export const PATHOLOGIES: readonly PathologyDefinition[] = [
  {
    id: 'renalArteryStenosis',
    kind: 'pathology',
    label: 'Nierenarterienstenose',
    paramId: 'renalArteryStenosisLeft',
    effects: [],
    actsOn: 'renal: senkt den Perfusionsdruck der betroffenen Niere (seitengetrennt)',
    contentId: 'nierenarterienstenose',
    source: switchOnly,
  },
  {
    id: 'hemorrhage',
    kind: 'pathology',
    label: 'Blutung',
    paramId: 'hemorrhageRate',
    effects: [],
    actsOn: 'balance: entzieht Vollblut aus Plasma- und Erythrozytenvolumen',
    contentId: 'hypovolaemie',
    source: switchOnly,
  },
  {
    id: 'heartFailure',
    kind: 'pathology',
    label: 'Herzinsuffizienz',
    paramId: 'heartFailure',
    effects: [],
    actsOn: 'cardiovascular: senkt die Kontraktilität und erhöht die Nachlastempfindlichkeit',
    contentId: 'herzinsuffizienz',
    source: switchOnly,
  },
  {
    id: 'primaryAldosteronism',
    kind: 'pathology',
    label: 'Conn-Syndrom',
    paramId: 'primaryAldosteronism',
    effects: [],
    actsOn: 'endocrine-raas: autonome Aldosteronsekretion zusätzlich zur geregelten',
    contentId: 'conn-syndrom',
    source: switchOnly,
  },
  {
    id: 'adrenalInsufficiency',
    kind: 'pathology',
    label: 'M. Addison',
    paramId: 'adrenalInsufficiency',
    effects: [],
    actsOn: 'endocrine-raas: die geregelte Aldosteronsekretion fällt aus',
    contentId: 'morbus-addison',
    source: switchOnly,
  },
  {
    id: 'pheochromocytoma',
    kind: 'pathology',
    label: 'Phäochromozytom',
    paramId: 'pheochromocytoma',
    effects: [],
    actsOn: 'cardiovascular: autonomer Sympathikotonus zusätzlich zum Reflexausgang',
    contentId: 'phaeochromozytom',
    source: switchOnly,
  },
  {
    id: 'diabetesInsipidus',
    kind: 'pathology',
    label: 'Diabetes insipidus',
    paramId: 'diabetesInsipidus',
    effects: [],
    actsOn: 'endocrine-raas: die ADH-Sekretion fällt aus',
    contentId: 'diabetes-insipidus',
    source: switchOnly,
  },
  {
    id: 'siadh',
    kind: 'pathology',
    label: 'SIADH',
    paramId: 'siadh',
    effects: [],
    actsOn: 'endocrine-raas: ADH-Sekretion als osmolalitätsunabhängige Untergrenze',
    contentId: 'siadh',
    source: switchOnly,
  },
  {
    id: 'nephroticSyndrome',
    kind: 'pathology',
    label: 'Nephrotisches Syndrom',
    paramId: 'nephroticSyndrome',
    effects: [],
    actsOn: 'balance: senkt den kolloidosmotischen Druck des Plasmas (und damit π_GC)',
    contentId: 'onkotischer-druck',
    source: switchOnly,
  },
];
