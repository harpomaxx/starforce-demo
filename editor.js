import { baseSprites } from './js/tileset.js';

const TILE_SIZE = 16;
let mapWidth = 16;
let mapHeight = 32;
let mapData = [];
let selectedTile = 'continent_piece'; // Start with basic continent piece
let isMouseDown = false; // Track mouse state for drag painting
let dragMode = 'paint'; // Track whether we're painting or erasing during drag
let loadedSprites = new Map(); // Store loaded JSON sprites
let loadedTemplates = new Map(); // Store loaded template definitions
let showGrid = true; // Grid visibility state
let filteredSprites = []; // Filtered sprite list for search
let currentMode = 'tiles'; // Current editor mode: 'tiles' or 'templates'
let selectedTemplate = null; // Currently selected template for placement
let templatePreviewPosition = null; // Current hover position for template preview

// Selection system variables
let isSelecting = false; // Whether we're in selection mode
let selectionStart = null; // Start position of selection {x, y}
let selectionEnd = null; // End position of selection {x, y}
let selectedArea = null; // Current selected area {x, y, width, height}
let copiedData = null; // Copied tile data
let isShiftPressed = false; // Track shift key state
let lastMousePosition = {x: 0, y: 0}; // Track last mouse position for pasting

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

async function loadTemplate(templateName) {
    if (loadedTemplates.has(templateName)) {
        return loadedTemplates.get(templateName);
    }

    try {
        const response = await fetch(`assets/templates/${templateName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${templateName}`);
        }
        const template = await response.json();
        loadedTemplates.set(templateName, template);
        return template;
    } catch (error) {
        console.warn(`Could not load template ${templateName}:`, error);
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
	'turret-1',    
	'turret-2',    
	'turret-5',    
	'turret-6',    
	'turret-9',    
	'turret-10',    
        'sensor',
        'bigbase_1'
    ];

    const loadPromises = spriteNames.map(name => loadSprite(name));
    await Promise.all(loadPromises);
    console.log('Loaded sprites:', Array.from(loadedSprites.keys()));
}

async function loadAllTemplates() {
    const templateNames = [
        'base_template',
        'dome_template', 
        'turret_template'
    ];

    const loadPromises = templateNames.map(name => loadTemplate(name));
    await Promise.all(loadPromises);
    console.log('Loaded templates:', Array.from(loadedTemplates.keys()));
    
    // Debug: show template details
    loadedTemplates.forEach((template, name) => {
        console.log(`Template ${name}:`, template);
    });
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
    const tilesMode = document.getElementById('tiles-mode');
    const templatesMode = document.getElementById('templates-mode');

    // Load all sprites and templates from JSON files first
    await loadAllSprites();
    await loadAllTemplates();
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
    
    // Mode toggle functionality
    tilesMode.addEventListener('click', () => switchMode('tiles'));
    templatesMode.addEventListener('click', () => switchMode('templates'));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('keyup', handleKeyboard);
    
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
        ctx.strokeStyle = '#555'; // Lighter gray for better visibility
        ctx.lineWidth = 1; // Thicker lines for better visibility
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
    
    // Draw template preview
    if (templatePreviewPosition && selectedTemplate) {
        const canPlace = templatePreviewPosition.x + selectedTemplate.width <= mapWidth && 
                        templatePreviewPosition.y + selectedTemplate.height <= mapHeight;
        
        // Draw template outline
        ctx.strokeStyle = canPlace ? '#00d4ff' : '#ff4757';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
            templatePreviewPosition.x * TILE_SIZE,
            templatePreviewPosition.y * TILE_SIZE,
            selectedTemplate.width * TILE_SIZE,
            selectedTemplate.height * TILE_SIZE
        );
        
        // Add semi-transparent overlay
        ctx.fillStyle = canPlace ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 71, 87, 0.2)';
        ctx.fillRect(
            templatePreviewPosition.x * TILE_SIZE,
            templatePreviewPosition.y * TILE_SIZE,
            selectedTemplate.width * TILE_SIZE,
            selectedTemplate.height * TILE_SIZE
        );
        
        // Draw template tiles with transparency if it can be placed
        if (canPlace) {
            ctx.globalAlpha = 0.6;
            for (let y = 0; y < selectedTemplate.height; y++) {
                for (let x = 0; x < selectedTemplate.width; x++) {
                    const tileName = selectedTemplate.tiles[y][x];
                    if (tileName) {
                        const sprite = getSprite(tileName);
                        if (sprite) {
                            drawSprite(ctx, sprite, 
                                (templatePreviewPosition.x + x) * TILE_SIZE, 
                                (templatePreviewPosition.y + y) * TILE_SIZE, 
                                TILE_SIZE
                            );
                        }
                    }
                }
            }
            ctx.globalAlpha = 1.0;
        }
        
        ctx.setLineDash([]); // Reset line dash
    }
    
    // Draw selection overlay
    if (selectedArea) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
            selectedArea.x * TILE_SIZE,
            selectedArea.y * TILE_SIZE,
            selectedArea.width * TILE_SIZE,
            selectedArea.height * TILE_SIZE
        );
        
        // Add semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(
            selectedArea.x * TILE_SIZE,
            selectedArea.y * TILE_SIZE,
            selectedArea.width * TILE_SIZE,
            selectedArea.height * TILE_SIZE
        );
        
        ctx.setLineDash([]); // Reset line dash
    }
}

function drawTileset() {
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const ctx = tilesetCanvas.getContext('2d');
    ctx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
    
    if (currentMode === 'tiles') {
        drawTiles(ctx);
    } else {
        drawTemplates(ctx);
    }
}

function drawTiles(ctx) {
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
}

function drawTemplates(ctx) {
    let x = 0;
    let y = 0;
    const templateSize = TILE_SIZE * 6; // Even larger size for better visibility
    const spacing = 20;
    const totalTemplateWidth = templateSize + spacing;
    const totalTemplateHeight = templateSize + 40;
    
    const templates = Array.from(loadedTemplates.values());
    console.log(`Drawing ${templates.length} templates`); // Debug
    
    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        console.log(`Drawing template: ${template.name}`); // Debug
        
        // Draw background for template
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, y, templateSize, templateSize);
        
        // Highlight selected template
        if (selectedTemplate && selectedTemplate.id === template.id) {
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 2, y - 2, templateSize + 4, templateSize + 4);
        }
        
        drawTemplatePreview(ctx, template, x, y, templateSize);
        
        // Draw template name label
        ctx.fillStyle = selectedTemplate && selectedTemplate.id === template.id ? '#00d4ff' : '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(template.name, x + templateSize/2, y + templateSize + 20);
        
        x += totalTemplateWidth;
        if (x >= 512 - templateSize) { // Use fixed canvas width
            x = 0;
            y += totalTemplateHeight;
        }
    }
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

function drawTemplatePreview(ctx, template, dx, dy, size) {
    const tileSize = size / Math.max(template.width, template.height);
    
    for (let y = 0; y < template.height; y++) {
        for (let x = 0; x < template.width; x++) {
            const tileName = template.tiles[y][x];
            if (tileName) {
                const sprite = getSprite(tileName);
                if (sprite) {
                    drawSprite(ctx, sprite, dx + x * tileSize, dy + y * tileSize, tileSize);
                } else {
                    console.warn(`Could not find sprite for ${tileName} in template ${template.name}`);
                    // Draw a placeholder rectangle if sprite not found
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(dx + x * tileSize, dy + y * tileSize, tileSize, tileSize);
                }
            }
        }
    }
}

function switchMode(mode) {
    currentMode = mode;
    console.log(`Switching to mode: ${mode}`); // Debug
    
    // Update button states
    const tilesBtn = document.getElementById('tiles-mode');
    const templatesBtn = document.getElementById('templates-mode');
    
    if (mode === 'tiles') {
        tilesBtn.classList.add('active');
        templatesBtn.classList.remove('active');
        selectedTemplate = null;
        templatePreviewPosition = null; // Clear any template preview
    } else {
        tilesBtn.classList.remove('active');
        templatesBtn.classList.add('active');
        selectedTile = null; // Clear tile selection when switching to templates
    }
    
    // Update search placeholder
    const searchInput = document.getElementById('tile-search');
    searchInput.placeholder = mode === 'tiles' ? '🔍 Search tiles...' : '🔍 Search templates...';
    
    console.log(`Templates loaded: ${loadedTemplates.size}`); // Debug
    drawTileset();
}

function handleMapMouseMove(event) {
    const mapCanvas = document.getElementById('map-canvas');
    const rect = mapCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) / TILE_SIZE);
    const statusBar = document.getElementById('status-bar');
    const currentTile = (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) ? mapData[y][x] : null;
    
    // Update last mouse position for pasting
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        lastMousePosition = {x, y};
    }
    
    // Update status bar with selection info
    let statusText = `Position: ${x}, ${y} | Current: ${currentTile || 'empty'}`;
    
    if (currentMode === 'templates' && selectedTemplate) {
        statusText += ` | Template: ${selectedTemplate.name} (${selectedTemplate.width}x${selectedTemplate.height})`;
        // Check if template fits at current position
        if (x + selectedTemplate.width > mapWidth || y + selectedTemplate.height > mapHeight) {
            statusText += ' | ⚠️ DOES NOT FIT';
        }
    } else {
        statusText += ` | Selected: ${selectedTile}`;
    }
    
    if (selectedArea) {
        statusText += ` | Selection: ${selectedArea.width}x${selectedArea.height}`;
    }
    if (copiedData) {
        statusText += ` | Copied: ${copiedData.width}x${copiedData.height}`;
    }
    statusBar.textContent = statusText;
    
    // Handle template preview
    if (currentMode === 'templates' && selectedTemplate && x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        if (!templatePreviewPosition || templatePreviewPosition.x !== x || templatePreviewPosition.y !== y) {
            templatePreviewPosition = {x, y};
            drawMap(); // Redraw to show template preview
        }
    } else if (templatePreviewPosition) {
        templatePreviewPosition = null;
        drawMap(); // Clear preview
    }
    
    // Handle selection mode
    if (isSelecting && selectionStart && x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        selectionEnd = {x, y};
        updateSelectedArea();
        drawMap(); // Redraw to show selection
        return;
    }
    
    // If mouse is down and not selecting, paint while dragging
    if (isMouseDown && !isSelecting && x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        paintTile(x, y, event);
    }
}

function handleMapMouseDown(event) {
    const mapCanvas = document.getElementById('map-canvas');
    const rect = mapCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) / TILE_SIZE);
    
    // Check if we're starting a selection (Shift + Left Click)
    if (event.button === 0 && isShiftPressed && x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        isSelecting = true;
        selectionStart = {x, y};
        selectionEnd = {x, y};
        selectedArea = null;
        updateSelectedArea();
        drawMap();
        event.preventDefault();
        return;
    }
    
    // Clear selection if clicking without shift
    if (event.button === 0 && !isShiftPressed && selectedArea) {
        selectedArea = null;
        drawMap();
    }
    
    isMouseDown = true;
    
    // Set drag mode based on which button was pressed
    if (event.button === 0) { // Left mouse button
        dragMode = 'paint';
    } else if (event.button === 2) { // Right mouse button
        dragMode = 'erase';
    }
    
    // Paint immediately on mouse down if not selecting
    if (!isSelecting && x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        paintTile(x, y, event);
    }
    
    // Prevent context menu on right click
    event.preventDefault();
}

function handleMapMouseUp(event) {
    if (isSelecting) {
        isSelecting = false;
        // Finalize selection
        if (selectionStart && selectionEnd) {
            updateSelectedArea();
            drawMap();
        }
    }
    isMouseDown = false;
}

function handleMapMouseLeave(event) {
    isMouseDown = false; // Stop painting when mouse leaves canvas
    
    // Clear template preview when mouse leaves canvas
    if (templatePreviewPosition) {
        templatePreviewPosition = null;
        drawMap();
    }
}

function paintTile(x, y, event) {
    if (currentMode === 'templates' && selectedTemplate) {
        // Handle template placement
        if (event.type === 'mousedown' && event.button === 0) { // Left click only for templates
            placeTemplate(x, y);
        }
        return;
    }
    
    // Handle normal tile painting
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

function placeTemplate(startX, startY) {
    if (!selectedTemplate) return;
    
    // Check if template fits within map bounds
    if (startX + selectedTemplate.width > mapWidth || 
        startY + selectedTemplate.height > mapHeight) {
        console.warn('Template does not fit at this position');
        return;
    }
    
    // Place all tiles from the template
    for (let y = 0; y < selectedTemplate.height; y++) {
        for (let x = 0; x < selectedTemplate.width; x++) {
            const tileName = selectedTemplate.tiles[y][x];
            if (tileName) {
                mapData[startY + y][startX + x] = tileName;
            }
        }
    }
    
    drawMap();
    console.log(`Placed template ${selectedTemplate.name} at ${startX}, ${startY}`);
}

function handleTilesetClick(event) {
    const tilesetCanvas = document.getElementById('tileset-canvas');
    const rect = tilesetCanvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    if (currentMode === 'tiles') {
        handleTileClick(clickX, clickY);
    } else {
        handleTemplateClick(clickX, clickY);
    }
}

function handleTileClick(clickX, clickY) {
    const tileSize = TILE_SIZE * 3; // Match the display size
    const spacing = 12;
    const totalTileWidth = tileSize + spacing;
    const totalTileHeight = tileSize + 24;
    
    const x = Math.floor(clickX / totalTileWidth);
    const y = Math.floor(clickY / totalTileHeight);
    const tilesPerRow = Math.floor(512 / totalTileWidth); // Use canvas width
    const index = y * tilesPerRow + x;
    
    // Use filtered sprites or all sprites
    const spritesToUse = filteredSprites.length > 0 ? filteredSprites : getAllSpriteNames();
    
    if (index < spritesToUse.length) {
        const newSelectedTile = spritesToUse[index];
        if (newSelectedTile !== selectedTile) {
            selectedTile = newSelectedTile;
            selectedTemplate = null; // Clear template selection
            console.log('Selected tile:', selectedTile);
            drawTileset(); // Only redraw if selection actually changed
        }
    }
}

function handleTemplateClick(clickX, clickY) {
    const templateSize = TILE_SIZE * 6; // Match the drawing size
    const spacing = 20;
    const totalTemplateWidth = templateSize + spacing;
    const totalTemplateHeight = templateSize + 40; // Match the drawing height
    
    const x = Math.floor(clickX / totalTemplateWidth);
    const y = Math.floor(clickY / totalTemplateHeight);
    const templatesPerRow = Math.floor(512 / totalTemplateWidth); // Use canvas width
    const index = y * templatesPerRow + x;
    
    const templates = Array.from(loadedTemplates.values());
    console.log(`Template click at ${clickX}, ${clickY} -> grid ${x}, ${y} -> index ${index}`); // Debug
    
    if (index < templates.length) {
        const newSelectedTemplate = templates[index];
        if (!selectedTemplate || selectedTemplate.id !== newSelectedTemplate.id) {
            selectedTemplate = newSelectedTemplate;
            selectedTile = null; // Clear tile selection
            console.log('Selected template:', selectedTemplate.name);
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

function updateSelectedArea() {
    if (!selectionStart || !selectionEnd) {
        selectedArea = null;
        return;
    }
    
    const minX = Math.min(selectionStart.x, selectionEnd.x);
    const maxX = Math.max(selectionStart.x, selectionEnd.x);
    const minY = Math.min(selectionStart.y, selectionEnd.y);
    const maxY = Math.max(selectionStart.y, selectionEnd.y);
    
    selectedArea = {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };
}

function copySelection() {
    if (!selectedArea) {
        alert('No area selected. Hold Shift and drag to select an area first.');
        return;
    }
    
    copiedData = {
        width: selectedArea.width,
        height: selectedArea.height,
        tiles: []
    };
    
    // Copy the tile data
    for (let y = 0; y < selectedArea.height; y++) {
        copiedData.tiles[y] = [];
        for (let x = 0; x < selectedArea.width; x++) {
            const mapX = selectedArea.x + x;
            const mapY = selectedArea.y + y;
            copiedData.tiles[y][x] = (mapX < mapWidth && mapY < mapHeight) ? mapData[mapY][mapX] : null;
        }
    }
    
    console.log(`Copied ${selectedArea.width}x${selectedArea.height} area`);
}

function pasteSelection(targetX, targetY) {
    if (!copiedData) {
        alert('Nothing to paste. Copy an area first with Ctrl+C.');
        return;
    }
    
    // Paste the tiles
    for (let y = 0; y < copiedData.height; y++) {
        for (let x = 0; x < copiedData.width; x++) {
            const mapX = targetX + x;
            const mapY = targetY + y;
            
            if (mapX >= 0 && mapX < mapWidth && mapY >= 0 && mapY < mapHeight) {
                mapData[mapY][mapX] = copiedData.tiles[y][x];
            }
        }
    }
    
    drawMap();
    console.log(`Pasted ${copiedData.width}x${copiedData.height} area at ${targetX}, ${targetY}`);
}

function deleteSelection() {
    if (!selectedArea) {
        alert('No area selected. Hold Shift and drag to select an area first.');
        return;
    }
    
    // Clear the selected area
    for (let y = selectedArea.y; y < selectedArea.y + selectedArea.height; y++) {
        for (let x = selectedArea.x; x < selectedArea.x + selectedArea.width; x++) {
            if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
                mapData[y][x] = null;
            }
        }
    }
    
    drawMap();
    console.log(`Deleted ${selectedArea.width}x${selectedArea.height} area`);
}

function handleKeyboard(event) {
    // Track shift key state
    if (event.type === 'keydown' && event.key === 'Shift') {
        isShiftPressed = true;
    }
    if (event.type === 'keyup' && event.key === 'Shift') {
        isShiftPressed = false;
    }
    
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
            case 'c':
                event.preventDefault();
                copySelection();
                break;
            case 'v':
                event.preventDefault();
                // Paste at last mouse position or center if no position recorded
                const pasteX = lastMousePosition.x || Math.floor(mapWidth / 2);
                const pasteY = lastMousePosition.y || Math.floor(mapHeight / 2);
                pasteSelection(pasteX, pasteY);
                break;
            case 'a':
                event.preventDefault();
                // Select all
                selectedArea = {x: 0, y: 0, width: mapWidth, height: mapHeight};
                drawMap();
                break;
        }
    } else {
        switch (event.key.toLowerCase()) {
            case 'delete':
            case 'backspace':
                if (event.target.tagName !== 'INPUT') {
                    if (selectedArea) {
                        deleteSelection();
                    } else {
                        clearMap();
                    }
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
                } else if (selectedArea) {
                    // Clear selection
                    selectedArea = null;
                    drawMap();
                }
                break;
        }
    }
}

initializeEditor();
