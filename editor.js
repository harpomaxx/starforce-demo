import { baseSprites } from './js/tileset.js';

const TILE_SIZE = 16;
let mapWidth = 16;
let mapHeight = 32;
let mapData = [];
let selectedTile = 'continent_piece'; // Start with basic continent piece
let isMouseDown = false; // Track mouse state for drag painting
let dragMode = 'paint'; // Track whether we're painting or erasing during drag

function initializeEditor() {
    const mapCanvas = document.getElementById('map-canvas');
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const resizeButton = document.getElementById('resize-button');
    const exportButton = document.getElementById('export-button');
    const loadButton = document.getElementById('load-button');
    const clearButton = document.getElementById('clear-button');

    resizeMap();

    mapCanvas.addEventListener('mousemove', handleMapMouseMove);
    mapCanvas.addEventListener('mousedown', handleMapMouseDown);
    mapCanvas.addEventListener('mouseup', handleMapMouseUp);
    mapCanvas.addEventListener('mouseleave', handleMapMouseLeave); // Stop painting when leaving canvas
    mapCanvas.addEventListener('contextmenu', e => e.preventDefault()); // Disable context menu
    tilesetCanvas.addEventListener('click', handleTilesetClick);
    resizeButton.addEventListener('click', resizeMap);
    exportButton.addEventListener('click', exportMap);
    loadButton.addEventListener('change', loadMap);
    clearButton.addEventListener('click', clearMap);

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

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tile = mapData[y][x];
            if (tile && baseSprites[tile]) {
                drawSprite(ctx, baseSprites[tile].sprite, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function drawTileset() {
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const ctx = tilesetCanvas.getContext('2d');
    let x = 0;
    let y = 0;
    for (const key in baseSprites) {
        drawSprite(ctx, baseSprites[key].sprite, x, y, TILE_SIZE * 2);
        x += TILE_SIZE * 2;
        if (x >= tilesetCanvas.width) {
            x = 0;
            y += TILE_SIZE * 2;
        }
    }
}

function drawSprite(ctx, sprite, dx, dy, size) {
    const pixelSize = size / 16;
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            ctx.fillStyle = sprite[y][x];
            ctx.fillRect(dx + x * pixelSize, dy + y * pixelSize, pixelSize, pixelSize);
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
    const x = Math.floor((event.clientX - rect.left) / (TILE_SIZE * 2));
    const y = Math.floor((event.clientY - rect.top) / (TILE_SIZE * 2));
    const tilesPerRow = Math.floor(tilesetCanvas.width / (TILE_SIZE * 2));
    const index = y * tilesPerRow + x;
    const keys = Object.keys(baseSprites);
    if (index < keys.length) {
        selectedTile = keys[index];
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

initializeEditor();
