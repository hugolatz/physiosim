'use client';

import { useState } from 'react';
import { ALL_PARAMS, type ParamDefinition } from '@physiosim/engine';

const GROUPS: { id: ParamDefinition['group']; title: string; hint: string }[] = [
  { id: 'physiology', title: 'Physiologie', hint: 'Zufuhr, Herz, Gefäße, Autoregulation' },
  { id: 'drug', title: 'Pharmaka', hint: 'Wirkstärke 0–100 %, jeweils mit eigenem Angriffspunkt' },
  { id: 'pathology', title: 'Pathologien', hint: 'Krankheitsbilder als Schalter' },
];

export function InterventionPanel({
  params,
  onChange,
}: {
  params: Record<string, number>;
  onChange: (id: string, value: number) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    physiology: true,
    drug: true,
    pathology: false,
  });

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const defs = ALL_PARAMS.filter((p) => p.group === group.id);
        const active = defs.filter((d) => params[d.id] !== d.default).length;
        const isOpen = open[group.id] ?? false;
        return (
          <section key={group.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [group.id]: !isOpen }))}
              aria-expanded={isOpen}
              className="flex w-full items-baseline justify-between gap-2 border-b pb-1.5 text-left"
              style={{ borderColor: 'var(--color-rule)' }}
            >
              <span
                className="text-xs tracking-[0.15em] uppercase"
                style={{ color: 'var(--color-ink-faint)' }}
              >
                {group.title}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
                {active > 0 && (
                  <span
                    className="mr-2 rounded-full px-1.5 py-0.5"
                    style={{
                      backgroundColor: 'var(--color-signal-tint)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {active} aktiv
                  </span>
                )}
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <div className="mt-3 space-y-3.5">
                {defs.map((def) => (
                  <ParamSlider
                    key={def.id}
                    definition={def}
                    value={params[def.id] ?? def.default}
                    onChange={(v) => onChange(def.id, v)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
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
  const changed = value !== definition.default;

  if (isSwitch) {
    return (
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={`p-${definition.id}`} className="text-sm leading-tight">
          {definition.label}
          {definition.hint !== undefined && (
            <span className="mt-0.5 block text-xs" style={{ color: 'var(--color-ink-faint)' }}>
              {definition.hint}
            </span>
          )}
        </label>
        <input
          id={`p-${definition.id}`}
          type="checkbox"
          checked={value > 0}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          className="mt-1 h-4 w-4 shrink-0"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={`p-${definition.id}`} className="text-sm">
          {definition.label}
        </label>
        <span
          className="tabular text-sm"
          style={{ color: changed ? 'var(--color-signal)' : 'var(--color-ink-muted)' }}
        >
          {value.toLocaleString('de-DE')} {definition.unit === '1' ? '' : definition.unit}
        </span>
      </div>
      <input
        id={`p-${definition.id}`}
        type="range"
        min={definition.min}
        max={definition.max}
        step={definition.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-describedby={definition.hint ? `h-${definition.id}` : undefined}
      />
      {definition.hint !== undefined && (
        <p
          id={`h-${definition.id}`}
          className="text-xs leading-snug"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          {definition.hint}
        </p>
      )}
    </div>
  );
}
