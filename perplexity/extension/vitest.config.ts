import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      'tests/mcp/**/mcp.e2e.spec.ts', // keep Playwright E2E out of Vitest
    ],
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
      '@mcp': path.resolve(__dirname, 'src/services/mcp'),
    },
  },
  esbuild: {
    format: 'esm', // preserve import.meta
  },
});
