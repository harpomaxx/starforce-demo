export const CANVAS_WIDTH = 400, CANVAS_HEIGHT = 600;
export const PLAYER_WIDTH = 32, PLAYER_HEIGHT = 24, PLAYER_SPEED = 4;
export const BULLET_RADIUS = 4, BULLET_SPEED = 7, SHOOT_DELAY = 200;
export const ENEMY_WIDTH = 32, ENEMY_HEIGHT = 20, ENEMY_SPEED_MIN = 1.2, ENEMY_SPEED_MAX = 2.6;
export const ENEMY_SPAWN_DELAY = 2000; // Start with 2 seconds
export const BOMB_RADIUS = 240, BOMB_COOLDOWN = 2500, BOMB_MAX = 2;
export const CONTINENT_SPEED = 0.5; // Fixed speed for all continents
export const CONTINENT_MIN_SPACING = 150; // Minimum pixels between continents

export const state = {
  player: { x: 200, y: 540, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, alive: true },
  bullets: [],
  enemies: [],
  enemyBullets: [],
  items: [],
  score: 0,
  bombCount: BOMB_MAX,
  bombVisual: null,
  bombVisualTime: 0,
  tripleFire: false,
  tripleFireUntil: 0,
  shield: false,
  shieldUntil: 0,
  shieldFlash: 0,
  shieldHits: 0,
  bombPlusTime: 0,
  lives: 3,
  boss: null,
  bossAppearScore: 3000,
  bossWarningTime: 0,
  gameOver: false,
  keys: {},
  lastShot: 0,
  lastEnemy: 0,
  lastBomb: -BOMB_COOLDOWN,
  stars: [],
  spatialContinents: [], // Continents now contain integrated bases
  paused: true,
  respawnPauseUntil: 0,
  gameStarted: false,
  invincible: false,
  invincibleUntil: 0,
  _startInvincibilityAfterUnpause: false,
  screenShake: null,
  enemiesKilled: 0,
  nextBossAt: 10000,
  // Background Music State
  music: {
    enabled: false, // Start disabled to prevent freeze issues
    volume: 0.6, // Increased default volume
    currentTrack: null,
    targetTrack: 'menu',
    isPlaying: false,
    fadeVolume: 0,
    crossfadeTime: 2000, // 2 seconds for crossfade
    lastTrackChange: 0,
    intensity: 0 // 0-1, affects music dynamics based on game state
  }
};

export function resetGame() {
  state.player = { x: 200, y: 540, w: PLAYER_WIDTH, h: PLAYER_HEIGHT, alive: true };
  state.bullets = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.items = [];
  state.score = 0;
  state.bombCount = BOMB_MAX;
  state.bombVisual = null;
  state.bombVisualTime = 0;
  state.tripleFire = false;
  state.tripleFireUntil = 0;
  state.shield = false;
  state.shieldUntil = 0;
  state.shieldFlash = 0;
  state.shieldHits = 0;
  state.bombPlusTime = 0;
  state.lives = 3;
  state.boss = null;
  state.bossAppearScore = 3000;
  state.bossWarningTime = 0;
  state.gameOver = false;
  // Don't reset paused state if force unpause is set (for mobile)
  if (!window.FORCE_UNPAUSE) {
    state.paused = true;
  }
  state.keys = {};
  state.lastShot = 0;
  state.lastEnemy = 0;
  state.lastBomb = -BOMB_COOLDOWN;
  state.stars = [];
  state.spatialContinents = [];
  state.respawnPauseUntil = 0;
  state.invincible = false;
  state.invincibleUntil = 0;
  state._startInvincibilityAfterUnpause = false;
  state.screenShake = null;
  state.enemiesKilled = 0;
  state.nextBossAt = 10000;
  // Reset music target to menu, but preserve user settings
  state.music.targetTrack = 'menu';
  state.music.intensity = 0;
  for (let i = 0; i < 48; i++) {
    state.stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      r: 0.7 + Math.random() * 1.2,
      speed: 0.4 + Math.random() * 0.7
    });
  }
  
  // Create initial spatial continents with integrated bases
  createSpatialContinents();
  
  const infoElem = document.getElementById('info');
  if (infoElem) infoElem.textContent = '';
}

// Create integrated bases within continent structure
function createIntegratedBases(continent) {
  // Create 4-8 base structures within the continent for more targets
  const numBases = 4 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < numBases; i++) {
    createBaseWithinContinent(continent);
  }
}

// Define 16x16 sprite patterns for each base type
const baseSprites = {
  hub: {
    // Command Hub - central core with connection points
    sprite: [
      ["#2c3e50", "#2c3e50", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#2c3e50", "#2c3e50", "#2c3e50"],
      ["#2c3e50", "#4a90e2", "#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#4a90e2", "#2c3e50", "#2c3e50"],
      ["#4a90e2", "#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#2c3e50", "#2c3e50", "#2c3e50", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#2c3e50", "#2c3e50", "#2c3e50", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#2c3e50", "#4a90e2", "#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#4a90e2", "#2c3e50", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#2c3e50", "#4a90e2", "#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#4a90e2", "#2c3e50", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#2c3e50", "#4a90e2", "#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#4a90e2", "#2c3e50", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#ffffff", "#ffffff", "#2c3e50", "#4a90e2", "#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#4a90e2", "#2c3e50", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#4a90e2", "#4a90e2", "#ffffff", "#2c3e50", "#2c3e50", "#2c3e50", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#2c3e50", "#2c3e50", "#2c3e50", "#ffffff", "#4a90e2", "#2c3e50"],
      ["#2c3e50", "#4a90e2", "#4a90e2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#4a90e2", "#4a90e2", "#2c3e50"],
      ["#2c3e50", "#2c3e50", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#4a90e2", "#2c3e50", "#2c3e50"],
      ["#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50", "#2c3e50"]
    ],
    colors: ["#4a90e2", "#2c3e50", "#ffffff"]
  },
  comm: {
    // Communication Array - antenna pattern
    sprite: [
      ["#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#ffffff", "#ffffff", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#d35400", "#d35400", "#d35400", "#ffffff", "#ffffff", "#d35400", "#d35400", "#d35400", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
      ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#d35400", "#d35400", "#d35400", "#d35400", "#ffffff", "#ffffff", "#d35400", "#d35400", "#d35400", "#d35400", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#ffffff", "#ffffff", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#f39c12", "#d35400"],
      ["#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#ffffff", "#ffffff", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400"]
    ],
    colors: ["#f39c12", "#d35400", "#ffffff"]
  },
  dock: {
    // Docking Port - bay opening
    sprite: [
      ["#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449"],
      ["#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449"],
      ["#1e8449", "#2ecc71", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#2ecc71", "#1e8449"],
      ["#1e8449", "#2ecc71", "#27ae60", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#27ae60", "#2ecc71", "#1e8449"],
      ["#1e8449", "#2ecc71", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#2ecc71", "#1e8449"],
      ["#1e8449", "#27ae60", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#27ae60", "#1e8449"],
      ["#1e8449", "#27ae60", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#27ae60", "#1e8449"],
      ["#1e8449", "#27ae60", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#27ae60", "#1e8449"],
      ["#1e8449", "#27ae60", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#27ae60", "#1e8449"],
      ["#1e8449", "#27ae60", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#27ae60", "#1e8449"],
      ["#1e8449", "#27ae60", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#27ae60", "#1e8449"],
      ["#1e8449", "#2ecc71", "#27ae60", "#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449", "#27ae60", "#2ecc71", "#1e8449"],
      ["#1e8449", "#2ecc71", "#27ae60", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#27ae60", "#2ecc71", "#1e8449"],
      ["#1e8449", "#2ecc71", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#2ecc71", "#1e8449"],
      ["#1e8449", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#27ae60", "#2ecc71", "#2ecc71", "#2ecc71", "#2ecc71", "#1e8449"],
      ["#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449", "#1e8449"]
    ],
    colors: ["#2ecc71", "#27ae60", "#1e8449"]
  },
  research: {
    // Research Module - lab equipment pattern
    sprite: [
      ["#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#7d3c98"],
      ["#7d3c98", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#7d3c98"],
      ["#7d3c98", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#9b59b6", "#ffffff", "#ffffff", "#9b59b6", "#9b59b6", "#9b59b6", "#7d3c98"],
      ["#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98", "#7d3c98"]
    ],
    colors: ["#9b59b6", "#7d3c98", "#ffffff"]
  },
  solar: {
    // Solar Panel Array - panel grid
    sprite: [
      ["#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910"],
      ["#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910"],
      ["#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910"],
      ["#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910", "#d68910", "#f39c12", "#f39c12", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#f39c12", "#f39c12", "#f1c40f", "#f1c40f", "#d68910"],
      ["#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910", "#d68910"]
    ],
    colors: ["#f1c40f", "#f39c12", "#d68910"]
  },
  mining: {
    // Mining Platform - drill/excavator
    sprite: [
      ["#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d"],
      ["#a0522d", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#a0522d", "#a0522d", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d", "#d35400", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#d35400", "#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#a0522d", "#a0522d", "#d35400", "#a0522d", "#d35400", "#d35400", "#a0522d", "#d35400", "#a0522d", "#a0522d", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#a0522d", "#a0522d", "#d35400", "#a0522d", "#d35400", "#d35400", "#a0522d", "#d35400", "#a0522d", "#a0522d", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d", "#d35400", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#d35400", "#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#a0522d", "#a0522d", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#d35400", "#e67e22", "#a0522d"],
      ["#a0522d", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#e67e22", "#a0522d"],
      ["#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d", "#a0522d"]
    ],
    colors: ["#e67e22", "#d35400", "#a0522d"]
  },
  turret: {
    // Defense Turret - weapon barrel
    sprite: [
      ["#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#922b21", "#922b21", "#922b21", "#922b21", "#ffffff", "#ffffff", "#922b21", "#922b21", "#922b21", "#922b21", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#922b21"],
      ["#922b21", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#922b21", "#922b21", "#922b21", "#922b21", "#ffffff", "#ffffff", "#922b21", "#922b21", "#922b21", "#922b21", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#ffffff", "#ffffff", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#e74c3c", "#922b21"],
      ["#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21", "#922b21"]
    ],
    colors: ["#e74c3c", "#922b21", "#ffffff"]
  },
  fuel: {
    // Fuel Depot - tank/storage
    sprite: [
      ["#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65"],
      ["#117a65", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#117a65"],
      ["#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65"],
      ["#117a65", "#1abc9c", "#85c1e9", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#85c1e9", "#1abc9c", "#117a65"],
      ["#117a65", "#1abc9c", "#85c1e9", "#117a65", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#117a65", "#85c1e9", "#1abc9c", "#117a65"],
      ["#117a65", "#85c1e9", "#85c1e9", "#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65", "#85c1e9", "#85c1e9", "#117a65"],
      ["#117a65", "#85c1e9", "#85c1e9", "#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65", "#85c1e9", "#85c1e9", "#117a65"],
      ["#117a65", "#85c1e9", "#85c1e9", "#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65", "#85c1e9", "#85c1e9", "#117a65"],
      ["#117a65", "#85c1e9", "#85c1e9", "#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65", "#85c1e9", "#85c1e9", "#117a65"],
      ["#117a65", "#85c1e9", "#85c1e9", "#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65", "#85c1e9", "#85c1e9", "#117a65"],
      ["#117a65", "#85c1e9", "#85c1e9", "#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65", "#85c1e9", "#85c1e9", "#117a65"],
      ["#117a65", "#1abc9c", "#85c1e9", "#117a65", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#117a65", "#85c1e9", "#1abc9c", "#117a65"],
      ["#117a65", "#1abc9c", "#85c1e9", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#85c1e9", "#1abc9c", "#117a65"],
      ["#117a65", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#117a65"],
      ["#117a65", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#85c1e9", "#1abc9c", "#1abc9c", "#1abc9c", "#1abc9c", "#117a65"],
      ["#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65", "#117a65"]
    ],
    colors: ["#1abc9c", "#85c1e9", "#117a65"]
  },
  cargo: {
    // Cargo Bay - container/storage
    sprite: [
      ["#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573"],
      ["#566573", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#566573"],
      ["#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#bdc3c7", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#bdc3c7", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573"],
      ["#566573", "#95a5a6", "#bdc3c7", "#95a5a6", "#95a5a6", "#566573", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#566573", "#95a5a6", "#95a5a6", "#bdc3c7", "#95a5a6", "#566573"],
      ["#566573", "#95a5a6", "#bdc3c7", "#95a5a6", "#95a5a6", "#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573", "#95a5a6", "#95a5a6", "#bdc3c7", "#95a5a6", "#566573"],
      ["#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573"],
      ["#566573", "#566573", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#566573", "#566573"],
      ["#566573", "#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#95a5a6", "#566573", "#566573", "#95a5a6", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573", "#566573"],
      ["#566573", "#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#95a5a6", "#566573", "#566573", "#95a5a6", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573", "#566573"],
      ["#566573", "#566573", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#566573", "#566573"],
      ["#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573"],
      ["#566573", "#95a5a6", "#bdc3c7", "#95a5a6", "#95a5a6", "#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573", "#95a5a6", "#95a5a6", "#bdc3c7", "#95a5a6", "#566573"],
      ["#566573", "#95a5a6", "#bdc3c7", "#95a5a6", "#95a5a6", "#566573", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#566573", "#95a5a6", "#95a5a6", "#bdc3c7", "#95a5a6", "#566573"],
      ["#566573", "#95a5a6", "#bdc3c7", "#bdc3c7", "#bdc3c7", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#bdc3c7", "#bdc3c7", "#bdc3c7", "#95a5a6", "#566573"],
      ["#566573", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#95a5a6", "#566573"],
      ["#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573", "#566573"]
    ],
    colors: ["#95a5a6", "#bdc3c7", "#566573"]
  },
  sensor: {
    // Sensor Array - dish/scanner pattern
    sprite: [
      ["#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3"],
      ["#2471a3", "#3498db", "#3498db", "#3498db", "#3498db", "#5dade2", "#5dade2", "#ffffff", "#ffffff", "#5dade2", "#5dade2", "#3498db", "#3498db", "#3498db", "#3498db", "#2471a3"],
      ["#2471a3", "#3498db", "#5dade2", "#5dade2", "#5dade2", "#5dade2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#5dade2", "#5dade2", "#5dade2", "#5dade2", "#3498db", "#2471a3"],
      ["#2471a3", "#3498db", "#5dade2", "#3498db", "#3498db", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#3498db", "#3498db", "#5dade2", "#3498db", "#2471a3"],
      ["#2471a3", "#3498db", "#5dade2", "#3498db", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#3498db", "#5dade2", "#3498db", "#2471a3"],
      ["#2471a3", "#5dade2", "#5dade2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#5dade2", "#5dade2", "#2471a3"],
      ["#2471a3", "#5dade2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#5dade2", "#2471a3"],
      ["#2471a3", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#2471a3"],
      ["#2471a3", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#2471a3"],
      ["#2471a3", "#5dade2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#5dade2", "#2471a3"],
      ["#2471a3", "#5dade2", "#5dade2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#5dade2", "#5dade2", "#2471a3"],
      ["#2471a3", "#3498db", "#5dade2", "#3498db", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#3498db", "#5dade2", "#3498db", "#2471a3"],
      ["#2471a3", "#3498db", "#5dade2", "#3498db", "#3498db", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#3498db", "#3498db", "#5dade2", "#3498db", "#2471a3"],
      ["#2471a3", "#3498db", "#5dade2", "#5dade2", "#5dade2", "#5dade2", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#5dade2", "#5dade2", "#5dade2", "#5dade2", "#3498db", "#2471a3"],
      ["#2471a3", "#3498db", "#3498db", "#3498db", "#3498db", "#5dade2", "#5dade2", "#ffffff", "#ffffff", "#5dade2", "#5dade2", "#3498db", "#3498db", "#3498db", "#3498db", "#2471a3"],
      ["#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3", "#2471a3"]
    ],
    colors: ["#3498db", "#ffffff", "#2471a3", "#5dade2"]
  }
};

// Create a single base structure within the continent
function createBaseWithinContinent(continent) {
  const baseShapes = [
    // Space Station Hub - central core with extending modules
    {pattern: [[0,1,0],[1,1,1],[0,1,0]], width: 3, height: 3, name: "hub"},
    
    // Communication Array - linear antenna structure
    {pattern: [[1,1,1]], width: 3, height: 1, name: "comm"},
    
    // Docking Port - small rectangular structure
    {pattern: [[1,1]], width: 2, height: 1, name: "dock"},
    
    // Research Module - compact square
    {pattern: [[1,1],[1,1]], width: 2, height: 2, name: "research"},
    
    // Solar Panel Array - thin line
    {pattern: [[1],[1]], width: 1, height: 2, name: "solar"},
    
    // Mining Platform - L-shaped
    {pattern: [[1,0],[1,1]], width: 2, height: 2, name: "mining"},
    
    // Defense Turret - single block
    {pattern: [[1]], width: 1, height: 1, name: "turret"},
    
    // Fuel Depot - small T-shape
    {pattern: [[1,1,1],[0,1,0]], width: 3, height: 2, name: "fuel"},
    
    // Cargo Bay - rectangular
    {pattern: [[1,1,1],[1,1,1]], width: 3, height: 2, name: "cargo"},
    
    // Sensor Array - cross pattern
    {pattern: [[0,1,0],[1,1,1],[0,1,0]], width: 3, height: 3, name: "sensor"}
  ];
  
  const shape = baseShapes[Math.floor(Math.random() * baseShapes.length)];
  
  // Find a random position within the continent where there's continental structure
  let attempts = 0;
  let placed = false;
  
  while (attempts < 20 && !placed) {
    const startRow = Math.floor(Math.random() * (continent.height - shape.height));
    const startCol = Math.floor(Math.random() * (continent.width - shape.width));
    
    // Check if this area has continental structure to place base on
    let hasFoundation = false;
    for (let row = 0; row < shape.height; row++) {
      for (let col = 0; col < shape.width; col++) {
        if (continent.squares[startRow + row] && continent.squares[startRow + row][startCol + col]) {
          hasFoundation = true;
          break;
        }
      }
      if (hasFoundation) break;
    }
    
    if (hasFoundation) {
      // Place the base pattern
      for (let row = 0; row < shape.height; row++) {
        for (let col = 0; col < shape.width; col++) {
          if (shape.pattern[row] && shape.pattern[row][col] === 1) {
            const targetRow = startRow + row;
            const targetCol = startCol + col;
            if (targetRow < continent.height && targetCol < continent.width) {
              // Store base type information for rendering
              continent.bases[targetRow][targetCol] = {
                active: true,
                type: shape.name
              };
            }
          }
        }
      }
      placed = true;
    }
    attempts++;
  }
}

// Create spatial continents with integrated bases
function createSpatialContinents() {
  // Create 2-3 initial continents to ensure good coverage
  for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
    createSpatialContinent();
  }
}

// Find a safe position for a new continent that doesn't overlap with existing ones
function findSafeContinentPosition(width, height, squareSize) {
  const totalWidth = width * squareSize;
  const totalHeight = height * squareSize;
  
  let attempts = 0;
  let maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    // Generate potential position
    const x = Math.random() * (CANVAS_WIDTH - totalWidth * 0.5);
    const y = -totalHeight - Math.random() * 300;
    
    // Check if this position overlaps with any existing continent
    let overlaps = false;
    for (let existingContinent of state.spatialContinents) {
      if (continentsOverlap(
        x, y, totalWidth, totalHeight,
        existingContinent.x, existingContinent.y, 
        existingContinent.width * existingContinent.squareSize,
        existingContinent.height * existingContinent.squareSize
      )) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      return { x: x, y: y };
    }
    
    attempts++;
  }
  
  // If no safe position found, place it far above the screen
  return {
    x: Math.random() * (CANVAS_WIDTH - totalWidth),
    y: -totalHeight - CONTINENT_MIN_SPACING * (state.spatialContinents.length + 1)
  };
}

// Check if two continent rectangles overlap (with spacing buffer)
function continentsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  const buffer = CONTINENT_MIN_SPACING;
  return !(x1 > x2 + w2 + buffer || 
           x2 > x1 + w1 + buffer || 
           y1 > y2 + h2 + buffer || 
           y2 > y1 + h1 + buffer);
}

// Create a single spatial continent with integrated bases
function createSpatialContinent() {
  const squareSize = 24;
  const continentWidth = 18; // Larger for better coverage
  const continentHeight = 14; // Taller for more presence
  
  // Find a safe position that doesn't overlap with existing continents
  let safePosition = findSafeContinentPosition(continentWidth, continentHeight, squareSize);
  
  const continent = {
    x: safePosition.x,
    y: safePosition.y,
    width: continentWidth,
    height: continentHeight,
    squareSize: squareSize,
    speed: CONTINENT_SPEED, // All continents move at same speed
    squares: [], // Continental structure (non-interactive)
    bases: []    // Interactive base structures within continent
  };
  
  // Initialize squares arrays
  for (let row = 0; row < continentHeight; row++) {
    continent.squares[row] = [];
    continent.bases[row] = [];
    for (let col = 0; col < continentWidth; col++) {
      continent.squares[row][col] = false; // Continental background
      continent.bases[row][col] = false;   // Interactive bases
    }
  }
  
  // Create continent background structure
  createContinentShape(continent);
  
  // Create integrated bases within the continent
  createIntegratedBases(continent);
  
  state.spatialContinents.push(continent);
}

// Create large irregular continent shapes
function createContinentShape(continent) {
  const w = continent.width;
  const h = continent.height;
  
  // Create organic, continent-like shapes with emphasis on archipelago designs
  const shapes = [
    // Large irregular landmass with gaps
    function(squares) {
      // Create a rough oval/blob shape with internal gaps
      const centerX = w / 2;
      const centerY = h / 2;
      for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
          const dx = col - centerX;
          const dy = row - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxRadius = Math.min(w, h) / 2.2;
          
          // Add some randomness for irregular edges
          const noise = (Math.random() - 0.5) * 2;
          const threshold = maxRadius + noise;
          
          if (distance < threshold) {
            // Create internal gaps for complexity
            if (Math.random() > 0.1) { // 90% fill rate
              squares[row][col] = true;
            }
          }
        }
      }
    },
    
    // Large Archipelago - multiple connected islands with small gaps
    function(squares) {
      // Create several larger "islands" with narrow channels
      const islands = [
        {x: w * 0.15, y: h * 0.2, r: 4.5},
        {x: w * 0.6, y: h * 0.15, r: 5},
        {x: w * 0.3, y: h * 0.5, r: 4},
        {x: w * 0.75, y: h * 0.6, r: 4.5},
        {x: w * 0.45, y: h * 0.8, r: 3.5}
      ];
      
      islands.forEach(island => {
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const dx = col - island.x;
            const dy = row - island.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < island.r) {
              squares[row][col] = true;
            }
          }
        }
      });
      
      // Add connecting bridges (narrow channels)
      for (let col = Math.floor(w * 0.15); col < Math.floor(w * 0.6); col++) {
        if (col % 3 !== 0) { // Create gaps in bridges
          squares[Math.floor(h * 0.17)][col] = true;
        }
      }
      for (let col = Math.floor(w * 0.3); col < Math.floor(w * 0.75); col++) {
        if (col % 4 !== 0) {
          squares[Math.floor(h * 0.55)][col] = true;
        }
      }
      for (let row = Math.floor(h * 0.5); row < Math.floor(h * 0.8); row++) {
        if (row % 3 !== 0) {
          squares[row][Math.floor(w * 0.37)] = true;
        }
      }
    },
    
    // Sprawling Archipelago with many small islands
    function(squares) {
      // Create many smaller islands scattered throughout
      const smallIslands = [];
      for (let i = 0; i < 12; i++) {
        smallIslands.push({
          x: w * 0.1 + Math.random() * w * 0.8,
          y: h * 0.1 + Math.random() * h * 0.8,
          r: 1.5 + Math.random() * 2.5
        });
      }
      
      smallIslands.forEach(island => {
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const dx = col - island.x;
            const dy = row - island.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < island.r) {
              squares[row][col] = true;
            }
          }
        }
      });
      
      // Add some connecting tissue between nearby islands
      for (let i = 0; i < smallIslands.length; i++) {
        for (let j = i + 1; j < smallIslands.length; j++) {
          const island1 = smallIslands[i];
          const island2 = smallIslands[j];
          const dist = Math.sqrt((island1.x - island2.x) ** 2 + (island1.y - island2.y) ** 2);
          
          if (dist < 6) { // Connect nearby islands
            const steps = Math.floor(dist);
            for (let step = 0; step < steps; step++) {
              const t = step / steps;
              const x = Math.floor(island1.x + t * (island2.x - island1.x));
              const y = Math.floor(island1.y + t * (island2.y - island1.y));
              if (x >= 0 && x < w && y >= 0 && y < h && Math.random() > 0.3) {
                squares[y][x] = true;
              }
            }
          }
        }
      }
    },
    
    // Continent with inland seas (reverse archipelago)
    function(squares) {
      // Fill most of the area, then create inland water bodies
      for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
          const edgeDistance = Math.min(row, col, h - row - 1, w - col - 1);
          if (edgeDistance > 1) {
            squares[row][col] = true;
          }
        }
      }
      
      // Create inland "seas" (gaps)
      const seas = [
        {x: w * 0.25, y: h * 0.3, r: 2.5},
        {x: w * 0.65, y: h * 0.2, r: 2},
        {x: w * 0.45, y: h * 0.6, r: 1.8},
        {x: w * 0.75, y: h * 0.7, r: 1.5}
      ];
      
      seas.forEach(sea => {
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const dx = col - sea.x;
            const dy = row - sea.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < sea.r) {
              squares[row][col] = false; // Create gaps
            }
          }
        }
      });
    }
  ];
  
  // Pick a random shape generator
  const shapeGenerator = shapes[Math.floor(Math.random() * shapes.length)];
  shapeGenerator(continent.squares);
  
  // Add some random holes and roughness (reduced for more solid continents)
  for (let row = 1; row < h - 1; row++) {
    for (let col = 1; col < w - 1; col++) {
      if (continent.squares[row][col] && Math.random() < 0.02) {
        // Very small chance to create holes for more solid appearance
        continent.squares[row][col] = false;
      }
    }
  }
}

// Export the creation function and sprite data for use in other modules
export { createSpatialContinent, baseSprites };

