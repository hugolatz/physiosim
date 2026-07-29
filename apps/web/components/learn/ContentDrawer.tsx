'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { CONTENT } from '@/content/registry.generated';
import { useMDXComponents } from '@/mdx-components';
import { ContentLinkProvider } from '@/components/learn/ContentLink';

/**
 * The learning content for one model node.
 *
 * Basis and Klinik are stacked in the same panel rather than split across pages — that is
 * the didactic decision from the brief: a student should never see a mechanism without its
 * clinical consequence. The jump bar only scrolls; it never hides one of them.
 */
export function ContentDrawer({
  contentId,
  onClose,
  onOpenContent,
}: {
  contentId: string;
  onClose: () => void;
  onOpenContent: (id: string) => void;
}) {
  const entry = CONTENT[contentId];
  const [Body, setBody] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setBody(null);
    setFailed(false);
    if (entry === undefined) return;
    entry
      .load()
      .then((mod) => {
        if (active) setBody(() => mod.default);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [entry]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function jumpTo(heading: string) {
    const headings = bodyRef.current?.querySelectorAll('h2');
    headings?.forEach((h) => {
      if (h.textContent?.trim().toLowerCase() === heading.toLowerCase()) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-xl"
      style={{ borderColor: 'var(--color-rule)', backgroundColor: 'var(--color-paper-raised)' }}
      role="dialog"
      aria-modal="false"
      aria-label={entry?.meta.title ?? 'Lerninhalt'}
    >
      <header
        className="flex items-start justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: 'var(--color-rule)' }}
      >
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
            {entry?.meta.title ?? contentId}
          </h2>
          {entry !== undefined && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-ink-faint)' }}>
              {entry.meta.tags.join(' · ')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm border px-2 py-1 text-sm"
          style={{ borderColor: 'var(--color-rule)' }}
          aria-label="Lerninhalt schließen"
        >
          ✕
        </button>
      </header>

      {entry !== undefined && (
        <nav
          className="flex gap-1 border-b px-5 py-2"
          style={{ borderColor: 'var(--color-rule)' }}
          aria-label="Abschnitte"
        >
          {['Basis', 'Klinik', 'Prüfung'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => jumpTo(s)}
              className="rounded-sm border px-2.5 py-1 text-xs"
              style={{ borderColor: 'var(--color-rule)', color: 'var(--color-ink-muted)' }}
            >
              {s}
            </button>
          ))}
        </nav>
      )}

      <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-4">
        {entry === undefined ? (
          <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Zu diesem Knoten ist noch kein Lerninhalt geschrieben.{' '}
            <span style={{ color: 'var(--color-ink-faint)' }}>
              Anlegen unter <code>apps/web/content/{contentId}.mdx</code> — siehe
              docs/contributing-content.md.
            </span>
          </p>
        ) : failed ? (
          <p className="text-sm" style={{ color: 'var(--color-arterial)' }}>
            Der Inhalt konnte nicht geladen werden.
          </p>
        ) : Body === null ? (
          <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>
            Wird geladen …
          </p>
        ) : (
          <ContentLinkProvider onOpen={onOpenContent}>
            <MDXProvider components={useMDXComponents({})}>
              <Body />
            </MDXProvider>
          </ContentLinkProvider>
        )}
      </div>

      {entry !== undefined && (
        <footer className="border-t px-5 py-3" style={{ borderColor: 'var(--color-rule)' }}>
          <p className="text-xs" style={{ color: 'var(--color-ink-faint)' }}>
            <strong style={{ color: 'var(--color-ink-muted)' }}>Quellen:</strong>{' '}
            {entry.meta.sources.join(' · ')}
          </p>
        </footer>
      )}
    </aside>
  );
}
