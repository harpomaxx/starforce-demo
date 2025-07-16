import { state, CANVAS_WIDTH, CANVAS_HEIGHT, BOMB_COOLDOWN, BOMB_MAX, baseSprites, getCurrentMapName, TILE_SIZE, getMapTileAt, getMapScrollOffset } from './state.js';
import { drawPlayer } from './player.js';
import { drawEnemies } from './enemy.js';
import { drawBoss } from './boss.js';
import { drawBullets } from './bullet.js';
import { drawItems } from './items.js';
import { now } from './utils.js';

export function renderGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  // Apply screen shake effect
  let shakeX = 0, shakeY = 0;
  if (state.screenShake) {
    const elapsed = now() - state.screenShake.startTime;
    if (elapsed < state.screenShake.duration) {
      const progress = elapsed / state.screenShake.duration;
      const intensity = state.screenShake.intensity * (1 - progress);
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    } else {
      state.screenShake = null;
    }
  }
  
  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Draw background stars
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#fff";
  for (let star of state.stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  
  // Draw map tiles from tile buffer
  const scrollOffset = getMapScrollOffset();
  const tilesPerRow = Math.ceil(CANVAS_WIDTH / TILE_SIZE);
  const tilesPerCol = Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1; // +1 for smooth scrolling
  
  for (let row = 0; row < tilesPerCol; row++) {
    for (let col = 0; col < tilesPerRow; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE + scrollOffset;
      
      // Skip drawing if outside canvas bounds
      if (x < -TILE_SIZE || x >= CANVAS_WIDTH || 
          y < -TILE_SIZE || y >= CANVAS_HEIGHT) {
        continue;
      }
      
      // Get tile directly from buffer using buffer coordinates
      const tileType = getMapTileAt(x, y);
      
      if (tileType === "continent_piece") {
        // Draw continental structure (background)
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#334155"; // Dark blue-gray for continent
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = "#475569"; // Slightly lighter border
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.restore();
      } else if (tileType && tileType !== "continent_piece") {
        // Draw continental structure (background) beneath base
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#334155"; // Dark blue-gray for continent
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = "#475569"; // Slightly lighter border
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.restore();
        
        // Draw base sprite (foreground - interactive) with 16x16 sprites
        const spriteData = baseSprites[tileType];
        if (spriteData && spriteData.sprite) {
          // Draw 16x16 sprite (each pixel is 1.5x1.5 pixels to fit in 24x24 square)
          const pixelSize = TILE_SIZE / 16; // 1.5 pixels per sprite pixel
          
          for (let spriteRow = 0; spriteRow < 16; spriteRow++) {
            for (let spriteCol = 0; spriteCol < 16; spriteCol++) {
              const pixelX = x + spriteCol * pixelSize;
              const pixelY = y + spriteRow * pixelSize;
              const color = spriteData.sprite[spriteRow][spriteCol];
              
              ctx.save();
              ctx.fillStyle = color;
              ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
              ctx.restore();
            }
          }
          
          // Add subtle border for definition around the entire base
          ctx.save();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.restore();
        } else {
          // Fallback to solid color if no sprite data
          ctx.save();
          ctx.fillStyle = "#666";
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.restore();
        }
      }
    }
  }

  // Enhanced Bomb Visual
  if (state.bombVisual) {
    const elapsed = now() - state.bombVisual.time;
    const progress = Math.min(1, elapsed / 500);
    
    ctx.save();
    
    // Multiple expanding rings for dramatic effect
    for (let i = 0; i < 3; i++) {
      const offset = i * 0.2;
      const ringProgress = Math.max(0, progress - offset);
      const ringRadius = state.bombVisual.r * ringProgress;
      
      if (ringRadius > 0) {
        ctx.globalAlpha = (0.6 - i * 0.15) * (1 - ringProgress * 0.7);
        ctx.strokeStyle = i === 0 ? "#fff" : i === 1 ? "#ff6" : "#f84";
        ctx.lineWidth = 12 - i * 2;
        ctx.beginPath();
        ctx.arc(state.bombVisual.x, state.bombVisual.y, ringRadius, 0, Math.PI*2);
        ctx.stroke();
      }
    }
    
    // Central flash
    if (progress < 0.3) {
      ctx.globalAlpha = 0.8 * (1 - progress / 0.3);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(state.bombVisual.x, state.bombVisual.y, 20 * progress, 0, Math.PI*2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  // Player
  if (!state.gameOver) drawPlayer(ctx);

  // Shield
  if (!state.gameOver && state.shield) {
    ctx.save();
    ctx.globalAlpha = 0.36 + 0.20 * Math.sin(now()/110);
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y+2, 24, 0, Math.PI*2);
    ctx.strokeStyle = "#0ff";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }

  // Bullets
  drawBullets(ctx);

  // Enemies
  drawEnemies(ctx);

  // Boss
  drawBoss(ctx);

  // Items
  drawItems(ctx);

  // Score/UI
  ctx.fillStyle="#fff";
  ctx.font = "18px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + state.score, 12, 28);

  // Draw small bomb icons at the top right
  for (let i = 0; i < state.bombCount; i++) {
    ctx.save();
    const bx = CANVAS_WIDTH - 380 + i * 32;
    const by = 54;
    ctx.translate(bx, by);
    ctx.scale(0.5, 0.5);
    // Draw bomb body
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#f55";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 7;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Bomb highlight
    ctx.beginPath();
    ctx.arc(-5, -5, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff8";
    ctx.fill();
    // Bomb fuse
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -24);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    // Bomb spark
    ctx.beginPath();
    ctx.arc(0, -26, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ff0";
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 80 + i);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Draw small player ships (lives) at the top right
  for (let i = 0; i < state.lives; i++) {
    ctx.save();
    // Save original player position
    const origX = state.player.x, origY = state.player.y;
    // Set to fixed position for icon
    state.player.x = CANVAS_WIDTH - 370 + i * 32;
    state.player.y = 190;
   // ctx.translate(state.player.x, state.player.y);
    ctx.scale(0.5, 0.5);
    drawPlayer(ctx);
    // Restore player position
    state.player.x = origX;
    state.player.y = origY;
    ctx.restore();
  }

  if (state.tripleFire) {
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'right';
    ctx.fillText('Triple Fire!', CANVAS_WIDTH-12, 28);
  }
  if (state.shield) {
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#0ff';
    ctx.textAlign = 'right';
    ctx.fillText('Shield!', CANVAS_WIDTH-12, 54);
  }
  // Bomb cooldown overlay
  if (!state.gameOver && state.bombCount > 0 && now()-state.lastBomb < BOMB_COOLDOWN) {
    let cooldown = (BOMB_COOLDOWN - (now()-state.lastBomb)) / BOMB_COOLDOWN;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_WIDTH*cooldown, 6);
    ctx.restore();
  }

  if (state.bossWarningTime && now()-state.bossWarningTime < 1400) {
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "#ff0";
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.7+0.3*Math.sin(now()/70);
    ctx.fillText("!!! WARNING !!!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2-70);
    ctx.globalAlpha = 1.0;
  }

  // Blinking "Continue" message during respawn pause and waiting for user input
  if (state.respawnPauseUntil && (Date.now() < state.respawnPauseUntil || state._waitingForContinue)) {
    ctx.save();
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff0";
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.globalAlpha = 0.85;
      ctx.fillText("Get Ready!", canvas.width/2, canvas.height/2 - 10);
      ctx.font = "18px monospace";
      ctx.globalAlpha = 0.8;
      ctx.fillText("Tap or press to continue", canvas.width/2, canvas.height/2 + 24);
    }
    ctx.restore();
  }

  if (state.gameOver) {
    ctx.textAlign = "center";
    ctx.font = "30px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2-10);
    ctx.font = "18px monospace";
    ctx.fillText("Score: " + state.score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2+24);
    ctx.fillText("Press R or Space to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2+48);
  }
  
  // FPS Counter and Mobile indicator (always visible on mobile or with ?perf)
  if (state.performance.isMobile || window.location.search.includes('perf')) {
    ctx.save();
    ctx.fillStyle = state.performance.isMobile ? "#ffff00" : "#00ff00";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    
    const avgFps = state.performance.fpsHistory.length > 0 ? 
      Math.round(state.performance.fpsHistory.reduce((a, b) => a + b, 0) / state.performance.fpsHistory.length) : 0;
    
    ctx.fillText(`FPS: ${state.performance.currentFps} (${avgFps})`, 5, CANVAS_HEIGHT - 25);
    
    if (state.performance.isMobile) {
      ctx.fillText("MOBILE", 5, CANVAS_HEIGHT - 10);
    }
    
    ctx.restore();
  }
  
  // Map name (bottom-left in yellow)
  ctx.save();
  ctx.fillStyle = "#ffff00";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Map: ${getCurrentMapName()}`, 5, CANVAS_HEIGHT - 5);
  ctx.restore();
  
  // Version number (bottom-right in yellow)
  ctx.save();
  ctx.fillStyle = "#ffff00";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText("v1.09.15", CANVAS_WIDTH - 5, CANVAS_HEIGHT - 5);
  ctx.restore();
  
  
  // Restore screen shake transform
  ctx.restore();
}

