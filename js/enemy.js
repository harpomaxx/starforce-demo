import { state, ENEMY_WIDTH, ENEMY_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, ENEMY_SPAWN_DELAY, ENEMY_SPEED_MIN, ENEMY_SPEED_MAX, BOMB_RADIUS } from './state.js';
import { playSound } from './audio.js';
import { now, rectsCollide } from './utils.js';

// Calculate dynamic spawn delay based on score (gets faster over time)
function getSpawnDelay() {
  const baseDelay = ENEMY_SPAWN_DELAY; // 700ms
  const minDelay = 250; // Minimum 250ms between spawns
  const scoreReduction = Math.floor(state.score / 500) * 25; // Reduce by 25ms every 500 points
  return Math.max(minDelay, baseDelay - scoreReduction);
}

// Calculate dynamic firing rate based on score (enemies fire more often)
function getFiringRate(enemy) {
  const baseRate = 0.013;
  const sizeBonus = 0.008 * (enemy.w / ENEMY_WIDTH);
  const scoreBonus = Math.floor(state.score / 1000) * 0.002; // +0.002 every 1000 points
  return Math.min(0.04, baseRate + sizeBonus + scoreBonus); // Cap at 4% per frame
}

// Calculate dynamic enemy speed based on score (enemies move faster)
function getEnemySpeed() {
  const baseMin = ENEMY_SPEED_MIN; // 1.2
  const baseMax = ENEMY_SPEED_MAX; // 2.6
  const speedIncrease = Math.floor(state.score / 1500) * 0.2; // +0.2 every 1500 points
  const newMin = Math.min(4.0, baseMin + speedIncrease);
  const newMax = Math.min(5.0, baseMax + speedIncrease);
  return newMin + Math.random() * (newMax - newMin);
}

// ENEMY SPAWN, MOVE, BULLET, COLLISIONS, BOMB HIT
export function updateEnemies(dt) {
  // Update bomb visual and effect
  if (state.bombVisual) {
    const elapsed = now() - state.bombVisual.time;
    const duration = 500; // 500ms bomb expansion
    
    if (elapsed < duration) {
      // Grow bomb radius over time
      const progress = elapsed / duration;
      state.bombVisual.r = 8 + (state.bombVisual.maxR - 8) * progress;
    } else {
      // Bomb effect: Remove enemies in radius, score up
      let enemiesKilled = 0;
      state.enemies = state.enemies.filter(e => {
        let d = Math.hypot(e.x - state.bombVisual.x, e.y - state.bombVisual.y);
        if (d < BOMB_RADIUS) {
          playSound('hit');
          state.score += 100;
          state.enemiesKilled++; // Track enemy kills
          enemiesKilled++;
          return false;
        }
        return true;
      });
      
      // Clear bomb visual after effect
      state.bombVisual = null;
      
      // Add screen shake effect for dramatic impact
      if (enemiesKilled > 0) {
        state.screenShake = {
          intensity: Math.min(15, enemiesKilled * 2),
          duration: 200,
          startTime: now()
        };
      }
    }
  }

  // ENEMY SPAWN (if no boss) - with dynamic difficulty
  const currentSpawnDelay = getSpawnDelay();
  if (!state.boss && now() - state.lastEnemy > currentSpawnDelay) {
    const x = Math.random()*(CANVAS_WIDTH-ENEMY_WIDTH)+ENEMY_WIDTH/2;
    const speed = getEnemySpeed(); // Dynamic speed based on score
    const type = Math.floor(Math.random()*5);
    const shipType = Math.floor(Math.random()*3);
    let extra = {};
    if (type === 1) { extra.sineStart = x; extra.sinePhase = Math.random()*Math.PI*2; extra.sineFreq = 1 + Math.random()*1.5; extra.sineAmp = 36 + Math.random()*22; }
    if (type === 2) { extra.dir = Math.random()<0.5 ? -1 : 1; }
    if (type === 3) { extra.angle = Math.random()*Math.PI*2; extra.radius = 80+Math.random()*40; extra.cx = x; extra.cy = -ENEMY_HEIGHT-40; extra.spin = (Math.random()<0.5?-1:1) * (0.04+Math.random()*0.02);}
    if (type === 4) { extra.phase = 0; extra.timer = 0; extra.slowY = 1.3+Math.random()*0.6; extra.pause = 500+Math.random()*400; extra.dropY = 3+Math.random()*1.2; }
    let baseW = ENEMY_WIDTH, baseH = ENEMY_HEIGHT;
    if (shipType === 0) { baseW = 36; baseH = 28; }
    else if (shipType === 1) { baseW = 48; baseH = 32; }
    else if (shipType === 2) { baseW = 38; baseH = 38; }
    const scale = 1.1 + Math.random() * 0.18;
    const w = baseW * scale, h = baseH * scale;
    state.enemies.push({
      x, y: -h, w, h,
      speed, type, shipType, ...extra
    });
    state.lastEnemy = now();
  }

  // ENEMY MOVEMENT
  for (let e of state.enemies) {
    if (e.type === 0) {
      e.y += e.speed;
    } else if (e.type === 1) {
      e.y += e.speed;
      e.x = e.sineStart + Math.sin((e.y/36) * e.sineFreq + e.sinePhase) * e.sineAmp;
    } else if (e.type === 2) {
      e.y += e.speed;
      e.x += e.dir * e.speed * 0.8;
      if (e.x < e.w/2) { e.x = e.w/2; e.dir = 1; }
      else if (e.x > CANVAS_WIDTH-e.w/2) { e.x = CANVAS_WIDTH-e.w/2; e.dir = -1; }
    } else if (e.type === 3) {
      e.angle += e.spin;
      e.radius -= 0.2;
      e.x = e.cx + Math.cos(e.angle)*e.radius;
      e.y = e.cy + Math.sin(e.angle)*e.radius + e.speed*2;
    } else if (e.type === 4) {
      if (e.phase === 0) {
        e.y += e.slowY;
        e.timer += dt;
        if (e.timer > e.pause) { e.phase = 1; e.timer = 0; }
      } else if (e.phase === 1) {
        e.timer += dt;
        if (e.timer > 450) { e.phase = 2; }
      } else {
        e.y += e.dropY;
      }
    }
  }
  state.enemies = state.enemies.filter(e => e.y < CANVAS_HEIGHT+ENEMY_HEIGHT);

  // ENEMY BULLETS - with dynamic firing rate
  for (let e of state.enemies) {
    if (e.y > 0 && Math.random() < getFiringRate(e)) {
      state.enemyBullets.push({
        x: e.x,
        y: e.y + e.h*0.4,
        r: 5 + 0.4 * (e.w/ENEMY_WIDTH),
        vy: 4.2 + Math.random()*2,
        type: e.shipType
      });
      playSound('enemyfire');
    }
  }

  // ENEMY COLLISION WITH PLAYER
  for (let e of state.enemies) {
    if (!state.invincible && rectsCollide(state.player, e)) {
      if (state.shield) {
        state.shieldHits--;
        if (state.shieldHits <= 0) {
          state.shield = false;
          state.shieldFlash = 12;
          playSound('shield_break');
        } else {
          playSound('shield');
        }
        state.enemies.splice(state.enemies.indexOf(e),1);
        state.enemiesKilled++; // Track enemy kills (shield collision)
        break;
      } else {
        state.lives--;
        playSound('explosion'); // Play explosion sound
        if (state.lives <= 0) {
          state.gameOver = true;
          document.getElementById('info').innerHTML = `<b>Game Over!</b> Score: ${state.score} <br>Press <b>R</b> or <b>Space</b> to Restart`;
          playSound('over');
          break;
        } else {
          state.player.x = CANVAS_WIDTH/2;
          state.player.y = CANVAS_HEIGHT - 60;
          state.shield = true;
          state.shieldUntil = now() + 1400;
          state.respawnPauseUntil = Date.now() + 1000; // Pause for 1 second
          playSound('shield');
          state.enemyBullets = state.enemyBullets.filter(eb => Math.abs(eb.y - state.player.y) > 60);
          break;
        }
      }
    }
  }
}

// ENEMY DRAW
export function drawEnemies(ctx) {
  for (let e of state.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.shipType === 0) {
      ctx.beginPath();
      ctx.moveTo(-e.w/2+7, -e.h/2+5);
      ctx.lineTo(0, -e.h/2-4);
      ctx.lineTo(e.w/2-7, -e.h/2+5);
      ctx.lineTo(e.w/2, e.h/2-5);
      ctx.lineTo(0, e.h/2+7);
      ctx.lineTo(-e.w/2, e.h/2-5);
      ctx.closePath();
      ctx.fillStyle = "#f44";
      ctx.shadowColor = "#f99";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -e.h*0.13, e.w*0.16, e.h*0.14, 0, 0, Math.PI*2);
      ctx.fillStyle = "#fff4";
      ctx.fill();
    } else if (e.shipType === 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w*0.42, e.h*0.33, 0, 0, Math.PI*2);
      ctx.fillStyle = "#3f7";
      ctx.shadowColor = "#8fa";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -e.h*0.09, e.w*0.23, e.h*0.17, 0, 0, Math.PI*2);
      ctx.fillStyle = "#bfff";
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let i=0;i<3;i++) {
        ctx.beginPath();
        ctx.arc(Math.sin(i*Math.PI*2/3)*e.w*0.22, e.h*0.13, 3, 0, Math.PI*2);
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.8;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.beginPath();
      ctx.moveTo(-e.w*0.33, -e.h*0.22);
      ctx.lineTo(0, -e.h*0.46);
      ctx.lineTo(e.w*0.33, -e.h*0.22);
      ctx.lineTo(e.w*0.21, e.h*0.42);
      ctx.lineTo(-e.w*0.21, e.h*0.42);
      ctx.closePath();
      ctx.fillStyle = "#3ee";
      ctx.shadowColor = "#6ff";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -e.h*0.18, e.w*0.14, e.h*0.13, 0, 0, Math.PI*2);
      ctx.fillStyle = "#fff9";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, e.h*0.30, e.w*0.07, e.h*0.13, 0, 0, Math.PI*2);
      ctx.fillStyle = "#f99";
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

