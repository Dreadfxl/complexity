import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'vite-plugins/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    exclude: [
      'e2e/**',
      'tests/**/*.spec.ts',
      'node_modules/**',
      '**/*.e2e.*',
    ],
    setupFiles: [
      path.resolve(__dirname, 'tests/setup.global.ts'),
    ],
    deps: {
      inline: ['zod'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '~': path.resolve(__dirname),
      '@src': path.resolve(__dirname, 'src'),
      '@mcp': path.resolve(__dirname, 'src/services/mcp'),
    },
  },
  esbuild: { format: 'esm' },
});
