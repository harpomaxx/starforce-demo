export class SpriteLoader {
  constructor() {
    this.sprites = new Map();
    this.loadPromises = new Map();
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

  drawPixelSprite(ctx, sprite, x, y, scale = 1.5) {
    if (!sprite || sprite.type !== 'pixel') {
      return;
    }

    const spriteData = sprite.sprite;
    const spriteHeight = spriteData.length;
    const spriteWidth = spriteData[0].length;
    
    // Calculate pixel size to fit in 24x24 tile space (or maintain aspect ratio)
    const targetSize = 24; // Standard tile size
    const pixelSize = targetSize / Math.max(spriteWidth, spriteHeight);
    
    for (let row = 0; row < spriteHeight; row++) {
      for (let col = 0; col < spriteWidth; col++) {
        const color = spriteData[row][col];
        // Skip transparent pixels
        if (color && color !== '#00000000') {
          ctx.fillStyle = color;
          ctx.fillRect(
            x + col * pixelSize,
            y + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }
}

export const spriteLoader = new SpriteLoader();