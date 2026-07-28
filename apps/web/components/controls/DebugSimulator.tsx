'use client';

import { useMemo, useState } from 'react';
import { ALL_PARAMS, SCENARIOS, type ParamDefinition, type Readout } from '@physiosim/engine';
import { TIME_LAPSE, useSimulation } from '@/lib/useSimulation';
import { deviation, formatModelTime, formatValue, GROUP_LABELS } from '@/lib/format';

const GROUP_ORDER: ParamDefinition['group'][] = ['physiology', 'drug', 'pathology'];
const GROUP_TITLES: Record<ParamDefinition['group'], string> = {
  physiology: 'Physiologie',
  drug: 'Pharmaka',
  pathology: 'Pathologien',
};

export function DebugSimulator() {
  const sim = useSimulation();
  const [scenario, setScenario] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<Readout['group'], Readout[]>();
    for (const readout of sim.readouts) {
      const list = map.get(readout.group) ?? [];
      list.push(readout);
      map.set(readout.group, list);
    }
    return map;
  }, [sim.readouts]);

  function applyScenario(id: string) {
    setScenario(id);
    const found = SCENARIOS.find((s) => s.id === id);
    if (found === undefined) return;
    for (const def of ALL_PARAMS) {
      sim.setParam(def.id, found.params[def.id] ?? def.default);
    }
    sim.reset();
  }

  const active = SCENARIOS.find((s) => s.id === scenario);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,380px)_1fr]">
      <section aria-label="Parameter" className="space-y-6">
        <div
          className="space-y-3 rounded-sm border p-4"
          style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-raised)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="tabular text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Modellzeit {formatModelTime(sim.modelTime)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => sim.setRunning(!sim.running)}
                className="rounded-sm px-3 py-1.5 text-sm font-medium"
                style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
              >
                {sim.running ? 'Pause' : 'Weiter'}
              </button>
              <button
                type="button"
                onClick={sim.reset}
                className="rounded-sm border px-3 py-1.5 text-sm"
                style={{ borderColor: 'var(--color-rule)' }}
              >
                Zurücksetzen
              </button>
            </div>
          </div>

          <label className="block text-sm">
            <span style={{ color: 'var(--color-ink-muted)' }}>Zeitraffer</span>
            <select
              value={sim.timeLapse}
              onChange={(e) => sim.setTimeLapse(e.target.value as typeof sim.timeLapse)}
              className="mt-1 w-full rounded-sm border px-2 py-1.5"
              style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}
            >
              {TIME_LAPSE.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span style={{ color: 'var(--color-ink-muted)' }}>Szenario</span>
            <select
              value={scenario}
              onChange={(e) => applyScenario(e.target.value)}
              className="mt-1 w-full rounded-sm border px-2 py-1.5"
              style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}
            >
              <option value="">— eigenes Setup —</option>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {active !== undefined && (
            <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              <strong style={{ color: 'var(--color-ink)' }}>Aufgabe:</strong> {active.task}
            </p>
          )}
        </div>

        {GROUP_ORDER.map((group) => (
          <fieldset key={group} className="space-y-3">
            <legend
              className="mb-2 text-xs tracking-[0.15em] uppercase"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              {GROUP_TITLES[group]}
            </legend>
            {ALL_PARAMS.filter((p) => p.group === group).map((def) => (
              <ParamSlider
                key={def.id}
                definition={def}
                value={sim.params[def.id] ?? def.default}
                onChange={(v) => sim.setParam(def.id, v)}
              />
            ))}
          </fieldset>
        ))}
      </section>

      <section aria-label="Messwerte" className="space-y-6">
        {[...grouped.entries()].map(([group, readouts]) => (
          <div key={group}>
            <h2
              className="mb-2 text-xs tracking-[0.15em] uppercase"
              style={{ color: 'var(--color-ink-faint)' }}
            >
              {GROUP_LABELS[group]}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">{GROUP_LABELS[group]}</caption>
                <thead>
                  <tr style={{ color: 'var(--color-ink-faint)' }}>
                    <th scope="col" className="py-1 text-left font-normal">
                      Größe
                    </th>
                    <th scope="col" className="py-1 text-right font-normal">
                      Wert
                    </th>
                    <th scope="col" className="py-1 pl-3 text-left font-normal">
                      Einheit
                    </th>
                    <th scope="col" className="py-1 pl-3 text-left font-normal">
                      Normbereich
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {readouts.map((readout) => (
                    <ReadoutRow key={readout.id} readout={readout} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function ParamSlider({
  definition,
  value,
  onChange,
}: {
  definition: ParamDefinition;
  value: number;
  onChange: (value: number) => void;
}) {
  const isSwitch = definition.min === 0 && definition.max === 1 && definition.step === 1;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={`param-${definition.id}`} className="text-sm">
          {definition.label}
        </label>
        <span className="tabular text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          {isSwitch
            ? value > 0
              ? 'an'
              : 'aus'
            : `${value.toLocaleString('de-DE')} ${definition.unit === '1' ? '' : definition.unit}`}
        </span>
      </div>
      <input
        id={`param-${definition.id}`}
        type="range"
        min={definition.min}
        max={definition.max}
        step={definition.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-describedby={definition.hint ? `hint-${definition.id}` : undefined}
      />
      {definition.hint !== undefined && (
        <p
          id={`hint-${definition.id}`}
          className="text-xs"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          {definition.hint}
        </p>
      )}
    </div>
  );
}

function ReadoutRow({ readout }: { readout: Readout }) {
  const state = deviation(readout);
  const color =
    state === 'high'
      ? 'var(--color-arterial)'
      : state === 'low'
        ? 'var(--color-venous)'
        : 'var(--color-ink)';
  return (
    <tr style={{ borderTop: '1px solid var(--color-rule)' }}>
      <th scope="row" className="py-1.5 pr-3 text-left font-normal">
        {readout.label}
      </th>
      <td className="tabular py-1.5 text-right font-medium" style={{ color }}>
        {formatValue(readout)}
        {state === 'high' && <span aria-label="über dem Normbereich"> ↑</span>}
        {state === 'low' && <span aria-label="unter dem Normbereich"> ↓</span>}
      </td>
      <td className="py-1.5 pl-3" style={{ color: 'var(--color-ink-faint)' }}>
        {readout.unit === '1' ? '' : readout.unit}
      </td>
      <td className="tabular py-1.5 pl-3" style={{ color: 'var(--color-ink-faint)' }}>
        {readout.normal !== undefined
          ? `${readout.normal.low.toLocaleString('de-DE')}–${readout.normal.high.toLocaleString('de-DE')}`
          : '—'}
      </td>
    </tr>
  );
}
