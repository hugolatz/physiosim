'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ALL_PARAMS,
  createSimulation,
  RESTING_SIGNALS,
  type CardiovascularState,
  type Modulators,
  type OrganismSignals,
  type Readout,
  type RenalState,
  type Simulation,
} from '@physiosim/engine';

/** Time-lapse factors: model seconds per wall-clock second. */
export const TIME_LAPSE = [
  { id: 'realtime', label: '1× Echtzeit', factor: 1 },
  { id: 'minute', label: '1 min/s', factor: 60 },
  { id: 'hour', label: '1 h/s', factor: 3600 },
  { id: 'day', label: '1 Tag/s', factor: 86_400 },
] as const;

export type TimeLapseId = (typeof TIME_LAPSE)[number]['id'];

const FRAME_MS = 100;
const HISTORY_LIMIT = 480;

/** One sampled point of the time course, for the curves. */
export interface Sample {
  t: number;
  map: number;
  heartRate: number;
  cardiacOutput: number;
  gfr: number;
  urineFlow: number;
  renin: number;
  aldosterone: number;
  ecfVolume: number;
  sodiumExcretion: number;
  potassium: number;
  adh: number;
}

/** A marker on the timeline: the user changed something at this model time. */
export interface SimEvent {
  id: number;
  t: number;
  paramId: string;
  label: string;
  value: number;
  unit: string;
}

export interface SimulationView {
  readouts: readonly Readout[];
  readoutById: Record<string, Readout>;
  signals: Readonly<OrganismSignals>;
  renal: RenalState;
  cardiovascular: CardiovascularState;
  /** Where the active drugs are pulling, 1 = untouched. Drives the transporter badges. */
  modulation: Modulators;
  history: readonly Sample[];
  events: readonly SimEvent[];
  params: Record<string, number>;
  modelTime: number;
  running: boolean;
  timeLapse: TimeLapseId;
  setParam: (id: string, value: number) => void;
  setManyParams: (values: Record<string, number>, restart?: boolean) => void;
  /** Restart, run a baseline to equilibrium, then apply the intervention. */
  runScenario: (
    baseline: Readonly<Record<string, number>>,
    settleBeforeSeconds: number,
    params: Readonly<Record<string, number>>,
  ) => void;
  setRunning: (running: boolean) => void;
  setTimeLapse: (id: TimeLapseId) => void;
  reset: () => void;
}

function defaults(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const def of ALL_PARAMS) out[def.id] = def.default;
  return out;
}

function sampleOf(sim: Simulation): Sample {
  const s = sim.signals();
  return {
    t: sim.time,
    map: s.mapMmHg,
    heartRate: s.heartRateBpm,
    cardiacOutput: s.cardiacOutputLPerMin,
    gfr: s.gfrMlPerMin,
    urineFlow: (s.urineFlowMlPerMin * 1440) / 1000,
    renin: s.plasmaReninActivity,
    aldosterone: s.aldosteroneNgPerL,
    ecfVolume: s.ecfVolumeL,
    sodiumExcretion: s.sodiumExcretionMmolPerMin * 1440,
    potassium: s.plasmaPotassiumMmolPerL,
    adh: s.adhNgPerL,
  };
}

/**
 * Drives the engine from React without letting React own the model state.
 *
 * The simulation is a mutable object in a ref; the component tree only re-renders when a
 * fresh set of readouts arrives. Moving the solver into a worker (M4) means changing this
 * hook and nothing else.
 */
export function useSimulation(initial?: Record<string, number>): SimulationView {
  const simRef = useRef<Simulation | null>(null);
  if (simRef.current === null) simRef.current = createSimulation(initial ?? {});

  const historyRef = useRef<Sample[]>([sampleOf(simRef.current)]);
  const eventIdRef = useRef(0);

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaults(),
    ...initial,
  }));
  const [frame, setFrame] = useState(() => snapshotOf(simRef.current, historyRef.current));
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [running, setRunning] = useState(true);
  const [timeLapse, setTimeLapse] = useState<TimeLapseId>('minute');

  useEffect(() => {
    if (!running) return;
    const factor = TIME_LAPSE.find((t) => t.id === timeLapse)?.factor ?? 1;
    const handle = window.setInterval(() => {
      const sim = simRef.current;
      if (sim === null) return;
      sim.advance((factor * FRAME_MS) / 1000);
      historyRef.current.push(sampleOf(sim));
      if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
      setFrame(snapshotOf(sim, historyRef.current));
    }, FRAME_MS);
    return () => window.clearInterval(handle);
  }, [running, timeLapse]);

  const recordEvent = useCallback((id: string, value: number) => {
    const def = ALL_PARAMS.find((p) => p.id === id);
    const sim = simRef.current;
    if (def === undefined || sim === null) return;
    setEvents((previous) => {
      const last = previous[previous.length - 1];
      // Dragging a slider must leave one marker, not fifty.
      const next: SimEvent = {
        id: last !== undefined && last.paramId === id ? last.id : ++eventIdRef.current,
        t: sim.time,
        paramId: id,
        label: def.label,
        value,
        unit: def.unit === '1' ? '' : def.unit,
      };
      if (last !== undefined && last.paramId === id) {
        return [...previous.slice(0, -1), { ...next, t: last.t }];
      }
      return [...previous.slice(-19), next];
    });
  }, []);

  const setParam = useCallback(
    (id: string, value: number) => {
      setParams((previous) => {
        if (previous[id] === value) return previous;
        const next = { ...previous, [id]: value };
        simRef.current?.setParams(next);
        return next;
      });
      recordEvent(id, value);
    },
    [recordEvent],
  );

  const setManyParams = useCallback((values: Record<string, number>, restart = false) => {
    const sim = simRef.current;
    if (sim === null) return;
    const next = { ...defaults(), ...values };
    setParams(next);
    if (restart) {
      sim.reset(next);
      historyRef.current = [sampleOf(sim)];
      setEvents([]);
    } else {
      sim.setParams(next);
    }
    setFrame(snapshotOf(sim, historyRef.current));
  }, []);

  const runScenario = useCallback(
    (
      baseline: Readonly<Record<string, number>>,
      settleBeforeSeconds: number,
      scenarioParams: Readonly<Record<string, number>>,
    ) => {
      const sim = simRef.current;
      if (sim === null) return;
      const base = { ...defaults(), ...baseline };
      sim.reset(base);
      historyRef.current = [sampleOf(sim)];
      setEvents([]);
      if (settleBeforeSeconds > 0) {
        // Sample the run-up so the curves show the state the intervention starts from.
        const steps = 60;
        for (let i = 0; i < steps; i += 1) {
          sim.advance(settleBeforeSeconds / steps);
          historyRef.current.push(sampleOf(sim));
        }
      }
      const applied = { ...defaults(), ...scenarioParams };
      setParams(applied);
      sim.setParams(applied);
      const changed = Object.keys(scenarioParams).filter(
        (id) => (baseline[id] ?? defaults()[id]) !== scenarioParams[id],
      );
      setEvents(
        changed.map((id, i) => {
          const def = ALL_PARAMS.find((p) => p.id === id);
          return {
            id: ++eventIdRef.current + i,
            t: sim.time,
            paramId: id,
            label: def?.label ?? id,
            value: scenarioParams[id] ?? 0,
            unit: def?.unit === '1' ? '' : (def?.unit ?? ''),
          };
        }),
      );
      setFrame(snapshotOf(sim, historyRef.current));
    },
    [],
  );

  const reset = useCallback(() => {
    const sim = simRef.current;
    if (sim === null) return;
    sim.reset(params);
    historyRef.current = [sampleOf(sim)];
    setEvents([]);
    setFrame(snapshotOf(sim, historyRef.current));
  }, [params]);

  return {
    ...frame,
    events,
    params,
    running,
    timeLapse,
    setParam,
    setManyParams,
    runScenario,
    setRunning,
    setTimeLapse,
    reset,
  };
}

interface Frame {
  readouts: readonly Readout[];
  readoutById: Record<string, Readout>;
  signals: Readonly<OrganismSignals>;
  renal: RenalState;
  cardiovascular: CardiovascularState;
  modulation: Modulators;
  history: readonly Sample[];
  modelTime: number;
}

function snapshotOf(sim: Simulation | null, history: readonly Sample[]): Frame {
  if (sim === null) {
    throw new Error('Simulation not initialised');
  }
  const readouts = sim.readouts();
  const readoutById: Record<string, Readout> = {};
  for (const r of readouts) readoutById[r.id] = r;
  return {
    readouts,
    readoutById,
    signals: sim.signals() ?? RESTING_SIGNALS,
    renal: sim.state<RenalState>('renal'),
    cardiovascular: sim.state<CardiovascularState>('cardiovascular'),
    modulation: sim.modulation,
    history: history.slice(),
    modelTime: sim.time,
  };
}
