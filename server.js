const WebSocket = require('ws');
// Listen on all network interfaces
const server = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });

const games = new Map(); // Store game states
let waitingPlayer = null; // Store player waiting for opponent

// Add ship placement validation
function validateShipPlacement(board) {
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

// Check if a ship is sunk
function isShipSunk(board, hits, shipType) {
    const shipLengths = {
        carrier: 5,
        battleship: 4,
        cruiser: 3,
        submarine: 3,
        destroyer: 2
    };

    let hitCount = 0;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === shipType && hits[i][j]) {
                hitCount++;
            }
        }
    }
    return hitCount === shipLengths[shipType];
}

server.on('connection', (socket) => {
    console.log('Player connected');
    
    socket.id = Math.random().toString(36).substring(7);
    console.log('Assigned ID:', socket.id);
    
    // Send the socket ID to the client immediately after connection
    socket.send(JSON.stringify({
        type: 'connection_established',
        socketId: socket.id
    }));
    
    socket.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received message:', data);
        
        switch(data.type) {
            case 'join':
                if (waitingPlayer === null) {
                    waitingPlayer = socket;
                    socket.send(JSON.stringify({
                        type: 'waiting',
                        message: 'Waiting for opponent...',
                        socketId: socket.id
                    }));
                } else {
                    const gameId = Math.random().toString(36).substring(7);
                    const firstPlayer = Math.random() < 0.5 ? waitingPlayer : socket;
                    
                    games.set(gameId, {
                        player1: waitingPlayer,
                        player2: socket,
                        player1Board: null,
                        player2Board: null,
                        player1Hits: Array(10).fill().map(() => Array(10).fill(false)),
                        player2Hits: Array(10).fill().map(() => Array(10).fill(false)),
                        currentTurn: firstPlayer.id,
                        gameId: gameId
                    });
                    
                    waitingPlayer.gameId = gameId;
                    socket.gameId = gameId;
                    
                    waitingPlayer.send(JSON.stringify({
                        type: 'game_start',
                        gameId: gameId,
                        playerNumber: 1,
                        socketId: waitingPlayer.id
                    }));
                    socket.send(JSON.stringify({
                        type: 'game_start',
                        gameId: gameId,
                        playerNumber: 2,
                        socketId: socket.id
                    }));
                    
                    waitingPlayer = null;
                }
                break;
            case 'place_ships':
                const game = games.get(socket.gameId);
                if (!game) return;

                if (game.player1 === socket) {
                    game.player1Board = data.board;
                    game.player1Ready = true;
                } else {
                    game.player2Board = data.board;
                    game.player2Ready = true;
                }

                if (game.player1Ready && game.player2Ready) {
                    const firstPlayer = game.currentTurn === game.player1.id ? 1 : 2;
                    game.player1.send(JSON.stringify({
                        type: 'game_ready',
                        message: 'Both players ready - game starting!',
                        firstPlayer: firstPlayer,
                        currentTurn: game.currentTurn
                    }));
                    game.player2.send(JSON.stringify({
                        type: 'game_ready',
                        message: 'Both players ready - game starting!',
                        firstPlayer: firstPlayer,
                        currentTurn: game.currentTurn
                    }));
                }
                break;
            case 'fire':
                const gameState = games.get(socket.gameId);
                if (!gameState || gameState.currentTurn !== socket.id) return;

                const row = data.position.row;
                const col = data.position.col;
                const targetBoard = gameState.player1 === socket ? gameState.player2Board : gameState.player1Board;
                const hits = gameState.player1 === socket ? gameState.player2Hits : gameState.player1Hits;

                if (hits[row][col]) return; // Already fired at this location

                hits[row][col] = true;
                const isHit = targetBoard[row][col] !== null;
                const shipType = targetBoard[row][col];
                let shipSunk = false;

                if (isHit && shipType) {
                    shipSunk = isShipSunk(targetBoard, hits, shipType);
                }

                // Switch turns
                gameState.currentTurn = gameState.player1.id === socket.id ? gameState.player2.id : gameState.player1.id;

                // Send result to both players
                const result = {
                    type: 'fire_result',
                    position: { row, col },
                    isHit,
                    shipType,
                    shipSunk,
                    nextTurn: gameState.currentTurn
                };

                gameState.player1.send(JSON.stringify(result));
                gameState.player2.send(JSON.stringify(result));

                // Check for game over
                if (isHit) {
                    const allShipsSunk = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer']
                        .every(ship => isShipSunk(targetBoard, hits, ship));
                    
                    if (allShipsSunk) {
                        const gameOver = {
                            type: 'game_over',
                            winner: socket.id
                        };
                        gameState.player1.send(JSON.stringify(gameOver));
                        gameState.player2.send(JSON.stringify(gameOver));
                        games.delete(socket.gameId);
                    }
                }
                break;
        }
    });
    
    socket.on('close', () => {
        // Handle player disconnection
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        if (socket.gameId && games.has(socket.gameId)) {
            const game = games.get(socket.gameId);
            const opponent = game.player1 === socket ? game.player2 : game.player1;
            opponent.send(JSON.stringify({
                type: 'opponent_disconnected',
                message: 'Your opponent has disconnected'
            }));
            games.delete(socket.gameId);
        }
    });
}); 