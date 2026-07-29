'use client';

import type { SimEvent, TimeLapseId } from '@/lib/useSimulation';
import { TIME_LAPSE } from '@/lib/useSimulation';
import { formatModelTime } from '@/lib/format';

interface TimeControlsProps {
  modelTime: number;
  running: boolean;
  timeLapse: TimeLapseId;
  events: readonly SimEvent[];
  historySpanSeconds: number;
  onToggleRunning: () => void;
  onTimeLapse: (id: TimeLapseId) => void;
  onReset: () => void;
}

/**
 * The time axis: play state, time-lapse, and the event markers that say what the user did
 * and when. Without the markers a curve is just a wiggle — with them it is a story.
 */
export function TimeControls({
  modelTime,
  running,
  timeLapse,
  events,
  historySpanSeconds,
  onToggleRunning,
  onTimeLapse,
  onReset,
}: TimeControlsProps) {
  const start = Math.max(modelTime - historySpanSeconds, 0);
  const span = Math.max(modelTime - start, 1);

  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-sm border px-4 py-3"
      style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-raised)' }}
    >
      <button
        type="button"
        onClick={onToggleRunning}
        className="rounded-sm px-4 py-1.5 text-sm font-medium"
        style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        {running ? 'Pause' : 'Weiter'}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-sm border px-3 py-1.5 text-sm"
        style={{ borderColor: 'var(--color-rule)' }}
      >
        Zurücksetzen
      </button>

      <div className="flex items-center gap-1" role="group" aria-label="Zeitraffer">
        {TIME_LAPSE.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTimeLapse(t.id)}
            aria-pressed={timeLapse === t.id}
            className="rounded-sm border px-2.5 py-1 text-xs"
            style={{
              borderColor: timeLapse === t.id ? 'var(--color-ink)' : 'var(--color-rule)',
              backgroundColor: timeLapse === t.id ? 'var(--color-ink)' : 'transparent',
              color: timeLapse === t.id ? 'var(--color-paper)' : 'var(--color-ink-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <span className="tabular text-sm" style={{ color: 'var(--color-ink-muted)' }}>
        Modellzeit {formatModelTime(modelTime)}
      </span>

      {/* event timeline */}
      <div className="min-w-[220px] flex-1">
        <div
          className="relative h-8 rounded-sm"
          style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-rule)' }}
        >
          {events
            .filter((e) => e.t >= start)
            .map((e) => {
              const left = ((e.t - start) / span) * 100;
              return (
                <span
                  key={e.id}
                  className="absolute top-0 h-full"
                  style={{ left: `${Math.min(Math.max(left, 0), 99)}%` }}
                  title={`${formatModelTime(e.t)} — ${e.label}: ${e.value.toLocaleString('de-DE')} ${e.unit}`}
                >
                  <span
                    className="block h-full w-0.5"
                    style={{ backgroundColor: 'var(--color-signal)' }}
                    aria-hidden
                  />
                  <span className="sr-only">
                    {formatModelTime(e.t)}: {e.label} auf {e.value} {e.unit}
                  </span>
                </span>
              );
            })}
        </div>
        {events.length > 0 && (
          <p className="mt-1 truncate text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            Zuletzt: {events[events.length - 1]?.label} ={' '}
            {events[events.length - 1]?.value.toLocaleString('de-DE')}{' '}
            {events[events.length - 1]?.unit}
          </p>
        )}
      </div>
    </div>
  );
}
