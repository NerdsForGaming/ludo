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

  const handleRoomJoined = (data: unknown) => {
    const typedData = data as { gameState: GameState; playerId?: string };
    setCurrentRoom({ id: currentRoom?.id || '', players: typedData.gameState.players, gameState: typedData.gameState, maxPlayers: 4 });
    setGameState(typedData.gameState);
    setCurrentPlayerId(typedData.playerId || '');
    setCurrentView('game');
  };

  const handlePlayerJoined = (data: unknown) => {
    const typedData = data as { gameState: GameState };
    if (currentRoom) {
      setCurrentRoom(prev => prev ? { ...prev, players: typedData.gameState.players } : null);
      setGameState(typedData.gameState);
    }
  };

  const handlePlayerLeft = (data: unknown) => {
    const typedData = data as { playerId: string };
    if (currentRoom) {
      setCurrentRoom(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== typedData.playerId) } : null);
    }
  };

  const handleGameStarted = (data: unknown) => {
    const typedData = data as { gameState: GameState };
    setGameState(typedData.gameState);
  };

  const handleDiceRolled = (data: unknown) => {
    const typedData = data as { diceValue: number };
    setGameState(prev => prev ? { ...prev, diceValue: typedData.diceValue } : null);
  };

  const handlePieceMoved = (data: unknown) => {
    const typedData = data as { pieceId: string; newPosition: any };
    setGameState(prev => {
      if (!prev) return null;
      const newState = { ...prev };
      newState.players = newState.players.map(player => ({
        ...player,
        pieces: player.pieces.map(piece =>
          piece.id === typedData.pieceId
            ? { ...piece, position: typedData.newPosition }
            : piece
        )
      }));
      newState.diceValue = 0;
      return newState;
    });
  };

  const handleGameFinished = (data: unknown) => {
    const typedData = data as { winner: string };
    setGameState(prev => prev ? { ...prev, winner: typedData.winner as any, status: 'finished' as any } : null);
  };

  const handleGameUpdated = (data: unknown) => {
    const typedData = data as { gameState: GameState };
    setGameState(typedData.gameState);
  };

  const handleError = (data: unknown) => {
    const typedData = data as { message: string };
    alert(typedData.message);
  };

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
