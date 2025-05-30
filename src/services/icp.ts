import { GameState, Player, ContentSource } from '@/types/game';

const ICP_SERVER_URL = process.env.NEXT_PUBLIC_ICP_SERVER_URL || 'http://localhost:3001';

class ICPService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(`${ICP_SERVER_URL.replace('http', 'ws')}/game`);
    
    this.ws.onopen = () => {
      console.log('Connected to ICP server');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 1000 * Math.pow(2, this.reconnectAttempts));
      }
    };

    this.ws.onerror = (error) => {
      console.error('ICP WebSocket error:', error);
    };
  }

  // Game state management
  async joinGame(playerId: string, publicIdentity?: { platform: string; username: string }): Promise<Player> {
    const response = await fetch(`${ICP_SERVER_URL}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, publicIdentity }),
    });
    return response.json();
  }

  async submitFakeAnswer(playerId: string, content: string): Promise<void> {
    if (!this.ws) throw new Error('Not connected to ICP server');
    this.ws.send(JSON.stringify({
      type: 'submit_fake',
      playerId,
      content,
    }));
  }

  async selectAnswer(playerId: string, answerIndex: number): Promise<void> {
    if (!this.ws) throw new Error('Not connected to ICP server');
    this.ws.send(JSON.stringify({
      type: 'select_answer',
      playerId,
      answerIndex,
    }));
  }

  // Content fetching
  async fetchContent(type: 'reddit' | 'facebook' | 'imgur', id: string): Promise<ContentSource> {
    const response = await fetch(`${ICP_SERVER_URL}/content/${type}/${id}`);
    return response.json();
  }

  // Cohort management
  async updateCohorts(): Promise<void> {
    if (!this.ws) throw new Error('Not connected to ICP server');
    this.ws.send(JSON.stringify({ type: 'update_cohorts' }));
  }

  // Game state subscription
  onGameStateUpdate(callback: (state: GameState) => void): () => void {
    if (!this.ws) throw new Error('Not connected to ICP server');
    
    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'game_state_update') {
        callback(data.state);
      }
    };

    this.ws.addEventListener('message', handler);
    return () => this.ws?.removeEventListener('message', handler);
  }

  // Cleanup
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const icpService = new ICPService(); 