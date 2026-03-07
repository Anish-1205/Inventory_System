import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['**/dist/**', '**/node_modules/**', '**/migrations/**'],
    },
  },
  resolve: {
    alias: {
      '@inventory-saas/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
