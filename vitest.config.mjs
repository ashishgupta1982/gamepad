import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Mirrors jsconfig.json's baseUrl=src so `@/...` resolves in tests exactly as it
// does in the app. Without it every import under test fails to resolve and the
// suite looks broken rather than the code.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
