import { describe, expect, it } from 'vitest';
import { createSimulation, SCENARIOS, SOLVER_DT } from '../../src/index';
import { DAY, HOUR } from '../../src/core/units';
import { values } from '../helpers';

/**
 * Invariants: things that must hold no matter what the user does. A scenario test says
 * "the physiology is right"; these say "the arithmetic is not broken".
 */

describe('Determinismus', () => {
  it('liefert bei gleichen Parametern exakt dasselbe Ergebnis', () => {
    const a = createSimulation({ sodiumIntake: 250, loopDiuretic: 40 });
    const b = createSimulation({ sodiumIntake: 250, loopDiuretic: 40 });
    a.advance(3 * DAY);
    b.advance(3 * DAY);
    expect(values(a)).toEqual(values(b));
  });

  it('hängt nicht davon ab, in wie vielen Schritten die Zeit vergeht', () => {
    // The time-lapse setting must not change the result (docs/adr/0002).
    const oneGo = createSimulation({ sodiumIntake: 250 });
    oneGo.advance(12 * HOUR);

    const inChunks = createSimulation({ sodiumIntake: 250 });
    for (let i = 0; i < 12; i += 1) inChunks.advance(HOUR);

    const left = values(oneGo);
    const right = values(inChunks);
    for (const key of Object.keys(left)) {
      expect(right[key]).toBeCloseTo(left[key]!, 9);
    }
  });

  it('kennt keine Zufallszahlen im Kern', () => {
    const a = createSimulation();
    a.advance(HOUR);
    const snapshot = a.snapshot();
    a.advance(HOUR);
    a.restore(snapshot);
    a.advance(HOUR);
    const b = createSimulation();
    b.advance(2 * HOUR);
    expect(values(a)['map']).toBeCloseTo(values(b)['map']!, 9);
  });
});

describe('Massenerhaltung', () => {
  it('bilanziert Natrium über 7 Tage', () => {
    // Steady state at the default intake: what goes in must come out.
    const sim = createSimulation();
    sim.advance(7 * DAY);
    const v = values(sim);
    expect(v['sodiumExcretion']!).toBeGreaterThan(140);
    expect(v['sodiumExcretion']!).toBeLessThan(160);
  });

  it('bilanziert Kalium über 7 Tage', () => {
    const sim = createSimulation();
    sim.advance(7 * DAY);
    const v = values(sim);
    expect(v['potassiumExcretion']!).toBeGreaterThan(64);
    expect(v['potassiumExcretion']!).toBeLessThan(76);
  });

  it('bilanziert Wasser: Zufuhr minus Verluste ergibt die Urinmenge', () => {
    const sim = createSimulation();
    sim.advance(7 * DAY);
    const v = values(sim);
    // intake total − insensible (0.9) − stool (0.15) = urine, at steady state
    expect(v['urineFlow']!).toBeCloseTo(v['waterIntake']! - 1.05, 1);
  });

  it('verliert bei einer Blutung genau das entnommene Volumen', () => {
    const sim = createSimulation();
    sim.advance(HOUR);
    const before = values(sim)['bloodVolume']!;
    sim.setParams({ hemorrhageRate: 50 });
    // 50 mL/min for 10 min = 500 mL, checked immediately so refill cannot mask it.
    sim.advance(10 * 60);
    sim.setParams({ hemorrhageRate: 0 });
    const after = values(sim)['bloodVolume']!;
    expect(before - after).toBeGreaterThan(0.4);
    expect(before - after).toBeLessThan(0.55);
  });
});

describe('Keine unphysiologischen Werte', () => {
  const stressTests: Readonly<Record<string, number>>[] = [
    {},
    { sodiumIntake: 800, waterIntake: 12 },
    { sodiumIntake: 10, waterIntake: 0, thirstEnabled: 0 },
    { loopDiuretic: 100, thiazide: 100, mra: 100 },
    { aceInhibitor: 100, arb: 100, reninInhibitor: 100, nsaid: 100 },
    { primaryAldosteronism: 100, sodiumIntake: 600 },
    { adrenalInsufficiency: 100, sodiumIntake: 20 },
    { renalArteryStenosisLeft: 60, renalArteryStenosisRight: 60 },
    { heartFailure: 80, sodiumIntake: 400 },
    { pheochromocytoma: 100 },
    { nephroticSyndrome: 100 },
    { hemorrhageRate: 20 },
    { vascularTone: 1.8, baroreflexEnabled: 0 },
  ];

  it.each(stressTests)('bleibt endlich und nichtnegativ: %o', (params) => {
    const sim = createSimulation(params);
    sim.advance(7 * DAY);
    for (const readout of sim.readouts()) {
      expect(Number.isFinite(readout.value), `${readout.id} ist nicht endlich`).toBe(true);
    }
    const v = values(sim);
    const neverNegative = [
      'bloodVolume',
      'plasmaVolume',
      'ecfVolume',
      'totalBodyWater',
      'gfr',
      'rbf',
      'urineFlow',
      'osmolality',
      'plasmaSodium',
      'plasmaPotassium',
      'plasmaReninActivity',
      'angiotensinII',
      'aldosterone',
      'adh',
      'heartRate',
      'cardiacOutput',
      'map',
    ];
    for (const id of neverNegative) {
      expect(v[id], `${id} ist negativ`).toBeGreaterThanOrEqual(0);
    }
    // These presets are survivable, so the values must stay in a range a body can be in.
    expect(v['map']!).toBeLessThan(260);
    expect(v['heartRate']!).toBeLessThan(200);
    expect(v['osmolality']!).toBeGreaterThan(240);
    expect(v['osmolality']!).toBeLessThan(340);
  });

  /**
   * Two presets deliberately describe a patient who would die: untreated diabetes
   * insipidus without access to water, and SIADH with forced drinking. The model has no
   * notion of death — it keeps integrating. What it must not do is produce infinities or
   * negative volumes, and it must move in the right direction.
   * The interface has to mark these states as no longer physiological (offen fuer M2,
   * siehe docs/model/validation.md).
   */
  it.each([
    { params: { diabetesInsipidus: 100, thirstEnabled: 0 }, direction: 'up' as const },
    { params: { siadh: 100, waterIntake: 6 }, direction: 'down' as const },
  ])('bleibt bei letalen Extremen endlich: %o', ({ params, direction }) => {
    const sim = createSimulation(params);
    sim.advance(7 * DAY);
    for (const readout of sim.readouts()) {
      expect(Number.isFinite(readout.value), `${readout.id}`).toBe(true);
    }
    const osm = values(sim)['osmolality']!;
    expect(osm).toBeGreaterThan(0);
    if (direction === 'up') expect(osm).toBeGreaterThan(320);
    else expect(osm).toBeLessThan(265);
  });
});

describe('Numerische Stabilität', () => {
  it('bleibt über 30 simulierte Tage stabil', () => {
    const sim = createSimulation({ sodiumIntake: 300 });
    sim.advance(30 * DAY);
    const v = values(sim);
    expect(Number.isFinite(v['map']!)).toBe(true);
    expect(v['map']!).toBeGreaterThan(50);
    expect(v['map']!).toBeLessThan(180);
    // And it really is a steady state: another day changes almost nothing.
    const before = v['map']!;
    sim.advance(DAY);
    expect(Math.abs(values(sim)['map']! - before)).toBeLessThan(1.5);
  });

  it('bleibt auch mit maximaler Störung über 30 Tage endlich', () => {
    const sim = createSimulation({
      primaryAldosteronism: 100,
      sodiumIntake: 600,
      heartFailure: 60,
    });
    sim.advance(30 * DAY);
    for (const readout of sim.readouts()) {
      expect(Number.isFinite(readout.value), `${readout.id}`).toBe(true);
    }
  });

  it('verwendet eine feste Schrittweite von 2 s', () => {
    expect(SOLVER_DT).toBe(2);
    const sim = createSimulation();
    sim.advance(1); // less than one step
    expect(sim.time).toBe(0);
    sim.advance(1); // now it adds up to one step
    expect(sim.time).toBe(2);
  });
});

describe('Szenarienkatalog', () => {
  it('lässt sich vollständig ausführen', () => {
    for (const scenario of SCENARIOS) {
      const sim = createSimulation(scenario.params);
      sim.advance(Math.min(scenario.settleSeconds, 3 * DAY));
      for (const id of scenario.focus) {
        expect(() => sim.readout(id), `${scenario.id}: ${id}`).not.toThrow();
      }
    }
  });
});
