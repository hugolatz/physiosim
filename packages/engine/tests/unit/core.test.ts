import { describe, expect, it } from 'vitest';
import { clamp, lerp, nonNegative, relax, sigmoid } from '../../src/core/units';
import { mergeSignals, RESTING_SIGNALS } from '../../src/core/signals';
import { applyEffects, effectFactor, NEUTRAL_MODULATORS } from '../../src/core/modulation';
import { mergeParamDefinitions, param, resolveParams } from '../../src/core/params';
import type { ParamDefinition } from '../../src/core/types';

const naIntake: ParamDefinition = {
  id: 'naIntake',
  label: 'Kochsalzzufuhr',
  group: 'physiology',
  unit: 'mmol/d',
  min: 10,
  max: 600,
  step: 10,
  default: 150,
  source: 'Typische Zufuhr in Deutschland; DGE-Empfehlung 100 mmol/d',
};

describe('numeric helpers', () => {
  it('clamps and rejects NaN', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(Number.NaN, 0, 10)).toBe(0);
  });

  it('keeps physiological quantities non-negative', () => {
    expect(nonNegative(-0.5)).toBe(0);
    expect(nonNegative(Number.NaN)).toBe(0);
    expect(nonNegative(2)).toBe(2);
  });

  it('relaxes towards the target with the given time constant', () => {
    // One time constant should cover ~63 % of the distance.
    let value = 0;
    const tau = 10;
    const dt = 0.05;
    for (let t = 0; t < tau; t += dt) value = relax(value, 1, tau, dt);
    expect(value).toBeGreaterThan(0.6);
    expect(value).toBeLessThan(0.65);
  });

  it('has a sigmoid centred on x50', () => {
    expect(sigmoid(100, 100, 0.1)).toBeCloseTo(0.5, 10);
    expect(sigmoid(160, 100, 0.1)).toBeGreaterThan(0.9);
    expect(sigmoid(40, 100, 0.1)).toBeLessThan(0.1);
  });

  it('interpolates with clamped t', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 2)).toBe(10);
    expect(lerp(0, 10, -1)).toBe(0);
  });
});

describe('organism signals', () => {
  it('merges contributions without mutating the base', () => {
    const merged = mergeSignals(RESTING_SIGNALS, [{ mapMmHg: 120 }, { heartRateBpm: 55 }]);
    expect(merged.mapMmHg).toBe(120);
    expect(merged.heartRateBpm).toBe(55);
    expect(merged.gfrMlPerMin).toBe(RESTING_SIGNALS.gfrMlPerMin);
    expect(RESTING_SIGNALS.mapMmHg).toBe(93);
  });
});

describe('drug modulation', () => {
  const aceInhibitor = {
    site: 'ace.activity',
    emax: 0.15,
    ec50: 35,
    source: 'Didaktische Setzung, keine Messgroesse',
  } as const;

  it('has no effect at zero intensity and approaches emax at full dose', () => {
    expect(effectFactor(aceInhibitor, 0)).toBe(1);
    expect(effectFactor(aceInhibitor, 100)).toBeLessThan(0.5);
    expect(effectFactor(aceInhibitor, 100)).toBeGreaterThan(0.15);
  });

  it('compounds effects on the same site multiplicatively', () => {
    const once = applyEffects(NEUTRAL_MODULATORS, [{ effect: aceInhibitor, intensity: 100 }]);
    const twice = applyEffects(NEUTRAL_MODULATORS, [
      { effect: aceInhibitor, intensity: 100 },
      { effect: aceInhibitor, intensity: 100 },
    ]);
    expect(twice['ace.activity']).toBeCloseTo(once['ace.activity'] ** 2, 10);
  });

  it('leaves untouched sites neutral', () => {
    const mod = applyEffects(NEUTRAL_MODULATORS, [{ effect: aceInhibitor, intensity: 50 }]);
    expect(mod['nkcc2.transport']).toBe(1);
  });
});

describe('parameter resolution', () => {
  it('fills defaults and clamps overrides', () => {
    expect(resolveParams([naIntake])['naIntake']).toBe(150);
    expect(resolveParams([naIntake], { naIntake: 900 })['naIntake']).toBe(600);
    expect(resolveParams([naIntake], { naIntake: Number.NaN })['naIntake']).toBe(150);
  });

  it('throws on unknown parameter ids', () => {
    const p = resolveParams([naIntake]);
    expect(param(p, 'naIntake')).toBe(150);
    expect(() => param(p, 'naIntakeTypo')).toThrow(/Unknown parameter/);
  });

  it('rejects duplicate ids across systems', () => {
    const clashing: ParamDefinition = { ...naIntake, default: 200 };
    expect(() => mergeParamDefinitions([[naIntake], [clashing]])).toThrow(/Duplicate/);
    expect(mergeParamDefinitions([[naIntake], [naIntake]])).toHaveLength(1);
  });
});
