import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'internet_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  websocket: {
    pingInterval: 30000,
    pingTimeout: 5000,
  },
  game: {
    minAudienceSize: 5,
    roundDuration: 30000,
    cohortSize: 10,
    maxFakeAnswers: 3,
  },
  waybackApiKey: process.env.WAYBACK_API_KEY || '',
}; 