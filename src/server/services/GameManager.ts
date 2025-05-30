import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, AudienceMember, ContentSource, GameRound, GameStats } from '@/types/game';
import { WaybackService } from './WaybackService';
import { CohortManager } from './CohortManager';

export class GameManager {
  private gameState: GameState;
  private readonly waybackService: WaybackService;
  private readonly cohortManager: CohortManager;
  private readonly roundDuration: number;
  private readonly maxFakeAnswers: number;

  constructor(
    waybackService: WaybackService,
    cohortManager: CohortManager,
    roundDuration: number = 30000,
    maxFakeAnswers: number = 3
  ) {
    this.waybackService = waybackService;
    this.cohortManager = cohortManager;
    this.roundDuration = roundDuration;
    this.maxFakeAnswers = maxFakeAnswers;
    this.gameState = this.createNewGame();
  }

  private createNewGame(): GameState {
    return {
      id: uuidv4(),
      status: 'waiting',
      round: 0,
      players: [],
      audience: [],
      fakeAnswers: [],
    };
  }

  addPlayer(name: string, isHost: boolean = false): Player {
    const player: Player = {
      id: uuidv4(),
      name,
      score: 0,
      isHost,
    };
    this.gameState.players.push(player);
    return player;
  }

  removePlayer(playerId: string): void {
    const index = this.gameState.players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      this.gameState.players.splice(index, 1);
    }
  }

  addAudienceMember(): AudienceMember {
    const member: AudienceMember = {
      id: uuidv4(),
      cohort: '',
      score: 0,
    };
    this.cohortManager.assignToCohort(member);
    this.gameState.audience.push(member);
    return member;
  }

  removeAudienceMember(memberId: string): void {
    const index = this.gameState.audience.findIndex((m) => m.id === memberId);
    if (index !== -1) {
      this.cohortManager.removeFromCohort(memberId);
      this.gameState.audience.splice(index, 1);
    }
  }

  async startRound(): Promise<GameRound> {
    if (this.gameState.status !== 'waiting' && this.gameState.status !== 'finished') {
      throw new Error('Cannot start a new round while game is in progress');
    }

    this.gameState.status = 'playing';
    this.gameState.round++;
    this.gameState.roundStartTime = Date.now();
    this.gameState.roundEndTime = this.gameState.roundStartTime + this.roundDuration;

    // Fetch new content from Wayback Machine
    const content = await this.waybackService.fetchContent('reddit', 'https://reddit.com/r/AskReddit');
    this.gameState.currentContent = content;
    this.gameState.correctAnswer = content.id;
    this.gameState.fakeAnswers = [];

    return {
      content,
      fakeAnswers: [],
      correctAnswer: content.id,
      playerSelections: {},
      audienceSelections: {},
      scores: {},
    };
  }

  submitFakeAnswer(playerId: string, answer: string): void {
    if (this.gameState.fakeAnswers.length >= this.maxFakeAnswers) {
      throw new Error('Maximum number of fake answers reached');
    }

    const player = this.gameState.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    this.gameState.fakeAnswers.push(answer);
  }

  selectAnswer(playerId: string, answerId: string): void {
    const player = this.gameState.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (answerId === this.gameState.correctAnswer) {
      player.score += 100;
    }
  }

  selectAudienceAnswer(memberId: string, answerId: string): void {
    const member = this.gameState.audience.find((m) => m.id === memberId);
    if (!member) {
      throw new Error('Audience member not found');
    }

    member.selectedAnswer = answerId;
    if (answerId === this.gameState.correctAnswer) {
      member.score += 50;
    }
  }

  endRound(): GameStats {
    if (this.gameState.status !== 'playing') {
      throw new Error('No active round to end');
    }

    // Update cohort scores
    const selections = Object.fromEntries(
      this.gameState.audience.map((m) => [m.id, m.selectedAnswer || ''])
    );
    this.cohortManager.updateCohortScores(selections, this.gameState.correctAnswer!);

    // Calculate game stats
    const stats: GameStats = {
      totalRounds: this.gameState.round,
      playerScores: Object.fromEntries(
        this.gameState.players.map((p) => [p.id, p.score])
      ),
      cohortScores: Object.fromEntries(
        this.cohortManager.getCohorts().map((c) => [c.id, c.score])
      ),
      averageAudienceScore:
        this.gameState.audience.reduce((sum, m) => sum + m.score, 0) /
        this.gameState.audience.length,
      mostSuccessfulCohort: this.getMostSuccessfulCohort(),
      mostSuccessfulPlayer: this.getMostSuccessfulPlayer(),
    };

    this.gameState.status = 'finished';
    return stats;
  }

  private getMostSuccessfulCohort(): string {
    const cohorts = this.cohortManager.getCohorts();
    return cohorts.reduce((best, current) =>
      current.score > best.score ? current : best
    ).id;
  }

  private getMostSuccessfulPlayer(): string {
    return this.gameState.players.reduce((best, current) =>
      current.score > best.score ? current : best
    ).id;
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  resetGame(): void {
    this.gameState = this.createNewGame();
    this.cohortManager.resetCohorts();
  }
} 