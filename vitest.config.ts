import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'tests/calculations/**/*.test.ts',
      'tests/unit/**/*.test.ts',
      'lib/**/*.test.ts',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'tests/api/**',
      'tests/integration/**',
      'tests/components/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/calculations/**/*.ts',
        'lib/utils/**/*.ts',
        'lib/types/**/*.ts',
      ],
      exclude: [
        'lib/types/database.ts', // Type definitions
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 5000,
    hookTimeout: 5000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/app': path.resolve(__dirname, './app'),
    },
  },
});