import { resetGame, state, CANVAS_HEIGHT, createSpatialContinent, CONTINENT_SPEED } from './state.js';
import { setupInput } from './input.js';
import { updatePlayer } from './player.js';
import { updateEnemies } from './enemy.js';
import { updateBoss } from './boss.js';
import { updateBullets } from './bullet.js';
import { updateItems } from './items.js';
import { renderGame } from './render.js';
import { now, rectsCollide } from './utils.js';
import { playSound, initMusic, playMusic, stopMusic, setMusicVolume, updateMusicIntensity } from './audio.js';

setupInput();
resetGame();

// Initialize music system (commented out to prevent freeze)
// initMusic();

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

// Music system management
function updateMusicSystem() {
  if (!state.music.enabled) return;
  
  // Only proceed if we have a valid audio context and user has interacted
  try {
    // Determine what track should be playing based on game state
    let targetTrack = 'menu';
    
    if (!state.paused && !state.gameOver && state.gameStarted) {
      if (state.boss && state.boss.alive) {
        targetTrack = 'boss';
      } else {
        targetTrack = 'gameplay';
      }
    }
    
    // Handle track changes
    if (state.music.targetTrack !== targetTrack) {
      state.music.targetTrack = targetTrack;
      state.music.lastTrackChange = now();
      
      if (state.music.enabled) {
        // Initialize music system only when needed and after user interaction
        initMusic();
        playMusic(targetTrack, state.music.crossfadeTime);
        state.music.currentTrack = targetTrack;
        state.music.isPlaying = true;
      }
    }
    
    // Update music intensity based on game state
    if (state.music.isPlaying && !state.paused && !state.gameOver) {
      let intensity = 0;
      
      // Base intensity on various game factors
      if (state.boss && state.boss.alive) {
        intensity = 0.8 + ((state.boss.hits || 0) / 20); // Max intensity during boss fights
      } else {
        // Build intensity based on enemies on screen and player status
        intensity += Math.min(state.enemies.length / 10, 0.3); // More enemies = more intensity
        intensity += Math.min(state.enemyBullets.length / 15, 0.2); // More bullets = more intensity
        intensity += (state.lives < 2) ? 0.3 : 0; // Low health = more intensity
        intensity += state.shield ? -0.2 : 0; // Shield = less intensity
      }
      
      intensity = Math.max(0, Math.min(1, intensity));
      state.music.intensity = intensity;
      updateMusicIntensity(intensity);
    }
    
    // Set music volume based on user settings
    setMusicVolume(state.music.enabled ? state.music.volume : 0);
  } catch (error) {
    // Silently handle any audio context errors to prevent game freeze
    console.warn('Music system error:', error);
    state.music.enabled = false;
  }
}

function gameLoop(ts) {
  let dt = ts - lastTime;
  lastTime = ts;
  
  // ==================== MUSIC MANAGEMENT ====================
  updateMusicSystem();
  
  // Debug: Log every 60 frames (about once per second)
  if (!window.frameCount) window.frameCount = 0;
  window.frameCount++;
  if (window.frameCount % 60 === 0) {
    console.log(`Game loop running: frame ${window.frameCount}, paused: ${state.paused}, gameOver: ${state.gameOver}, FORCE_UNPAUSE: ${window.FORCE_UNPAUSE}`);
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
  
  // Move spatial continents (with integrated bases) - all at same speed
  for (let i = state.spatialContinents.length - 1; i >= 0; i--) {
    let continent = state.spatialContinents[i];
    continent.y += CONTINENT_SPEED; // All continents move at exactly the same speed
    
    // Remove continents that have moved off screen
    if (continent.y > CANVAS_HEIGHT + 200) {
      state.spatialContinents.splice(i, 1);
      // High chance to create new continent for continuous coverage
      if (Math.random() < 0.85) {
        createSpatialContinent();
      }
    }
  }
  
  // Ensure continuous continental presence - spawn new continents proactively
  if (state.spatialContinents.length < 2 && Math.random() < 0.8) {
    createSpatialContinent();
  }
  
  // Occasionally add extra continents for dense coverage
  if (state.spatialContinents.length < 3 && Math.random() < 0.3) {
    createSpatialContinent();
  }

  updatePlayer(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateBullets(dt);
  updateItems(dt);

  // ---- PLAYER BULLET VS SPATIAL BASES (INTEGRATED IN CONTINENTS) ----
  for (let i = state.spatialContinents.length - 1; i >= 0; i--) {
    let continent = state.spatialContinents[i];
    for (let j = state.bullets.length - 1; j >= 0; j--) {
      let bullet = state.bullets[j];
      
      // Check if bullet is within continent bounds
      if (bullet.x >= continent.x && bullet.x <= continent.x + continent.width * continent.squareSize &&
          bullet.y >= continent.y && bullet.y <= continent.y + continent.height * continent.squareSize) {
        
        // Calculate which square was hit
        let col = Math.floor((bullet.x - continent.x) / continent.squareSize);
        let row = Math.floor((bullet.y - continent.y) / continent.squareSize);
        
        // Check if the square exists and is an interactive base (not just continental structure)
        if (row >= 0 && row < continent.height && col >= 0 && col < continent.width && 
            continent.bases[row][col] && continent.bases[row][col].active) {
          // Destroy the base square
          const baseType = continent.bases[row][col].type;
          continent.bases[row][col] = false;
          state.bullets.splice(j, 1);
          
          // Different point values for different base types
          let points = 10;
          switch (baseType) {
            case "hub": points = 25; break;      // Command centers worth more
            case "turret": points = 20; break;   // Defense structures
            case "research": points = 15; break; // Important facilities
            case "fuel": points = 15; break;
            case "sensor": points = 15; break;
            case "cargo": points = 12; break;
            default: points = 10; break;         // Standard modules
          }
          
          state.score += points;
          playSound('hit');
          break;
        }
      }
    }
  }

  // ---- PLAYER BULLET VS ENEMY ----
  for (let i = state.enemies.length-1; i>=0; i--) {
    let e = state.enemies[i];
    for (let j = state.bullets.length-1; j>=0; j--) {
      let b = state.bullets[j];
      if (b.x > e.x-e.w/2 && b.x < e.x+e.w/2 && b.y > e.y-e.h/2 && b.y < e.y+e.h/2) {
        state.enemies.splice(i,1);
        state.bullets.splice(j,1);
        state.score += 100;
        state.enemiesKilled++; // Track enemy kills
        playSound('hit');
        // Drop items (~5% total chance - approximately 1 item every 20 seconds)
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
        playSound('hit');
        if (state.boss.hp <= 0) {
          state.score += 1500;
          playSound('bomb');
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
          playSound('shield_break');
        } else {
          playSound('shield');
        }
        state.enemyBullets.splice(i,1);
        break;
      } else {
        state.lives--;
        playSound('explosion'); // Play explosion sound
        if (state.lives <= 0) {
          state.gameOver = true;
          const infoElem = document.getElementById('info');
          if (infoElem) infoElem.innerHTML = `<b>Game Over!</b> Score: ${state.score} <br>Press <b>R</b> or <b>Space</b> to Restart`;
          playSound('over');
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
          playSound('shield');
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
        playSound('shield_break');
      } else {
        playSound('shield');
      }
    } else {
      state.lives--;
      playSound('explosion'); // Play explosion sound
      if (state.lives <= 0) {
        state.gameOver = true;
        const infoElem = document.getElementById('info');
        if (infoElem) infoElem.innerHTML = `<b>Game Over!</b> Score: ${state.score} <br>Press <b>R</b> or <b>Space</b> to Restart`;
        playSound('over');
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
        playSound('shield');
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

