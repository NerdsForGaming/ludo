import { NextRequest, NextResponse } from 'next/server';
import { GameState, Player, PlayerColor } from '@/lib/types';
import { LudoGame } from '@/lib/ludo-logic';

// In-memory game state storage (for demo purposes)
// In production, use a database like Redis or PostgreSQL
const gameRooms = new Map<string, {
  gameState: GameState;
  players: Player[];
  lastUpdated: number;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;

  if (!gameRooms.has(roomId)) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const room = gameRooms.get(roomId)!;
  return NextResponse.json(room.gameState);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const body = await request.json();
  const { action, playerName, playerColor, pieceId, diceValue } = body;

  // Initialize room if it doesn't exist
  if (!gameRooms.has(roomId)) {
    const initialGameState = LudoGame.createInitialGameState(roomId);
    gameRooms.set(roomId, {
      gameState: initialGameState,
      players: [],
      lastUpdated: Date.now()
    });
  }

  const room = gameRooms.get(roomId)!;

  try {
    switch (action) {
      case 'join':
        return handleJoinRoom(room, playerName, playerColor as PlayerColor);

      case 'start':
        return handleStartGame(room);

      case 'roll_dice':
        return handleRollDice(room);

      case 'move_piece':
        return handleMovePiece(room, pieceId, diceValue);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Game API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function handleJoinRoom(room: any, playerName: string, playerColor: PlayerColor) {
  // Check if color is already taken
  const colorTaken = room.players.some((player: Player) => player.color === playerColor);
  if (colorTaken) {
    return NextResponse.json({ error: 'Color already taken' }, { status: 400 });
  }

  // Check if room is full
  if (room.players.length >= 4) {
    return NextResponse.json({ error: 'Room is full' }, { status: 400 });
  }

  // Create player
  const player = LudoGame.createPlayer(`player-${Date.now()}`, playerName, playerColor);

  room.players.push(player);

  // Update game state
  room.gameState.players = room.players;
  room.lastUpdated = Date.now();

  return NextResponse.json({
    success: true,
    gameState: room.gameState,
    playerId: player.id
  });
}

function handleStartGame(room: any) {
  if (room.players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 });
  }

  room.gameState.status = 'playing';
  room.gameState.currentPlayerIndex = 0;
  room.gameState.players[0].isActive = true;
  room.lastUpdated = Date.now();

  return NextResponse.json({ success: true, gameState: room.gameState });
}

function handleRollDice(room: any) {
  if (room.gameState.status !== 'playing') {
    return NextResponse.json({ error: 'Game not started' }, { status: 400 });
  }

  const diceValue = LudoGame.rollDice();
  room.gameState.diceValue = diceValue;
  room.lastUpdated = Date.now();

  return NextResponse.json({
    success: true,
    diceValue,
    gameState: room.gameState
  });
}

function handleMovePiece(room: any, pieceId: string, diceValue: number) {
  if (room.gameState.status !== 'playing') {
    return NextResponse.json({ error: 'Game not started' }, { status: 400 });
  }

  // Find the piece
  let movedPiece = null;
  for (const player of room.gameState.players) {
    const piece = player.pieces.find((p: any) => p.id === pieceId);
    if (piece) {
      movedPiece = piece;
      break;
    }
  }

  if (!movedPiece) {
    return NextResponse.json({ error: 'Piece not found' }, { status: 404 });
  }

  // Validate move
  if (!LudoGame.canMovePiece(movedPiece, diceValue)) {
    return NextResponse.json({ error: 'Invalid move' }, { status: 400 });
  }

  // Move piece
  const originalPosition = movedPiece.position;
  const updatedPiece = LudoGame.movePiece(movedPiece, diceValue);
  movedPiece.position = updatedPiece.position;

  // Check for captures - simplified for API version
  // Find pieces at the same position and capture them
  for (const player of room.gameState.players) {
    if (player.color !== movedPiece.color) {
      for (const piece of player.pieces) {
        if (piece.position === movedPiece.position && piece.position !== 'home' && piece.position !== 'start') {
          piece.position = 'home'; // Send captured piece back home
          break;
        }
      }
    }
  }

  // Move to next player
  room.gameState.currentPlayerIndex = LudoGame.getNextPlayer(room.gameState.currentPlayerIndex, room.gameState.players);
  room.gameState.diceValue = 0;

  // Update active player
  room.gameState.players.forEach((player: Player) => player.isActive = false);
  room.gameState.players[room.gameState.currentPlayerIndex].isActive = true;

  // Check for winner
  const winner = LudoGame.checkWinner(room.gameState.players);
  if (winner) {
    room.gameState.winner = winner;
    room.gameState.status = 'finished';
  }

  room.lastUpdated = Date.now();

  return NextResponse.json({
    success: true,
    newPosition: movedPiece.position,
    originalPosition,
    gameState: room.gameState
  });
}
