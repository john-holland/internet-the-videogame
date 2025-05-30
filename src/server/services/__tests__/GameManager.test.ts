import { GameManager } from '../GameManager';
import { WaybackService } from '../WaybackService';
import { CohortManager } from '../CohortManager';
import { ContentSource } from '@/types/game';

// Mock the WaybackService
jest.mock('../WaybackService');
const MockWaybackService = WaybackService as jest.MockedClass<typeof WaybackService>;

// Mock the CohortManager
jest.mock('../CohortManager');
const MockCohortManager = CohortManager as jest.MockedClass<typeof CohortManager>;

describe('GameManager', () => {
  let gameManager: GameManager;
  let mockWaybackService: jest.Mocked<WaybackService>;
  let mockCohortManager: jest.Mocked<CohortManager>;

  beforeEach(() => {
    mockWaybackService = new MockWaybackService('fake-api-key') as jest.Mocked<WaybackService>;
    mockCohortManager = new MockCohortManager() as jest.Mocked<CohortManager>;
    gameManager = new GameManager(mockWaybackService, mockCohortManager);
  });

  describe('addPlayer', () => {
    it('should add a new player to the game', () => {
      const player = gameManager.addPlayer('Test Player');
      expect(player.name).toBe('Test Player');
      expect(player.score).toBe(0);
      expect(player.isHost).toBe(false);
    });

    it('should add a host player when specified', () => {
      const player = gameManager.addPlayer('Host Player', true);
      expect(player.name).toBe('Host Player');
      expect(player.isHost).toBe(true);
    });
  });

  describe('removePlayer', () => {
    it('should remove a player from the game', () => {
      const player = gameManager.addPlayer('Test Player');
      gameManager.removePlayer(player.id);
      const gameState = gameManager.getGameState();
      expect(gameState.players).not.toContainEqual(expect.objectContaining({ id: player.id }));
    });
  });

  describe('startRound', () => {
    it('should start a new round with content from Wayback Machine', async () => {
      const mockContent: ContentSource = {
        type: 'reddit',
        id: 'test-id',
        url: 'https://test.com',
        content: 'Test content',
        author: 'Test author',
        timestamp: '2024-01-01',
      };

      mockWaybackService.fetchContent.mockResolvedValue(mockContent);

      const round = await gameManager.startRound();
      expect(round.content).toEqual(mockContent);
      expect(round.correctAnswer).toBe(mockContent.id);
      expect(round.fakeAnswers).toHaveLength(0);
    });

    it('should throw error when trying to start a round while game is in progress', async () => {
      await gameManager.startRound();
      await expect(gameManager.startRound()).rejects.toThrow('Cannot start a new round while game is in progress');
    });
  });

  describe('submitFakeAnswer', () => {
    it('should add a fake answer to the current round', async () => {
      await gameManager.startRound();
      const player = gameManager.addPlayer('Test Player');
      gameManager.submitFakeAnswer(player.id, 'Fake answer');
      const gameState = gameManager.getGameState();
      expect(gameState.fakeAnswers).toContain('Fake answer');
    });

    it('should throw error when maximum fake answers reached', async () => {
      await gameManager.startRound();
      const player = gameManager.addPlayer('Test Player');
      for (let i = 0; i < 3; i++) {
        gameManager.submitFakeAnswer(player.id, `Fake answer ${i}`);
      }
      expect(() => gameManager.submitFakeAnswer(player.id, 'Extra fake answer')).toThrow('Maximum number of fake answers reached');
    });
  });

  describe('selectAnswer', () => {
    it('should award points for correct answer', async () => {
      await gameManager.startRound();
      const player = gameManager.addPlayer('Test Player');
      const gameState = gameManager.getGameState();
      gameManager.selectAnswer(player.id, gameState.correctAnswer!);
      expect(player.score).toBe(100);
    });

    it('should not award points for incorrect answer', async () => {
      await gameManager.startRound();
      const player = gameManager.addPlayer('Test Player');
      gameManager.selectAnswer(player.id, 'wrong-answer');
      expect(player.score).toBe(0);
    });
  });

  describe('endRound', () => {
    it('should calculate and return game stats', async () => {
      await gameManager.startRound();
      const player = gameManager.addPlayer('Test Player');
      gameManager.selectAnswer(player.id, 'correct-answer');
      const stats = gameManager.endRound();
      expect(stats.totalRounds).toBe(1);
      expect(stats.playerScores[player.id]).toBe(0); // No points for wrong answer
    });

    it('should throw error when no active round', () => {
      expect(() => gameManager.endRound()).toThrow('No active round to end');
    });
  });
}); 