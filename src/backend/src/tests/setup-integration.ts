import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'cut_grc_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
};

// Test Redis configuration
const testRedisConfig = {
  url: process.env.TEST_REDIS_URL || 'redis://localhost:6379',
};

let dbPool: Pool;
let redisClient: any;

// Global setup for integration tests
beforeAll(async () => {
  console.log('Setting up integration test environment...');
  
  // Create database connection pool
  dbPool = new Pool(testDbConfig);
  
  // Create Redis client
  redisClient = createClient(testRedisConfig);
  await redisClient.connect();
  
  // Set global test utilities
  global.dbPool = dbPool;
  global.redisClient = redisClient;
  
  // Run database migrations for test database
  // await runTestMigrations();
  
  // Seed test data
  // await seedTestData();
});

// Global teardown for integration tests
afterAll(async () => {
  console.log('Cleaning up integration test environment...');
  
  // Clean up test data
  // await cleanupTestData();
  
  // Close connections
  if (dbPool) await dbPool.end();
  if (redisClient) await redisClient.quit();
});

// Clean database before each test
beforeEach(async () => {
  // Truncate all tables except migrations
  // await cleanTestDatabase();
});

// Type declarations for global test utilities
declare global {
  var dbPool: Pool;
  var redisClient: any;
  var testUser: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}