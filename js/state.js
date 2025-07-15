export const CANVAS_WIDTH = 400, CANVAS_HEIGHT = 600;
export const PLAYER_WIDTH = 32, PLAYER_HEIGHT = 24, PLAYER_SPEED = 4;
export const BULLET_RADIUS = 4, BULLET_SPEED = 7, SHOOT_DELAY = 200;
export const ENEMY_WIDTH = 32, ENEMY_HEIGHT = 20, ENEMY_SPEED_MIN = 1.2, ENEMY_SPEED_MAX = 2.6;
export const ENEMY_SPAWN_DELAY = 2000; // Start with 2 seconds
export const BOMB_RADIUS = 240, BOMB_COOLDOWN = 2500, BOMB_MAX = 2;

// Direct map scrolling system
export const TILE_SIZE = 24; // Size of each map tile in pixels
export const MAP_SCROLL_SPEED = 0.51; // How fast the map scrolls down
let mapScrollY = 0 ; // Current scroll position in pixels (positive values, 0 = start of map)
//let  mapScrollY = -(staticMapData.height - 1) * TILE_SIZE -1
// mapScrollRow removed - no longer needed with new logic

// Viewport Tile Buffer System
class ViewportTileBuffer {
  constructor() {
    this.tilesPerRow = Math.ceil(CANVAS_WIDTH / TILE_SIZE);   // ~17 tiles
    this.tilesPerCol = Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1; // ~25 tiles + 1 for smooth scrolling
    
    // Buffer that represents exactly what's visible on canvas
    this.visibleTiles = Array(this.tilesPerCol).fill(null)
                            .map(() => Array(this.tilesPerRow).fill(null));
    
    // Transition state
    this.transitionActive = false;
    this.nextMapData = null;
    this.transitionScrollY = 0;
  }
  
  getTileAt(col, row) {
    if (row >= 0 && row < this.tilesPerCol && col >= 0 && col < this.tilesPerRow) {
      return this.visibleTiles[row][col];
    }
    return null;
  }
  
  setTileAt(col, row, tileType) {
    if (row >= 0 && row < this.tilesPerCol && col >= 0 && col < this.tilesPerRow) {
      this.visibleTiles[row][col] = tileType;
    }
  }
  
  clear() {
    for (let row = 0; row < this.tilesPerCol; row++) {
      for (let col = 0; col < this.tilesPerRow; col++) {
        this.visibleTiles[row][col] = null;
      }
    }
  }
  
  // Load a section of map data into the buffer
  loadMapSection(mapData, bufferStartRow, mapStartRow, numRows) {
    if (!mapData || !mapData.tiles) return;
    
    for (let row = 0; row < numRows; row++) {
      const bufferRow = bufferStartRow + row;
      const sourceRow = mapStartRow + row;
      
      if (bufferRow >= this.tilesPerCol || sourceRow >= mapData.height || sourceRow < 0) {
        continue;
      }
      
      for (let col = 0; col < this.tilesPerRow && col < mapData.width; col++) {
        const tileType = mapData.tiles[sourceRow][col];
        this.setTileAt(col, bufferRow, tileType);
      }
    }
  }
  
  // Update buffer contents based on current scroll position
  updateBuffer(currentMapData, scrollY, scrollOffset) {
    if (!currentMapData) return;
    
    this.clear();
    
    // Calculate which rows from the current map should be visible
    const currentMapPixelY = scrollY + scrollOffset;
    const startRowInMap = Math.floor(currentMapPixelY / TILE_SIZE);
    const mapRowsToShow = Math.min(this.tilesPerCol, currentMapData.height - startRowInMap);
    
    if (!this.transitionActive) {
      // Normal case: just show current map
      if (startRowInMap >= 0 && mapRowsToShow > 0) {
        const actualMapStartRow = (currentMapData.height - 1) - startRowInMap - (mapRowsToShow - 1);
        this.loadMapSection(currentMapData, 0, Math.max(0, actualMapStartRow), mapRowsToShow);
      }
    } else {
      // Transition case: mix current and next map
      const transitionProgress = Math.max(0, -scrollY / TILE_SIZE);
      const nextMapRows = Math.floor(transitionProgress);
      const currentMapRows = this.tilesPerCol - nextMapRows;
      
      // Load current map portion (bottom part of buffer)
      if (currentMapRows > 0 && startRowInMap >= 0) {
        const actualMapStartRow = Math.max(0, (currentMapData.height - 1) - startRowInMap - (currentMapRows - 1));
        this.loadMapSection(currentMapData, nextMapRows, actualMapStartRow, currentMapRows);
      }
      
      // Load next map portion (top part of buffer)
      if (nextMapRows > 0 && this.nextMapData) {
        const nextMapStartRow = Math.max(0, this.nextMapData.height - nextMapRows);
        this.loadMapSection(this.nextMapData, 0, nextMapStartRow, nextMapRows);
      }
    }
  }
  
  // Start a transition to the next map
  startTransition(nextMapData) {
    this.transitionActive = true;
    this.nextMapData = nextMapData;
    this.transitionScrollY = mapScrollY;
  }
  
  // Complete the transition
  completeTransition() {
    this.transitionActive = false;
    this.nextMapData = null;
    this.transitionScrollY = 0;
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
  const mapNames = ["asteroids", "nebula","bigbase"];
  
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

// Initialize the viewport buffer
let viewportBuffer = null;

// Initialize viewport buffer
export function initializeViewportBuffer() {
  viewportBuffer = new ViewportTileBuffer();
  return viewportBuffer;
}

// Get viewport buffer (for rendering)
export function getViewportBuffer() {
  return viewportBuffer;
}


// Map cycling order for automatic progression
const mapCyclingOrder = ["asteroids", "nebula","bigbase"];
let currentMapIndex = 0;

// Direct map scrolling functions
export function updateMapScroll() {
  if (!staticMapData || !viewportBuffer) return;
  
  // Update scroll position (increase to move through map forward)
  mapScrollY -= MAP_SCROLL_SPEED;
  console.log(`ScrollY: ${mapScrollY}`);
  
  // Check if we're approaching the end of current map (start transition)
  const mapEndThreshold = -(staticMapData.height * TILE_SIZE) + CANVAS_HEIGHT;
  if (mapScrollY <= mapEndThreshold && !viewportBuffer.transitionActive) {
    // Prepare next map for transition
    const nextMapIndex = (currentMapIndex + 1) % mapCyclingOrder.length;
    const nextMapName = mapCyclingOrder[nextMapIndex];
    
    if (availableMaps[nextMapName]) {
      console.log(`Starting transition to map: ${nextMapName} at scrollY: ${mapScrollY}`);
      viewportBuffer.startTransition(availableMaps[nextMapName]);
    }
  }
  
  // Check if we need to complete the transition
  // Wait until we've scrolled past the current map completely and started showing the next map
  const currentMapCompleteThreshold = -(staticMapData.height * TILE_SIZE);
  
  if (viewportBuffer.transitionActive && mapScrollY <= currentMapCompleteThreshold) {
    // The current map is now completely off-screen, switch to next map
    const nextMapIndex = (currentMapIndex + 1) % mapCyclingOrder.length;
    const nextMapName = mapCyclingOrder[nextMapIndex];
    
    if (availableMaps[nextMapName]) {
      currentMapIndex = nextMapIndex;
      currentMapName = nextMapName;
      staticMapData = availableMaps[nextMapName];
      
      // Continue scrolling from the top of the new map
      // Adjust mapScrollY to represent position in the new map
      mapScrollY = mapScrollY + (staticMapData.height * TILE_SIZE);
      
      // Complete the transition
      viewportBuffer.completeTransition();
      
      console.log(`Completed transition to map: ${nextMapName} at scrollY: ${mapScrollY}`);
    }
  }
  
  // Update viewport buffer with current state
  const scrollOffset = getMapScrollOffset();
  viewportBuffer.updateBuffer(staticMapData, mapScrollY, scrollOffset);
}

export function getMapTileAt(x, y) {
  if (!viewportBuffer) return null;
  
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  
  return viewportBuffer.getTileAt(col, row);
}

export function getMapScrollOffset() {
  return mapScrollY % TILE_SIZE ; // Adjust this based on how you want to use the scroll offset
  //return Math.abs(mapScrollY) % TILE_SIZE;
  //return (TILE_SIZE - (mapScrollY % TILE_SIZE)) % TILE_SIZE;     
}

export function resetMapScroll() {
  currentMapIndex = 0;
  if (availableMaps[mapCyclingOrder[0]]) {
    currentMapName = mapCyclingOrder[0];
    staticMapData = availableMaps[mapCyclingOrder[0]];
    // Start from the beginning of the map (row 31 first)
    mapScrollY = 0;
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
    
    // Initialize viewport buffer
    if (!viewportBuffer) {
      initializeViewportBuffer();
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

