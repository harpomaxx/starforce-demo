# Tile-Based Viewport System Documentation

## Overview

The tile-based viewport system is a streamlined approach to managing seamless map transitions in the Star Force game. It replaces the complex pixel-based calculations with simple, discrete tile operations that eliminate coordinate system errors and provide smooth scrolling experiences.

## Core Concepts

### 1. Tile Buffer Architecture

The system uses a circular buffer of tiles that represents exactly what's visible on screen plus one extra row for smooth scrolling.

```
Buffer Layout (32 rows × 17 columns):
┌─────────────────────────────────────┐
│ Row 0:  [newest tiles - top edge]   │ ← New tiles added here
│ Row 1:  [........................]   │
│ Row 2:  [........................]   │
│ ...     [........................]   │
│ Row 30: [........................]   │
│ Row 31: [oldest tiles - bottom]     │ ← Tiles removed from here
└─────────────────────────────────────┘
```

### 2. Shift-and-Add Mechanism

Instead of complex coordinate calculations, the system uses simple array operations:

```
Before Shift:          After Shift:           After Add:
[A][B][C][D]          [?][A][B][C]          [X][A][B][C]
[E][F][G][H]    →     [?][E][F][G]    →     [Y][E][F][G]
[I][J][K][L]          [?][I][J][K]          [Z][I][J][K]
[M][N][O][P]          [?][M][N][O]          [W][M][N][O]
```

## TileBuffer Class Structure

### Core Properties

```javascript
class TileBuffer {
  constructor(height = 32) {
    this.height = height;           // Buffer height (32 rows)
    this.tiles = Array(height);    // Circular tile buffer
    this.currentMap = null;         // Current map data
    this.currentMapRow = 0;         // Current row in map
    this.nextMap = null;            // Next map for transitions
    this.pixelOffset = 0;           // Sub-tile scrolling offset
  }
}
```

### Key Methods

#### `shiftAndAdd()`
The heart of the scrolling system:

```javascript
shiftAndAdd() {
  // 1. Shift everything down (toward higher indices)
  for (let i = this.height - 1; i > 0; i--) {
    this.tiles[i] = this.tiles[i - 1];
  }
  
  // 2. Add new row at top (buffer[0])
  const newRow = this.getCurrentMapRow();
  this.tiles[0] = newRow;
  
  // 3. Update map position
  this.currentMapRow--;
}
```

#### `update(scrollSpeed)`
Manages pixel-perfect scrolling:

```javascript
update(scrollSpeed) {
  this.pixelOffset += scrollSpeed;
  
  // When we've scrolled a full tile (24 pixels)
  if (this.pixelOffset >= TILE_SIZE) {
    this.pixelOffset -= TILE_SIZE;  // Keep sub-pixel precision
    this.shiftAndAdd();             // Add new tile row
  }
}
```

## Coordinate System

### Buffer Coordinates vs. Screen Coordinates

```
Screen Position Calculation:
screenY = bufferRow * TILE_SIZE + pixelOffset

Example with pixelOffset = 12:
Buffer Row 0 → Screen Y = 0 * 24 + 12 = 12px
Buffer Row 1 → Screen Y = 1 * 24 + 12 = 36px
Buffer Row 2 → Screen Y = 2 * 24 + 12 = 60px
```

### Map Coordinate Mapping

```
Map Data Layout:               Buffer Representation:
Row 0: [last to render]   →    tiles[0]: [first on screen]
Row 1: [..................]   tiles[1]: [................]
Row 2: [..................]   tiles[2]: [................]
...                            ...
Row N: [first to render]  →    tiles[31]: [last on screen]
```

## Scrolling Flow Diagram

```
┌─────────────────┐
│ Game Loop       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ updateMapScroll │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ tileBuffer.     │
│ update(speed)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐    NO     ┌─────────────────┐
│ pixelOffset >=  │ ─────────→│ Continue with   │
│ TILE_SIZE?      │           │ current offset  │
└─────────────────┘           └─────────────────┘
         │ YES
         ▼
┌─────────────────┐
│ pixelOffset -=  │
│ TILE_SIZE       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ shiftAndAdd()   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Add new map row │
│ to buffer[0]    │
└─────────────────┘
```

## Map Transition System

### Transition States

```
State 1: Normal Rendering
┌─────────────────┐
│ Current Map     │
│ [████████████]  │
│ [████████████]  │  ← All tiles from current map
│ [████████████]  │
│ [████████████]  │
└─────────────────┘

State 2: Transition Prepared
┌─────────────────┐
│ Current Map     │
│ [████████████]  │
│ [████████████]  │  ← Still showing current map
│ [████████████]  │     but next map is loaded
│ [████████████]  │
└─────────────────┘
nextMap = loaded

State 3: Transition Active
┌─────────────────┐
│ [▓▓▓▓▓▓▓▓▓▓▓▓]  │  ← New map tiles (nextMap)
│ [▓▓▓▓▓▓▓▓▓▓▓▓]  │
│ [████████████]  │  ← Old map tiles (currentMap)
│ [████████████]  │
└─────────────────┘

State 4: Transition Complete
┌─────────────────┐
│ [▓▓▓▓▓▓▓▓▓▓▓▓]  │
│ [▓▓▓▓▓▓▓▓▓▓▓▓]  │  ← All tiles from new map
│ [▓▓▓▓▓▓▓▓▓▓▓▓]  │     (now currentMap)
│ [▓▓▓▓▓▓▓▓▓▓▓▓]  │
└─────────────────┘
```

### Transition Logic Flow

```
┌─────────────────┐
│ Check if near   │    NO     ┌─────────────────┐
│ end of current  │ ─────────→│ Continue normal │
│ map             │           │ scrolling       │
└─────────────────┘           └─────────────────┘
         │ YES
         ▼
┌─────────────────┐
│ Load next map   │
│ setNextMap()    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Continue        │
│ scrolling with  │
│ mixed tiles     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Current map     │    YES    ┌─────────────────┐
│ finished?       │ ─────────→│ Switch to next  │
└─────────────────┘           │ map as current  │
         │ NO                 └─────────────────┘
         ▼
┌─────────────────┐
│ Continue mixed  │
│ rendering       │
└─────────────────┘
```

## Rendering Integration

### Screen Positioning

The render system uses the buffer directly with pixel offset:

```javascript
// In render.js
const scrollOffset = getMapScrollOffset(); // Returns pixelOffset
for (let row = 0; row < tilesPerCol; row++) {
  for (let col = 0; col < tilesPerRow; col++) {
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE + scrollOffset; // ← Key positioning
    
    const tileType = getMapTileAt(x, y); // ← Gets from buffer
    // ... render tile
  }
}
```

### Buffer Access Method

```javascript
// In state.js
export function getMapTileAt(x, y) {
  if (!tileBuffer) return null;
  
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  
  return tileBuffer.getTileAt(col, row); // ← Direct buffer access
}
```

## Performance Characteristics

### Time Complexity
- **Buffer access**: O(1) - Direct array indexing
- **Scrolling update**: O(W) where W is screen width in tiles (~17)
- **Transition setup**: O(1) - Just setting references

### Memory Usage
- **Buffer size**: 32 rows × 17 columns = 544 tiles
- **Memory per tile**: ~8 bytes (string reference)
- **Total buffer memory**: ~4.3KB

### Comparison with Old System

| Aspect | Old Pixel-Based | New Tile-Based |
|--------|----------------|----------------|
| Coordinate calculations | Complex | Simple |
| Transition logic | Error-prone | Robust |
| Performance | O(W×H) per frame | O(W) per tile row |
| Memory usage | Higher | Lower |
| Debugging | Difficult | Easy |

## Map Cycling Integration

### Cycling Order Management

```javascript
const mapCyclingOrder = ["deepspace", "asteroids", "deepspace", "nebula", "deepspace", "bigbase"];
let currentMapIndex = 0;
```

### Index Management During Transitions

```javascript
// When map transition completes
if (tileBuffer.currentMap !== staticMapData) {
  // Properly increment to next position in cycle
  currentMapIndex = (currentMapIndex + 1) % mapCyclingOrder.length;
  currentMapName = mapCyclingOrder[currentMapIndex];
  staticMapData = tileBuffer.currentMap;
}
```

## Debugging Features

### Console Logging
The system provides detailed logging:
```
Preparing transition to map: nebula
Switched to map: nebula (index: 3)
```

### Buffer State Inspection
Access internal state for debugging:
```javascript
console.log(`Current map row: ${tileBuffer.currentMapRow}`);
console.log(`Pixel offset: ${tileBuffer.getPixelOffset()}`);
console.log(`Buffer height: ${tileBuffer.height}`);
```

## Advantages of This System

### 1. **Simplicity**
- No complex coordinate transformations
- Clear separation between pixel scrolling and tile management
- Easy to understand and maintain

### 2. **Robustness**
- Eliminates coordinate calculation errors
- Predictable behavior at map boundaries
- Handles edge cases gracefully

### 3. **Performance**
- Minimal computational overhead
- Efficient memory usage
- Smooth 60fps scrolling

### 4. **Flexibility**
- Easy to add new maps
- Simple to modify scroll speed
- Straightforward transition timing adjustments

### 5. **Maintainability**
- Clear separation of concerns
- Well-defined interfaces
- Comprehensive logging and debugging

## Implementation Guidelines

### Adding New Maps
1. Create map JSON file in `maps/` directory
2. Add map name to `mapCyclingOrder` array
3. System automatically handles loading and transitions

### Modifying Scroll Speed
```javascript
const MAP_SCROLL_SPEED = 0.51; // Pixels per frame
```

### Custom Transition Timing
```javascript
// Trigger transition when 10 rows remain
if (tileBuffer.currentMapRow >= -10 && !tileBuffer.nextMap) {
  // Prepare next map
}
```

## Future Enhancements

### Possible Improvements
1. **Variable buffer sizes** for different screen resolutions
2. **Parallel map loading** for faster transitions
3. **Dynamic tile caching** for memory optimization
4. **Configurable transition effects** (fade, slide, etc.)
5. **Multi-layer support** for background/foreground separation

### Performance Optimizations
1. **Tile pooling** to reduce garbage collection
2. **Predictive loading** of upcoming maps
3. **Compressed tile representation** for memory efficiency
4. **Hardware acceleration** for tile rendering

---

*This documentation describes the tile-based viewport system implemented in Star Force Modular v1.09.15+*