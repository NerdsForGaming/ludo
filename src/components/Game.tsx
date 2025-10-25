'use client';

import { useState, useEffect } from 'react';
import Lobby from './Lobby';
import GameBoard from './GameBoard';
import { socketManager } from '@/lib/socket';
import { GameState, Player } from '@/lib/types';

interface GameRoom {
  id: string;
  players: Player[];
  gameState: GameState;
  maxPlayers: number;
}

export default function Game() {
  const [currentView, setCurrentView] = useState<'lobby' | 'game'>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  useEffect(() => {
    socketManager.on('room_joined', handleRoomJoined);
    socketManager.on('player_joined', handlePlayerJoined);
    socketManager.on('player_left', handlePlayerLeft);
    socketManager.on('game_started', handleGameStarted);
    socketManager.on('dice_rolled', handleDiceRolled);
    socketManager.on('piece_moved', handlePieceMoved);
    socketManager.on('game_finished', handleGameFinished);
    socketManager.on('game_updated', handleGameUpdated);
    socketManager.on('error', handleError);

    return () => {
      socketManager.off('room_joined', handleRoomJoined);
      socketManager.off('player_joined', handlePlayerJoined);
      socketManager.off('player_left', handlePlayerLeft);
      socketManager.off('game_started', handleGameStarted);
      socketManager.off('dice_rolled', handleDiceRolled);
      socketManager.off('piece_moved', handlePieceMoved);
      socketManager.off('game_finished', handleGameFinished);
      socketManager.off('game_updated', handleGameUpdated);
      socketManager.off('error', handleError);
      socketManager.disconnect();
    };
  }, []);

  const handleRoomJoined = (data: any) => {
    setCurrentRoom({ id: currentRoom?.id || '', players: data.gameState.players, gameState: data.gameState, maxPlayers: 4 });
    setGameState(data.gameState);
    setCurrentPlayerId(data.playerId || '');
    setCurrentView('game');
  };

  const handlePlayerJoined = (data: any) => {
    if (currentRoom) {
      setCurrentRoom(prev => prev ? { ...prev, players: data.gameState.players } : null);
      setGameState(data.gameState);
    }
  };

  const handlePlayerLeft = (data: any) => {
    if (currentRoom) {
      setCurrentRoom(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== data.playerId) } : null);
    }
  };

  const handleGameStarted = (data: any) => {
    setGameState(data.gameState);
  };

  const handleDiceRolled = (data: any) => {
    if (gameState) {
      gameState.diceValue = data.diceValue;
    }
  };

  const handlePieceMoved = (data: any) => {
    if (gameState) {
      // Update piece position in game state
      gameState.players.forEach(player => {
        player.pieces.forEach(piece => {
          if (piece.id === data.pieceId) {
            piece.position = data.newPosition;
          }
        });
      });
      gameState.diceValue = 0;
    }
  };

  const handleGameFinished = (data: any) => {
    if (gameState) {
      gameState.winner = data.winner;
      gameState.status = 'finished';
    }
  };

  const handleGameUpdated = (data: any) => {
    setGameState(data.gameState);
  };

  const handleError = (data: any) => {
    alert(data.message);
  };

  const leaveGame = () => {
    socketManager.disconnect();
    setCurrentView('lobby');
    setCurrentRoom(null);
    setGameState(null);
    setCurrentPlayerId('');
  };

  if (currentView === 'lobby') {
    return <Lobby />;
  }

  if (!gameState || !currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to game...</p>
        </div>
      </div>
    );
  }

  return (
    <GameBoard
      gameState={gameState}
      currentPlayerId={currentPlayerId}
      roomId={currentRoom.id}
    />
  );
}
