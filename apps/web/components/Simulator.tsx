'use client';

import { useMemo, useState } from 'react';
import { SCENARIOS } from '@physiosim/engine';
import { useSimulation } from '@/lib/useSimulation';
import { bodyVisual } from '@/lib/visuals';
import { BodyView, type OrganId } from '@/components/body/BodyView';
import { NephronView } from '@/components/organs/NephronView';
import { HeartView } from '@/components/organs/HeartView';
import { InterventionPanel } from '@/components/controls/InterventionPanel';
import { TimeControls } from '@/components/controls/TimeControls';
import { TimeSeries } from '@/components/readouts/TimeSeries';
import { Disclaimer } from '@/components/learn/Disclaimer';
import { deviation, formatValue } from '@/lib/format';

const KEY_VITALS = [
  'map',
  'heartRate',
  'cardiacOutput',
  'gfr',
  'urineFlow',
  'plasmaReninActivity',
  'aldosterone',
  'plasmaPotassium',
];

export function Simulator() {
  const sim = useSimulation();
  const [organ, setOrgan] = useState<OrganId | null>(null);
  const [scenario, setScenario] = useState('');

  const visual = useMemo(
    () => bodyVisual(sim.signals, sim.renal, sim.cardiovascular),
    [sim.signals, sim.renal, sim.cardiovascular],
  );

  function applyScenario(id: string) {
    setScenario(id);
    const found = SCENARIOS.find((s) => s.id === id);
    if (found === undefined) {
      sim.setManyParams({}, true);
      return;
    }
    sim.runScenario(found.baseline ?? found.params, found.settleBeforeSeconds ?? 0, found.params);
  }

  const activeScenario = SCENARIOS.find((s) => s.id === scenario);
  const detail =
    organ === 'kidneyLeft' || organ === 'kidneyRight'
      ? 'kidney'
      : organ === 'heart'
        ? 'heart'
        : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-4 px-4 py-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
            PhysioSim
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Blutdruckregulation, Niere und RAAS als ein zusammenhängendes Modell.
          </p>
        </div>
        <label className="text-sm">
          <span className="mr-2" style={{ color: 'var(--color-ink-muted)' }}>
            Szenario
          </span>
          <select
            value={scenario}
            onChange={(e) => applyScenario(e.target.value)}
            className="rounded-sm border px-2 py-1.5"
            style={{
              borderColor: 'var(--color-rule)',
              backgroundColor: 'var(--color-paper-raised)',
            }}
          >
            <option value="">— eigenes Setup —</option>
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {activeScenario !== undefined && (
        <p
          className="rounded-sm border-l-2 px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-signal)',
            backgroundColor: 'var(--color-paper-raised)',
            color: 'var(--color-ink-muted)',
          }}
        >
          <strong style={{ color: 'var(--color-ink)' }}>Aufgabe:</strong> {activeScenario.task}
        </p>
      )}

      <div className="grid flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* ---- left: interventions ------------------------------------- */}
        <aside
          className="order-2 max-h-[70vh] overflow-y-auto rounded-sm border p-4 xl:order-1"
          style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-raised)' }}
          aria-label="Parameter und Interventionen"
        >
          <InterventionPanel params={sim.params} onChange={sim.setParam} />
        </aside>

        {/* ---- centre: the drawing -------------------------------------- */}
        <section
          className="order-1 flex min-h-[520px] flex-col rounded-sm border p-4 xl:order-2"
          style={{ borderColor: 'var(--color-rule)' }}
          aria-label="Visualisierung"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {detail === 'kidney'
                ? `Nephron — Niere ${organ === 'kidneyLeft' ? 'links' : 'rechts'}`
                : detail === 'heart'
                  ? 'Herz'
                  : 'Ganzkörperansicht'}
            </h2>
            {detail !== null && (
              <button
                type="button"
                onClick={() => setOrgan(null)}
                className="rounded-sm border px-2.5 py-1 text-xs"
                style={{ borderColor: 'var(--color-rule)' }}
              >
                ← Ganzkörper
              </button>
            )}
          </div>

          <div className="h-[min(66vh,680px)]">
            {detail === 'kidney' ? (
              <NephronView
                visual={organ === 'kidneyLeft' ? visual.left : visual.right}
                modulation={sim.modulation}
                sideLabel={organ === 'kidneyLeft' ? 'links' : 'rechts'}
                plasmaOncoticMmHg={sim.signals.plasmaOncoticMmHg}
              />
            ) : detail === 'heart' ? (
              <HeartView heart={sim.cardiovascular} />
            ) : (
              <BodyView
                visual={visual}
                signals={sim.signals}
                selected={organ}
                onSelect={setOrgan}
              />
            )}
          </div>

          <p className="mt-2 text-xs leading-snug" style={{ color: 'var(--color-ink-faint)' }}>
            {detail === null
              ? 'Herz, Nieren und Gefäße sind anklickbar. Jede Bewegung stammt aus einer Modellgröße: Pulsrate aus der Herzfrequenz, Gefäßweite aus dem Widerstand (r ∝ R^−¼), Tropfrate aus dem Urinfluss. Die Durchblutung von Kopf, Armen und Beinen teilt sich einen gemeinsamen Index aus dem Herzzeitvolumen — diese Regionen werden im Modell nicht einzeln gerechnet.'
              : 'Alle Größen dieser Ansicht stammen unmittelbar aus dem Rechenmodell.'}
          </p>
        </section>

        {/* ---- right: numbers and curves --------------------------------- */}
        <aside
          className="order-3 max-h-[70vh] space-y-4 overflow-y-auto rounded-sm border p-4"
          style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-raised)' }}
          aria-label="Messwerte und Kurven"
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {KEY_VITALS.map((id) => {
              const r = sim.readoutById[id];
              if (r === undefined) return null;
              const state = deviation(r);
              const color =
                state === 'high'
                  ? 'var(--color-arterial)'
                  : state === 'low'
                    ? 'var(--color-venous)'
                    : 'var(--color-ink)';
              return (
                <div key={id}>
                  <div className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                    {r.label}
                  </div>
                  <div className="tabular text-base font-medium" style={{ color }}>
                    {formatValue(r)}
                    <span className="ml-1 text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                      {r.unit === '1' ? '' : r.unit}
                    </span>
                    {state === 'high' && <span aria-label="über dem Normbereich"> ↑</span>}
                    {state === 'low' && <span aria-label="unter dem Normbereich"> ↓</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-3" style={{ borderColor: 'var(--color-rule)' }}>
            <TimeSeries history={sim.history} />
          </div>

          <a
            href="/debug"
            className="block text-xs underline"
            style={{ color: 'var(--color-ink-faint)' }}
          >
            Alle Werte als Tabelle
          </a>
        </aside>
      </div>

      <TimeControls
        modelTime={sim.modelTime}
        running={sim.running}
        timeLapse={sim.timeLapse}
        events={sim.events}
        historySpanSeconds={Math.max(sim.modelTime - (sim.history[0]?.t ?? 0), 60)}
        onToggleRunning={() => sim.setRunning(!sim.running)}
        onTimeLapse={sim.setTimeLapse}
        onReset={sim.reset}
      />

      <Disclaimer />
    </div>
  );
}
