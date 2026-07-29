import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export: PhysioSim runs entirely client-side, see docs/adr/0007.
  output: 'export',
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  // The engine is consumed as TypeScript source, no separate build step.
  transpilePackages: ['@physiosim/engine', '@physiosim/ui'],
  typescript: { ignoreBuildErrors: false },
};

const withMDX = createMDX({
  options: {
    // Frontmatter is read by scripts/check-content.mjs, not rendered — this keeps the
    // YAML block from ending up in the page as text.
    //
    // Plugins are named as strings rather than imported: Turbopack requires serialisable
    // loader options and rejects a function reference here.
    remarkPlugins: [['remark-frontmatter', 'yaml']],
    providerImportSource: '@mdx-js/react',
  },
});

export default withMDX(nextConfig);
