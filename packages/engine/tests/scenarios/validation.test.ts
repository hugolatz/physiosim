import { describe, expect, it } from 'vitest';
import { DAY, HOUR, MINUTE } from '../../src/core/units';
import { change, settled, values } from '../helpers';

/**
 * The teaching scenarios as acceptance tests.
 *
 * These check direction and order of magnitude, never an exact number — the model is a
 * didactic simplification and pinning it to three decimal places would only make the suite
 * brittle. A red test here is a statement about physiology, not about code style.
 * The prose version of each expectation lives in docs/model/validation.md.
 */

describe('1 — Akuter Blutverlust 1000 mL', () => {
  const base = settled();
  const before = values(base);

  const sim = settled();
  sim.setParams({ hemorrhageRate: 100 }); // 100 mL/min
  sim.advance(10 * MINUTE); // = 1000 mL
  sim.setParams({ hemorrhageRate: 0 });
  sim.advance(20 * MINUTE);
  const after = values(sim);

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
  const before = values(settled({}, 14 * DAY));
  const after = values(settled({ sodiumIntake: 400 }, 14 * DAY));

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
  const before = values(settled({}, 7 * DAY));
  const after = values(settled({ renalArteryStenosisLeft: 30 }, 7 * DAY));

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
  const sim = settled({ renalArteryStenosisLeft: 40, renalArteryStenosisRight: 40 }, 3 * DAY);
  const before = values(sim);
  sim.setParams({
    renalArteryStenosisLeft: 40,
    renalArteryStenosisRight: 40,
    aceInhibitor: 100,
  });
  sim.advance(2 * HOUR);
  const after = values(sim);

  it('lässt die GFR deutlich abfallen', () => {
    expect(change(before['gfr']!, after['gfr']!)).toBeLessThan(-0.15);
  });

  it('senkt den glomerulären Kapillardruck', () => {
    expect(after['pgc-left']!).toBeLessThan(before['pgc-left']!);
  });

  it('senkt die Filtrationsfraktion — das Vas efferens ist offen', () => {
    expect(after['filtrationFraction']!).toBeLessThan(before['filtrationFraction']! * 0.8);
  });

  it('senkt das AT1-Signal und steigert reaktiv das Renin', () => {
    expect(after['angiotensinIIEffect']!).toBeLessThan(before['angiotensinIIEffect']! * 0.6);
    expect(after['plasmaReninActivity']!).toBeGreaterThan(before['plasmaReninActivity']!);
  });

  it('trifft eine gesunde Niere weit weniger hart', () => {
    const healthy = settled({}, 3 * DAY);
    const healthyBefore = values(healthy).gfr!;
    healthy.setParams({ aceInhibitor: 100 });
    healthy.advance(2 * HOUR);
    const healthyDrop = change(healthyBefore, values(healthy).gfr!);
    expect(healthyDrop).toBeGreaterThan(change(before['gfr']!, after['gfr']!));
  });
});

describe('5 — Conn-Syndrom', () => {
  const before = values(settled({}, 14 * DAY));
  const after = values(settled({ primaryAldosteronism: 100 }, 14 * DAY));

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
  const before = values(settled({}, 2 * DAY));
  const sim = settled({}, 2 * DAY);
  sim.setParams({ loopDiuretic: 100 });
  sim.advance(6 * HOUR);
  const acute = values(sim);
  sim.advance(42 * HOUR);
  const after = values(sim);

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
  const base = settled({}, 2 * DAY);
  const before = values(base);

  const single = settled({}, 2 * DAY);
  single.setParams({ nsaid: 100 });
  single.advance(2 * DAY);
  const nsaidOnly = values(single);

  const sim = settled({}, 2 * DAY);
  sim.setParams({ nsaid: 100, aceInhibitor: 100, loopDiuretic: 100 });
  sim.advance(2 * DAY);
  const after = values(sim);

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
  function gfrAt(mapDriver: number, autoregulation: boolean) {
    const params: Record<string, number> = {
      vascularTone: mapDriver,
      // The baroreflex would undo the pressure change we want to impose.
      baroreflexEnabled: 0,
    };
    if (!autoregulation) {
      params['tgfEnabled'] = 0;
      params['myogenicEnabled'] = 0;
    }
    const sim = settled(params, 30 * MINUTE);
    const v = values(sim);
    return { map: v['map']!, gfr: v['gfr']! };
  }

  it('lässt die GFR ohne Autoregulation viel stärker dem Druck folgen', () => {
    const lowWith = gfrAt(0.8, true);
    const highWith = gfrAt(1.3, true);
    const lowWithout = gfrAt(0.8, false);
    const highWithout = gfrAt(1.3, false);

    // Sanity: the driver really did move the pressure in both settings.
    expect(highWith.map - lowWith.map).toBeGreaterThan(10);
    expect(highWithout.map - lowWithout.map).toBeGreaterThan(10);

    const slopeWith = (highWith.gfr - lowWith.gfr) / (highWith.map - lowWith.map);
    const slopeWithout = (highWithout.gfr - lowWithout.gfr) / (highWithout.map - lowWithout.map);

    expect(slopeWithout).toBeGreaterThan(slopeWith * 1.5);
  });
});

describe('9 — Drucksprung: Sekunden gegen Tage', () => {
  it('fängt eine akute Drucksteigerung binnen Sekunden über den Reflex ab', () => {
    const sim = settled();
    const before = values(sim);
    sim.setParams({ vascularTone: 1.35 });
    sim.advance(30);
    const withReflex = values(sim);

    const noReflex = settled({ baroreflexEnabled: 0 });
    noReflex.setParams({ vascularTone: 1.35, baroreflexEnabled: 0 });
    noReflex.advance(30);
    const without = values(noReflex);

    expect(withReflex['map']!).toBeGreaterThan(before['map']!);
    // Within seconds the reflex has withdrawn sympathetic tone and blunted the rise.
    expect(withReflex['sympatheticTone']!).toBeLessThan(0.95);
    expect(withReflex['map']!).toBeLessThan(without['map']!);
  });

  it('begrenzt eine chronische Salz-Retention über die Druck-Natriurese', () => {
    // The long-term controller is only visible once the hormonal loops can no longer
    // escape — an autonomous mineralocorticoid load is exactly that situation.
    // See docs/model/validation.md on why salt loading alone does not show this.
    const baseline = values(settled({}, 14 * DAY))['map']!;

    const withKidney = values(settled({ primaryAldosteronism: 60 }, 14 * DAY));
    const withoutKidney = values(
      settled({ primaryAldosteronism: 60, pressureNatriuresisEnabled: 0 }, 14 * DAY),
    );

    const withRise = withKidney['map']! - baseline;
    const withoutRise = withoutKidney['map']! - baseline;

    expect(withRise).toBeGreaterThan(0);
    expect(withoutRise).toBeGreaterThan(withRise * 1.3);
    // And it contains it by holding down the volume, not by relaxing the vessels.
    expect(withKidney['ecfVolume']!).toBeLessThan(withoutKidney['ecfVolume']! - 2);
  });

  it('lässt den Reflex-Sollwert über Tage nachziehen', () => {
    const sim = settled({ primaryAldosteronism: 100 });
    sim.advance(60);
    const early = values(sim);
    sim.advance(7 * DAY);
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
