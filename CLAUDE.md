# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based arcade-style shooter game called "Star Force Modular" built with vanilla JavaScript using ES6 modules and HTML5 Canvas. The game features a spaceship that shoots enemies, collects power-ups, and faces boss battles.

## Architecture

The codebase follows a modular design with clear separation of concerns:

### Core Game Loop
- **main.js**: Entry point, game loop, collision detection, and overall game state management
- **state.js**: Central game state management with all game constants and the main state object
- **render.js**: All drawing/rendering logic consolidated in one place

### Game Systems
- **player.js**: Player movement, shooting, bombing, and drawing
- **enemy.js**: Enemy spawning, movement patterns (5 types), collision, and drawing  
- **boss.js**: Boss mechanics, AI, and rendering
- **bullet.js**: Player and enemy bullet physics and drawing
- **items.js**: Power-up collection and effects (triple fire, shield, bombs, lives)
- **input.js**: Keyboard and mobile touch controls
- **audio.js**: Web Audio API sound effects generation
- **utils.js**: Small utility functions (clamp, timing, collision detection)

### Game State Management
The game uses a centralized state object exported from `state.js` that contains:
- Player position, health, and abilities
- Arrays of bullets, enemies, items, and effects
- Game progression (score, lives, boss triggers)
- Input state and timing variables

## Development Commands

This is a client-side only project with no build system. To run:

1. Serve the files using a local HTTP server (required for ES6 modules):
   ```bash
   python -m http.server 8000
   # OR
   npx serve .
   # OR
   php -S localhost:8000
   ```

2. Open http://localhost:8000 in a browser

## Key Technical Details

### Game Constants
All game balance and physics constants are defined in `state.js` (canvas size, speeds, delays, etc.)

### Collision System
- Uses simple bounding box collision via `rectsCollide()` in utils.js
- Player vs enemies, bullets vs enemies, player vs items, etc.

### Enemy AI Patterns
Five distinct enemy movement patterns controlled by `type` property:
- Type 0: Straight down
- Type 1: Sine wave movement  
- Type 2: Bouncing side to side
- Type 3: Spiral/circular movement
- Type 4: Pause-and-drop behavior

### Power-up System
Four power-up types with visual indicators and time-based effects:
- Triple Fire: Multi-directional shooting
- Shield: Absorbs hits with visual effects
- Bomb Plus: Increases bomb count
- Life Up: Extra lives

### Audio System
Procedural audio generation using Web Audio API with different waveforms and envelopes for each sound type.

## Mobile Support

The game includes touch controls with on-screen buttons. Mobile detection and touch event handling in `input.js`.

## Game Progression

- Enemies spawn continuously with random types and sizes
- Boss appears every 3000+ points with scaled difficulty
- Power-ups drop randomly from destroyed enemies
- Lives system with temporary invincibility on respawn