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

  // drawPixelSprite method removed - now using fast 16x16 rendering in render.js
}

export const spriteLoader = new SpriteLoader();