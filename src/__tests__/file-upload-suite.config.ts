/**
 * File Upload Test Suite Configuration
 * 
 * Configuration file for running the complete file upload test suite
 * with proper setup and teardown for all test scenarios.
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'file-upload-suite',
    root: path.resolve(__dirname, '..'),
    include: [
      '**/file-upload-*.test.ts',
      '**/file-upload-*.test.tsx'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**'
    ],
    environment: 'jsdom',
    setupFiles: [
      './test-setup.ts'
    ],
    globalSetup: './global-setup.ts',
    globals: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/file-upload.ts',
        'src/app/api/**/submit/route.ts',
        'src/components/**/file-upload/**',
        'src/hooks/**/upload/**'
      ],
      exclude: [
        'src/__tests__/**',
        'src/**/test-utils/**',
        'src/**/mock-**'
      ],
      thresholds: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85
      }
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@/utils/mock-storage': path.resolve(__dirname, 'utils/mock-storage.ts'),
      '@/utils/real-supabase-utils': path.resolve(__dirname, 'utils/real-supabase-utils.ts')
    }
  }
})