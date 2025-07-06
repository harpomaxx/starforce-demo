# Star Force Modular

A browser-based arcade-style shooter game built with vanilla JavaScript and HTML5 Canvas. Take control of a spaceship, shoot enemies, collect power-ups, and face challenging boss battles!

## 🎮 Game Features

- **Classic Arcade Gameplay**: Smooth scrolling shooter with retro-style graphics
- **Enemy Variety**: 5 different enemy types with unique movement patterns
- **Power-up System**: Collect upgrades including triple fire, shields, extra bombs, and lives
- **Boss Battles**: Face powerful bosses every 10,000 enemies defeated
- **Progressive Difficulty**: Enemy spawn rates and firing increase over time
- **Mobile Support**: Touch controls with virtual joystick and action buttons
- **Procedural Audio**: Dynamic sound effects generated using Web Audio API

## 🕹️ Controls

### Desktop
- **Movement**: Arrow keys or WASD
- **Shoot**: Spacebar
- **Bomb**: B key
- **Restart**: R or Space (after Game Over)

### Mobile
- **Movement**: Virtual joystick (bottom left)
- **Shoot**: Red FIRE button (bottom right)
- **Bomb**: Orange BOMB button (bottom right)
- **Restart**: Tap anywhere after Game Over

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/star-force-modular.git
   cd star-force-modular
   ```

2. **Start a local server** (required for ES6 modules)
   ```bash
   # Using Python
   python -m http.server 8000
   # or Python 3
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 🏗️ Architecture

The game follows a modular ES6 architecture with clear separation of concerns:

### Core Systems
- **main.js**: Game loop, collision detection, and state management
- **state.js**: Central game state and constants
- **render.js**: All rendering and drawing logic

### Game Components
- **player.js**: Player movement, shooting, and abilities
- **enemy.js**: Enemy spawning, AI, and movement patterns
- **boss.js**: Boss mechanics and AI
- **bullet.js**: Bullet physics for both player and enemies
- **items.js**: Power-up collection and effects
- **input.js**: Keyboard and mobile touch controls
- **audio.js**: Procedural sound generation
- **utils.js**: Utility functions and collision detection

## 🎯 Gameplay Elements

### Enemy Types
- **Type 0**: Straight downward movement
- **Type 1**: Sine wave pattern
- **Type 2**: Horizontal bouncing
- **Type 3**: Spiral/circular movement
- **Type 4**: Pause-and-drop behavior

### Power-ups
- **Triple Fire**: Multi-directional shooting
- **Shield**: Absorbs enemy hits with visual effects
- **Bomb Plus**: Increases bomb inventory
- **Life Up**: Extra lives

### Boss Battles
- Appears every 10,000 enemies defeated
- Scaled difficulty based on game progress
- Drops multiple power-ups when defeated
- Unique attack patterns and movement

## 🛠️ Technical Features

- **ES6 Modules**: Clean, modular code structure
- **Canvas Rendering**: Smooth 60fps graphics
- **Touch Events**: Multi-touch support for mobile
- **Web Audio API**: Dynamic sound generation
- **Responsive Design**: Works on desktop and mobile
- **Progressive Difficulty**: Dynamic scaling based on player progress

## 🎨 Customization

Game balance can be adjusted by modifying constants in `state.js`:
- Canvas dimensions
- Player/enemy speeds
- Spawn rates and delays
- Power-up durations
- Boss trigger conditions

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎮 Screenshots

*Add screenshots of your game here*

## 🔧 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Requires ES6 module support and HTML5 Canvas.

---

**Enjoy the game!** 🚀✨