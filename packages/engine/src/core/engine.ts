import type { OrganismBus, Params, Readout, State, SystemModel } from './types';
import type { OrganismSignals } from './signals';
import { mergeSignals, RESTING_SIGNALS } from './signals';
import type { Modulators } from './modulation';
import { resolveParams } from './params';
import { ALL_PARAMS, SYSTEMS } from './registry';
import { buildModulators } from '../interventions/drugs';
import type { Seconds } from './units';
import { HOUR } from './units';

/**
 * Fixed integration step in model seconds (docs/adr/0002).
 *
 * The same value is used at every time-lapse setting, so a scenario produces the same
 * curve whether it is watched in real time or fast-forwarded a day per second.
 */
export const SOLVER_DT: Seconds = 2;

export interface EngineSnapshot {
  readonly t: Seconds;
  readonly states: Readonly<Record<string, State>>;
  readonly signals: Readonly<OrganismSignals>;
  readonly params: Params;
}

/**
 * Orchestrates the registered systems.
 *
 * One step means: every system integrates using the shared signals of the previous step,
 * then all contributions are merged into the new shared state. No system sees another
 * system's half-finished result, which is what keeps the outcome independent of order.
 */
export class Simulation {
  private readonly systems: readonly SystemModel[];
  private states = new Map<string, State>();
  private signalState: Readonly<OrganismSignals> = RESTING_SIGNALS;
  private params: Params;
  private modulators: Modulators;
  private timeSeconds: Seconds = 0;
  /** Model time requested but not yet worth a whole step. */
  private carry: Seconds = 0;

  constructor(
    overrides: Readonly<Record<string, number>> = {},
    systems: readonly SystemModel[] = SYSTEMS,
  ) {
    this.systems = systems;
    this.params = resolveParams(ALL_PARAMS, overrides);
    this.modulators = buildModulators(this.params);
    this.reset(overrides);
  }

  /** Restart from the resting state with the given parameters. */
  reset(overrides: Readonly<Record<string, number>> = {}): void {
    this.params = resolveParams(ALL_PARAMS, overrides);
    this.modulators = buildModulators(this.params);
    this.states = new Map();
    this.timeSeconds = 0;
    this.carry = 0;

    const contributions = this.systems.map((system) => {
      const state = system.initialState(this.params);
      this.states.set(system.id, state);
      return system.publish(state);
    });
    this.signalState = mergeSignals(RESTING_SIGNALS, contributions);
  }

  /**
   * Change parameters without restarting — this is what a slider does, and what "give an
   * ACE inhibitor now" means.
   */
  setParams(overrides: Readonly<Record<string, number>>): void {
    this.params = resolveParams(ALL_PARAMS, overrides);
    this.modulators = buildModulators(this.params);
  }

  get parameters(): Params {
    return this.params;
  }

  get modulation(): Modulators {
    return this.modulators;
  }

  get time(): Seconds {
    return this.timeSeconds;
  }

  /** Advance the model by `seconds` of model time. */
  advance(seconds: Seconds): void {
    if (seconds <= 0) return;
    this.carry += seconds;
    const steps = Math.floor(this.carry / SOLVER_DT);
    this.carry -= steps * SOLVER_DT;
    for (let i = 0; i < steps; i += 1) this.stepOnce();
  }

  /**
   * Run long enough for the slow loops to settle. Used to start scenarios from a genuine
   * steady state instead of from a transient.
   */
  equilibrate(seconds: Seconds = 72 * HOUR): void {
    this.advance(seconds);
  }

  signals(): Readonly<OrganismSignals> {
    return this.signalState;
  }

  state<S extends State>(systemId: string): S {
    const state = this.states.get(systemId);
    if (state === undefined) throw new Error(`Unknown system "${systemId}".`);
    return state as S;
  }

  readouts(): readonly Readout[] {
    const out: Readout[] = [];
    for (const system of this.systems) {
      const state = this.states.get(system.id);
      if (state === undefined) continue;
      out.push(...system.derive(state, this.params));
    }
    return out;
  }

  /** Look up one readout by id. Throws on a typo rather than silently returning nothing. */
  readout(id: string): Readout {
    const found = this.readouts().find((r) => r.id === id);
    if (found === undefined) throw new Error(`Unknown readout "${id}".`);
    return found;
  }

  value(id: string): number {
    return this.readout(id).value;
  }

  snapshot(): EngineSnapshot {
    return {
      t: this.timeSeconds,
      states: Object.fromEntries(this.states),
      signals: this.signalState,
      params: this.params,
    };
  }

  restore(snapshot: EngineSnapshot): void {
    this.timeSeconds = snapshot.t;
    this.carry = 0;
    this.states = new Map(Object.entries(snapshot.states));
    this.signalState = snapshot.signals;
    this.params = snapshot.params;
    this.modulators = buildModulators(this.params);
  }

  private stepOnce(): void {
    const bus: OrganismBus = { signals: this.signalState, mod: this.modulators };
    const contributions: Partial<OrganismSignals>[] = [];
    for (const system of this.systems) {
      const previous = this.states.get(system.id);
      if (previous === undefined) continue;
      const next = system.step(previous, this.params, SOLVER_DT, bus);
      this.states.set(system.id, next);
      contributions.push(system.publish(next));
    }
    this.signalState = mergeSignals(this.signalState, contributions);
    this.timeSeconds += SOLVER_DT;
  }
}

/** Convenience factory. */
export function createSimulation(overrides: Readonly<Record<string, number>> = {}): Simulation {
  return new Simulation(overrides);
}
