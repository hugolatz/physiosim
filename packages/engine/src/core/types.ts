import type { Seconds, Unit } from './units';
import type { DrugEffect, Modulators } from './modulation';
import type { OrganismSignals } from './signals';

/**
 * Time scales present in the model. The UI groups readouts by these so a student can see
 * that the baroreflex buffers within seconds while the kidney sets long-term pressure.
 */
export type TimeScale = 'fast' | 'medium' | 'slow';

/** Which side of a paired organ an intervention applies to (see docs/adr/0004). */
export type Side = 'left' | 'right';

export type ParamGroup = 'physiology' | 'drug' | 'pathology';

export interface ParamDefinition {
  readonly id: string;
  /** German UI label. */
  readonly label: string;
  readonly group: ParamGroup;
  readonly unit: Unit;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly default: number;
  /** Normal range of the parameter itself, where one exists. */
  readonly normal?: { readonly low: number; readonly high: number };
  /** Short German explanation shown next to the control. */
  readonly hint?: string;
  /** Id of the MDX node explaining this parameter. */
  readonly contentId?: string;
  /** Source for the default value, or an explicit note that it is a calibrated setting. */
  readonly source: string;
}

/**
 * A fully resolved parameter set. Always produced by `resolveParams`, so every lookup of a
 * declared id is total — no `undefined` handling scattered through the model code.
 */
export interface Params {
  readonly [paramId: string]: number;
}

/** Base state. Every system state carries the model time it belongs to. */
export interface State {
  readonly t: Seconds;
}

export type ReadoutGroup = 'haemodynamik' | 'niere' | 'hormone' | 'labor' | 'bilanz';

export interface Readout {
  readonly id: string;
  /** German UI label. */
  readonly label: string;
  readonly value: number;
  readonly unit: Unit;
  /** Decimal places for display. */
  readonly precision: number;
  readonly group: ReadoutGroup;
  /**
   * Anchor of the equation in docs/model that produced this value.
   * Makes "every displayed value traces back to a documented equation" checkable.
   */
  readonly equation: string;
  readonly normal?: {
    readonly low: number;
    readonly high: number;
    readonly source: string;
  };
  readonly contentId?: string;
}

/**
 * Read-only view other systems get during a step. Signals are those of the *previous*
 * step, which makes the result independent of module order (see docs/adr/0003).
 */
export interface OrganismBus {
  readonly signals: Readonly<OrganismSignals>;
  /** Multiplicative factors of all active interventions; 1 means untouched. */
  readonly mod: Modulators;
}

/**
 * Something the user can do to the body: give a drug, switch on a pathology, start an
 * event. Drugs act through the shared modulation sites; pathologies act inside the system
 * that owns them and describe where in `actsOn` (see interventions/).
 */
export interface Intervention {
  readonly id: string;
  /** German label. */
  readonly label: string;
  readonly kind: 'drug' | 'pathology' | 'event';
  readonly effects: readonly DrugEffect[];
  readonly contentId?: string;
  /** Source for the effect sizes, or an explicit note that they are didactic settings. */
  readonly source: string;
}

/**
 * One body system. Adding a system means adding a file that implements this and
 * registering it — the core does not change (Definition of Done Nr. 6).
 */
export interface SystemModel<S extends State = State> {
  readonly id: string;
  /** German label. */
  readonly label: string;
  readonly timeScales: readonly TimeScale[];
  readonly params: readonly ParamDefinition[];

  initialState(p: Params): S;

  /** One integration step. `dt` is model time in seconds. Must be pure. */
  step(state: S, p: Params, dt: Seconds, bus: OrganismBus): S;

  /**
   * Display values derived from state and parameters alone. All intermediate quantities
   * needed here (P_GC, FF, segmental flows) are therefore carried in the state.
   */
  derive(state: S, p: Params): readonly Readout[];

  /** Quantities this system contributes to the shared organism signal space. */
  publish(state: S): Partial<OrganismSignals>;
}
