import type { MDXComponents } from 'mdx/types';
import { Frage, Option } from '@/components/learn/Quiz';
import { Verweis } from '@/components/learn/ContentLink';

/**
 * Components available to every learning node. Content authors write German prose plus
 * <Frage>/<Option> for the exam block; nothing else is needed.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => (
      <h2
        className="mt-5 mb-2 text-xs tracking-[0.15em] uppercase"
        style={{ color: 'var(--color-ink-faint)' }}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => <h3 className="mt-4 mb-1 text-sm font-medium">{children}</h3>,
    p: ({ children }) => (
      <p className="mb-2.5 text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
        {children}
      </p>
    ),
    ul: ({ children }) => <ul className="mb-2.5 ml-4 list-disc space-y-1 text-sm">{children}</ul>,
    ol: ({ children }) => (
      <ol className="mb-2.5 ml-4 list-decimal space-y-1 text-sm">{children}</ol>
    ),
    li: ({ children }) => (
      <li style={{ color: 'var(--color-ink-muted)' }} className="leading-relaxed">
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong style={{ color: 'var(--color-ink)' }} className="font-medium">
        {children}
      </strong>
    ),
    code: ({ children }) => (
      <code
        className="tabular rounded-sm px-1 py-0.5 text-[0.85em]"
        style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
      >
        {children}
      </code>
    ),
    Frage,
    Option,
    Verweis,
    ...components,
  };
}
