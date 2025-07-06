import { state, CANVAS_WIDTH } from './state.js';
import { now } from './utils.js';
import { playSound } from './audio.js';

export function updateBoss(dt) {
  // Boss appearance (every 10000 enemies killed)
  if (!state.boss && state.enemiesKilled >= state.nextBossAt) {
    state.boss = {
      x: CANVAS_WIDTH/2,
      y: -60,
      w: 75, h: 48,
      hp: 110, hpMax: 110,
      entering: true,
      vx: 2.0,
      fireCooldown: 0
    };
    state.bossWarningTime = now();
    state.nextBossAt += 10000; // Next boss at +10000 more enemies
    playSound('bomb');
  }

  // Boss logic
  if (state.boss) {
    // Entering
    if (state.boss.entering) {
      state.boss.y += 2.4;
      if (state.boss.y > 96) state.boss.entering = false;
    } else {
      state.boss.x += state.boss.vx;
      if (state.boss.x < state.boss.w/2+10 || state.boss.x > CANVAS_WIDTH-state.boss.w/2-10) state.boss.vx *= -1;
      state.boss.fireCooldown -= dt;
      if (state.boss.fireCooldown <= 0) {
        // Spread shots
        for (let angle of [-0.36, 0, 0.36]) {
          let px = state.player.x - state.boss.x, py = state.player.y - state.boss.y;
          let norm = Math.hypot(px,py);
          let nx = px/norm, ny = py/norm;
          let dx = nx*Math.cos(angle) - ny*Math.sin(angle);
          let dy = nx*Math.sin(angle) + ny*Math.cos(angle);
          let sx = state.boss.x + dx*34;
          let sy = state.boss.y + dy*18;
          state.enemyBullets.push({
            x: sx,
            y: sy,
            r: 8,
            vy: 4.1*dy + Math.random()*1.5,
            vx: 4.1*dx,
            type: 3
          });
        }
        playSound('enemyfire');
        state.boss.fireCooldown = 1050 + Math.random()*180 - (state.boss.hpMax-state.boss.hp)*2;
      }
    }
    // Boss hit/collisions and reward handled in main and items
  }
}

export function drawBoss(ctx) {
  if (!state.boss) return;
  let b = state.boss;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.beginPath();
  ctx.moveTo(-b.w/2+18, -b.h/2+8);
  ctx.lineTo(0, -b.h/2-10);
  ctx.lineTo(b.w/2-18, -b.h/2+8);
  ctx.lineTo(b.w/2, b.h/2-8);
  ctx.lineTo(0, b.h/2+10);
  ctx.lineTo(-b.w/2, b.h/2-8);
  ctx.closePath();
  ctx.fillStyle = "#f9c";
  ctx.shadowColor = "#f0f";
  ctx.shadowBlur = 19;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.35 + 0.23*Math.sin(now()/160);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Core
  ctx.beginPath();
  ctx.arc(0, 0, b.h*0.21 + 3*Math.abs(Math.sin(now()/200)), 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.34 + 0.13*Math.sin(now()/110);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // HP bar (50% width)
  ctx.save();
  const barWidth = 130; // 50% of original 260px
  const barX = 135; // Centered: (400 - 130) / 2 = 135
  
  ctx.fillStyle="#fff";
  ctx.globalAlpha = 0.9 + 0.07*Math.sin(now()/170);
  ctx.fillRect(barX, 12, barWidth, 16);
  ctx.globalAlpha = 1;
  ctx.fillStyle="#0bf";
  ctx.fillRect(barX, 12, barWidth * (b.hp/b.hpMax), 16);
  ctx.strokeStyle="#fff";
  ctx.strokeRect(barX, 12, barWidth, 16);
  ctx.font = "bold 15px monospace";
  ctx.fillStyle="#000";
  ctx.textAlign = "center";
  ctx.fillText("BOSS", 200, 24);
  ctx.restore();
}

