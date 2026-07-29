#!/usr/bin/env node
/**
 * Validates every learning-content file and regenerates the registry.
 *
 * The CI runs this before the build. It fails on a missing source, because content without
 * a citation is exactly what this project must not ship — see CONTRIBUTING.md.
 *
 * Usage:
 *   node scripts/check-content.mjs           validate and rewrite the registry
 *   node scripts/check-content.mjs --check    validate only, fail if the registry is stale
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', 'content');
const registryPath = join(contentDir, 'registry.generated.ts');

const FrontmatterSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'id darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten'),
  title: z.string().min(3),
  system: z.string().min(3),
  tags: z.array(z.string().min(1)).min(1, 'mindestens ein Schlagwort'),
  sources: z
    .array(z.string().min(8))
    .min(1, 'Quellenangabe ist Pflicht — Inhalte ohne Beleg werden nicht ausgeliefert'),
});

const REQUIRED_SECTIONS = ['## Basis', '## Klinik', '## Prüfung'];

const files = readdirSync(contentDir)
  .filter((f) => f.endsWith('.mdx'))
  .sort();

const problems = [];
const entries = [];

for (const file of files) {
  const raw = readFileSync(join(contentDir, file), 'utf8');
  const { data, content } = matter(raw);
  const slug = basename(file, '.mdx');

  const parsed = FrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      problems.push(`${file}: ${issue.path.join('.') || 'frontmatter'} — ${issue.message}`);
    }
    continue;
  }

  if (parsed.data.id !== slug) {
    problems.push(`${file}: id "${parsed.data.id}" stimmt nicht mit dem Dateinamen überein`);
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      problems.push(`${file}: Abschnitt "${section}" fehlt`);
    }
  }

  entries.push({ slug, meta: parsed.data });
}

if (problems.length > 0) {
  console.error('\nLerninhalte fehlerhaft:\n');
  for (const p of problems) console.error(`  • ${p}`);
  console.error(`\n${problems.length} Problem(e). Siehe docs/contributing-content.md.\n`);
  process.exit(1);
}

const generated = `// AUTOMATISCH ERZEUGT von scripts/check-content.mjs — nicht von Hand ändern.
// Neu erzeugen mit: npm run content --workspace @physiosim/web
import type { ContentEntry } from '@/lib/content';

export const CONTENT: Readonly<Record<string, ContentEntry>> = {
${entries
  .map(
    ({ slug, meta }) => `  '${slug}': {
    meta: {
      id: '${meta.id}',
      title: ${JSON.stringify(meta.title)},
      system: ${JSON.stringify(meta.system)},
      tags: ${JSON.stringify(meta.tags)},
      sources: ${JSON.stringify(meta.sources)},
    },
    load: () => import('./${slug}.mdx'),
  },`,
  )
  .join('\n')}
};

export const CONTENT_IDS = Object.keys(CONTENT);
`;

const isCheckOnly = process.argv.includes('--check');
let existing = '';
try {
  existing = readFileSync(registryPath, 'utf8');
} catch {
  existing = '';
}

if (isCheckOnly) {
  if (existing !== generated) {
    console.error(
      '\nDie Content-Registry ist nicht aktuell.\nBitte "npm run content --workspace @physiosim/web" ausführen und das Ergebnis committen.\n',
    );
    process.exit(1);
  }
  console.log(`Lerninhalte in Ordnung: ${entries.length} Knoten, Registry aktuell.`);
} else {
  if (existing !== generated) writeFileSync(registryPath, generated);
  console.log(`Lerninhalte in Ordnung: ${entries.length} Knoten, alle mit Quellenangabe.`);
}
