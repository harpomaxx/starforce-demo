import { state, BOMB_MAX } from './state.js';
import { playSound } from './audio.js';
import { now } from './utils.js';

export function updateItems(dt) {
  for (let it of state.items) it.y += it.vy;
  state.items = state.items.filter(it => it.y < 620);

  for (let i = state.items.length-1; i >= 0; i--) {
    let it = state.items[i];
    if (Math.abs(state.player.x - it.x) < state.player.w/2+it.r &&
        Math.abs(state.player.y - it.y) < state.player.h/2+it.r) {
      if (it.type === 'triple') {
        state.tripleFire = true;
        state.tripleFireUntil = now() + 12000;
        playSound('powerup');
      } else if (it.type === 'shield') {
        state.shield = true;
        state.shieldUntil = now() + 10000;
        state.shieldHits = 3; // Shield can take 3 hits
        playSound('shield');
      } else if (it.type === 'bombplus') {
        if (state.bombCount < BOMB_MAX) {
          state.bombCount++;
          state.bombPlusTime = now();
          playSound('bombplus');
        }
      } else if (it.type === 'lifeup') {
        state.lives++;
        playSound('lifeup');
        state.bombPlusTime = now();
      }
      state.items.splice(i,1);
    }
  }
}

export function drawItems(ctx) {
  for (let it of state.items) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.r, 0, Math.PI*2);
    ctx.globalAlpha = 0.8;
    if (it.type === 'shield') {
      ctx.fillStyle = '#1ff';
      ctx.strokeStyle = '#0cf';
    } else if (it.type === 'bombplus') {
      ctx.fillStyle = '#f55';
      ctx.strokeStyle = '#f00';
    } else if (it.type === 'lifeup') {
      ctx.fillStyle = '#f44';
      ctx.strokeStyle = '#fff';
    } else {
      ctx.fillStyle = '#ff0';
      ctx.strokeStyle = '#fa0';
    }
    ctx.shadowColor = (it.type === 'shield') ? '#0ff8' :
                      (it.type === 'bombplus' ? '#f008' :
                      (it.type === 'lifeup' ? '#fff8' : '#fff8'));
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(it.x, it.y);
    if (it.type === 'shield') {
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI*2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.96;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3,0);
      ctx.lineTo(3,0);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (it.type === 'bombplus') {
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI*2);
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.98;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -4.5);
      ctx.lineTo(0, -8);
      ctx.strokeStyle = "#ff0";
      ctx.lineWidth = 1.3;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, -8.3, 1, 0, Math.PI*2);
      ctx.fillStyle = "#fa0";
      ctx.fill();
    } else if (it.type === 'lifeup') {
      ctx.beginPath();
      ctx.moveTo(0, 3.5);
      ctx.bezierCurveTo(-7, -4, -6, -13, 0, -8);
      ctx.bezierCurveTo(6, -13, 7, -4, 0, 3.5);
      ctx.fillStyle = "#f44";
      ctx.shadowColor = "#fff";
      ctx.globalAlpha = 0.92;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("+1", 0, 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.96;
      ctx.fill();
    }
    ctx.restore();
  }
}

