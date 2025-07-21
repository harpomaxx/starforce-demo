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

  // drawPixelSprite method removed - now using fast 16x16 rendering in render.js
}

export const spriteLoader = new SpriteLoader();
