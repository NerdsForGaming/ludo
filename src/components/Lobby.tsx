'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { socketManager } from '@/lib/socket';
import { GameState, PlayerColor } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface Room {
  id: string;
  players: Array<{
    id: string;
    name: string;
    color: PlayerColor;
  }>;
  maxPlayers: number;
  gameState?: GameState;
}

const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export default function Lobby() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [roomId, setRoomId] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  useEffect(() => {
    // No explicit connection needed for API-based client

    return () => {
      socketManager.disconnect();
    };
  }, []);

  const createRoom = async () => {
    if (!playerName.trim()) return;

    const newRoomId = uuidv4();
    setRoomId(newRoomId);

    try {
      await socketManager.joinRoom(newRoomId, playerName, selectedColor);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) return;

    try {
      await socketManager.joinRoom(roomId, playerName, selectedColor);
      setIsJoinDialogOpen(false);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const startGame = async (roomId: string) => {
    try {
      await socketManager.startGame(roomId);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Ludo Multiplayer</h1>
          <p className="text-gray-600">Play Ludo with friends online!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Create New Game
              </CardTitle>
              <CardDescription>
                Start a new Ludo game and invite your friends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Game</DialogTitle>
                    <DialogDescription>
                      Set up your game and choose your color
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Your Name</label>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Choose Color</label>
                      <div className="flex gap-2 mt-1">
                        {PLAYER_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <Button onClick={createRoom} className="w-full bg-green-600 hover:bg-green-700">
                      Create Game
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Join Existing Game
              </CardTitle>
              <CardDescription>
                Join a game using room ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Join Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Game</DialogTitle>
                    <DialogDescription>
                      Enter room ID and join the game
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Your Name</label>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Room ID</label>
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        placeholder="Enter room ID"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Choose Color</label>
                      <div className="flex gap-2 mt-1">
                        {PLAYER_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <Button onClick={joinRoom} className="w-full bg-blue-600 hover:bg-blue-700">
                      Join Game
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Active Rooms */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No active games. Create one to get started!</p>
                </CardContent>
              </Card>
            ) : (
              rooms.map((room) => (
                <Card key={room.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Room {room.id.slice(0, 8)}
                      <Badge variant={room.gameState?.status === 'playing' ? 'default' : 'secondary'}>
                        {room.gameState?.status || 'waiting'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {room.players.length}/{room.maxPlayers} players
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {room.players.map((player) => (
                        <div key={player.id} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-sm">{player.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => joinRoom()}
                      >
                        Join
                      </Button>
                      {room.gameState?.status === 'waiting' && room.players.length >= 2 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startGame(room.id)}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
