# Battleship Game

A multiplayer Battleship game implementation using WebSocket for real-time gameplay.

## Features
- Real-time multiplayer gameplay
- Ship placement with rotation (using spacebar)
- Visual feedback for valid/invalid placements
- Hit/miss indicators with animations
- Ship sinking notifications
- Turn-based gameplay
- Automatic win/lose detection

## Ships
- Carrier (5 spaces)
- Battleship (4 spaces)
- Cruiser (3 spaces)
- Submarine (3 spaces)
- Destroyer (2 spaces)

## Setup
1. Clone the repository:
```bash
git clone https://github.com/KKeyes1/battleship.git
cd battleship
```

2. Install dependencies:
```bash
npm install
```

3. Start both servers:
```bash
# In one terminal, start the WebSocket game server
node server.js

# In another terminal, start the HTTP server
node http-server.js
```

4. Access the game:
- On your computer: `http://localhost:3000`
- On other computers in your network: `http://YOUR_IP:3000`
  (Replace YOUR_IP with your computer's local IP address)

## How to Play
1. Click "Join Game" to enter matchmaking
2. Place your ships:
   - Click on your grid to place ships
   - Press SPACEBAR to rotate ships before placement
   - Place all 5 ships to continue
3. Click "Ready" when all ships are placed
4. Take turns firing at your opponent's grid
5. Hits are marked in red (💥), misses in green (×)
6. First player to sink all opponent's ships wins!

## Version Management
The game uses semantic versioning (MAJOR.MINOR.PATCH). Current stable version is v1.0.0.

To return to a specific version:
```bash
# List all versions
git tag

# Return to v1.0.0
git checkout v1.0.0

# Create new branch from v1.0.0
git checkout -b new-feature v1.0.0
```

## Technical Details
- WebSocket server runs on port 8080
- HTTP server runs on port 3000
- Built with Node.js and vanilla JavaScript
- Uses the 'ws' package for WebSocket communication

## Game Rules
- Players must place all ships before the game starts
- Ships cannot overlap or extend beyond the grid
- Players take turns firing one shot at a time
- A hit must be announced ("Ship hit!" notification)
- When a ship is sunk, it must be announced
- Game ends when all ships of one player are sunk 