# Battleship Game

A multiplayer Battleship game implementation using WebSocket for real-time gameplay.

## Features
- Real-time multiplayer gameplay
- Ship placement validation
- Game state management
- Player matchmaking

## Setup
1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

The server will start on port 8080.

## Game Rules
- Players take turns placing their ships on their board
- Once both players have placed their ships, the game begins
- Players alternate turns firing at opponent's grid
- First player to sink all opponent's ships wins

## How to Play
1. Click "Join Game" to enter matchmaking
2. Place your ships:
   - Hover over your grid to see ship placement preview
   - Press SPACEBAR to rotate ships
   - Click to place ships
3. Once all ships are placed, click "Ready"
4. Take turns firing at your opponent's grid

## Technologies Used
- WebSocket (ws)
- HTML5
- CSS3
- JavaScript 