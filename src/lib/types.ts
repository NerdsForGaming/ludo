export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type PiecePosition = 'home' | 'start' | 'path' | 'finish' | number;

export interface Piece {
  id: string;
  color: PlayerColor;
  position: PiecePosition;
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  pieces: Piece[];
  isActive: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number;
  isRolling: boolean;
  winner: PlayerColor | null;
  status: 'waiting' | 'playing' | 'finished';
  board: BoardPosition[];
}

export interface BoardPosition {
  id: number;
  x: number;
  y: number;
  type: 'start' | 'path' | 'finish' | 'home' | 'center';
  color?: PlayerColor;
  pieces: Piece[];
}

export interface DiceRoll {
  value: number;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  players: Player[];
  gameState: GameState;
  maxPlayers: number;
  createdAt: number;
}

export interface SocketEvents {
  // Client to Server
  JOIN_ROOM: 'join_room';
  LEAVE_ROOM: 'leave_room';
  ROLL_DICE: 'roll_dice';
  MOVE_PIECE: 'move_piece';
  START_GAME: 'start_game';

  // Server to Client
  ROOM_JOINED: 'room_joined';
  ROOM_LEFT: 'room_left';
  GAME_UPDATED: 'game_updated';
  PLAYER_JOINED: 'player_joined';
  PLAYER_LEFT: 'player_left';
  GAME_STARTED: 'game_started';
  DICE_ROLLED: 'dice_rolled';
  PIECE_MOVED: 'piece_moved';
  GAME_FINISHED: 'game_finished';
  ERROR: 'error';
}
