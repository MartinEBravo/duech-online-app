import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setupTests.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    exclude: ['node_modules/**'],
    // Use happy-dom for component tests (.tsx files)
    environmentMatchGlobs: [['src/__tests__/**/*.test.tsx', 'happy-dom']],
  },
});
