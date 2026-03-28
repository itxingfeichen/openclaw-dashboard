/**
 * Jest Test Setup
 * Configures test environment and mocks
 */

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-min-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only-min-32';
process.env.NODE_ENV = 'test';

// Mock console.error in tests to reduce noise
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.('[Password]')) {
    return; // Suppress password comparison errors in tests
  }
  originalConsoleError(...args);
};
