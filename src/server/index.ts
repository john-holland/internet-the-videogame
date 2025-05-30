import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config } from './config';
import { GameManager } from './game/GameManager';
import { WaybackService } from './services/WaybackService';
import { CohortManager } from './game/CohortManager';
import { CommentatorService } from './services/CommentatorService';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Database connection
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
});

// Redis connection
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
});

// Services
const waybackService = new WaybackService(config.waybackApiKey);
const cohortManager = new CohortManager();
const gameManager = new GameManager(pool, redis, waybackService, cohortManager);
const commentatorService = new CommentatorService(pool);

// Store active commentator streams
const activeStreams = new Map<string, Set<WebSocket>>();

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  let playerId: string | null = null;
  let isCommentator = false;

  ws.on('message', async (message: string) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'join':
        playerId = data.playerId;
        isCommentator = data.isCommentator;
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

      case 'audience_reaction':
        if (!playerId) return;
        // Broadcast reaction to all clients
        wss.clients.forEach((client: WebSocket) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'audience_reaction',
              userId: playerId,
              cohortId: data.cohortId,
              reaction: data.reaction,
            }));
          }
        });
        break;

      case 'commentator_audio':
        if (!isCommentator) return;
        // Check if commentator is active
        const isActive = await commentatorService.isCommentatorActive(playerId);
        if (!isActive) return;
        
        // Broadcast audio to all clients except the sender
        wss.clients.forEach((client: WebSocket) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'commentator_audio',
              commentatorId: playerId,
              audioData: data.audioData,
            }));
          }
        });
        break;

      case 'get_commentators':
        const commentators = await commentatorService.getAllCommentators();
        ws.send(JSON.stringify({
          type: 'commentators_list',
          commentators,
        }));
        break;

      case 'add_commentator':
        if (!data.name) return;
        const newCommentator = await commentatorService.addCommentator(data.name);
        // Broadcast to all clients
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'commentator_added',
              commentator: newCommentator,
            }));
          }
        });
        break;

      case 'toggle_commentator':
        if (!data.commentatorId) return;
        const updatedCommentator = await commentatorService.toggleCommentator(
          data.commentatorId,
          data.isActive
        );
        // Broadcast to all clients
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'commentator_updated',
              commentator: updatedCommentator,
            }));
          }
        });
        break;

      case 'delete_commentator':
        if (!data.commentatorId) return;
        await commentatorService.deleteCommentator(data.commentatorId);
        // Broadcast to all clients
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'commentator_deleted',
              commentatorId: data.commentatorId,
            }));
          }
        });
        break;
    }
  });

  ws.on('close', () => {
    if (playerId) {
      gameManager.leaveGame(playerId);
      if (isCommentator) {
        activeStreams.get(playerId)?.delete(ws);
        if (activeStreams.get(playerId)?.size === 0) {
          activeStreams.delete(playerId);
        }
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || config.server.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 