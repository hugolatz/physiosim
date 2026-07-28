import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Scenario tests integrate up to 30 simulated days.
    testTimeout: 120_000,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      thresholds: {
        // Quality gate from the project brief: engine coverage >= 85 %.
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
