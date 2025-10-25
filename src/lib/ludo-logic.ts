import { PlayerColor, Piece, GameState, BoardPosition, Player } from './types';

export class LudoGame {
  private static readonly BOARD_SIZE = 15;
  private static readonly PIECES_PER_PLAYER = 4;
  private static readonly FINISH_PATH_LENGTH = 6;
  private static readonly HOME_POSITIONS = 4;

  // Ludo board layout - standard cross shape
  static createBoard(): BoardPosition[] {
    const board: BoardPosition[] = [];
    const center = Math.floor(this.BOARD_SIZE / 2);

    // Initialize empty board
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        board.push({
          id: i * this.BOARD_SIZE + j,
          x: j,
          y: i,
          type: 'path',
          pieces: []
        });
      }
    }

    // Mark center area as center
    for (let i = center - 1; i <= center + 1; i++) {
      for (let j = center - 1; j <= center + 1; j++) {
        const index = i * this.BOARD_SIZE + j;
        if (board[index]) {
          board[index].type = 'center';
        }
      }
    }

    // Set up home areas and starting positions
    this.setupHomeAreas(board);
    this.setupStartPositions(board);

    return board;
  }

  private static setupHomeAreas(board: BoardPosition[]): void {
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const homePositions = [
      { startX: 0, startY: 0, endX: 5, endY: 5 },      // Red home (top-left)
      { startX: 9, startY: 0, endX: 14, endY: 5 },     // Green home (top-right)
      { startX: 0, startY: 9, endX: 5, endY: 14 },     // Yellow home (bottom-left)
      { startX: 9, startY: 9, endX: 14, endY: 14 }     // Blue home (bottom-right)
    ];

    colors.forEach((color, index) => {
      const pos = homePositions[index];
      for (let i = pos.startY; i <= pos.endY; i++) {
        for (let j = pos.startX; j <= pos.endX; j++) {
          const boardIndex = i * this.BOARD_SIZE + j;
          if (board[boardIndex] && i >= pos.startY + 1 && i <= pos.endY - 1 &&
              j >= pos.startX + 1 && j <= pos.endX - 1) {
            board[boardIndex].type = 'home';
            board[boardIndex].color = color;
          }
        }
      }
    });
  }

  private static setupStartPositions(board: BoardPosition[]): void {
    // Starting positions for each player
    const startPositions = [
      { x: 1, y: 6, color: 'red' as PlayerColor },      // Red start
      { x: 8, y: 1, color: 'green' as PlayerColor },     // Green start
      { x: 6, y: 8, color: 'yellow' as PlayerColor },    // Yellow start
      { x: 13, y: 13, color: 'blue' as PlayerColor }     // Blue start
    ];

    startPositions.forEach((pos) => {
      const index = pos.y * this.BOARD_SIZE + pos.x;
      if (board[index]) {
        board[index].type = 'start';
        board[index].color = pos.color;
      }
    });
  }

  static createInitialGameState(roomId: string): GameState {
    const board = this.createBoard();
    const players: Player[] = [];

    return {
      id: roomId,
      players,
      currentPlayerIndex: 0,
      diceValue: 0,
      isRolling: false,
      winner: null,
      status: 'waiting',
      board
    };
  }

  static rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  static canMovePiece(piece: Piece, diceValue: number, gameState: GameState): boolean {
    if (piece.position === 'home') return false;
    if (piece.position === 'finish') return false;

    // If piece is at start, needs 6 to move out
    if (piece.position === 'start') {
      return diceValue === 6;
    }

    // Check if piece can reach finish
    if (typeof piece.position === 'number') {
      const newPosition = piece.position + diceValue;
      return newPosition <= 56; // Total path length
    }

    return false;
  }

  static movePiece(piece: Piece, diceValue: number, gameState: GameState): Piece {
    const newPiece = { ...piece };

    if (piece.position === 'start' && diceValue === 6) {
      // Move from start to first path position
      newPiece.position = 1;
    } else if (typeof piece.position === 'number') {
      const newPosition = piece.position + diceValue;

      // Check if reached finish
      if (newPosition >= 56) {
        newPiece.position = 'finish';
      } else {
        newPiece.position = newPosition;
      }
    }

    return newPiece;
  }

  static getNextPlayer(currentIndex: number, players: Player[]): number {
    return (currentIndex + 1) % players.length;
  }

  static checkWinner(players: Player[]): PlayerColor | null {
    for (const player of players) {
      const finishedPieces = player.pieces.filter(piece => piece.position === 'finish').length;
      if (finishedPieces === this.PIECES_PER_PLAYER) {
        return player.color;
      }
    }
    return null;
  }

  static createPiece(playerId: string, color: PlayerColor, pieceIndex: number): Piece {
    return {
      id: `${playerId}-${color}-${pieceIndex}`,
      color,
      position: 'home',
      playerId
    };
  }

  static createPlayer(id: string, name: string, color: PlayerColor): Player {
    const pieces: Piece[] = [];
    for (let i = 0; i < this.PIECES_PER_PLAYER; i++) {
      pieces.push(this.createPiece(id, color, i));
    }

    return {
      id,
      name,
      color,
      pieces,
      isActive: false
    };
  }

  static getPathPositions(): number[] {
    // Standard Ludo path - clockwise from each player's starting position
    const path: number[] = [];

    // Bottom row (yellow to green)
    for (let i = 6; i <= 8; i++) path.push(i);
    // Right column (green to blue)
    for (let i = 15; i <= 21; i += 6) path.push(i);
    // Top row (blue to red)
    for (let i = 48; i >= 42; i--) path.push(i);
    // Left column (red to yellow)
    for (let i = 27; i >= 21; i -= 6) path.push(i);

    // Continue the path
    for (let i = 28; i <= 34; i++) path.push(i);
    for (let i = 39; i <= 45; i += 6) path.push(i);
    for (let i = 40; i >= 34; i--) path.push(i);
    for (let i = 15; i >= 9; i -= 6) path.push(i);

    return path;
  }
}
