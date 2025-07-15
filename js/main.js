import { resetGame, state, CANVAS_HEIGHT, initializePerformance, updatePerformanceMetrics, shouldLimitAudio, incrementAudioCalls, initializeMaps, updateMapScroll, getMapTileAt, TILE_SIZE } from './state.js';
import { setupInput } from './input.js';
import { updatePlayer } from './player.js';
import { updateEnemies } from './enemy.js';
import { updateBoss } from './boss.js';
import { updateBullets } from './bullet.js';
import { updateItems } from './items.js';
import { renderGame } from './render.js';
import { now, rectsCollide } from './utils.js';
import { playSound } from './audio.js';

// Performance optimized audio wrapper
function playLimitedSound(soundType) {
  if (!shouldLimitAudio()) {
    incrementAudioCalls();
    playSound(soundType);
  }
}

setupInput();
initializePerformance();

// Initialize maps before resetting game
initializeMaps().then(() => {
  resetGame();
  console.log('Game initialized with external maps');
}).catch(error => {
  console.error('Failed to initialize maps, starting with fallback:', error);
  resetGame(); // Start anyway with fallback maps
});

let lastTime = 0;
function showStartMessage() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "28px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Press any key or tap", canvas.width/2, canvas.height/2-10);
  ctx.font = "18px monospace";
  ctx.fillText("to start", canvas.width/2, canvas.height/2+24);
  ctx.restore();
}

function gameLoop(ts) {
  let dt = ts - lastTime;
  lastTime = ts;
  
  // Update performance metrics
  updatePerformanceMetrics(ts);
  
  // Debug: Log every 60 frames (about once per second) with FPS
  if (!window.frameCount) window.frameCount = 0;
  window.frameCount++;
  if (window.frameCount % 60 === 0) {
    const avgFps = state.performance.fpsHistory.length > 0 ? 
      Math.round(state.performance.fpsHistory.reduce((a, b) => a + b, 0) / state.performance.fpsHistory.length) : 0;
    console.log(`Game loop: frame ${window.frameCount}, FPS: ${state.performance.currentFps} (avg: ${avgFps}), Mobile: ${state.performance.isMobile}`);
  }
  
  // Debug: Log first few calls after unpause
  if (window.frameCount <= 10) {
    console.log(`Early game loop call #${window.frameCount}: paused=${state.paused}, gameOver=${state.gameOver}, FORCE_UNPAUSE=${window.FORCE_UNPAUSE}`);
  }

  // Pause for respawn after hit
  if (state.respawnPauseUntil && Date.now() < state.respawnPauseUntil) {
    renderGame();
    requestAnimationFrame(gameLoop);
    return;
  } else if (state.respawnPauseUntil && Date.now() >= state.respawnPauseUntil) {
    // Wait for user gesture to continue
    renderGame();
    // Only set up the listener once per respawn
    if (!state._waitingForContinue) {
      state._waitingForContinue = true;
      function continueHandler() {
        state.respawnPauseUntil = 0;
        state._waitingForContinue = false;
        
        // Start invincibility NOW when user unpauses
        if (state._startInvincibilityAfterUnpause) {
          state.invincible = true;
          state.invincibleUntil = now() + 2500; // 2.5 seconds from NOW
          state._startInvincibilityAfterUnpause = false;
        }
        
        window.removeEventListener('keydown', continueHandler);
        window.removeEventListener('mousedown', continueHandler);
        window.removeEventListener('touchstart', continueHandler);
      }
      window.addEventListener('keydown', continueHandler);
      window.addEventListener('mousedown', continueHandler);
      window.addEventListener('touchstart', continueHandler);
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  if (state.paused && !window.FORCE_UNPAUSE) {
    // Debug: Why is it still paused?
    if (window.frameCount <= 10) {
      console.log(`Frame ${window.frameCount}: Still paused! state.paused = ${state.paused}`);
    }
    showStartMessage();
    requestAnimationFrame(gameLoop);
    return;
  }
  
  // Debug: Check if we're using force unpause
  if (window.FORCE_UNPAUSE && window.frameCount <= 3) {
    console.log(`Frame ${window.frameCount}: Using FORCE_UNPAUSE, state.paused = ${state.paused}`);
  }
  
  // Debug: We made it past the pause check!
  if (window.frameCount <= 5) {
    console.log(`Frame ${window.frameCount}: Past pause check! paused=${state.paused}`);
  }
  
  // Debug: Log when game actually starts running
  if (!state.gameStarted) {
    state.gameStarted = true;
    console.log('*** GAME LOOP STARTED RUNNING! ***');
    // Force immediate render to test
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'blue';
    ctx.fillRect(100, 100, 50, 50);
    console.log('Drew blue square from game loop');
  }

  if (state.gameOver) {
    renderGame();
    requestAnimationFrame(gameLoop);
    return;
  }

  // Move stars background
  for (let star of state.stars) {
    star.y += star.speed;
    if (star.y > state.player.y + CANVAS_HEIGHT / 2) {
      star.y = state.player.y - CANVAS_HEIGHT / 2;
      star.x = Math.random() * 400;
      star.r = 0.7 + Math.random() * 1.2;
      star.speed = 0.4 + Math.random() * 0.7;
    }
  }
  
  // Update map scrolling
  updateMapScroll();

  updatePlayer(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateBullets(dt);
  updateItems(dt);

  // ---- PLAYER BULLET VS MAP BASES (OPTIMIZED) ----
  // Use collision frequency reduction for mobile performance
  const shouldCheckMapCollisions = !state.performance.isMobile || 
                                  (state.performance.frameCount % 2 === 0);
  
  if (shouldCheckMapCollisions) {
    for (let j = state.bullets.length - 1; j >= 0; j--) {
      let bullet = state.bullets[j];
      
      // Get the tile type at the bullet's position
      const tileType = getMapTileAt(bullet.x, bullet.y);
      
      // Check if it's a base tile (not null, not continent_piece)
      if (tileType && tileType !== "continent_piece") {
        // Remove the bullet
        state.bullets.splice(j, 1);
        
        // Different point values for different base types
        let points = 10;
        switch (tileType) {
          case "hub": points = 25; break;
          case "turret": points = 20; break;
          case "research": points = 15; break;
          case "fuel": points = 15; break;
          case "sensor": points = 15; break;
          case "cargo": points = 12; break;
          default: points = 10; break;
        }
        
        state.score += points;
        playLimitedSound('hit');
        
        // Note: We can't destroy bases in static map system
        // This is a limitation of the simpler approach
      }
    }
  }

  // ---- PLAYER BULLET VS ENEMY (OPTIMIZED) ----
  for (let i = state.enemies.length-1; i>=0; i--) {
    let e = state.enemies[i];
    for (let j = state.bullets.length-1; j>=0; j--) {
      let b = state.bullets[j];
      
      // Quick distance check first (faster than bounds check)
      const dx = Math.abs(b.x - e.x);
      const dy = Math.abs(b.y - e.y);
      if (dx < e.w/2 && dy < e.h/2) {
        state.enemies.splice(i,1);
        state.bullets.splice(j,1);
        state.score += 100;
        state.enemiesKilled++;
        playLimitedSound('hit');
        
        // Drop items (~5% total chance)
        let rand = Math.random();
        if (rand < 0.020) {
          state.items.push({x: e.x, y: e.y, r: 11, vy: 2.1, type: 'triple'});
        } else if (rand < 0.036) {
          state.items.push({x: e.x, y: e.y, r: 12, vy: 2.0, type: 'shield'});
        } else if (rand < 0.046) {
          state.items.push({x: e.x, y: e.y, r: 11, vy: 2.2, type: 'bombplus'});
        } else if (rand < 0.050) {
          state.items.push({x: e.x, y: e.y, r: 13, vy: 2.0, type: 'lifeup'});
        }
        break;
      }
    }
  }

  // ---- BULLET VS BOSS ----
  if (state.boss) {
    for (let j = state.bullets.length-1; j >= 0; j--) {
      let b = state.bullets[j];
      if (b.x > state.boss.x-state.boss.w/2 && b.x < state.boss.x+state.boss.w/2 &&
          b.y > state.boss.y-state.boss.h/2 && b.y < state.boss.y+state.boss.h/2) {
        state.bullets.splice(j,1);
        state.boss.hp -= 1;
        playLimitedSound('hit');
        if (state.boss.hp <= 0) {
          state.score += 1500;
          playLimitedSound('bomb');
          for (let i=0;i<5;i++) {
            state.items.push({
              x: state.boss.x + (Math.random()-0.5)*state.boss.w*0.7,
              y: state.boss.y + (Math.random()-0.5)*state.boss.h*0.7,
              r: 11,
              vy: 2.1+Math.random(),
              type: ['triple','shield','bombplus','lifeup'][Math.floor(Math.random()*4)]
            });
          }
          state.boss = null;
        }
        break;
      }
    }
  }

  // ---- ENEMY BULLET VS PLAYER ----
  // Check if player is invincible
  if (state.invincible && now() > state.invincibleUntil) {
    state.invincible = false;
  }
  
  for (let i = state.enemyBullets.length-1; i >= 0; i--) {
    let eb = state.enemyBullets[i];
    if (!state.invincible && 
        Math.abs(state.player.x - eb.x) < state.player.w*0.36 + eb.r &&
        Math.abs(state.player.y - eb.y) < state.player.h*0.34 + eb.r) {
      if (state.shield) {
        state.shieldHits--;
        if (state.shieldHits <= 0) {
          state.shield = false;
          state.shieldFlash = 12;
          playLimitedSound('shield_break');
        } else {
          playLimitedSound('shield');
        }
        state.enemyBullets.splice(i,1);
        break;
      } else {
        state.lives--;
        playLimitedSound('explosion'); // Play explosion sound
        if (state.lives <= 0) {
          state.gameOver = true;
          const infoElem = document.getElementById('info');
          if (infoElem) infoElem.innerHTML = `<b>Game Over!</b> Score: ${state.score} <br>Press <b>R</b> or <b>Space</b> to Restart`;
          playLimitedSound('over');
          break;
        } else {
          state.player.x = 200;
          state.player.y = 540;
          state.shield = true;
          state.shieldUntil = now() + 1400;
          // Don't start invincibility yet - wait for user to unpause
          state.invincible = false;
          state.invincibleUntil = 0;
          state._startInvincibilityAfterUnpause = true; // Flag to start invincibility after unpause
          state.respawnPauseUntil = Date.now() + 1000; // Pause for 1 second
          playLimitedSound('shield');
          state.enemyBullets = state.enemyBullets.filter(eb => Math.abs(eb.y - state.player.y) > 60);
          break;
        }
      }
    }
  }

  // ---- PLAYER VS BOSS ----
  if (state.boss && !state.invincible && 
      Math.abs(state.player.x - state.boss.x) < (state.player.w+state.boss.w)/2-4 &&
      Math.abs(state.player.y - state.boss.y) < (state.player.h+state.boss.h)/2-8) {
    if (state.shield) {
      state.shieldHits--;
      if (state.shieldHits <= 0) {
        state.shield = false;
        state.shieldFlash = 12;
        playLimitedSound('shield_break');
      } else {
        playLimitedSound('shield');
      }
    } else {
      state.lives--;
      playSound('explosion'); // Play explosion sound
      if (state.lives <= 0) {
        state.gameOver = true;
        const infoElem = document.getElementById('info');
        if (infoElem) infoElem.innerHTML = `<b>Game Over!</b> Score: ${state.score} <br>Press <b>R</b> or <b>Space</b> to Restart`;
        playLimitedSound('over');
      } else {
        state.player.x = 200;
        state.player.y = 540;
        state.shield = true;
        state.shieldUntil = now() + 1400;
        // Don't start invincibility yet - wait for user to unpause
        state.invincible = false;
        state.invincibleUntil = 0;
        state._startInvincibilityAfterUnpause = true; // Flag to start invincibility after unpause
        state.respawnPauseUntil = Date.now() + 1000; // Pause for 1 second
        playLimitedSound('shield');
        state.enemyBullets = state.enemyBullets.filter(eb => Math.abs(eb.y - state.player.y) > 60);
      }
    }
  }

  // ---- SHIELD TIMER ----
  if (state.shield && now() > state.shieldUntil) state.shield = false;
  if (state.tripleFire && now() > state.tripleFireUntil) state.tripleFire = false;
  if (state.shieldFlash > 0) state.shieldFlash--;

  renderGame();
  requestAnimationFrame(gameLoop);
}

// Resume game on first user gesture
function unpauseGame() {
  if (state.paused) {
    state.paused = false;
    console.log('Game unpaused by original unpause function');
  }
}
// Only add keyboard and mouse for desktop - mobile handled in input.js
window.addEventListener('keydown', unpauseGame, { once: true });
window.addEventListener('mousedown', unpauseGame, { once: true });
// Remove touchstart to avoid conflict with mobile controls
// window.addEventListener('touchstart', unpauseGame, { once: true });

requestAnimationFrame(gameLoop);

