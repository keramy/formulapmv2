/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // API Routes Testing (Node environment)
    {
      displayName: 'API Routes',
      testEnvironment: 'node',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/src/__tests__/api/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.node.js'],
    },
    // Component Testing (jsdom environment)
    {
      displayName: 'Components',
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/src/__tests__/components/**/*.test.tsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.dom.js'],
    },
    // Integration Testing (jsdom environment for auth testing)
    {
      displayName: 'Integration',
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.dom.js'],
      testTimeout: 30000, // Longer timeout for integration tests
      transformIgnorePatterns: [
        'node_modules/(?!(isows|@supabase|@testing-library)/)'
      ],
    },
    // Hooks Testing (jsdom environment)
    {
      displayName: 'Hooks',
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/src/__tests__/hooks/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.dom.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(isows|@supabase|@testing-library)/)'
      ],
    },
  ],
  // Global coverage settings
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/**/route.ts', // Exclude API route files from coverage (tested separately)
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};