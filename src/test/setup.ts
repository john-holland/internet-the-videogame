import '@types/jest';

// Mock environment variables
process.env.PORT = '3000';
process.env.HOST = 'localhost';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'internet_game_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.WAYBACK_API_KEY = 'test_api_key';

// Global test timeout
jest.setTimeout(10000); 