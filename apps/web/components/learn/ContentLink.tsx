'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { CONTENT } from '@/content/registry.generated';

/**
 * Cross-links between learning nodes.
 *
 * Content authors write <Verweis id="renin" />; the label comes from the target's own
 * frontmatter, so a renamed node cannot leave a stale link text behind.
 */
const ContentLinkContext = createContext<((id: string) => void) | null>(null);

export function ContentLinkProvider({
  onOpen,
  children,
}: {
  onOpen: (id: string) => void;
  children: ReactNode;
}) {
  return <ContentLinkContext.Provider value={onOpen}>{children}</ContentLinkContext.Provider>;
}

export function Verweis({ id, children }: { id: string; children?: ReactNode }) {
  const open = useContext(ContentLinkContext);
  const label = children ?? CONTENT[id]?.meta.title ?? id;
  const known = CONTENT[id] !== undefined;

  if (open === null || !known) {
    return <span style={{ color: 'var(--color-ink)' }}>{label}</span>;
  }
  return (
    <button
      type="button"
      onClick={() => open(id)}
      className="underline decoration-dotted underline-offset-2"
      style={{ color: 'var(--color-ink)' }}
    >
      {label}
    </button>
  );
}
