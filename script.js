class CatGame {
    constructor() {
        this.gridSize = 11;
        this.board = [];
        this.catPosition = { x: 5, y: 5 };
        this.moves = 0;
        this.gameOver = false;
        this.currentLevel = 1;
        this.maxLevel = 10;
        this.stats = this.loadStats();
        this.sounds = this.initializeSounds();
        this.initializeBoard();
        this.setupEventListeners();
        this.updateStatsDisplay();
    }

    loadStats() {
        const defaultStats = {
            bestScore: Infinity,
            gamesPlayed: 0,
            gamesWon: 0,
            levelsCompleted: 0,
            totalMoves: 0,
            achievements: []
        };
        const savedStats = localStorage.getItem('catGameStats');
        return savedStats ? JSON.parse(savedStats) : defaultStats;
    }

    saveStats() {
        localStorage.setItem('catGameStats', JSON.stringify(this.stats));
    }

    initializeSounds() {
        return {
            move: document.getElementById('move-sound'),
            block: document.getElementById('block-sound'),
            win: document.getElementById('win-sound'),
            lose: document.getElementById('lose-sound'),
            special: document.getElementById('special-sound')
        };
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {}); // Ignore autoplay restrictions
        }
    }

    getLevelConfig() {
        return {
            initialBlocks: Math.min(5 + this.currentLevel, 15), // More blocks as level increases
            catSpeed: Math.max(300 - (this.currentLevel * 20), 100), // Faster cat as level increases
            requiredMoves: Math.max(20 - this.currentLevel, 5), // Fewer moves allowed as level increases
            specialCells: this.currentLevel > 5 ? Math.floor(this.currentLevel / 2) : 0 // Special cells in higher levels
        };
    }

    initializeBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        this.board = [];
        const config = this.getLevelConfig();

        // Create initial board layout
        for (let y = 0; y < this.gridSize; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Add initial blocked cells based on level
                if (this.isInitialBlockedCell(x, y, config)) {
                    cell.classList.add('blocked');
                    this.board[y][x] = 1;
                } else {
                    this.board[y][x] = 0;
                }

                // Add special cells in higher levels
                if (config.specialCells > 0 && this.isSpecialCell(x, y)) {
                    cell.classList.add('special');
                    this.board[y][x] = 3; // 3 represents special cell
                }

                gameBoard.appendChild(cell);
            }
        }

        // Place cat in the center
        this.updateCatPosition(this.catPosition.x, this.catPosition.y);
        this.updateLevelDisplay();
    }

    isInitialBlockedCell(x, y, config) {
        const center = Math.floor(this.gridSize / 2);
        const distance = Math.abs(x - center) + Math.abs(y - center);
        
        // Create a more challenging pattern based on level
        if (distance === center + 1) {
            return Math.random() < (0.5 + (this.currentLevel * 0.02)); // More blocks as level increases
        }
        
        if (distance > center + 2) {
            return Math.random() < (0.2 + (this.currentLevel * 0.01));
        }
        
        return false;
    }

    isSpecialCell(x, y) {
        // Place special cells in strategic positions
        const center = Math.floor(this.gridSize / 2);
        const distance = Math.abs(x - center) + Math.abs(y - center);
        return distance === center && Math.random() < 0.3;
    }

    setupEventListeners() {
        const gameBoard = document.getElementById('game-board');
        
        // Use mousedown instead of click for more responsive interaction
        gameBoard.addEventListener('mousedown', (e) => {
            if (!e.target.classList.contains('cell') || this.gameOver) return;
            
            const x = parseInt(e.target.dataset.x);
            const y = parseInt(e.target.dataset.y);
            
            if (this.board[y][x] === 0) {
                e.preventDefault(); // Prevent text selection
                this.makeMove(x, y);
            } else if (this.board[y][x] === 3) {
                e.preventDefault();
                this.activateSpecialCell(x, y);
            }
        });

        // Prevent context menu on right click
        gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.getElementById('new-game-btn').addEventListener('click', () => this.resetGame());
        
        // Update play again button logic
        document.getElementById('play-again-btn').addEventListener('click', () => {
            const message = document.getElementById('game-message');
            message.classList.remove('active');
            
            // Only proceed to next level if the current game was won
            if (this.gameOver && this.lastGameWon) {
                this.nextLevel();
            } else {
                this.resetGame();
            }
        });

        document.getElementById('level-select').addEventListener('change', (e) => {
            this.currentLevel = parseInt(e.target.value);
            this.resetGame();
        });
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').classList.add('active');
        });
        document.getElementById('close-help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').classList.remove('active');
        });
    }

    activateSpecialCell(x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        cell.classList.add('special-active');
        this.playSound('special');
        
        // Special cell effects
        const effects = [
            () => this.removeRandomBlock(), // Remove a random block
            () => this.freezeCat(2), // Freeze cat for 2 moves
            () => this.addExtraMove(), // Add an extra move
            () => this.clearAdjacentCells(x, y) // Clear adjacent cells
        ];
        
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        randomEffect();
    }

    removeRandomBlock() {
        const blockedCells = Array.from(document.querySelectorAll('.cell.blocked:not(.special)'));
        if (blockedCells.length > 0) {
            const randomCell = blockedCells[Math.floor(Math.random() * blockedCells.length)];
            const x = parseInt(randomCell.dataset.x);
            const y = parseInt(randomCell.dataset.y);
            this.board[y][x] = 0;
            randomCell.classList.remove('blocked');
            this.playSound('special');
        }
    }

    freezeCat(moves) {
        this.catFrozen = moves;
        const catCell = document.querySelector('.cell.cat');
        catCell.classList.add('frozen');
        setTimeout(() => {
            catCell.classList.remove('frozen');
            this.catFrozen = 0;
        }, moves * this.getLevelConfig().catSpeed);
    }

    addExtraMove() {
        this.moves = Math.max(0, this.moves - 1);
        this.updateStatsDisplay();
    }

    clearAdjacentCells(x, y) {
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];
        
        directions.forEach(dir => {
            const newX = x + dir.x;
            const newY = y + dir.y;
            if (this.isValidPosition(newX, newY) && this.board[newY][newX] === 1) {
                this.board[newY][newX] = 0;
                const cell = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
                cell.classList.remove('blocked');
            }
        });
    }

    async makeMove(x, y) {
        if (this.catFrozen > 0) {
            this.catFrozen--;
            return;
        }

        this.board[y][x] = 1;
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        cell.classList.add('blocked');
        this.playSound('block');
        this.moves++;
        this.updateStatsDisplay();

        // Move cat with animation
        await this.moveCat();
        
        // Check game state
        this.checkGameState();
    }

    async moveCat() {
        const possibleMoves = this.findPossibleMoves();
        if (possibleMoves.length === 0) {
            // Double check if the cat is actually trapped
            if (this.isCatTrapped()) {
                this.endGame('You won! The cat is trapped!', true);
            } else {
                // If not trapped, find an escape route
                const escapeMove = this.findEscapeRoute();
                if (escapeMove) {
                    await this.animateCatMove(escapeMove.x, escapeMove.y);
                }
            }
            return;
        }

        const bestMove = this.findBestMove(possibleMoves);
        await this.animateCatMove(bestMove.x, bestMove.y);

        if (this.hasCatEscaped()) {
            this.endGame('Game Over! The cat escaped!', false);
        }
    }

    findPossibleMoves() {
        const moves = [];
        const directions = [
            { x: -1, y: 0 }, // left
            { x: 1, y: 0 },  // right
            { x: 0, y: -1 }, // up
            { x: 0, y: 1 },  // down
            { x: -1, y: -1 }, // diagonal
            { x: 1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: 1 }
        ];

        for (const dir of directions) {
            const newX = this.catPosition.x + dir.x;
            const newY = this.catPosition.y + dir.y;

            if (this.isValidMove(newX, newY)) {
                // Check if this move would lead to a dead end
                if (!this.wouldBeTrapped(newX, newY)) {
                    moves.push({ x: newX, y: newY });
                }
            }
        }

        return moves;
    }

    findBestMove(possibleMoves) {
        let bestMove = possibleMoves[0];
        let minDistance = Infinity;

        for (const move of possibleMoves) {
            const distance = this.getDistanceToEdge(move.x, move.y);
            if (distance < minDistance) {
                minDistance = distance;
                bestMove = move;
            }
        }

        return bestMove;
    }

    getDistanceToEdge(x, y) {
        return Math.min(
            x, // distance to left edge
            this.gridSize - 1 - x, // distance to right edge
            y, // distance to top edge
            this.gridSize - 1 - y  // distance to bottom edge
        );
    }

    isValidMove(x, y) {
        return this.isValidPosition(x, y) && this.board[y][x] === 0;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    updateCatPosition(x, y) {
        // Remove cat from previous position
        const oldCell = document.querySelector('.cell.cat');
        if (oldCell) {
            oldCell.classList.remove('cat', 'cat-moving');
        }

        // Update cat position
        this.catPosition = { x, y };
        this.board[y][x] = 2; // 2 represents cat

        // Add cat to new position with animation
        const newCell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        newCell.classList.add('cat');
    }

    hasCatEscaped() {
        return this.catPosition.x === 0 || 
               this.catPosition.x === this.gridSize - 1 || 
               this.catPosition.y === 0 || 
               this.catPosition.y === this.gridSize - 1;
    }

    checkGameState() {
        const possibleMoves = this.findPossibleMoves();
        if (possibleMoves.length === 0) {
            this.endGame('You won! The cat is trapped!');
        }
    }

    endGame(message, isWin) {
        this.gameOver = true;
        this.lastGameWon = isWin; // Store the game result
        this.stats.gamesPlayed++;
        
        if (isWin) {
            this.stats.gamesWon++;
            this.stats.levelsCompleted = Math.max(this.stats.levelsCompleted, this.currentLevel);
            if (this.moves < this.stats.bestScore) {
                this.stats.bestScore = this.moves;
            }
            this.stats.totalMoves += this.moves;
            this.playSound('win');
        } else {
            this.playSound('lose');
        }
        this.saveStats();
        this.updateStatsDisplay();

        const gameMessage = document.getElementById('game-message');
        const messageText = document.getElementById('message-text');
        const playAgainBtn = document.getElementById('play-again-btn');
        
        // Update button text based on game result
        playAgainBtn.textContent = isWin ? 'Next Level' : 'Play Again';
        messageText.textContent = message;
        gameMessage.classList.add('active');
    }

    resetGame() {
        this.moves = 0;
        this.gameOver = false;
        this.lastGameWon = false; // Reset the game result
        this.catPosition = { x: 5, y: 5 };
        document.getElementById('game-message').classList.remove('active');
        this.initializeBoard();
        this.updateMovesDisplay();
    }

    updateMovesDisplay() {
        document.getElementById('moves-count').textContent = this.moves;
    }

    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.resetGame();
            this.showLevelUpMessage();
        } else {
            this.showGameCompleteMessage();
        }
    }

    showLevelUpMessage() {
        const message = document.getElementById('game-message');
        const messageText = document.getElementById('message-text');
        const playAgainBtn = document.getElementById('play-again-btn');
        
        messageText.textContent = `Level ${this.currentLevel - 1} Complete! Moving to Level ${this.currentLevel}`;
        playAgainBtn.textContent = 'Start Level';
        message.classList.add('active');
        this.playSound('win');
        
        // Remove the message after a delay
        setTimeout(() => {
            message.classList.remove('active');
            playAgainBtn.textContent = 'Play Again'; // Reset button text
        }, 2000);
    }

    showGameCompleteMessage() {
        const message = document.getElementById('game-message');
        const messageText = document.getElementById('message-text');
        messageText.textContent = 'Congratulations! You completed all levels!';
        message.classList.add('active');
        this.playSound('win');
        
        // Add achievement
        if (!this.stats.achievements.includes('game_complete')) {
            this.stats.achievements.push('game_complete');
            this.saveStats();
        }
    }

    updateStatsDisplay() {
        document.getElementById('moves-count').textContent = this.moves;
        document.getElementById('best-score').textContent = 
            this.stats.bestScore === Infinity ? '-' : this.stats.bestScore;
        document.getElementById('games-played').textContent = this.stats.gamesPlayed;
        document.getElementById('win-rate').textContent = 
            this.stats.gamesPlayed === 0 ? '0%' : 
            Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) + '%';
        document.getElementById('level-display').textContent = `Level ${this.currentLevel}`;
    }

    updateLevelDisplay() {
        document.getElementById('level-display').textContent = `Level ${this.currentLevel}`;
    }

    wouldBeTrapped(x, y) {
        // Create a temporary board state
        const tempBoard = this.board.map(row => [...row]);
        tempBoard[y][x] = 2; // Place cat temporarily

        // Check if there's a path to the edge
        const visited = new Set();
        const queue = [{ x, y }];
        visited.add(`${x},${y}`);

        while (queue.length > 0) {
            const current = queue.shift();
            
            // If we reached any edge, we're not trapped
            if (current.x === 0 || current.x === this.gridSize - 1 ||
                current.y === 0 || current.y === this.gridSize - 1) {
                return false;
            }

            // Check all adjacent cells
            const directions = [
                { x: -1, y: 0 }, { x: 1, y: 0 },
                { x: 0, y: -1 }, { x: 0, y: 1 },
                { x: -1, y: -1 }, { x: 1, y: -1 },
                { x: -1, y: 1 }, { x: 1, y: 1 }
            ];

            for (const dir of directions) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                const key = `${newX},${newY}`;

                if (this.isValidPosition(newX, newY) && 
                    tempBoard[newY][newX] === 0 && 
                    !visited.has(key)) {
                    queue.push({ x: newX, y: newY });
                    visited.add(key);
                }
            }
        }

        // If we've checked all possible moves and haven't reached an edge, we're trapped
        return true;
    }

    isCatTrapped() {
        // Check if there's any possible path to the edge
        const visited = new Set();
        const queue = [{ x: this.catPosition.x, y: this.catPosition.y }];
        visited.add(`${this.catPosition.x},${this.catPosition.y}`);

        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === 0 || current.x === this.gridSize - 1 ||
                current.y === 0 || current.y === this.gridSize - 1) {
                return false; // Found a path to the edge
            }

            const directions = [
                { x: -1, y: 0 }, { x: 1, y: 0 },
                { x: 0, y: -1 }, { x: 0, y: 1 },
                { x: -1, y: -1 }, { x: 1, y: -1 },
                { x: -1, y: 1 }, { x: 1, y: 1 }
            ];

            for (const dir of directions) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                const key = `${newX},${newY}`;

                if (this.isValidMove(newX, newY) && !visited.has(key)) {
                    queue.push({ x: newX, y: newY });
                    visited.add(key);
                }
            }
        }

        return true; // No path to the edge found
    }

    findEscapeRoute() {
        // Find the shortest path to the edge
        const visited = new Set();
        const queue = [{ x: this.catPosition.x, y: this.catPosition.y, path: [] }];
        visited.add(`${this.catPosition.x},${this.catPosition.y}`);

        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === 0 || current.x === this.gridSize - 1 ||
                current.y === 0 || current.y === this.gridSize - 1) {
                return current.path[0] || null; // Return first move in path
            }

            const directions = [
                { x: -1, y: 0 }, { x: 1, y: 0 },
                { x: 0, y: -1 }, { x: 0, y: 1 },
                { x: -1, y: -1 }, { x: 1, y: -1 },
                { x: -1, y: 1 }, { x: 1, y: 1 }
            ];

            for (const dir of directions) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                const key = `${newX},${newY}`;

                if (this.isValidMove(newX, newY) && !visited.has(key)) {
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, { x: newX, y: newY }]
                    });
                    visited.add(key);
                }
            }
        }

        return null; // No escape route found
    }

    async animateCatMove(newX, newY) {
        const oldCell = document.querySelector('.cell.cat');
        const newCell = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
        
        // Calculate the movement direction
        const dx = newX - this.catPosition.x;
        const dy = newY - this.catPosition.y;
        
        // Add movement class with direction
        oldCell.classList.add('cat-moving');
        oldCell.style.setProperty('--move-x', `${dx * 100}%`);
        oldCell.style.setProperty('--move-y', `${dy * 100}%`);
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, this.getLevelConfig().catSpeed));
        
        // Update position
        this.updateCatPosition(newX, newY);
        this.playSound('move');
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new CatGame();
}); 