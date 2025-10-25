'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { socketManager } from '@/lib/socket';
import { GameState, PlayerColor, Piece } from '@/lib/types';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  roomId: string;
}

const BOARD_SIZE = 15;
const CELL_SIZE = 32;

const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6'
};

const PLAYER_POSITIONS = {
  red: { home: { startX: 0, startY: 0, endX: 5, endY: 5 }, start: { x: 1, y: 6 } },
  green: { home: { startX: 9, startY: 0, endX: 14, endY: 5 }, start: { x: 8, y: 1 } },
  yellow: { home: { startX: 0, startY: 9, endX: 5, endY: 14 }, start: { x: 6, y: 8 } },
  blue: { home: { startX: 9, startY: 9, endX: 14, endY: 14 }, start: { x: 13, y: 13 } }
};

export default function GameBoard({ gameState, currentPlayerId, roomId }: GameBoardProps) {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  useEffect(() => {
    socketManager.on('dice_rolled', handleDiceRolled);
    socketManager.on('piece_moved', handlePieceMoved);
    socketManager.on('game_finished', handleGameFinished);

    return () => {
      socketManager.off('dice_rolled', handleDiceRolled);
      socketManager.off('piece_moved', handlePieceMoved);
      socketManager.off('game_finished', handleGameFinished);
    };
  }, []);

  const handleDiceRolled = (data: any) => {
    // Update game state with dice roll
    gameState.diceValue = data.diceValue;
  };

  const handlePieceMoved = (data: any) => {
    // Update piece position in game state
    gameState.players.forEach(player => {
      player.pieces.forEach(piece => {
        if (piece.id === data.pieceId) {
          piece.position = data.newPosition;
        }
      });
    });
    gameState.diceValue = 0;
  };

  const handleGameFinished = (data: any) => {
    gameState.winner = data.winner;
    gameState.status = 'finished';
  };

  const rollDice = async () => {
    if (gameState.diceValue === 0 && gameState.players[gameState.currentPlayerIndex].id === currentPlayerId) {
      try {
        await socketManager.rollDice(roomId);
      } catch (error) {
        console.error('Failed to roll dice:', error);
      }
    }
  };

  const movePiece = async (piece: Piece) => {
    if (selectedPiece === piece.id) {
      setSelectedPiece(null);
      return;
    }

    if (gameState.diceValue > 0 && gameState.players[gameState.currentPlayerIndex].id === currentPlayerId) {
      // Validate move
      const canMove = validateMove(piece, gameState.diceValue);
      if (canMove) {
        try {
          await socketManager.movePiece(roomId, piece.id, gameState.diceValue);
          setSelectedPiece(null);
        } catch (error) {
          console.error('Failed to move piece:', error);
        }
      }
    }
  };

  const validateMove = (piece: Piece, diceValue: number): boolean => {
    if (piece.position === 'home' || piece.position === 'finish') return false;
    if (piece.position === 'start') return diceValue === 6;

    if (typeof piece.position === 'number') {
      const newPosition = piece.position + diceValue;
      return newPosition <= 56;
    }

    return false;
  };

  const getPiecePosition = (piece: Piece): { x: number; y: number } | null => {
    if (piece.position === 'home') {
      const playerPos = PLAYER_POSITIONS[piece.color];
      // Simple home positioning - distribute pieces in home area
      const homeIndex = gameState.players
        .find(p => p.color === piece.color)?.pieces
        .findIndex(p => p.id === piece.id) || 0;

      return {
        x: playerPos.home.startX + 1 + (homeIndex % 2),
        y: playerPos.home.startY + 1 + Math.floor(homeIndex / 2)
      };
    }

    if (piece.position === 'start') {
      const playerPos = PLAYER_POSITIONS[piece.color];
      return { x: playerPos.start.x, y: playerPos.start.y };
    }

    if (piece.position === 'finish') {
      // Finish area positioning
      const finishPositions = {
        red: { x: 7, y: 1 },
        green: { x: 13, y: 7 },
        yellow: { x: 7, y: 13 },
        blue: { x: 1, y: 7 }
      };
      return finishPositions[piece.color];
    }

    if (typeof piece.position === 'number') {
      // Path positioning - simplified for now
      const pathPositions = getPathPositions();
      const pathIndex = piece.position - 1;

      if (pathIndex < pathPositions.length) {
        const cellId = pathPositions[pathIndex];
        const row = Math.floor(cellId / BOARD_SIZE);
        const col = cellId % BOARD_SIZE;
        return { x: col, y: row };
      }
    }

    return null;
  };

  const getPathPositions = (): number[] => {
    const path: number[] = [];

    // Simplified path - clockwise
    for (let i = 6; i <= 8; i++) path.push(i); // Bottom
    for (let i = 15; i <= 21; i += 6) path.push(i); // Right
    for (let i = 48; i >= 42; i--) path.push(i); // Top
    for (let i = 27; i >= 21; i -= 6) path.push(i); // Left

    return path;
  };

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentPlayerTurn = currentPlayer?.isActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Game Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Ludo Game</h1>
              <p className="text-gray-600">Room: {roomId.slice(0, 8)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {gameState.players.map((player) => (
                <Badge
                  key={player.id}
                  variant={player.isActive ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PLAYER_COLORS[player.color] }}
                  />
                  {player.name} {player.isActive && '(Your turn)'}
                </Badge>
              ))}
            </div>
          </div>

          {gameState.winner && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-center font-semibold text-yellow-800">
                🎉 {gameState.players.find(p => p.color === gameState.winner)?.name} wins!
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="relative bg-green-800 p-4 rounded-lg shadow-inner">
                  {/* Board Grid */}
                  <div
                    className="grid gap-1 relative"
                    style={{
                      gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
                      gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`
                    }}
                  >
                    {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
                      const row = Math.floor(index / BOARD_SIZE);
                      const col = index % BOARD_SIZE;
                      const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;
                      const isHomeArea = (
                        (row <= 5 && col <= 5) || // Red home
                        (row <= 5 && col >= 9) || // Green home
                        (row >= 9 && col <= 5) || // Yellow home
                        (row >= 9 && col >= 9)    // Blue home
                      );

                      return (
                        <div
                          key={index}
                          className={`border border-green-700 ludo-board-cell ${
                            isCenter ? 'bg-green-900' : 'bg-green-600'
                          } ${isHomeArea ? 'bg-yellow-200' : ''}`}
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        />
                      );
                    })}

                    {/* Render Pieces */}
                    {gameState.players.flatMap(player =>
                      player.pieces.map(piece => {
                        const position = getPiecePosition(piece);
                        if (!position) return null;

                        return (
                          <div
                            key={piece.id}
                            className={`absolute rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-all hover:scale-110 mobile-touch-target ludo-piece ${
                              selectedPiece === piece.id ? 'ring-4 ring-yellow-400 selected' : ''
                            }`}
                            style={{
                              width: CELL_SIZE - 8,
                              height: CELL_SIZE - 8,
                              backgroundColor: PLAYER_COLORS[piece.color],
                              left: position.x * (CELL_SIZE + 4) + 16,
                              top: position.y * (CELL_SIZE + 4) + 16,
                              zIndex: 10
                            }}
                            onClick={() => movePiece(piece)}
                          >
                            <div className="w-full h-full rounded-full bg-white opacity-20" />
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Center area labels */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white font-bold text-lg">LUDO</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Controls */}
          <div className="space-y-4">
            {/* Dice */}
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold mb-2">Dice</h3>
                <div className="text-4xl font-bold mb-2">
                  {gameState.diceValue || '?'}
                </div>
                <Button
                  onClick={rollDice}
                  disabled={!isCurrentPlayerTurn || gameState.diceValue > 0}
                  className="w-full"
                >
                  {gameState.diceValue > 0 ? 'Dice Rolled' : 'Roll Dice'}
                </Button>
              </CardContent>
            </Card>

            {/* Players */}
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Players</h3>
                <div className="space-y-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded ${
                        player.isActive ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: PLAYER_COLORS[player.color] }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-xs text-gray-500">
                          {player.pieces.filter(p => p.position === 'finish').length}/4 finished
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            <Card className="shadow-lg">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold mb-2">Game Status</h3>
                <div className="text-sm text-gray-600">
                  {gameState.status === 'waiting' && 'Waiting for players...'}
                  {gameState.status === 'playing' && 'Game in progress'}
                  {gameState.status === 'finished' && 'Game finished!'}
                </div>
                {gameState.status === 'waiting' && gameState.players.length >= 2 && (
                  <Button
                    onClick={() => socketManager.startGame(roomId)}
                    className="w-full mt-2"
                  >
                    Start Game
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
