import { state, resetGame } from './state.js';

// Debug control - can be enabled via URL parameter ?debug=1 or localStorage
let debugEnabled = false;

// Check if debug is enabled
function isDebugEnabled() {
  if (debugEnabled) return true;
  
  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === '1') {
    debugEnabled = true;
    return true;
  }
  
  // Check localStorage
  if (localStorage.getItem('starforce-debug') === 'true') {
    debugEnabled = true;
    return true;
  }
  
  return false;
}

// Toggle debug mode
function toggleDebug() {
  debugEnabled = !debugEnabled;
  localStorage.setItem('starforce-debug', debugEnabled.toString());
  
  const debugDiv = document.getElementById('debug-log');
  if (debugDiv) {
    debugDiv.style.display = debugEnabled ? 'block' : 'none';
    if (!debugEnabled) {
      debugDiv.innerHTML = '';
    }
  }
  
  const infoDiv = document.getElementById('info');
  if (infoDiv && !debugEnabled) {
    // Clear debug messages from info div
    infoDiv.innerHTML = infoDiv.innerHTML.replace(/<div[^>]*color:#0f0[^>]*>.*?<\/div>/g, '');
  }
  
  console.log(`Debug mode ${debugEnabled ? 'enabled' : 'disabled'}`);
  return debugEnabled;
}

// Mobile detection helper
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent) || 
         'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Mobile debug logging
function debugLog(message) {
  if (!isDebugEnabled()) return;
  
  const debugDiv = document.getElementById('debug-log');
  if (debugDiv) {
    debugDiv.style.display = 'block';
    debugDiv.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
  console.log(message);
  
  // Also try to show debug in the info div for mobile
  const infoDiv = document.getElementById('info');
  if (infoDiv && isMobile()) {
    infoDiv.innerHTML += `<div style="font-size:14px;color:#0f0;background:rgba(0,0,0,0.7);padding:2px;margin:2px;">${message}</div>`;
  }
  
  // For critical mobile debugging, also show alerts for first few messages
  if (isMobile() && !window.mobileAlertCount) {
    window.mobileAlertCount = 0;
  }
  if (isMobile() && window.mobileAlertCount < 3 && (message.includes('FORCE START') || message.includes('UNPAUSED'))) {
    window.mobileAlertCount++;
    setTimeout(() => alert(`DEBUG: ${message}`), 100);
  }
}

// Expose debug toggle globally
window.toggleDebug = toggleDebug;

export function setupInput() {
  // Setup debug toggle button
  const debugToggleBtn = document.getElementById('debug-toggle');
  if (debugToggleBtn) {
    debugToggleBtn.addEventListener('click', () => {
      const isEnabled = toggleDebug();
      debugToggleBtn.textContent = isEnabled ? 'Debug ON' : 'Debug OFF';
      debugToggleBtn.style.color = isEnabled ? '#0f0' : '#666';
    });
    
    // Set initial state
    const isEnabled = isDebugEnabled();
    debugToggleBtn.textContent = isEnabled ? 'Debug ON' : 'Debug OFF';
    debugToggleBtn.style.color = isEnabled ? '#0f0' : '#666';
  }
  
  window.addEventListener('keydown', e => {
    state.keys[e.code] = true;
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyB"].includes(e.code)) e.preventDefault();
    if (state.gameOver && (e.code === "KeyR" || e.code === "Space")) {
      resetGame();
      // Ensure game starts immediately after restart
      state.paused = false;
    }
    
    // Music controls
    if (e.code === "KeyM") {
      // Toggle music on/off
      state.music.enabled = !state.music.enabled;
      console.log(`Music ${state.music.enabled ? 'enabled' : 'disabled'}`);
      if (!state.music.enabled) {
        // Import stopMusic function if music is disabled
        import('./audio.js').then(audio => audio.stopMusic(500));
      } else {
        // When enabling music, ensure audio context is ready and force track change
        import('./audio.js').then(audio => {
          audio.initMusic();
          // Force a track change to start music immediately
          state.music.targetTrack = null; // Reset target to force change
          console.log('Music enabled, forcing track start');
        });
      }
    }
    if (e.code === "Minus" || e.code === "NumpadSubtract") {
      // Decrease music volume
      state.music.volume = Math.max(0, state.music.volume - 0.1);
      console.log(`Music volume: ${(state.music.volume * 100).toFixed(0)}%`);
    }
    if (e.code === "Equal" || e.code === "NumpadAdd") {
      // Increase music volume (Equal is typically the + key without shift)
      state.music.volume = Math.min(1, state.music.volume + 0.1);
      console.log(`Music volume: ${(state.music.volume * 100).toFixed(0)}%`);
    }
    if (e.code === "KeyT") {
      // Test music system
      import('./audio.js').then(audio => {
        console.log('Testing music system...');
        audio.testMusicSystem();
      });
    }
    if (e.code === "KeyG") {
      // Test music system with main gain
      import('./audio.js').then(audio => {
        console.log('Testing music system with main gain...');
        audio.testMusicSystemWithMainGain();
      });
    }
    if (e.code === "KeyS") {
      // Test simple music
      import('./audio.js').then(audio => {
        console.log('Testing simple music...');
        audio.playSimpleMusic();
      });
    }
  });
  window.addEventListener('keyup', e => { state.keys[e.code] = false; });

  // --- Mobile Controls ---
  debugLog(`Mobile detection: ${isMobile()}, UA: ${navigator.userAgent.substring(0,50)}...`);
  
  // Show mobile controls on touch devices or for debugging
  const mc = document.getElementById('mobile-controls');
  debugLog(`Mobile controls element found: ${!!mc}`);
  if (mc && (isMobile() || window.location.search.includes('debug'))) {
    debugLog('Showing mobile controls');
    mc.style.display = 'block';
    setupVirtualJoystick();
    
    // Show debug force start button
    const forceBtn = document.getElementById('force-start');
    if (forceBtn) {
      // forceBtn.style.display = 'block'; // Hidden - button functionality remains
      debugLog('Force start button found but kept hidden');
      forceBtn.addEventListener('touchstart', e => {
        debugLog('FORCE START BUTTON PRESSED');
        state.paused = false;
        window.FORCE_UNPAUSE = true;
        debugLog('Force unpause set via button');
        e.preventDefault();
      });
      // Also add click for desktop testing
      forceBtn.addEventListener('click', _e => {
        debugLog('FORCE START BUTTON CLICKED');
        state.paused = false;
        window.FORCE_UNPAUSE = true;
        debugLog('Force unpause set via button click');
      });
    } else {
      debugLog('Force start button not found');
    }
  }

  // Simple global touch unpause for mobile - this should always work
  if (isMobile()) {
    debugLog('Adding global mobile touch unpause');
    
    // Add touch counter for debugging
    let touchCount = 0;
    document.addEventListener('touchstart', function unpauseOnTouch(e) {
      touchCount++;
      debugLog(`Global touch #${touchCount} detected, paused: ${state.paused}, gameOver: ${state.gameOver}, target: ${e.target.tagName}`);
      
      // Restart game if it's over
      if (state.gameOver) {
        resetGame();
        state.paused = false;
        debugLog('*** GAME RESTARTED BY GLOBAL TOUCH ***');
        return;
      }
      
      if (state.paused) {
        state.paused = false;
        debugLog('*** GAME UNPAUSED BY GLOBAL TOUCH ***');
      }
    }, { passive: true });
    
    // Also try with body
    document.body.addEventListener('touchstart', function(_e) {
      debugLog(`Body touch detected, paused: ${state.paused}, gameOver: ${state.gameOver}`);
      
      // Restart game if it's over
      if (state.gameOver) {
        resetGame();
        state.paused = false;
        debugLog('*** GAME RESTARTED BY BODY TOUCH ***');
        return;
      }
      
      if (state.paused) {
        state.paused = false;
        debugLog('*** GAME UNPAUSED BY BODY TOUCH ***');
      }
    }, { passive: true });
  }
  
  // Fallback: Add touch unpause to canvas and mobile controls for mobile
  if (isMobile()) {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('touchstart', _e => {
        if (state.paused) {
          state.paused = false;
          console.log('Game unpaused by canvas touch');
        }
      }, { once: true, passive: true });
    }
    
    // Also add to mobile controls container as another fallback
    if (mc) {
      mc.addEventListener('touchstart', _e => {
        if (state.paused) {
          state.paused = false;
          console.log('Game unpaused by mobile controls touch');
        }
      }, { once: true, passive: true });
    }
  }
  // Setup action buttons (Fire/Bomb only - movement handled by joystick)
  const actionBtnMap = [
    ['btn-fire', 'Space'],
    ['btn-bomb', 'KeyB']
  ];
  
  // Setup force start button
  const forceBtn = document.getElementById('force-start');
  debugLog(`Looking for force-start button: ${!!forceBtn}`);
  if (forceBtn) {
    debugLog('Force start button found and setting up');
    debugLog(`Button text: "${forceBtn.textContent}"`);
    debugLog(`Button style: ${forceBtn.style.background}`);
    
    // Add multiple event types to catch any interaction
    forceBtn.addEventListener('touchstart', e => {
      debugLog('=== FORCE START TOUCHSTART ===');
      state.paused = false;
      window.FORCE_UNPAUSE = true;
      debugLog('Force unpause set via touchstart');
      e.preventDefault();
      e.stopPropagation();
    }, {passive: false});
    
    forceBtn.addEventListener('touchend', e => {
      debugLog('=== FORCE START TOUCHEND ===');
      e.preventDefault();
    }, {passive: false});
    
    forceBtn.addEventListener('click', _e => {
      debugLog('=== FORCE START CLICK ===');
      state.paused = false;
      window.FORCE_UNPAUSE = true;
      debugLog('Force unpause set via click');
    });
    
    forceBtn.addEventListener('mousedown', _e => {
      debugLog('=== FORCE START MOUSEDOWN ===');
      state.paused = false;
      window.FORCE_UNPAUSE = true;
      debugLog('Force unpause set via mousedown');
    });
    
    debugLog('All event listeners added to force start button');
  } else {
    debugLog('Force start button NOT FOUND');
  }
  for (const [btnId, code] of actionBtnMap) {
    const btn = document.getElementById(btnId);
    if (!btn) continue;
    
    // Touch events
    btn.addEventListener('touchstart', e => {
      debugLog(`${btnId} button touchstart triggered`);
      
      // Restart game if it's over and fire button is pressed
      if (state.gameOver && btnId === 'btn-fire') {
        resetGame();
        state.paused = false;
        debugLog('Game restarted via mobile fire button');
        return;
      }
      
      // Unpause game on first touch
      if (state.paused) {
        state.paused = false;
        debugLog(`Game unpaused by ${btnId} button`);
      }
      
      state.keys[code] = true;
      e.preventDefault();
      // Remove stopPropagation to allow document-level events
    }, {passive:false});
    
    btn.addEventListener('touchend', e => {
      state.keys[code] = false;
      e.preventDefault();
    }, {passive:false});
    
    btn.addEventListener('touchcancel', e => {
      state.keys[code] = false;
      e.preventDefault();
    }, {passive:false});
    
    // Mouse events for desktop testing
    btn.addEventListener('mousedown', e => {
      state.keys[code] = true;
      e.preventDefault();
    });
    
    btn.addEventListener('mouseup', e => {
      state.keys[code] = false;
      e.preventDefault();
    });
    
    btn.addEventListener('mouseleave', _e => {
      state.keys[code] = false;
    });
  }
}

function setupVirtualJoystick() {
  debugLog('Setting up virtual joystick');
  const joystick = document.getElementById('joystick');
  const knob = document.getElementById('joystick-knob');
  const touchZone = document.getElementById('joystick-touch-zone');
  debugLog(`Joystick elements found: joystick=${!!joystick}, knob=${!!knob}, touchZone=${!!touchZone}`);
  if (!joystick || !knob) {
    debugLog('Joystick setup failed - elements not found');
    return;
  }
  
  let isActive = false;
  let centerX = 0;
  let centerY = 0;
  let touchCounter = 0;
  let joystickTouchId = null;
  
  function getJoystickCenter() {
    // Always calculate center based on the actual joystick element, not touch zone
    const rect = joystick.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    debugLog(`Joystick center: ${centerX}, ${centerY}`);
  }
  
  function handleStart(clientX, clientY) {
    isActive = true;
    getJoystickCenter();
    knob.classList.add('active');
    updateJoystick(clientX, clientY);
  }
  
  function handleMove(clientX, clientY) {
    if (!isActive) return;
    updateJoystick(clientX, clientY);
  }
  
  function handleEnd() {
    if (!isActive) return;
    isActive = false;
    knob.classList.remove('active');
    
    // Reset knob position
    knob.style.left = '50%';
    knob.style.top = '50%';
    
    // Clear all movement keys
    state.keys['ArrowLeft'] = false;
    state.keys['ArrowRight'] = false;
    state.keys['ArrowUp'] = false;
    state.keys['ArrowDown'] = false;
  }
  
  function updateJoystick(clientX, clientY) {
    // Recalculate center to ensure accuracy
    getJoystickCenter();
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = joystick.offsetWidth / 2 - 25; // Account for knob size
    
    // Debug only occasionally to avoid spam
    if (Math.random() < 0.1) {
      debugLog(`Touch: ${clientX}, ${clientY} | Delta: ${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}`);
    }
    
    // Limit knob movement to joystick area
    const limitedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    const knobX = Math.cos(angle) * limitedDistance;
    const knobY = Math.sin(angle) * limitedDistance;
    
    // Update knob position
    knob.style.left = `calc(50% + ${knobX}px)`;
    knob.style.top = `calc(50% + ${knobY}px)`;
    
    // Update movement keys based on position with improved thresholds
    const deadZone = 8; // Small dead zone in center (pixels)
    const threshold = Math.max(deadZone, maxDistance * 0.12); // 12% of max distance to activate
    
    // Only activate if outside dead zone
    const inDeadZone = Math.abs(knobX) < deadZone && Math.abs(knobY) < deadZone;
    
    state.keys['ArrowLeft'] = !inDeadZone && knobX < -threshold;
    state.keys['ArrowRight'] = !inDeadZone && knobX > threshold;
    state.keys['ArrowUp'] = !inDeadZone && knobY < -threshold;
    state.keys['ArrowDown'] = !inDeadZone && knobY > threshold;
    
    // Lightweight visual feedback
    const inputDetected = state.keys['ArrowLeft'] || state.keys['ArrowRight'] || 
                         state.keys['ArrowUp'] || state.keys['ArrowDown'];
    
    knob.classList.toggle('input-detected', inputDetected);
  }
  
  // Touch events - use touch zone for better detection
  const touchTarget = touchZone || joystick;
  
  touchTarget.addEventListener('touchstart', e => {
    touchCounter++;
    debugLog(`Joystick touchstart #${touchCounter} - Touch count: ${e.touches.length}`);
    e.preventDefault();
    
    // Always unpause, regardless of current state
    debugLog(`Current state: paused=${state.paused}, gameOver=${state.gameOver}`);
    state.paused = false;
    window.FORCE_UNPAUSE = true;
    debugLog('FORCED UNPAUSE - should start game now');
    
    // Immediate visual test
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 50, 50);
        debugLog('Drew red test square on canvas');
      }
    }
    
    const touch = e.touches[0];
    joystickTouchId = touch.identifier;
    handleStart(touch.clientX, touch.clientY);
  }, {passive:false});
  
  debugLog('Joystick event listeners added');
  
  // Track only the specific touch that started on joystick
  document.addEventListener('touchmove', e => {
    if (!isActive || joystickTouchId === null) return;
    
    // Find the specific touch that belongs to the joystick
    const joystickTouch = Array.from(e.touches).find(t => t.identifier === joystickTouchId);
    if (!joystickTouch) return;
    
    handleMove(joystickTouch.clientX, joystickTouch.clientY);
    
    // Don't prevent default to allow other touch events (like fire button)
  }, {passive:false});
  
  document.addEventListener('touchend', e => {
    if (!isActive || joystickTouchId === null) return;
    
    // Check if the joystick touch ended
    const remainingTouches = Array.from(e.touches).map(t => t.identifier);
    if (!remainingTouches.includes(joystickTouchId)) {
      joystickTouchId = null;
      handleEnd();
    }
  }, {passive:false});
  
  document.addEventListener('touchcancel', _e => {
    if (isActive) {
      joystickTouchId = null;
      handleEnd();
    }
  }, {passive:false});
  
  // Mouse events for desktop testing
  touchTarget.addEventListener('mousedown', e => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  });
  
  document.addEventListener('mousemove', e => {
    if (!isActive) return;
    handleMove(e.clientX, e.clientY);
  });
  
  document.addEventListener('mouseup', _e => {
    handleEnd();
  });
  
  // Prevent scrolling on mobile
  if (isMobile()) {
    // Prevent scrolling when touching mobile controls
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
      mobileControls.addEventListener('touchmove', e => {
        e.preventDefault();
      }, {passive:false});
    }
    
    // Prevent scrolling when touching canvas area
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('touchmove', e => {
        e.preventDefault();
      }, {passive:false});
    }
    
    // Prevent pull-to-refresh and overscroll
    document.addEventListener('touchstart', e => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, {passive:false});
    
    document.addEventListener('touchmove', e => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, {passive:false});
  }
}

