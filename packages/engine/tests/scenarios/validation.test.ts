import { beforeAll, describe, expect, it } from 'vitest';
import { DAY, HOUR, MINUTE } from '../../src/core/units';
import { advanceChunked, change, settled, values } from '../helpers';

/**
 * The teaching scenarios as acceptance tests.
 *
 * These check direction and order of magnitude, never an exact number — the model is a
 * didactic simplification and pinning it to three decimal places would only make the suite
 * brittle. A red test here is a statement about physiology, not about code style.
 * The prose version of each expectation lives in docs/model/validation.md.
 *
 * The heavy lifting happens in `beforeAll` rather than in the describe body: running weeks
 * of model time during collection blocks Vitest's worker so long that its reporter times
 * out (see tests/helpers.ts).
 */

type Values = Record<string, number>;

describe('1 — Akuter Blutverlust 1000 mL', () => {
  let before: Values;
  let after: Values;

  beforeAll(async () => {
    before = values(await settled());

    const sim = await settled();
    sim.setParams({ hemorrhageRate: 100 }); // 100 mL/min
    await advanceChunked(sim, 10 * MINUTE); // = 1000 mL
    sim.setParams({ hemorrhageRate: 0 });
    await advanceChunked(sim, 20 * MINUTE);
    after = values(sim);
  });

  it('senkt den Blutdruck, aber abgefedert', () => {
    expect(after['map']!).toBeLessThan(before['map']!);
    // Buffered: a fifth of the blood volume must not cost a third of the pressure.
    expect(change(before['map']!, after['map']!)).toBeGreaterThan(-0.25);
  });

  it('steigert Herzfrequenz und peripheren Widerstand', () => {
    expect(after['heartRate']!).toBeGreaterThan(before['heartRate']! * 1.05);
    expect(after['tpr']!).toBeGreaterThan(before['tpr']! * 1.1);
  });

  it('aktiviert das RAAS deutlich', () => {
    expect(after['plasmaReninActivity']!).toBeGreaterThan(before['plasmaReninActivity']! * 1.5);
    expect(after['aldosterone']!).toBeGreaterThan(before['aldosterone']! * 1.1);
  });

  it('drosselt Urinmenge und Natriumausscheidung', () => {
    expect(after['urineFlow']!).toBeLessThan(before['urineFlow']!);
    expect(after['urineSodium']!).toBeLessThan(before['urineSodium']! * 0.5);
    expect(after['sodiumExcretion']!).toBeLessThan(before['sodiumExcretion']! * 0.5);
  });

  it('hebt die Filtrationsfraktion', () => {
    expect(after['filtrationFraction']!).toBeGreaterThan(before['filtrationFraction']!);
  });
});

describe('2 — Chronisch hohe Kochsalzzufuhr', () => {
  let before: Values;
  let after: Values;

  beforeAll(async () => {
    before = values(await settled({}, 14 * DAY));
    after = values(await settled({ sodiumIntake: 400 }, 14 * DAY));
  });

  it('bringt die Ausscheidung wieder auf die Zufuhr', () => {
    // Pressure natriuresis plus RAAS suppression restore balance.
    expect(after['sodiumExcretion']!).toBeGreaterThan(370);
    expect(after['sodiumExcretion']!).toBeLessThan(430);
  });

  it('dehnt das Extrazellulärvolumen aus', () => {
    expect(after['ecfVolume']!).toBeGreaterThan(before['ecfVolume']!);
  });

  it('senkt Renin und Aldosteron', () => {
    expect(after['plasmaReninActivity']!).toBeLessThan(before['plasmaReninActivity']!);
    expect(after['aldosterone']!).toBeLessThan(before['aldosterone']!);
  });

  it('verändert den Blutdruck nur wenig', () => {
    // The didactic point: a healthy kidney absorbs a near-threefold salt load with almost
    // no pressure change. See docs/model/validation.md on the limits of this statement.
    expect(Math.abs(after['map']! - before['map']!)).toBeLessThan(5);
  });
});

describe('3 — Einseitige Nierenarterienstenose', () => {
  let before: Values;
  let after: Values;

  beforeAll(async () => {
    before = values(await settled({}, 7 * DAY));
    after = values(await settled({ renalArteryStenosisLeft: 30 }, 7 * DAY));
  });

  it('lässt vor allem die stenosierte Niere Renin freisetzen', () => {
    expect(after['renin-left']!).toBeGreaterThan(before['renin-left']! * 1.8);
    expect(after['renin-left']!).toBeGreaterThan(after['renin-right']! * 3);
  });

  it('hebt den systemischen Blutdruck', () => {
    expect(after['map']!).toBeGreaterThan(before['map']! + 3);
  });

  it('macht die Gegenniere natriuretisch', () => {
    expect(after['sodiumExcretion-right']!).toBeGreaterThan(after['sodiumExcretion-left']! * 1.5);
    expect(after['sodiumExcretion-right']!).toBeGreaterThan(before['sodiumExcretion-right']!);
  });

  it('senkt die GFR nur auf der stenosierten Seite deutlich', () => {
    expect(after['gfr-left']!).toBeLessThan(before['gfr-left']! * 0.7);
    expect(after['gfr-right']!).toBeGreaterThan(before['gfr-right']! * 0.9);
  });
});

describe('4 — ACE-Hemmer bei beidseitiger Stenose (Kernlernmoment)', () => {
  const stenosis = { renalArteryStenosisLeft: 30, renalArteryStenosisRight: 30 };
  let before: Values;
  let acute: Values;
  let after: Values;
  let healthyDrop: number;

  beforeAll(async () => {
    const sim = await settled(stenosis, 3 * DAY);
    before = values(sim);
    sim.setParams({ ...stenosis, aceInhibitor: 100 });
    // The nadir is a few minutes in; after that the renin rebound starts taking it back.
    await advanceChunked(sim, 5 * MINUTE);
    acute = values(sim);
    await advanceChunked(sim, 115 * MINUTE);
    after = values(sim);

    const healthy = await settled({}, 3 * DAY);
    const healthyBefore = values(healthy).gfr!;
    healthy.setParams({ aceInhibitor: 100 });
    await advanceChunked(healthy, 5 * MINUTE);
    healthyDrop = change(healthyBefore, values(healthy).gfr!);
  });

  it('lässt die GFR akut einbrechen', () => {
    expect(change(before['gfr']!, acute['gfr']!)).toBeLessThan(-0.2);
  });

  it('hält die GFR auch nach zwei Stunden unter dem Ausgangswert', () => {
    // Angiotensin escape: renin rises against the blockade and takes part of the
    // efferent tone back, so the acute collapse softens but does not resolve.
    expect(change(before['gfr']!, after['gfr']!)).toBeLessThan(-0.1);
    expect(after['gfr']!).toBeGreaterThan(acute['gfr']!);
  });

  it('senkt den glomerulären Kapillardruck', () => {
    expect(acute['pgc-left']!).toBeLessThan(before['pgc-left']!);
  });

  it('senkt die Filtrationsfraktion — das Vas efferens ist offen', () => {
    expect(acute['filtrationFraction']!).toBeLessThan(before['filtrationFraction']! * 0.8);
  });

  it('senkt das AT1-Signal und steigert reaktiv das Renin', () => {
    expect(acute['angiotensinIIEffect']!).toBeLessThan(before['angiotensinIIEffect']! * 0.6);
    expect(after['plasmaReninActivity']!).toBeGreaterThan(before['plasmaReninActivity']!);
  });

  it('trifft eine gesunde Niere weit weniger hart', () => {
    expect(healthyDrop).toBeGreaterThan(change(before['gfr']!, acute['gfr']!));
  });
});

describe('5 — Conn-Syndrom', () => {
  let before: Values;
  let after: Values;

  beforeAll(async () => {
    before = values(await settled({}, 14 * DAY));
    after = values(await settled({ primaryAldosteronism: 100 }, 14 * DAY));
  });

  it('zeigt hohes Aldosteron bei supprimiertem Renin', () => {
    expect(after['aldosterone']!).toBeGreaterThan(before['aldosterone']! * 3);
    expect(after['plasmaReninActivity']!).toBeLessThan(before['plasmaReninActivity']! * 0.5);
  });

  it('führt zur Hypokaliämie', () => {
    expect(after['plasmaPotassium']!).toBeLessThan(3.5);
  });

  it('hebt den Blutdruck', () => {
    expect(after['map']!).toBeGreaterThan(before['map']! + 3);
  });
});

describe('6 — Schleifendiuretikum', () => {
  let before: Values;
  let acute: Values;
  let after: Values;

  beforeAll(async () => {
    before = values(await settled({}, 2 * DAY));
    const sim = await settled({}, 2 * DAY);
    sim.setParams({ loopDiuretic: 100 });
    await advanceChunked(sim, 6 * HOUR);
    acute = values(sim);
    await advanceChunked(sim, 42 * HOUR);
    after = values(sim);
  });

  it('steigert die Urinmenge stark', () => {
    expect(acute['urineFlow']!).toBeGreaterThan(before['urineFlow']! * 2);
  });

  it('senkt das Extrazellulärvolumen', () => {
    expect(after['ecfVolume']!).toBeLessThan(before['ecfVolume']!);
  });

  it('aktiviert das RAAS reaktiv', () => {
    expect(after['plasmaReninActivity']!).toBeGreaterThan(before['plasmaReninActivity']! * 1.3);
    expect(after['aldosterone']!).toBeGreaterThan(before['aldosterone']!);
  });

  it('senkt das Kalium', () => {
    expect(after['plasmaPotassium']!).toBeLessThan(before['plasmaPotassium']! - 0.2);
  });

  it('verhindert die Konzentrierung des Urins', () => {
    expect(acute['urineOsmolality']!).toBeLessThan(before['urineOsmolality']!);
  });
});

describe('7 — NSAR + ACE-Hemmer + Diuretikum ("triple whammy")', () => {
  let before: Values;
  let nsaidOnly: Values;
  let after: Values;

  beforeAll(async () => {
    before = values(await settled({}, 2 * DAY));

    const single = await settled({}, 2 * DAY);
    single.setParams({ nsaid: 100 });
    await advanceChunked(single, 2 * DAY);
    nsaidOnly = values(single);

    const sim = await settled({}, 2 * DAY);
    sim.setParams({ nsaid: 100, aceInhibitor: 100, loopDiuretic: 100 });
    await advanceChunked(sim, 2 * DAY);
    after = values(sim);
  });

  it('lässt NSAR allein die GFR nur wenig verändern', () => {
    expect(Math.abs(change(before['gfr']!, nsaidOnly['gfr']!))).toBeLessThan(0.2);
  });

  it('lässt die Kombination die GFR einbrechen', () => {
    expect(change(before['gfr']!, after['gfr']!)).toBeLessThan(-0.3);
  });

  it('ist deutlich schlimmer als jede Einzelsubstanz', () => {
    expect(after['gfr']!).toBeLessThan(nsaidOnly['gfr']! * 0.75);
  });
});

describe('8 — Autoregulation abgeschaltet', () => {
  interface Point {
    map: number;
    gfr: number;
  }
  let lowWith: Point;
  let highWith: Point;
  let lowWithout: Point;
  let highWithout: Point;

  async function gfrAt(mapDriver: number, autoregulation: boolean): Promise<Point> {
    const params: Record<string, number> = {
      vascularTone: mapDriver,
      // The baroreflex would undo the pressure change we want to impose.
      baroreflexEnabled: 0,
    };
    if (!autoregulation) {
      params['tgfEnabled'] = 0;
      params['myogenicEnabled'] = 0;
    }
    const v = values(await settled(params, 30 * MINUTE));
    return { map: v['map']!, gfr: v['gfr']! };
  }

  beforeAll(async () => {
    lowWith = await gfrAt(0.8, true);
    highWith = await gfrAt(1.3, true);
    lowWithout = await gfrAt(0.8, false);
    highWithout = await gfrAt(1.3, false);
  });

  it('lässt die GFR ohne Autoregulation viel stärker dem Druck folgen', () => {
    // Sanity: the driver really did move the pressure in both settings.
    expect(highWith.map - lowWith.map).toBeGreaterThan(10);
    expect(highWithout.map - lowWithout.map).toBeGreaterThan(10);

    const slopeWith = (highWith.gfr - lowWith.gfr) / (highWith.map - lowWith.map);
    const slopeWithout = (highWithout.gfr - lowWithout.gfr) / (highWithout.map - lowWithout.map);

    expect(slopeWithout).toBeGreaterThan(slopeWith * 1.5);
  });
});

describe('9 — Drucksprung: Sekunden gegen Tage', () => {
  it('fängt eine akute Drucksteigerung binnen Sekunden über den Reflex ab', async () => {
    const sim = await settled();
    const before = values(sim);
    sim.setParams({ vascularTone: 1.35 });
    sim.advance(30);
    const withReflex = values(sim);

    const noReflex = await settled({ baroreflexEnabled: 0 });
    noReflex.setParams({ vascularTone: 1.35, baroreflexEnabled: 0 });
    noReflex.advance(30);
    const without = values(noReflex);

    expect(withReflex['map']!).toBeGreaterThan(before['map']!);
    // Within seconds the reflex has withdrawn sympathetic tone and blunted the rise.
    expect(withReflex['sympatheticTone']!).toBeLessThan(0.95);
    expect(withReflex['map']!).toBeLessThan(without['map']!);
  });

  it('begrenzt eine chronische Salz-Retention über die Druck-Natriurese', async () => {
    // The long-term controller is only visible once the hormonal loops can no longer
    // escape — an autonomous mineralocorticoid load is exactly that situation.
    // See docs/model/validation.md on why salt loading alone does not show this.
    const baseline = values(await settled({}, 14 * DAY))['map']!;

    const withKidney = values(await settled({ primaryAldosteronism: 60 }, 14 * DAY));
    const withoutKidney = values(
      await settled({ primaryAldosteronism: 60, pressureNatriuresisEnabled: 0 }, 14 * DAY),
    );

    const withRise = withKidney['map']! - baseline;
    const withoutRise = withoutKidney['map']! - baseline;

    expect(withRise).toBeGreaterThan(0);
    expect(withoutRise).toBeGreaterThan(withRise * 1.3);
    // And it contains it by holding down the volume, not by relaxing the vessels.
    expect(withKidney['ecfVolume']!).toBeLessThan(withoutKidney['ecfVolume']! - 2);
  });

  it('lässt den Reflex-Sollwert über Tage nachziehen', async () => {
    const sim = await settled({ primaryAldosteronism: 100 });
    sim.advance(60);
    const early = values(sim);
    await advanceChunked(sim, 7 * DAY);
    const late = values(sim);

    // Resetting: the set point follows the prevailing pressure, so the reflex stops
    // treating a chronically raised pressure as an error worth correcting.
    expect(late['baroreflexSetpoint']!).toBeGreaterThan(early['baroreflexSetpoint']! + 2);
    // Despite a clearly raised pressure the sympathetic tone is back near resting level:
    // the reflex has accepted the new pressure and is no longer correcting it.
    expect(late['map']!).toBeGreaterThan(early['map']! + 3);
    expect(late['sympatheticTone']!).toBeGreaterThan(0.9);
  });
});
