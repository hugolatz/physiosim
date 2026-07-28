'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ALL_PARAMS, createSimulation, type Readout, type Simulation } from '@physiosim/engine';

/** Time-lapse factors: model seconds per wall-clock second. */
export const TIME_LAPSE = [
  { id: 'realtime', label: '1× Echtzeit', factor: 1 },
  { id: 'minute', label: '1 min/s', factor: 60 },
  { id: 'hour', label: '1 h/s', factor: 3600 },
  { id: 'day', label: '1 Tag/s', factor: 86_400 },
] as const;

export type TimeLapseId = (typeof TIME_LAPSE)[number]['id'];

const FRAME_MS = 100;

export interface SimulationView {
  readouts: readonly Readout[];
  params: Record<string, number>;
  modelTime: number;
  running: boolean;
  timeLapse: TimeLapseId;
  setParam: (id: string, value: number) => void;
  setRunning: (running: boolean) => void;
  setTimeLapse: (id: TimeLapseId) => void;
  reset: () => void;
}

function defaults(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const def of ALL_PARAMS) out[def.id] = def.default;
  return out;
}

/**
 * Drives the engine from React without letting React own the model state.
 *
 * The simulation is a mutable object in a ref; the component only re-renders when the
 * readouts are refreshed. Moving the solver into a worker (M4) means changing this hook
 * and nothing else.
 */
export function useSimulation(initial?: Record<string, number>): SimulationView {
  const simRef = useRef<Simulation | null>(null);
  if (simRef.current === null) simRef.current = createSimulation(initial ?? {});

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...defaults(),
    ...initial,
  }));
  const [readouts, setReadouts] = useState<readonly Readout[]>(
    () => simRef.current?.readouts() ?? [],
  );
  const [modelTime, setModelTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [timeLapse, setTimeLapse] = useState<TimeLapseId>('minute');

  useEffect(() => {
    if (!running) return;
    const factor = TIME_LAPSE.find((t) => t.id === timeLapse)?.factor ?? 1;
    const handle = window.setInterval(() => {
      const sim = simRef.current;
      if (sim === null) return;
      sim.advance((factor * FRAME_MS) / 1000);
      setReadouts(sim.readouts());
      setModelTime(sim.time);
    }, FRAME_MS);
    return () => window.clearInterval(handle);
  }, [running, timeLapse]);

  const setParam = useCallback((id: string, value: number) => {
    setParams((previous) => {
      const next = { ...previous, [id]: value };
      simRef.current?.setParams(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const sim = simRef.current;
    if (sim === null) return;
    sim.reset(params);
    setReadouts(sim.readouts());
    setModelTime(0);
  }, [params]);

  return {
    readouts,
    params,
    modelTime,
    running,
    timeLapse,
    setParam,
    setRunning,
    setTimeLapse,
    reset,
  };
}
