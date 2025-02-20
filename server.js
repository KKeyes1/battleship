const WebSocket = require('ws');
// Listen on all network interfaces
const server = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });

const games = new Map(); // Store game states
let waitingPlayer = null; // Store player waiting for opponent

// Add ship placement validation
function validateShipPlacement(board) {
    // Simple validation - just check if all ships are placed
    const shipCounts = {
        carrier: 0,
        battleship: 0,
        cruiser: 0,
        submarine: 0,
        destroyer: 0
    };
    
    for (let row of board) {
        for (let cell of row) {
            if (cell) shipCounts[cell]++;
        }
    }
    
    return shipCounts.carrier === 5 &&
           shipCounts.battleship === 4 &&
           shipCounts.cruiser === 3 &&
           shipCounts.submarine === 3 &&
           shipCounts.destroyer === 2;
}

server.on('connection', (socket) => {
    console.log('Player connected');
    
    // Assign a unique ID to each socket
    socket.id = Math.random().toString(36).substring(7);
    console.log('Assigned ID:', socket.id);
    
    socket.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received message:', data);
        
        switch(data.type) {
            case 'join':
                if (waitingPlayer === null) {
                    // First player joins
                    waitingPlayer = socket;
                    socket.send(JSON.stringify({
                        type: 'waiting',
                        message: 'Waiting for opponent...'
                    }));
                } else {
                    // Second player joins - create a game
                    const gameId = Math.random().toString(36).substring(7);
                    games.set(gameId, {
                        player1: waitingPlayer,
                        player2: socket,
                        currentTurn: waitingPlayer.id
                    });
                    
                    // Notify both players
                    waitingPlayer.send(JSON.stringify({
                        type: 'game_start',
                        gameId: gameId,
                        playerNumber: 1
                    }));
                    socket.send(JSON.stringify({
                        type: 'game_start',
                        gameId: gameId,
                        playerNumber: 2
                    }));
                    
                    waitingPlayer = null;
                }
                break;
            case 'place_ships':
                if (validateShipPlacement(data.board)) {
                    // Find the game this player is in
                    for (let [gameId, game] of games) {
                        if (game.player1 === socket || game.player2 === socket) {
                            const playerNum = game.player1 === socket ? 1 : 2;
                            game[`player${playerNum}Board`] = data.board;
                            game[`player${playerNum}Ready`] = true;
                            
                            // Check if both players are ready
                            if (game.player1Ready && game.player2Ready) {
                                game.player1.send(JSON.stringify({
                                    type: 'game_ready',
                                    message: 'Both players ready - game starting!'
                                }));
                                game.player2.send(JSON.stringify({
                                    type: 'game_ready',
                                    message: 'Both players ready - game starting!'
                                }));
                            }
                            break;
                        }
                    }
                }
                break;
            case 'fire':
                // Handle torpedo firing
                break;
        }
    });
    
    socket.on('close', () => {
        // Handle player disconnection
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        // Notify opponent if in game
        games.forEach((game, gameId) => {
            if (game.player1 === socket || game.player2 === socket) {
                const opponent = game.player1 === socket ? game.player2 : game.player1;
                opponent.send(JSON.stringify({
                    type: 'opponent_disconnected',
                    message: 'Your opponent has disconnected'
                }));
                games.delete(gameId);
            }
        });
    });
}); 