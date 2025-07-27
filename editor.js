import { baseSprites } from './js/tileset.js';

const TILE_SIZE = 16;
let mapWidth = 16;
let mapHeight = 32;
let mapData = [];
let selectedTile = 'continent_piece'; // Start with basic continent piece
let isMouseDown = false; // Track mouse state for drag painting
let dragMode = 'paint'; // Track whether we're painting or erasing during drag
let loadedSprites = new Map(); // Store loaded JSON sprites
let showGrid = true; // Grid visibility state
let filteredSprites = []; // Filtered sprite list for search

async function loadSprite(spriteName) {
    if (loadedSprites.has(spriteName)) {
        return loadedSprites.get(spriteName);
    }

    try {
        const response = await fetch(`assets/sprites/${spriteName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load sprite: ${spriteName}`);
        }
        const sprite = await response.json();
        loadedSprites.set(spriteName, sprite);
        return sprite;
    } catch (error) {
        console.warn(`Could not load sprite ${spriteName} from JSON, using fallback:`, error);
        return null;
    }
}

async function loadAllSprites() {
    const spriteNames = [
        'continent_piece',
        'hub',
        'comm',
        'solar',
        'mining',
        'turret',
        'fuel',
	'base-15',
	'base-14',
	'base-13',
	'base-12',
	'base-11',
	'base-10',
	'base-9',
	'base-8',
	'base-7',
	'base-6',
	'base-5',
	'base-4',
	'base-3',
	'base-2',
	'base-1',
	'base-0',
	'dome-15',
	'dome-14',
	'dome-13',
	'dome-12', 
	'dome-11',
	'dome-10',
	'dome-9',
	'dome-8',
	'dome-7',
	'dome-6',
	'dome-5',
	'dome-4',
	'dome-3',
	'dome-2',
	'dome-1',
	'dome-0',
        'sensor',
        'bigbase_1'
    ];

    const loadPromises = spriteNames.map(name => loadSprite(name));
    await Promise.all(loadPromises);
    console.log('Loaded sprites:', Array.from(loadedSprites.keys()));
}

function getSprite(spriteName) {
    // Try JSON sprites first, fallback to old system
    const jsonSprite = loadedSprites.get(spriteName);
    if (jsonSprite) {
        return jsonSprite.sprite;
    }
    
    // Fallback to old tileset system
    const fallbackSprite = baseSprites[spriteName];
    return fallbackSprite ? fallbackSprite.sprite : null;
}

async function initializeEditor() {
    const mapCanvas = document.getElementById('map-canvas');
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const resizeButton = document.getElementById('resize-button');
    const exportButton = document.getElementById('export-button');
    const loadButton = document.getElementById('load-button');
    const clearButton = document.getElementById('clear-button');
    const gridToggle = document.getElementById('grid-toggle');
    const helpButton = document.getElementById('help-button');
    const closeHelp = document.getElementById('close-help');
    const tileSearch = document.getElementById('tile-search');

    // Load all sprites from JSON files first
    await loadAllSprites();
    initializeFilteredSprites();

    resizeMap();

    // Map canvas events
    mapCanvas.addEventListener('mousemove', handleMapMouseMove);
    mapCanvas.addEventListener('mousedown', handleMapMouseDown);
    mapCanvas.addEventListener('mouseup', handleMapMouseUp);
    mapCanvas.addEventListener('mouseleave', handleMapMouseLeave);
    mapCanvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // Tileset canvas events
    tilesetCanvas.addEventListener('click', handleTilesetClick);
    
    // Button events
    resizeButton.addEventListener('click', resizeMap);
    exportButton.addEventListener('click', exportMap);
    loadButton.addEventListener('change', loadMap);
    clearButton.addEventListener('click', clearMap);
    gridToggle.addEventListener('click', toggleGrid);
    helpButton.addEventListener('click', toggleHelp);
    closeHelp.addEventListener('click', toggleHelp);
    
    // Search functionality
    tileSearch.addEventListener('input', handleTileSearch);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Close help overlay when clicking outside
    document.getElementById('help-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'help-overlay') {
            toggleHelp();
        }
    });

    drawTileset();
    drawMap();
}

function resizeMap() {
    mapWidth = parseInt(document.getElementById('map-width').value);
    mapHeight = parseInt(document.getElementById('map-height').value);
    mapData = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill(null));
    const mapCanvas = document.getElementById('map-canvas');
    mapCanvas.width = mapWidth * TILE_SIZE;
    mapCanvas.height = mapHeight * TILE_SIZE;
    drawMap();
}

function drawMap() {
    const mapCanvas = document.getElementById('map-canvas');
    const ctx = mapCanvas.getContext('2d');
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Draw grid if enabled
    if (showGrid) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= mapWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE, 0);
            ctx.lineTo(x * TILE_SIZE, mapHeight * TILE_SIZE);
            ctx.stroke();
        }
        for (let y = 0; y <= mapHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * TILE_SIZE);
            ctx.lineTo(mapWidth * TILE_SIZE, y * TILE_SIZE);
            ctx.stroke();
        }
    }

    // Draw tiles
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tile = mapData[y][x];
            if (tile) {
                const sprite = getSprite(tile);
                if (sprite) {
                    drawSprite(ctx, sprite, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}

function drawTileset() {
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const ctx = tilesetCanvas.getContext('2d');
    ctx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
    
    let x = 0;
    let y = 0;
    const tileSize = TILE_SIZE * 3; // Increased from 2 to 3 for larger sprites
    const spacing = 12; // Increased spacing proportionally
    const totalTileWidth = tileSize + spacing;
    const totalTileHeight = tileSize + 24; // Increased for larger text spacing
    
    // Use filtered sprites or all sprites
    const spritesToDraw = filteredSprites.length > 0 ? filteredSprites : getAllSpriteNames();
    
    for (let i = 0; i < spritesToDraw.length; i++) {
        const spriteName = spritesToDraw[i];
        const sprite = getSprite(spriteName);
        if (sprite) {
            // Highlight selected tile
            if (spriteName === selectedTile) {
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 2, y - 2, tileSize + 4, tileSize + 4);
            }
            
            drawSprite(ctx, sprite, x, y, tileSize);
            
            // Draw sprite name label
            ctx.fillStyle = spriteName === selectedTile ? '#00d4ff' : '#ffffff';
            ctx.font = '10px monospace'; // Slightly larger font
            ctx.textAlign = 'center';
            ctx.fillText(spriteName.substring(0, 12), x + tileSize/2, y + tileSize + 14); // More characters and better positioning
            
            x += totalTileWidth;
            if (x >= tilesetCanvas.width - tileSize) {
                x = 0;
                y += totalTileHeight;
            }
        }
    }
    
    // Don't resize canvas during normal operations to prevent jumping
    // Only set height once during initialization or search changes
}

function drawSprite(ctx, sprite, dx, dy, size) {
    // All sprites are now standardized to 16x16
    const pixelSize = size / 16;
    
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const color = sprite[y][x];
            // Skip transparent pixels
            if (color && color !== '#00000000') {
                ctx.fillStyle = color;
                ctx.fillRect(dx + x * pixelSize, dy + y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

function handleMapMouseMove(event) {
    const mapCanvas = document.getElementById('map-canvas');
    const rect = mapCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) / TILE_SIZE);
    const statusBar = document.getElementById('status-bar');
    const currentTile = (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) ? mapData[y][x] : null;
    statusBar.textContent = `Position: ${x}, ${y} | Current: ${currentTile || 'empty'} | Selected: ${selectedTile}`;
    
    // If mouse is down, paint while dragging
    if (isMouseDown && x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        paintTile(x, y, event);
    }
}

function handleMapMouseDown(event) {
    isMouseDown = true;
    
    // Set drag mode based on which button was pressed
    if (event.button === 0) { // Left mouse button
        dragMode = 'paint';
    } else if (event.button === 2) { // Right mouse button
        dragMode = 'erase';
    }
    
    const mapCanvas = document.getElementById('map-canvas');
    const rect = mapCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) / TILE_SIZE);
    
    // Paint immediately on mouse down
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        paintTile(x, y, event);
    }
    
    // Prevent context menu on right click
    event.preventDefault();
}

function handleMapMouseUp(event) {
    isMouseDown = false;
}

function handleMapMouseLeave(event) {
    isMouseDown = false; // Stop painting when mouse leaves canvas
}

function paintTile(x, y, event) {
    let tileValue = null;
    
    if (event.type === 'mousedown') {
        // Direct click
        if (event.button === 0) { // Left click
            tileValue = selectedTile;
        } else if (event.button === 2) { // Right click
            tileValue = null; // Erase
        }
    } else if (event.type === 'mousemove' && isMouseDown) {
        // Drag painting - use the mode set when mouse was first pressed
        tileValue = dragMode === 'paint' ? selectedTile : null;
    }
    
    if (tileValue !== undefined) {
        mapData[y][x] = tileValue;
        drawMap();
    }
}

function handleTilesetClick(event) {
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const rect = tilesetCanvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const tileSize = TILE_SIZE * 3; // Match the display size
    const spacing = 12;
    const totalTileWidth = tileSize + spacing;
    const totalTileHeight = tileSize + 24;
    
    const x = Math.floor(clickX / totalTileWidth);
    const y = Math.floor(clickY / totalTileHeight);
    const tilesPerRow = Math.floor(tilesetCanvas.width / totalTileWidth);
    const index = y * tilesPerRow + x;
    
    // Use filtered sprites or all sprites
    const spritesToUse = filteredSprites.length > 0 ? filteredSprites : getAllSpriteNames();
    
    if (index < spritesToUse.length) {
        const newSelectedTile = spritesToUse[index];
        if (newSelectedTile !== selectedTile) {
            selectedTile = newSelectedTile;
            console.log('Selected tile:', selectedTile);
            drawTileset(); // Only redraw if selection actually changed
        }
    }
}

function exportMap() {
    const map = {
        width: mapWidth,
        height: mapHeight,
        tiles: mapData
    };
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starforce_map_16x32.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadMap(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const map = JSON.parse(e.target.result);
            if (map.width && map.height && map.tiles) {
                mapWidth = map.width;
                mapHeight = map.height;
                mapData = map.tiles;
                
                // Update the input fields
                document.getElementById('map-width').value = mapWidth;
                document.getElementById('map-height').value = mapHeight;
                
                // Update canvas size
                const mapCanvas = document.getElementById('map-canvas');
                mapCanvas.width = mapWidth * TILE_SIZE;
                mapCanvas.height = mapHeight * TILE_SIZE;
                
                drawMap();
                console.log(`Loaded map: ${mapWidth}x${mapHeight}`);
            } else {
                alert('Invalid map file format');
            }
        } catch (error) {
            alert('Error loading map file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function clearMap() {
    if (confirm('Clear the entire map? This cannot be undone.')) {
        mapData = Array(mapHeight).fill(null).map(() => Array(mapWidth).fill(null));
        drawMap();
    }
}

function getAllSpriteNames() {
    return Array.from(new Set([
        ...loadedSprites.keys(),
        ...Object.keys(baseSprites)
    ]));
}

function initializeFilteredSprites() {
    filteredSprites = getAllSpriteNames();
    calculateTilesetHeight();
}

function calculateTilesetHeight() {
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const tileSize = TILE_SIZE * 3; // Match the display size
    const spacing = 12;
    const totalTileWidth = tileSize + spacing;
    const totalTileHeight = tileSize + 24;
    
    const spritesToDraw = filteredSprites.length > 0 ? filteredSprites : getAllSpriteNames();
    const tilesPerRow = Math.floor(tilesetCanvas.width / totalTileWidth);
    const rows = Math.ceil(spritesToDraw.length / tilesPerRow);
    const requiredHeight = rows * totalTileHeight;
    
    tilesetCanvas.height = Math.max(512, requiredHeight + 50);
}

function handleTileSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredSprites = getAllSpriteNames();
    } else {
        const allSprites = getAllSpriteNames();
        filteredSprites = allSprites.filter(name => 
            name.toLowerCase().includes(searchTerm)
        );
    }
    
    calculateTilesetHeight(); // Recalculate height for new sprite set
    drawTileset();
}

function toggleGrid() {
    showGrid = !showGrid;
    const gridButton = document.getElementById('grid-toggle');
    gridButton.textContent = showGrid ? '⊞ Grid' : '⊡ Grid';
    drawMap();
}

function toggleHelp() {
    const helpOverlay = document.getElementById('help-overlay');
    const isVisible = helpOverlay.style.display !== 'none';
    helpOverlay.style.display = isVisible ? 'none' : 'flex';
}

function handleKeyboard(event) {
    // Don't trigger shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT') {
        return;
    }
    
    if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
            case 's':
                event.preventDefault();
                exportMap();
                break;
            case 'o':
                event.preventDefault();
                document.getElementById('load-button').click();
                break;
            case 'r':
                event.preventDefault();
                resizeMap();
                break;
        }
    } else {
        switch (event.key.toLowerCase()) {
            case 'delete':
            case 'backspace':
                if (event.target.tagName !== 'INPUT') {
                    clearMap();
                }
                break;
            case 'g':
                toggleGrid();
                break;
            case 'h':
                toggleHelp();
                break;
            case 'escape':
                const helpOverlay = document.getElementById('help-overlay');
                if (helpOverlay.style.display !== 'none') {
                    toggleHelp();
                }
                break;
        }
    }
}

initializeEditor();
