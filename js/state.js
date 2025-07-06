export const CANVAS_WIDTH = 400, CANVAS_HEIGHT = 600;
export const PLAYER_WIDTH = 32, PLAYER_HEIGHT = 24, PLAYER_SPEED = 4;
export const BULLET_RADIUS = 4, BULLET_SPEED = 7, SHOOT_DELAY = 200;
export const ENEMY_WIDTH = 32, ENEMY_HEIGHT = 20, ENEMY_SPEED_MIN = 1.2, ENEMY_SPEED_MAX = 2.6;
export const ENEMY_SPAWN_DELAY = 2000; // Start with 2 seconds
export const BOMB_RADIUS = 240, BOMB_COOLDOWN = 2500, BOMB_MAX = 2;

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
  nextBossAt: 10000
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
  const infoElem = document.getElementById('info');
  if (infoElem) infoElem.textContent = '';
}

