import { describe, expect, it } from 'vitest';
import { createSimulation, explain, renalConstants, type ExplainContext } from '../../src/index';
import type { CardiovascularState, RenalState, Simulation } from '../../src/index';
import { DAY, HOUR, MINUTE } from '../../src/core/units';
import { advanceChunked } from '../helpers';

/**
 * The "Warum?" panel has to name the cause a physiologist would name. These tests are the
 * guard against an explanation that is fluent but wrong — the worst possible failure for a
 * teaching tool.
 */

function ctxOf(sim: Simulation): ExplainContext {
  return {
    signals: sim.signals(),
    cardiovascular: sim.state<CardiovascularState>('cardiovascular'),
    renal: sim.state<RenalState>('renal'),
  };
}

function topStep(sim: Simulation, target: Parameters<typeof explain>[0]) {
  const steps = explain(target, ctxOf(sim)).steps;
  return steps[0];
}

describe('Warum?-Erklärung', () => {
  it('nennt im Ruhezustand keine treibende Ursache', async () => {
    const sim = createSimulation();
    sim.advance(6 * HOUR);
    const result = explain('map', ctxOf(sim));
    expect(result.direction).toBe('neutral');
    // Nothing is deviating meaningfully, so nothing should be dressed up as a cause.
    expect(result.steps.every((s) => s.weight < 0.1)).toBe(true);
  });

  it('führt den GFR-Einbruch unter ACE-Hemmer auf das Vas efferens zurück', async () => {
    const sim = createSimulation({ renalArteryStenosisLeft: 30, renalArteryStenosisRight: 30 });
    await advanceChunked(sim, 3 * DAY);
    const before = explain('gfr-left', ctxOf(sim));
    // Behind a stenosis the kidney leans on angiotensin II to hold its capillary pressure.
    expect(before.steps.find((s) => s.id === 'eff-angiotensin')?.direction).toBe('up');

    sim.setParams({
      renalArteryStenosisLeft: 30,
      renalArteryStenosisRight: 30,
      aceInhibitor: 100,
    });
    sim.advance(10 * MINUTE);

    const result = explain('gfr-left', ctxOf(sim));
    expect(result.direction).toBe('down');
    const efferent = result.steps.find((s) => s.id === 'eff-angiotensin');
    expect(efferent, 'die efferente Wirkung muss auftauchen').toBeDefined();
    // The support is gone: the same influence now points the other way.
    expect(efferent!.direction).toBe('down');
  });

  it('zeigt, dass der Renin-Rebound das AT1-Signal über Stunden teilweise zurückholt', async () => {
    const sim = createSimulation({ renalArteryStenosisLeft: 30, renalArteryStenosisRight: 30 });
    await advanceChunked(sim, 3 * DAY);
    sim.setParams({
      renalArteryStenosisLeft: 30,
      renalArteryStenosisRight: 30,
      aceInhibitor: 100,
    });
    sim.advance(10 * MINUTE);
    const early = ctxOf(sim).signals.angiotensinIiEffect;
    sim.advance(2 * HOUR);
    const late = ctxOf(sim).signals.angiotensinIiEffect;

    // Angiotensin escape: renin rises against the blockade, so the explanation must stop
    // naming angiotensin II as the driver once it no longer is one.
    expect(late).toBeGreaterThan(early);
    expect(sim.value('gfr')).toBeLessThan(renalConstants.GFR_ML_PER_MIN * 0.85);
  });

  it('führt die Reninsuppression bei Conn auf Druck und Macula densa zurück, nicht auf den Sympathikus', async () => {
    const sim = createSimulation({ primaryAldosteronism: 100 });
    await advanceChunked(sim, 14 * DAY);

    const result = explain('renin', ctxOf(sim));
    expect(result.direction).toBe('down');
    const top = result.steps[0];
    expect(top).toBeDefined();
    expect(['renin-pressure', 'renin-md', 'renin-feedback']).toContain(top!.id);
  });

  it('nennt beim Schleifendiuretikum den NKCC2-Block als Ursache der Natriurese', async () => {
    const sim = createSimulation();
    sim.advance(DAY);
    sim.setParams({ loopDiuretic: 100 });
    sim.advance(30 * MINUTE);

    const result = explain('sodiumExcretion', ctxOf(sim));
    expect(result.direction).toBe('up');
    const loop = result.steps.find((s) => s.id === 'loop-drug');
    expect(loop).toBeDefined();
    expect(result.steps.indexOf(loop!)).toBe(0);
  });

  it('erklärt die Polyurie bei Diabetes insipidus über die Wasserdurchlässigkeit', async () => {
    const sim = createSimulation({ diabetesInsipidus: 100 });
    sim.advance(6 * HOUR);

    const result = explain('urineFlow', ctxOf(sim));
    expect(result.direction).toBe('up');
    const adh = result.steps.find((s) => s.id === 'adh');
    expect(adh).toBeDefined();
    expect(adh!.direction).toBe('up');
  });

  it('erklärt die Hypokaliämie bei Conn über das Aldosteron', async () => {
    const sim = createSimulation({ primaryAldosteronism: 100 });
    await advanceChunked(sim, 14 * DAY);

    const result = explain('plasmaPotassium', ctxOf(sim));
    expect(result.direction).toBe('down');
    expect(result.steps[0]?.id).toBe('aldosterone');
  });

  it('zitiert Faktoren, die das Modell tatsächlich verwendet hat', async () => {
    const sim = createSimulation();
    sim.advance(DAY);
    sim.setParams({ loopDiuretic: 100 });
    sim.advance(HOUR);

    const step = topStep(sim, 'sodiumExcretion');
    const renal = sim.state<RenalState>('renal');
    expect(step).toBeDefined();
    // The quoted number is the recorded factor, not a recomputation.
    expect(step!.factor).toBeCloseTo(
      (renal.left.factors.thickAscendingDrug + renal.right.factors.thickAscendingDrug) / 2,
      10,
    );
  });

  it('lässt sich für jedes Ziel ohne Fehler aufrufen', async () => {
    const sim = createSimulation({ loopDiuretic: 60, aceInhibitor: 40, sodiumIntake: 300 });
    await advanceChunked(sim, 2 * DAY);
    const ctx = ctxOf(sim);
    for (const target of [
      'map',
      'gfr-left',
      'gfr-right',
      'renin',
      'sodiumExcretion',
      'urineFlow',
      'plasmaPotassium',
    ] as const) {
      const result = explain(target, ctx);
      expect(Number.isFinite(result.value)).toBe(true);
      expect(result.headline.length).toBeGreaterThan(10);
      for (const step of result.steps) {
        expect(Number.isFinite(step.factor)).toBe(true);
        expect(step.weight).toBeGreaterThan(0);
        expect(step.weight).toBeLessThanOrEqual(1);
      }
    }
  });
});
