// Jest setup file for global configuration
// This file is run before each test file

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock Next.js runtime
// Using a different approach to avoid ESM import issues
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}
if (typeof global.Request === 'undefined') {
  global.Request = jest.fn();
}
if (typeof global.Response === 'undefined') {
  global.Response = jest.fn();
}

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};