import { state, BULLET_SPEED, CANVAS_HEIGHT } from './state.js';

// Performance optimized bullet updates
export function updateBullets(dt) {
  // Update player bullets in place, removing off-screen ones
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    let b = state.bullets[i];
    b.y -= BULLET_SPEED;
    if (b.dx) b.x += b.dx * 2.4;
    
    // Remove off-screen bullets in place (more efficient than filter)
    if (b.y <= -10) {
      state.bullets.splice(i, 1);
    }
  }

  // Update enemy bullets in place
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    let eb = state.enemyBullets[i];
    if (eb.vx) eb.x += eb.vx;
    eb.y += eb.vy ? eb.vy : eb.vy = 4.4;
    
    // Remove off-screen bullets in place
    if (eb.y >= CANVAS_HEIGHT + 20 || eb.x <= -20 || eb.x >= 420) {
      state.enemyBullets.splice(i, 1);
    }
  }
}

export function drawBullets(ctx) {
  ctx.fillStyle = "#0ff";
  for (let b of state.bullets)
    ctx.beginPath(), ctx.arc(b.x, b.y, b.r, 0, Math.PI*2), ctx.fill();

  for (let eb of state.enemyBullets) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI*2);
    if (eb.type === 1) {
      ctx.fillStyle = '#ff8';
      ctx.shadowColor = '#ff0';
    } else if (eb.type === 2) {
      ctx.fillStyle = '#3ef';
      ctx.shadowColor = '#3ef';
    } else if (eb.type === 3) {
      ctx.fillStyle = '#f0f';
      ctx.shadowColor = '#fff';
    } else {
      ctx.fillStyle = '#f43';
      ctx.shadowColor = '#f44';
    }
    ctx.globalAlpha = 0.93;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }
}

