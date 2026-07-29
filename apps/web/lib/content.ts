import type { ComponentType } from 'react';

/**
 * Typed frontmatter of a learning node. Enforced at build time by
 * scripts/check-content.mjs — the CI refuses content without a source.
 */
export interface ContentMeta {
  readonly id: string;
  readonly title: string;
  readonly system: string;
  readonly tags: readonly string[];
  readonly sources: readonly string[];
}

export interface ContentEntry {
  readonly meta: ContentMeta;
  readonly load: () => Promise<{ default: ComponentType }>;
}
