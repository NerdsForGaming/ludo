import { GameState, Player, Piece } from './types';

class GameClient {
  private listeners: Map<string, Function[]> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private currentRoomId: string | null = null;
  private lastUpdate: number = 0;

  // Event subscription
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // API-based methods
  async joinRoom(roomId: string, playerName: string, playerColor: string): Promise<void> {
    try {
      const response = await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
          playerName,
          playerColor
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join room');
      }

      const data = await response.json();
      this.currentRoomId = roomId;
      this.lastUpdate = Date.now();

      // Start polling for updates
      this.startPolling();

      this.emit('room_joined', data);
    } catch (error) {
      console.error('Join room error:', error);
      this.emit('error', { message: error instanceof Error ? error.message : 'Failed to join room' });
    }
  }

  async startGame(roomId: string): Promise<void> {
    try {
      const response = await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start game');
      }

      const data = await response.json();
      this.emit('game_started', data);
    } catch (error) {
      console.error('Start game error:', error);
      this.emit('error', { message: error instanceof Error ? error.message : 'Failed to start game' });
    }
  }

  async rollDice(roomId: string): Promise<void> {
    try {
      const response = await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'roll_dice'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to roll dice');
      }

      const data = await response.json();
      this.emit('dice_rolled', data);
    } catch (error) {
      console.error('Roll dice error:', error);
      this.emit('error', { message: error instanceof Error ? error.message : 'Failed to roll dice' });
    }
  }

  async movePiece(roomId: string, pieceId: string, diceValue: number): Promise<void> {
    try {
      const response = await fetch(`/api/game/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'move_piece',
          pieceId,
          diceValue
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move piece');
      }

      const data = await response.json();
      this.emit('piece_moved', data);
    } catch (error) {
      console.error('Move piece error:', error);
      this.emit('error', { message: error instanceof Error ? error.message : 'Failed to move piece' });
    }
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      if (!this.currentRoomId) return;

      try {
        const response = await fetch(`/api/game/${this.currentRoomId}`);
        if (response.ok) {
          const gameState: GameState = await response.json();

          // Only emit if there are actual changes
          if (gameState && this.hasGameStateChanged(gameState)) {
            this.emit('game_updated', { gameState });
            this.lastUpdate = Date.now();
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000); // Poll every second
  }

  private hasGameStateChanged(newGameState: GameState): boolean {
    // Simple change detection - in production, use a proper diffing mechanism
    return true; // For now, always consider it changed to ensure updates
  }

  disconnect(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.currentRoomId = null;
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.currentRoomId !== null;
  }
}

export const socketManager = new GameClient();
