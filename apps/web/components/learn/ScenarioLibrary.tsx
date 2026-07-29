'use client';

import { SCENARIOS } from '@physiosim/engine';

/**
 * The scenario library. Each card carries the task and the expected behaviour — the same
 * expectation the engine's acceptance tests check, so what a student is told to look for is
 * what the test suite guarantees.
 */
export function ScenarioLibrary({
  activeId,
  onPick,
  onClose,
}: {
  activeId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-ink) 45%, transparent)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Szenarien"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-sm border p-5"
        style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
            Szenarien
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border px-2 py-1 text-sm"
            style={{ borderColor: 'var(--color-rule)' }}
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onPick(s.id);
                onClose();
              }}
              className="rounded-sm border p-3 text-left"
              style={{
                borderColor: activeId === s.id ? 'var(--color-signal)' : 'var(--color-rule)',
                backgroundColor: 'var(--color-paper-raised)',
              }}
            >
              <h3 className="text-sm font-medium">{s.label}</h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                {s.task}
              </p>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: 'var(--color-ink-faint)' }}
              >
                <strong>Zu erwarten:</strong> {s.expectation}
              </p>
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs" style={{ color: 'var(--color-ink-faint)' }}>
          Jedes Szenario ist zugleich ein Akzeptanztest der Engine — was hier als „zu erwarten"
          steht, prüft die Testsuite bei jedem Commit nach.
        </p>
      </div>
    </div>
  );
}
