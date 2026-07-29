// AUTOMATISCH ERZEUGT von scripts/check-content.mjs — nicht von Hand ändern.
// Neu erzeugen mit: npm run content --workspace @physiosim/web
import type { ContentEntry } from '@/lib/content';

export const CONTENT: Readonly<Record<string, ContentEntry>> = {
  'ace-hemmer': {
    meta: {
      id: 'ace-hemmer',
      title: 'ACE-Hemmer',
      system: 'cardio-renal',
      tags: ['Pharmakologie', 'RAAS', 'Angiotensin', 'Niere'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Integration of Salt and Water Balance',
        'Herold, Innere Medizin — Arterielle Hypertonie',
      ],
    },
    load: () => import('./ace-hemmer.mdx'),
  },
  adh: {
    meta: {
      id: 'adh',
      title: 'ADH (Vasopressin)',
      system: 'cardio-renal',
      tags: ['Wasserhaushalt', 'Osmolalität', 'Sammelrohr', 'AQP2'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Integration of Salt and Water Balance',
        'Silbernagl/Despopoulos, Taschenatlas Physiologie — Wasserhaushalt',
      ],
    },
    load: () => import('./adh.mdx'),
  },
  aldosteron: {
    meta: {
      id: 'aldosteron',
      title: 'Aldosteron',
      system: 'cardio-renal',
      tags: ['RAAS', 'Nebennierenrinde', 'Sammelrohr', 'ENaC', 'Kalium'],
      sources: [
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Nebennierenrinde',
        'Boron & Boulpaep, Medical Physiology — Transport of Sodium and Chloride',
      ],
    },
    load: () => import('./aldosteron.mdx'),
  },
  'ang-ii': {
    meta: {
      id: 'ang-ii',
      title: 'Angiotensin II',
      system: 'cardio-renal',
      tags: ['RAAS', 'Vasokonstriktion', 'Niere', 'AT1-Rezeptor'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Integration of Salt and Water Balance',
        'Silbernagl/Despopoulos, Taschenatlas Physiologie — Salz- und Wasserhaushalt',
      ],
    },
    load: () => import('./ang-ii.mdx'),
  },
  anp: {
    meta: {
      id: 'anp',
      title: 'ANP (atriales natriuretisches Peptid)',
      system: 'cardio-renal',
      tags: ['Volumenregulation', 'Vorhof', 'Natriurese', 'Gegenspieler'],
      sources: [
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Herz und Kreislauf',
        'Boron & Boulpaep, Medical Physiology — Integration of Salt and Water Balance',
      ],
    },
    load: () => import('./anp.mdx'),
  },
  'at1-blocker': {
    meta: {
      id: 'at1-blocker',
      title: 'AT1-Blocker (Sartane)',
      system: 'cardio-renal',
      tags: ['Pharmakologie', 'RAAS', 'AT1-Rezeptor'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Integration of Salt and Water Balance',
        'Herold, Innere Medizin — Arterielle Hypertonie',
      ],
    },
    load: () => import('./at1-blocker.mdx'),
  },
  barorezeptorreflex: {
    meta: {
      id: 'barorezeptorreflex',
      title: 'Barorezeptorreflex',
      system: 'cardio-renal',
      tags: ['Kreislaufregulation', 'Sympathikus', 'Resetting', 'Sekundenregelung'],
      sources: [
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Kreislaufregulation',
        'Guyton & Hall, Textbook of Medical Physiology — Nervous Regulation of the Circulation',
      ],
    },
    load: () => import('./barorezeptorreflex.mdx'),
  },
  'bayliss-effekt': {
    meta: {
      id: 'bayliss-effekt',
      title: 'Myogene Autoregulation (Bayliss-Effekt)',
      system: 'cardio-renal',
      tags: ['Autoregulation', 'glatte Muskulatur', 'Vas afferens'],
      sources: [
        'Guyton & Hall, Textbook of Medical Physiology — Autoregulation of GFR and Renal Blood Flow',
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Kreislaufregulation',
      ],
    },
    load: () => import('./bayliss-effekt.mdx'),
  },
  'conn-syndrom': {
    meta: {
      id: 'conn-syndrom',
      title: 'Primärer Hyperaldosteronismus (Conn-Syndrom)',
      system: 'cardio-renal',
      tags: ['Hypertonie', 'Aldosteron', 'Hypokaliämie', 'Escape'],
      sources: [
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Nebennierenrinde',
        'Herold, Innere Medizin — Nebennierenerkrankungen, sekundäre Hypertonie',
      ],
    },
    load: () => import('./conn-syndrom.mdx'),
  },
  'druck-natriurese': {
    meta: {
      id: 'druck-natriurese',
      title: 'Druck-Natriurese',
      system: 'cardio-renal',
      tags: ['Langzeitregulation', 'Guyton', 'Blutdruck', 'Natriumbilanz'],
      sources: [
        'Guyton & Hall, Textbook of Medical Physiology — Kap. 19: Renal-Body Fluid System for Blood Pressure Control',
        'Boron & Boulpaep, Medical Physiology — Integration of Salt and Water Balance',
      ],
    },
    load: () => import('./druck-natriurese.mdx'),
  },
  filtrationsfraktion: {
    meta: {
      id: 'filtrationsfraktion',
      title: 'Filtrationsfraktion',
      system: 'cardio-renal',
      tags: ['FF', 'GFR', 'RPF', 'Vas efferens'],
      sources: [
        'Guyton & Hall, Textbook of Medical Physiology — Renal Blood Flow',
        'Boron & Boulpaep, Medical Physiology — Glomerular Filtration',
      ],
    },
    load: () => import('./filtrationsfraktion.mdx'),
  },
  'frank-starling': {
    meta: {
      id: 'frank-starling',
      title: 'Frank-Starling-Mechanismus',
      system: 'cardio-renal',
      tags: ['Herz', 'Vorlast', 'Nachlast', 'Schlagvolumen'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Cardiac Muscle and the Cardiac Cycle',
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Herz',
      ],
    },
    load: () => import('./frank-starling.mdx'),
  },
  'freie-wasser-clearance': {
    meta: {
      id: 'freie-wasser-clearance',
      title: 'Freie Wasser-Clearance',
      system: 'cardio-renal',
      tags: ['Wasserhaushalt', 'Osmolalität', 'Sammelrohr', 'Clearance'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Urine Concentration and Dilution',
        'Silbernagl/Despopoulos, Taschenatlas Physiologie — Niere',
      ],
    },
    load: () => import('./freie-wasser-clearance.mdx'),
  },
  'glomerulaere-filtration': {
    meta: {
      id: 'glomerulaere-filtration',
      title: 'Glomeruläre Filtration',
      system: 'cardio-renal',
      tags: ['GFR', 'Starling-Kräfte', 'Kf', 'Filtrationsdruck'],
      sources: [
        'Guyton & Hall, Textbook of Medical Physiology — Glomerular Filtration',
        'Boron & Boulpaep, Medical Physiology — Glomerular Filtration and Renal Blood Flow',
      ],
    },
    load: () => import('./glomerulaere-filtration.mdx'),
  },
  'macula-densa': {
    meta: {
      id: 'macula-densa',
      title: 'Macula densa',
      system: 'cardio-renal',
      tags: ['juxtaglomerulärer Apparat', 'TGF', 'Renin', 'Autoregulation'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Glomerular Filtration and Renal Blood Flow',
        'Silbernagl/Despopoulos, Taschenatlas Physiologie — Niere',
      ],
    },
    load: () => import('./macula-densa.mdx'),
  },
  nierenarterienstenose: {
    meta: {
      id: 'nierenarterienstenose',
      title: 'Nierenarterienstenose',
      system: 'cardio-renal',
      tags: ['Hypertonie', 'RAAS', 'Goldblatt', 'Seitenvergleich'],
      sources: [
        'Guyton & Hall, Textbook of Medical Physiology — Renal-Body Fluid System',
        'Herold, Innere Medizin — Sekundäre Hypertonieformen',
      ],
    },
    load: () => import('./nierenarterienstenose.mdx'),
  },
  nsar: {
    meta: {
      id: 'nsar',
      title: 'NSAR und die „triple whammy"',
      system: 'cardio-renal',
      tags: ['Pharmakologie', 'Prostaglandine', 'Vas afferens', 'akutes Nierenversagen'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Regulation of Renal Blood Flow',
        'Herold, Innere Medizin — Akutes Nierenversagen',
      ],
    },
    load: () => import('./nsar.mdx'),
  },
  'onkotischer-druck': {
    meta: {
      id: 'onkotischer-druck',
      title: 'Kolloidosmotischer Druck',
      system: 'cardio-renal',
      tags: ['Starling', 'Albumin', 'Ödem', 'nephrotisches Syndrom'],
      sources: [
        'Guyton & Hall, Textbook of Medical Physiology — Capillary Fluid Exchange',
        'Boron & Boulpaep, Medical Physiology — Microcirculation',
      ],
    },
    load: () => import('./onkotischer-druck.mdx'),
  },
  'peripherer-widerstand': {
    meta: {
      id: 'peripherer-widerstand',
      title: 'Peripherer Widerstand und Ganzkörper-Autoregulation',
      system: 'cardio-renal',
      tags: ['TPR', 'Hagen-Poiseuille', 'Autoregulation', 'Guyton'],
      sources: [
        'Guyton & Hall, Textbook of Medical Physiology — Local Control of Blood Flow, Overview of the Circulation',
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Kreislaufregulation',
      ],
    },
    load: () => import('./peripherer-widerstand.mdx'),
  },
  renin: {
    meta: {
      id: 'renin',
      title: 'Renin',
      system: 'cardio-renal',
      tags: ['RAAS', 'Niere', 'juxtaglomerulärer Apparat', 'Regelkreis'],
      sources: [
        'Klinke/Pape/Kurtz/Silbernagl, Physiologie — Niere und Salz-Wasser-Haushalt',
        'Boron & Boulpaep, Medical Physiology — Integration of Salt and Water Balance',
      ],
    },
    load: () => import('./renin.mdx'),
  },
  schleifendiuretikum: {
    meta: {
      id: 'schleifendiuretikum',
      title: 'Schleifendiuretikum',
      system: 'cardio-renal',
      tags: ['Pharmakologie', 'NKCC2', 'Markgradient', 'Kalium'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Transport of Sodium and Chloride',
        'Herold, Innere Medizin — Herzinsuffizienz, Diuretika',
      ],
    },
    load: () => import('./schleifendiuretikum.mdx'),
  },
  spironolacton: {
    meta: {
      id: 'spironolacton',
      title: 'Mineralokortikoidrezeptor-Antagonist (Spironolacton)',
      system: 'cardio-renal',
      tags: ['Pharmakologie', 'Aldosteron', 'ENaC', 'Hyperkaliämie'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Transport of Sodium and Chloride',
        'Herold, Innere Medizin — Herzinsuffizienz, Hyperaldosteronismus',
      ],
    },
    load: () => import('./spironolacton.mdx'),
  },
  thiazid: {
    meta: {
      id: 'thiazid',
      title: 'Thiazid',
      system: 'cardio-renal',
      tags: ['Pharmakologie', 'NCC', 'distales Konvolut', 'Kalzium'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Transport of Sodium and Chloride',
        'Herold, Innere Medizin — Arterielle Hypertonie, Diuretika',
      ],
    },
    load: () => import('./thiazid.mdx'),
  },
  'tubuloglomerulaeres-feedback': {
    meta: {
      id: 'tubuloglomerulaeres-feedback',
      title: 'Tubuloglomeruläres Feedback',
      system: 'cardio-renal',
      tags: ['Autoregulation', 'Macula densa', 'Adenosin', 'TGF'],
      sources: [
        'Boron & Boulpaep, Medical Physiology — Regulation of Renal Blood Flow',
        'Guyton & Hall, Textbook of Medical Physiology — Autoregulation',
      ],
    },
    load: () => import('./tubuloglomerulaeres-feedback.mdx'),
  },
};

export const CONTENT_IDS = Object.keys(CONTENT);
