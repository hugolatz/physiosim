'use client';

import { Children, isValidElement, useState, type ReactElement, type ReactNode } from 'react';

interface OptionProps {
  children: ReactNode;
  richtig?: boolean;
  /** Why this option is right or wrong. Required for the distractors, per CONTRIBUTING. */
  erklaerung?: string;
}

/**
 * One answer of an exam question. Rendered by <Frage>, never on its own — as a standalone
 * element it would give the answer away.
 */
export function Option({ children }: OptionProps) {
  return <>{children}</>;
}

function isOption(node: ReactNode): node is ReactElement<OptionProps> {
  return isValidElement(node) && node.type === Option;
}

/**
 * A single-best-answer question in the style German medical exams use, with a reason given
 * for every option — the distractors are where the learning is.
 */
export function Frage({ frage, children }: { frage: string; children: ReactNode }) {
  const options = Children.toArray(children).filter(isOption);
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <fieldset
      className="mt-3 mb-4 rounded-sm border p-3"
      style={{ borderColor: 'var(--color-rule)' }}
    >
      <legend className="px-1 text-sm font-medium">{frage}</legend>
      <ol className="mt-2 space-y-1.5">
        {options.map((option, i) => {
          const correct = option.props.richtig === true;
          const chosen = picked === i;
          const revealed = picked !== null;
          const border = !revealed
            ? 'var(--color-rule)'
            : correct
              ? 'var(--color-filtrate)'
              : chosen
                ? 'var(--color-arterial)'
                : 'var(--color-rule)';
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPicked(i)}
                disabled={revealed}
                className="w-full rounded-sm border px-2.5 py-1.5 text-left text-sm disabled:cursor-default"
                style={{
                  borderColor: border,
                  backgroundColor:
                    revealed && correct
                      ? 'var(--color-filtrate-tint)'
                      : revealed && chosen
                        ? 'var(--color-arterial-tint)'
                        : 'transparent',
                }}
              >
                <span style={{ color: 'var(--color-ink-faint)' }} className="mr-1.5">
                  {String.fromCharCode(65 + i)}
                </span>
                {option.props.children}
              </button>
              {revealed && option.props.erklaerung !== undefined && (
                <p
                  className="mt-1 mb-1.5 ml-6 text-xs leading-relaxed"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  {correct ? 'Richtig: ' : 'Falsch: '}
                  {option.props.erklaerung}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {picked !== null && (
        <button
          type="button"
          onClick={() => setPicked(null)}
          className="mt-2 text-xs underline"
          style={{ color: 'var(--color-ink-faint)' }}
        >
          Zurücksetzen
        </button>
      )}
    </fieldset>
  );
}
