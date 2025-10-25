# Ludo Multiplayer Game

A sleek, modern multiplayer Ludo game built with Next.js, Socket.io, and Shadcn UI components.

## Features

- 🎮 **Real-time Multiplayer**: Play with up to 4 players simultaneously
- 📱 **Mobile Responsive**: Optimized for both desktop and mobile devices
- 🎨 **Modern UI**: Clean, professional design with Shadcn UI components
- ⚡ **Real-time Updates**: Live game state synchronization
- 🎯 **Touch Friendly**: Large touch targets for mobile play
- 🏠 **Room System**: Create private rooms and invite friends

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Shadcn UI, Tailwind CSS
- **Backend**: Socket.io for real-time communication
- **Styling**: CSS-in-JS with Tailwind CSS

## Getting Started

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

### Deployment to Vercel

1. **Push to GitHub** (optional, but recommended)

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI (if not already installed)
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

3. **Environment Variables** (if needed):
   Add any environment variables in the Vercel dashboard under Project Settings > Environment Variables.

## How to Play

1. **Create or Join a Room**:
   - Click "Create New Game" to start a new room
   - Click "Join Existing Game" and enter a room ID to join friends

2. **Choose Your Color**:
   - Select your preferred color (Red, Green, Yellow, Blue)

3. **Wait for Players**:
   - Minimum 2 players required to start
   - Maximum 4 players per game

4. **Game Rules**:
   - Roll dice to move your pieces
   - Get a 6 to move a piece out of home
   - First to get all 4 pieces to the finish wins!
   - Landing on another player's piece sends it back home

## Game Controls

- **Roll Dice**: Click the dice button on your turn
- **Move Pieces**: Click on a piece after rolling to move it
- **Touch Support**: All controls work on mobile devices

## Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── Game.tsx           # Main game component
│   ├── Lobby.tsx          # Room lobby
│   └── GameBoard.tsx      # Game board UI
├── lib/                   # Utility functions
│   ├── types.ts           # TypeScript types
│   ├── ludo-logic.ts      # Game logic
│   └── socket.ts          # Socket.io client
└── styles/                # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

If you encounter any issues or have questions, please create an issue on GitHub.

---

Built with ❤️ using Next.js, Socket.io, and Shadcn UI