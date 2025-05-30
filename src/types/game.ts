export type ContentType = 'reddit' | 'facebook' | 'imgur';

export interface ContentSource {
  type: ContentType;
  id: string;
  url: string;
  content: string;
  author: string;
  timestamp: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface AudienceMember {
  id: string;
  cohort: string;
  score: number;
  selectedAnswer?: string;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  round: number;
  currentContent?: ContentSource;
  players: Player[];
  audience: AudienceMember[];
  fakeAnswers: string[];
  correctAnswer?: string;
  roundStartTime?: number;
  roundEndTime?: number;
}

export interface Cohort {
  id: string;
  name: string;
  members: AudienceMember[];
  score: number;
  description: string;
  specialAbility: string;
  scoreMultiplier: number;
  bias: number;
  streak: number;
  lastCorrect: boolean;
}

export interface GameRound {
  content: ContentSource;
  fakeAnswers: string[];
  correctAnswer: string;
  playerSelections: Record<string, string>;
  audienceSelections: Record<string, string>;
  scores: Record<string, number>;
}

export interface GameStats {
  totalRounds: number;
  playerScores: Record<string, number>;
  cohortScores: Record<string, number>;
  averageAudienceScore: number;
  mostSuccessfulCohort: string;
  mostSuccessfulPlayer: string;
} 