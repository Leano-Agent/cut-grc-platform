import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Setup global test configurations
  console.log('Setting up test environment...');
});

afterAll(() => {
  // Cleanup after all tests
  console.log('Cleaning up test environment...');
});

// Global test utilities
global.testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
};

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  Object.assign(console, originalConsole);
});