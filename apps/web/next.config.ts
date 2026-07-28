import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export: PhysioSim runs entirely client-side, see docs/adr/0007.
  output: 'export',
  reactStrictMode: true,
  // The engine is consumed as TypeScript source, no separate build step.
  transpilePackages: ['@physiosim/engine', '@physiosim/ui'],
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
