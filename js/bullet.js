import { state, BULLET_SPEED, CANVAS_HEIGHT } from './state.js';

export function updateBullets(dt) {
  for (let b of state.bullets) {
    b.y -= BULLET_SPEED;
    if (b.dx) b.x += b.dx * 2.4;
  }
  state.bullets = state.bullets.filter(b => b.y > -10);

  for (let eb of state.enemyBullets) {
    if (eb.vx) eb.x += eb.vx;
    eb.y += eb.vy ? eb.vy : eb.vy = 4.4;
  }
  state.enemyBullets = state.enemyBullets.filter(eb => eb.y < CANVAS_HEIGHT + 20 && eb.x > -20 && eb.x < 400+20);
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

