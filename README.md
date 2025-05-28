# Cat Escape Game

A modern web-based implementation of the classic cat and mouse game, where you try to trap a cat by blocking its escape routes.

## How to Play

1. Open `index.html` in a modern web browser
2. The game starts with a cat (🐱) in the center of the board
3. Click on empty cells to block them
4. The cat will try to escape by moving to the nearest edge
5. Your goal is to trap the cat by blocking all possible escape routes
6. If the cat reaches any edge of the board, you lose!

## Game Features

- Modern, responsive design
- Smooth animations and transitions
- Move counter
- New game button
- Game over messages
- Pre-generated blocked cells for varied gameplay
- Cat AI that tries to find the best escape route

## Technical Details

The game is built using vanilla HTML, CSS, and JavaScript with no external dependencies. It features:

- CSS Grid for the game board
- CSS Variables for easy theming
- Modern CSS animations and transitions
- Responsive design that works on all screen sizes
- Object-oriented JavaScript for clean code organization

## Browser Support

The game works best in modern browsers that support:
- CSS Grid
- CSS Variables
- ES6+ JavaScript features

## Running Locally

Simply open the `index.html` file in your web browser. No server or build process is required.

## Game Rules

1. The cat can move in 8 directions (horizontally, vertically, and diagonally)
2. The cat will always try to move towards the nearest edge
3. You can only block empty cells
4. The game ends when either:
   - The cat is trapped (you win!)
   - The cat reaches any edge of the board (you lose!) 