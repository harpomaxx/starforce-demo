import { state, PLAYER_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, SHOOT_DELAY, BULLET_RADIUS, BOMB_COOLDOWN, BOMB_RADIUS } from './state.js';
import { clamp, now } from './utils.js';
import { playSound } from './audio.js';

export function updatePlayer(dt) {
  if (state.gameOver) return;
  let p = state.player;
  
  // Mobile-optimized movement speed for better responsiveness
  const moveSpeed = state.performance.isMobile ? PLAYER_SPEED * 1.4 : PLAYER_SPEED;
  
  if (state.keys['ArrowLeft']||state.keys['KeyA']) p.x -= moveSpeed;
  if (state.keys['ArrowRight']||state.keys['KeyD']) p.x += moveSpeed;
  if (state.keys['ArrowUp']||state.keys['KeyW']) p.y -= moveSpeed;
  if (state.keys['ArrowDown']||state.keys['KeyS']) p.y += moveSpeed;
  p.x = clamp(p.x, p.w/2, CANVAS_WIDTH-p.w/2);
  p.y = clamp(p.y, CANVAS_HEIGHT/2, CANVAS_HEIGHT-p.h/2);

  // Firing
  if (state.keys['Space'] && now() - state.lastShot > SHOOT_DELAY) {
    if (state.tripleFire) {
      state.bullets.push({x: p.x, y: p.y - p.h/2, r: BULLET_RADIUS});
      state.bullets.push({x: p.x - 10, y: p.y - p.h/2, r: BULLET_RADIUS, dx: -1});
      state.bullets.push({x: p.x + 10, y: p.y - p.h/2, r: BULLET_RADIUS, dx: 1});
    } else {
      state.bullets.push({x: p.x, y: p.y - p.h/2, r: BULLET_RADIUS});
    }
    state.lastShot = now();
    playSound('fire');
  }

  // Bomb (Key B)
  if ((state.keys['KeyB'] || state.keys['b']) && state.bombCount > 0 && now() - state.lastBomb > BOMB_COOLDOWN) {
    state.bombVisual = {
      x: p.x,
      y: p.y - p.h/3,
      r: 8,
      maxR: BOMB_RADIUS,
      time: now()
    };
    state.bombVisualTime = now();
    state.lastBomb = now();
    state.bombCount--;
    // Bomb removes enemies in radius (handled in enemy.js)
    playSound('bomb');
  }
}
export function drawPlayer(ctx) {
  let p = state.player;
  
  // Blinking effect during invincibility
  if (state.invincible) {
    const blinkFreq = 8; // Blinks per second
    const timeInInvincibility = now() - (state.invincibleUntil - 2500);
    const blinkPhase = Math.sin(timeInInvincibility * blinkFreq * Math.PI / 1000);
    
    // Skip drawing if in the "off" phase of blinking
    if (blinkPhase < 0) {
      return;
    }
    
    // Reduce opacity during invincibility
    ctx.globalAlpha = 0.7;
  }
  
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.beginPath();
  ctx.moveTo(0, -p.h/2);
  ctx.lineTo(-p.w*0.29, p.h*0.38);
  ctx.lineTo(-p.w*0.21, p.h*0.20);
  ctx.lineTo(-p.w*0.41, p.h*0.45);
  ctx.lineTo(-p.w*0.21, p.h*0.55);
  ctx.lineTo(0, p.h*0.32);
  ctx.lineTo(p.w*0.21, p.h*0.55);
  ctx.lineTo(p.w*0.41, p.h*0.45);
  ctx.lineTo(p.w*0.21, p.h*0.20);
  ctx.lineTo(p.w*0.29, p.h*0.38);
  ctx.closePath();
  ctx.fillStyle = state.invincible ? "#ff6b6b" : "#39c6ff"; // Red when invincible for high visibility
  ctx.shadowColor = "#3cf";
  ctx.shadowBlur = 7;
  ctx.fill();
  ctx.restore();
  
  // Reset alpha
  if (state.invincible) {
    ctx.globalAlpha = 1.0;
  }
}

