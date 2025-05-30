import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config } from './config';
import { GameManager } from './game/GameManager';
import { WaybackService } from './services/WaybackService';
import { CohortManager } from './game/CohortManager';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Database connection
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
});

// Redis connection
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
});

// Services
const waybackService = new WaybackService(config.waybackApiKey);
const cohortManager = new CohortManager(redis);
const gameManager = new GameManager(pool, redis, waybackService, cohortManager);

// WebSocket connection handling
wss.on('connection', (ws) => {
  let playerId: string | null = null;

  ws.on('message', async (message: string) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'join':
        playerId = data.playerId;
        const player = await gameManager.joinGame(playerId, data.publicIdentity);
        ws.send(JSON.stringify({ type: 'joined', player }));
        break;

      case 'submit_fake':
        if (!playerId) return;
        await gameManager.submitFakeAnswer(playerId, data.content);
        break;

      case 'select_answer':
        if (!playerId) return;
        await gameManager.selectAnswer(playerId, data.answerIndex);
        break;

      case 'update_cohorts':
        await cohortManager.updateCohorts();
        break;
    }
  });

  ws.on('close', () => {
    if (playerId) {
      gameManager.leaveGame(playerId);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || config.server.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 