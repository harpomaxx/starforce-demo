export class SpriteLoader {
  constructor() {
    this.sprites = new Map();
    this.loadPromises = new Map();
    this.spriteCanvases = new Map();
  }

  async loadSprite(spriteName) {
    if (this.sprites.has(spriteName)) {
      return this.sprites.get(spriteName);
    }

    if (this.loadPromises.has(spriteName)) {
      return this.loadPromises.get(spriteName);
    }

    const loadPromise = this._fetchSprite(spriteName);
    this.loadPromises.set(spriteName, loadPromise);

    try {
      const sprite = await loadPromise;
      this.sprites.set(spriteName, sprite);
      
      // Create cached canvas for this sprite
      if (sprite && sprite.sprite) {
        const canvas = this._createSpriteCanvas(sprite);
        this.spriteCanvases.set(spriteName, canvas);
      }
      
      this.loadPromises.delete(spriteName);
      return sprite;
    } catch (error) {
      this.loadPromises.delete(spriteName);
      throw error;
    }
  }

  async _fetchSprite(spriteName) {
    const response = await fetch(`assets/sprites/${spriteName}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load sprite: ${spriteName}`);
    }
    return await response.json();
  }

  async loadAllSprites() {
    const spriteNames = [
      'continent_piece',
      'hub',
      'comm',
      'dock',
      'research',
      'solar',
      'mining',
      'turret',
      'fuel',
      'cargo',
      'sensor',
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
	'base-0',
      'bigbase_1'
    ];

    const loadPromises = spriteNames.map(name => this.loadSprite(name));
    await Promise.all(loadPromises);
  }

  getSprite(spriteName) {
    return this.sprites.get(spriteName);
  }

  hasSprite(spriteName) {
    return this.sprites.has(spriteName);
  }

  getSpriteCanvas(spriteName) {
    return this.spriteCanvases.get(spriteName);
  }

  hasSpriteCanvas(spriteName) {
    return this.spriteCanvases.has(spriteName);
  }

  _createSpriteCanvas(spriteData) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    const sprite = spriteData.sprite;
    
    // Render sprite pixels to canvas
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const color = sprite[row][col];
        
        // Skip transparent pixels
        if (color && color !== '#00000000') {
          ctx.fillStyle = color;
          ctx.fillRect(col, row, 1, 1);
        }
      }
    }
    
    return canvas;
  }

  // drawPixelSprite method removed - now using fast 16x16 rendering in render.js
}

export const spriteLoader = new SpriteLoader();
