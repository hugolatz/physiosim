'use client';

import { useState } from 'react';
import {
  arrowFor,
  EXPLAIN_TARGETS,
  explain,
  type ExplainContext,
  type ExplainTargetId,
} from '@physiosim/engine';

interface WhyPanelProps {
  context: ExplainContext;
  onOpenContent: (contentId: string) => void;
}

const DIRECTION_COLOR = {
  up: 'var(--color-arterial)',
  down: 'var(--color-venous)',
  neutral: 'var(--color-ink-faint)',
} as const;

/**
 * "Warum passiert das gerade?"
 *
 * Every line here is generated from the factors the engine recorded while it stepped —
 * see packages/engine/src/explain. Following a link makes that influence the new question,
 * which is what turns a list of forces into a chain the student walks backwards:
 * GFR ← Angiotensin II ← Renin ← Blutdruck.
 */
export function WhyPanel({ context, onOpenContent }: WhyPanelProps) {
  const [chain, setChain] = useState<ExplainTargetId[]>(['map']);
  const target = chain[chain.length - 1] ?? 'map';
  const result = explain(target, context);

  return (
    <section
      className="space-y-3 rounded-sm border p-4"
      style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-raised)' }}
      aria-label="Warum passiert das gerade?"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Warum passiert das gerade?</h2>
        <div className="flex flex-wrap gap-1">
          {EXPLAIN_TARGETS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setChain([t.id])}
              aria-pressed={target === t.id}
              className="rounded-sm border px-2 py-0.5 text-xs"
              style={{
                borderColor: target === t.id ? 'var(--color-ink)' : 'var(--color-rule)',
                backgroundColor: target === t.id ? 'var(--color-ink)' : 'transparent',
                color: target === t.id ? 'var(--color-paper)' : 'var(--color-ink-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* the walked chain, newest question last */}
      {chain.length > 1 && (
        <nav aria-label="Kausalkette" className="flex flex-wrap items-center gap-1 text-xs">
          {chain.map((id, i) => {
            const label = EXPLAIN_TARGETS.find((t) => t.id === id)?.label ?? id;
            const isLast = i === chain.length - 1;
            return (
              <span key={`${id}-${i}`} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChain(chain.slice(0, i + 1))}
                  className={isLast ? 'font-medium' : 'underline'}
                  style={{ color: isLast ? 'var(--color-ink)' : 'var(--color-ink-faint)' }}
                >
                  {label}
                </button>
                {!isLast && <span style={{ color: 'var(--color-ink-faint)' }}>←</span>}
              </span>
            );
          })}
        </nav>
      )}

      <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
        <span
          className="tabular mr-2 font-medium"
          style={{ color: DIRECTION_COLOR[result.direction] }}
        >
          {result.targetLabel} {arrowFor(result.direction)}{' '}
          {result.value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} {result.unit}
        </span>
        {result.headline}
      </p>

      {result.steps.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>
          Zurzeit zieht nichts nennenswert an dieser Größe — das System ist im Gleichgewicht.
          Verstelle links einen Parameter, dann erscheint hier die Kette.
        </p>
      ) : (
        <ol className="space-y-2">
          {result.steps.map((step) => (
            <li key={step.id} className="space-y-1">
              <div className="flex items-baseline gap-2 text-sm">
                <span
                  aria-hidden
                  className="w-3 shrink-0 font-medium"
                  style={{ color: DIRECTION_COLOR[step.direction] }}
                >
                  {arrowFor(step.direction)}
                </span>
                <span className="flex-1">
                  {step.drillTo !== undefined ? (
                    <button
                      type="button"
                      onClick={() => setChain([...chain, step.drillTo!])}
                      className="font-medium underline decoration-dotted underline-offset-2"
                      title="Warum ist das so?"
                    >
                      {step.label}
                    </button>
                  ) : (
                    <span className="font-medium">{step.label}</span>
                  )}{' '}
                  <span style={{ color: 'var(--color-ink-muted)' }}>{step.mechanism}</span>
                  {step.contentId !== undefined && (
                    <button
                      type="button"
                      onClick={() => onOpenContent(step.contentId!)}
                      className="ml-1.5 rounded-sm px-1 text-xs"
                      style={{
                        backgroundColor: 'var(--color-signal-tint)',
                        color: 'var(--color-ink)',
                      }}
                      aria-label={`Lerninhalt zu ${step.label} öffnen`}
                    >
                      lernen
                    </button>
                  )}
                </span>
                <span
                  className="tabular shrink-0 text-xs"
                  style={{ color: 'var(--color-ink-faint)' }}
                  title="Faktor, den das Modell in diesem Schritt verwendet hat"
                >
                  ×{step.factor.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                className="h-1 rounded-full"
                style={{ backgroundColor: 'var(--color-rule)' }}
                role="presentation"
              >
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${Math.round(step.weight * 100)}%`,
                    backgroundColor: DIRECTION_COLOR[step.direction],
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
        Die Faktoren sind die Zahlen, mit denen das Modell in diesem Rechenschritt tatsächlich
        multipliziert hat — nicht nacherzählt, sondern mitgeschrieben. Der Balken zeigt, wie stark
        der Beitrag gerade ist.
      </p>
    </section>
  );
}
