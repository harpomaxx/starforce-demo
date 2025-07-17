export const CANVAS_WIDTH = 400, CANVAS_HEIGHT = 600;
export const PLAYER_WIDTH = 32, PLAYER_HEIGHT = 24, PLAYER_SPEED = 4;
export const BULLET_RADIUS = 4, BULLET_SPEED = 7, SHOOT_DELAY = 200;
export const ENEMY_WIDTH = 32, ENEMY_HEIGHT = 20, ENEMY_SPEED_MIN = 1.2, ENEMY_SPEED_MAX = 2.6;
export const ENEMY_SPAWN_DELAY = 2000; // Start with 2 seconds
export const BOMB_RADIUS = 240, BOMB_COOLDOWN = 2500, BOMB_MAX = 2;

// Direct map scrolling system
export const TILE_SIZE = 24; // Size of each map tile in pixels
export const MAP_SCROLL_SPEED = 0.51; // How fast the map scrolls down
// mapScrollRow removed - no longer needed with new logic

// New Tile-Based Buffer System
class TileBuffer {
  constructor(height = 32) {
    this.height = height;
    this.tiles = Array(height).fill(null);
    this.currentMap = null;
    this.currentMapRow = 0;
    this.nextMap = null;
    this.pixelOffset = 0; // For smooth scrolling
  }
  
  setMap(mapData) {
    this.currentMap = mapData;
    this.currentMapRow = 0; // Start from the beginning of the map
    this.fillInitialBuffer();
  }
  
  setNextMap(mapData) {
    this.nextMap = mapData;
  }
  
  fillInitialBuffer() {
    if (!this.currentMap) return;
    
    // Fill buffer so last map row appears at buffer[0] (top of viewport)
    // buffer[0] = last map row, buffer[height-1] = first map row
    for (let i = 0; i < this.height; i++) {
      const mapRow = (this.currentMap.height - 1) - i;
      if (mapRow >= 0) {
        this.tiles[i] = this.getMapRowTiles(this.currentMap, mapRow);
      } else {
        this.tiles[i] = null;
      }
    }
    this.currentMapRow = this.currentMap.height - this.height;
  }
  
  getMapRowTiles(mapData, row) {
    if (!mapData || !mapData.tiles || row < 0 || row >= mapData.height) {
      return null;
    }
    return mapData.tiles[row];
  }
  
  shiftAndAdd() {
    if (!this.currentMap) return;
    
    // Shift everything down (towards higher indices)
    for (let i = this.height - 1; i > 0; i--) {
      this.tiles[i] = this.tiles[i - 1];
    }
    
    // Add new row at top (buffer[0])
    let newRow = null;
    if (this.currentMapRow >= 0) {
      newRow = this.getMapRowTiles(this.currentMap, this.currentMapRow);
      this.currentMapRow--;
    } else if (this.nextMap) {
      // Switch to next map
      this.currentMap = this.nextMap;
      this.nextMap = null;
      this.currentMapRow = this.currentMap.height - 1; // Start from end of new map
      newRow = this.getMapRowTiles(this.currentMap, this.currentMapRow);
      this.currentMapRow--;
    }
    
    this.tiles[0] = newRow;
  }
  
  getTileAt(col, row) {
    if (row < 0 || row >= this.height) return null;
    const rowData = this.tiles[row];
    if (!rowData || col < 0 || col >= rowData.length) return null;
    return rowData[col];
  }
  
  update(scrollSpeed) {
    this.pixelOffset += scrollSpeed;
    
    // When we've scrolled a full tile, shift the buffer
    while (this.pixelOffset >= TILE_SIZE) {
      this.shiftAndAdd();
      this.pixelOffset -= TILE_SIZE;
    }
  }
  
  getPixelOffset() {
    return this.pixelOffset;
  }
}


// Map loading system
let availableMaps = {};
let mapsLoaded = false;

// Async function to load a map from external file
async function loadMap(mapName) {
  try {
    const response = await fetch(`maps/${mapName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
    }
    const mapData = await response.json();
    
    // Validate map structure
    if (!mapData.width || !mapData.height || !mapData.tiles) {
      throw new Error(`Invalid map format in ${mapName}.json`);
    }
    
    availableMaps[mapName] = mapData;
    console.log(`Loaded map: ${mapName} (${mapData.width}x${mapData.height})`);
    return mapData;
  } catch (error) {
    console.error(`Error loading map ${mapName}:`, error);
    throw error;
  }
}

// Load all available maps
async function loadAllMaps() {
  const mapNames = mapCyclingOrder;
  
  try {
    await Promise.all(mapNames.map(mapName => loadMap(mapName)));
    mapsLoaded = true;
    console.log('All maps loaded successfully');
  } catch (error) {
    console.error('Failed to load maps:', error);
    // Fall back to a simple default map if loading fails
    availableMaps = {
      "default": {
        "width": 16,
        "height": 32,
        "tiles": Array(32).fill(null).map(() => Array(16).fill(null))
      }
    };
    mapsLoaded = true;
    console.log('Using fallback default map');
  }
}

// Current map selection (can be changed to switch maps)
let currentMapName = "asteroids";
let staticMapData = null; // Will be set after maps are loaded

// Initialize the tile buffer
let tileBuffer = null;

// Initialize tile buffer
export function initializeTileBuffer() {
  tileBuffer = new TileBuffer(32);
  return tileBuffer;
}




// Map cycling order for automatic progression
const mapCyclingOrder = ["deepspace", "test", "asteroids","deepspace", "nebula","deepspace","bigbase"];
let currentMapIndex = 0;

// Simplified map scrolling functions
export function updateMapScroll() {
  if (!staticMapData || !tileBuffer) return;
  
  // Check if we need to set up next map for transition
  if (tileBuffer.currentMapRow >= -10 && !tileBuffer.nextMap) {
    // Approaching end of current map, prepare next map
    const nextMapIndex = (currentMapIndex + 1) % mapCyclingOrder.length;
    const nextMapName = mapCyclingOrder[nextMapIndex];
    
    if (availableMaps[nextMapName]) {
      console.log(`Preparing transition to map: ${nextMapName}`);
      tileBuffer.setNextMap(availableMaps[nextMapName]);
    }
  }
  
  // Update tile buffer with scroll speed
  tileBuffer.update(MAP_SCROLL_SPEED);
  
  // Check if we've switched to a new map
  if (tileBuffer.currentMap !== staticMapData) {
    // Move to the next map in sequence
    currentMapIndex = (currentMapIndex + 1) % mapCyclingOrder.length;
    currentMapName = mapCyclingOrder[currentMapIndex];
    staticMapData = tileBuffer.currentMap;
    console.log(`Switched to map: ${currentMapName} (index: ${currentMapIndex})`);
  }
}

export function getMapTileAt(x, y) {
  if (!tileBuffer) return null;
  
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  
  return tileBuffer.getTileAt(col, row);
}

export function getMapScrollOffset() {
  if (!tileBuffer) return 0;
  return tileBuffer.getPixelOffset();
}

export function resetMapScroll() {
  currentMapIndex = 0;
  if (availableMaps[mapCyclingOrder[0]]) {
    currentMapName = mapCyclingOrder[0];
    staticMapData = availableMaps[mapCyclingOrder[0]];
    
    // Reset tile buffer with the first map
    if (tileBuffer) {
      tileBuffer.setMap(staticMapData);
    }
  }
}

// Function to switch maps (can be called from console or UI)
export async function switchMap(mapName) {
  // Ensure maps are loaded first
  if (!mapsLoaded) {
    await loadAllMaps();
  }
  
  if (availableMaps[mapName]) {
    currentMapName = mapName;
    staticMapData = availableMaps[mapName];
    resetMapScroll(); // Reset scroll position
    // Map switched, scroll will be reset
    console.log(`Switched to map: ${mapName}`);
    return true;
  } else {
    console.log(`Map "${mapName}" not found. Available maps:`, Object.keys(availableMaps));
    return false;
  }
}

// Function to get current map name for display
export function getCurrentMapName() {
  return currentMapName;
}

// Initialize maps - call this when the game starts
export async function initializeMaps() {
  if (!mapsLoaded) {
    await loadAllMaps();
    // Set initial map data after loading
    if (availableMaps[currentMapName]) {
      staticMapData = availableMaps[currentMapName];
    } else {
      // Fallback to first available map
      const firstMapName = Object.keys(availableMaps)[0];
      if (firstMapName) {
        currentMapName = firstMapName;
        staticMapData = availableMaps[firstMapName];
      }
    }
    // Reset map scroll position to start from end of map
    resetMapScroll();
    
    // Initialize tile buffer
    if (!tileBuffer) {
      initializeTileBuffer();
    }
  }
  return mapsLoaded;
}

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
  paused: true,
  respawnPauseUntil: 0,
  gameStarted: false,
  invincible: false,
  invincibleUntil: 0,
  _startInvincibilityAfterUnpause: false,
  screenShake: null,
  enemiesKilled: 0,
  nextBossAt: 10000,
  
  // Performance monitoring
  performance: {
    isMobile: false,
    currentFps: 0,
    frameCount: 0,
    lastFrameTime: 0,
    fpsHistory: [],
    audioCallCount: 0,
    maxAudioCalls: 10 // Mobile limit
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
  state.respawnPauseUntil = 0;
  state.invincible = false;
  state.invincibleUntil = 0;
  state._startInvincibilityAfterUnpause = false;
  state.screenShake = null;
  state.enemiesKilled = 0;
  state.nextBossAt = 10000;
  
  for (let i = 0; i < 48; i++) {
    state.stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      r: 0.7 + Math.random() * 1.2,
      speed: 0.4 + Math.random() * 0.7
    });
  }
  
  // Reset map scroll position to show beginning of map
  resetMapScroll();
  
  const infoElem = document.getElementById('info');
  if (infoElem) infoElem.textContent = '';
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








// Mobile device detection
export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent) || 
         'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Initialize performance monitoring
export function initializePerformance() {
  state.performance.isMobile = isMobileDevice();
  state.performance.lastFrameTime = performance.now();
  state.performance.maxAudioCalls = state.performance.isMobile ? 5 : 10;
  
  console.log(`Performance initialized - Mobile: ${state.performance.isMobile}`);
}

// Update performance metrics
export function updatePerformanceMetrics(currentTime) {
  const deltaTime = currentTime - state.performance.lastFrameTime;
  state.performance.lastFrameTime = currentTime;
  
  if (deltaTime > 0) {
    state.performance.currentFps = Math.round(1000 / deltaTime);
    state.performance.frameCount++;
    
    // Keep history of last 30 frames for averaging
    state.performance.fpsHistory.push(state.performance.currentFps);
    if (state.performance.fpsHistory.length > 30) {
      state.performance.fpsHistory.shift();
    }
  }
  
  // Reset audio counter each frame
  state.performance.audioCallCount = 0;
}

// Check if audio should be limited
export function shouldLimitAudio() {
  const isFirefoxMobile = navigator.userAgent.includes('Firefox') && 
                         (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android'));
  const isChromeMobile = navigator.userAgent.includes('Chrome') && 
                        (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android'));
  
  if (isFirefoxMobile) {
    // Firefox mobile: More aggressive audio limiting for stability (max 2 per frame)
    return state.performance.audioCallCount >= 2;
  } else if (isChromeMobile) {
    // Chrome mobile: Standard limiting for good audio quality
    return state.performance.audioCallCount >= state.performance.maxAudioCalls;
  }
  
  // Desktop: No audio limiting
  return false;
}

// Increment audio call counter
export function incrementAudioCalls() {
  state.performance.audioCallCount++;
}

// Export the sprite data for use in other modules
export { baseSprites };

