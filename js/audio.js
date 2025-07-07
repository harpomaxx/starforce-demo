let audioCtx = null;
let musicNodes = null; // Will store active music generation nodes

function ensureAudio() {
  try {
    if (!audioCtx) {
      console.log('Creating new audio context...');
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported in this browser');
      }
      audioCtx = new AudioContextClass();
      console.log('Audio context created successfully, state:', audioCtx.state);
    }
    
    // Resume if suspended
    if (audioCtx.state === 'suspended') {
      console.log('Resuming suspended audio context...');
      audioCtx.resume().then(() => {
        console.log('Audio context resumed successfully');
      }).catch(err => {
        console.error('Failed to resume audio context:', err);
      });
    }
  } catch (error) {
    console.error('Error in ensureAudio:', error);
    throw error; // Re-throw so callers know it failed
  }
}

// Resume AudioContext on first user gesture (for mobile/browser policy)
function resumeAudioContextOnGesture() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
['touchstart', 'mousedown', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    resumeAudioContextOnGesture();
  }, { once: true, passive: true });
});

export function playSound(type) {
  ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  let freq, duration, gain;
  if (type === 'fire') {
    freq = 480; duration = 0.07; gain = 0.18;
  } else if (type === 'hit') {
    freq = 140; duration = 0.17; gain = 0.27;
  } else if (type === 'over') {
    freq = 52; duration = 0.7; gain = 0.33;
  } else if (type === 'bomb') {
    freq = 200; duration = 0.7; gain = 0.32;
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(820, audioCtx.currentTime + duration*0.85);
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + duration);
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    return;
  } else if (type === 'powerup') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(330, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(660, audioCtx.currentTime + 0.08);
    o.frequency.linearRampToValueAtTime(220, audioCtx.currentTime + 0.2);
    g.gain.value = 0.31;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.23);
    g.gain.setValueAtTime(0.31, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.23);
    return;
  } else if (type === 'shield') {
    o.type = 'sine';
    o.frequency.setValueAtTime(220, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(520, audioCtx.currentTime + 0.23);
    g.gain.value = 0.22;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.26);
    g.gain.setValueAtTime(0.22, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.26);
    return;
  } else if (type === 'shield_break') {
    o.type = 'square';
    o.frequency.setValueAtTime(340, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(90, audioCtx.currentTime + 0.14);
    g.gain.value = 0.36;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.18);
    g.gain.setValueAtTime(0.36, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.18);
    return;
  } else if (type === 'bombplus') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(200, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(740, audioCtx.currentTime + 0.21);
    g.gain.value = 0.33;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.21);
    g.gain.setValueAtTime(0.33, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.21);
    return;
  } else if (type === 'enemyfire') {
    o.type = 'square';
    o.frequency.setValueAtTime(190, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(280 + Math.random()*60, audioCtx.currentTime + 0.13);
    g.gain.value = 0.13 + Math.random()*0.05;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(g.gain.value, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    return;
  } else if (type === 'lifeup') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(400, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(840, audioCtx.currentTime + 0.11);
    g.gain.value = 0.25;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.25);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);
    return;
  } else if (type === 'explosion') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.22);
    g.gain.value = 0.38;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.25);
    g.gain.setValueAtTime(0.38, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.25);
    return;
  }
  o.type = (type === 'over') ? 'triangle' : 'square';
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + duration);
  g.gain.setValueAtTime(gain, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
}

// ================== BACKGROUND MUSIC SYSTEM ==================

// Music track definitions with procedural parameters
const musicTracks = {
  menu: {
    name: "Space Menu",
    tempo: 0.5, // Slow, ambient
    bassFreq: 55, // Low bass note (A1)
    bassVolume: 0.08, // Reduced volume for better mixing
    padFreqs: [110, 165, 220], // Harmonious pad frequencies
    padVolume: 0.06, // Reduced volume for better mixing
    arpFreqs: [440, 523, 659], // A4, C5, E5 - Major triad
    arpSpeed: 2000, // ms between arp notes
    arpVolume: 0.04, // Reduced volume for better mixing
    filterFreq: 800,
    reverb: 0.3
  },
  
  gameplay: {
    name: "Deep Space Exploration",
    tempo: 0.7,
    bassFreq: 60, // Slightly higher bass
    bassVolume: 0.08, // Reduced volume for better mixing
    padFreqs: [120, 180, 240, 320],
    padVolume: 0.06, // Reduced volume for better mixing
    arpFreqs: [330, 415, 523, 659], // More complex arpeggio
    arpSpeed: 1500,
    arpVolume: 0.04, // Reduced volume for better mixing
    filterFreq: 1200,
    reverb: 0.4
  },
  
  boss: {
    name: "Battle Stations",
    tempo: 1.2, // Faster, more intense
    bassFreq: 80, // Higher, more aggressive bass
    bassVolume: 0.10, // Reduced volume for better mixing
    padFreqs: [160, 200, 240, 320, 400], // Dense harmonic layers
    padVolume: 0.08, // Reduced volume for better mixing
    arpFreqs: [220, 277, 330, 415, 523], // Minor scale for tension
    arpSpeed: 800, // Rapid arpeggiation
    arpVolume: 0.06, // Reduced volume for better mixing
    filterFreq: 2000,
    reverb: 0.2 // Less reverb for more aggressive sound
  }
};

// Store active music nodes for cleanup
let activeMusicNodes = {
  oscillators: [],
  gains: [],
  filters: [],
  mainGain: null,
  arpeggiatorInterval: null
};

// Flag to prevent concurrent music creation
let isCreatingMusic = false;

// Track if we're in a user gesture context (for browser policy compliance)
let inUserGestureContext = false;

// Initialize background music system
export function initMusic() {
  try {
    console.log('initMusic: Starting music system initialization...');
    ensureAudio();
    
    if (!audioCtx) {
      console.error('initMusic: No audio context available after ensureAudio');
      return false;
    }
    
    console.log('initMusic: Audio context available, state:', audioCtx.state);
    
    // Create main music gain node for volume control
    if (!activeMusicNodes.mainGain) {
      console.log('initMusic: Creating main music gain node');
      activeMusicNodes.mainGain = audioCtx.createGain();
      activeMusicNodes.mainGain.connect(audioCtx.destination);
      activeMusicNodes.mainGain.gain.value = 0;
      console.log('initMusic: Main gain node created and connected successfully');
    } else {
      console.log('initMusic: Main gain node already exists');
    }
    
    console.log('initMusic: Music system initialization completed successfully');
    return true;
  } catch (error) {
    console.error('initMusic: Error initializing music system:', error);
    console.error('initMusic: Stack trace:', error.stack);
    return false;
  }
}

// Set user gesture context (call this before audio operations from input handlers)
export function setUserGestureContext(inGesture) {
  inUserGestureContext = inGesture;
  console.log(`Audio: User gesture context set to ${inGesture}`);
}

// Start playing a specific music track
export function playMusic(trackName, fadeInTime = 2000) {
  if (!trackName || !musicTracks[trackName]) {
    console.error(`playMusic: Invalid track name "${trackName}" or track not found`);
    console.error('playMusic: Available tracks:', Object.keys(musicTracks));
    return false;
  }
  
  console.log(`playMusic: Starting track "${trackName}" with fade-in time ${fadeInTime}ms`);
  
  // Prevent concurrent music creation
  if (isCreatingMusic) {
    console.log('playMusic: Already creating music, ignoring duplicate call');
    return false;
  }
  
  try {
    isCreatingMusic = true;
    console.log('playMusic: Set isCreatingMusic flag to true');
    
    // DEFENSIVE: Always start with clean arrays at the very beginning
    console.log(`playMusic: Pre-cleanup check - ${activeMusicNodes.oscillators.length} oscillators in array`);
    activeMusicNodes.oscillators = [];
    activeMusicNodes.gains = [];
    activeMusicNodes.filters = [];
    if (activeMusicNodes.arpeggiatorInterval) {
      clearInterval(activeMusicNodes.arpeggiatorInterval);
      activeMusicNodes.arpeggiatorInterval = null;
    }
    ensureAudio();
    if (!audioCtx) {
      console.log('No audio context available');
      isCreatingMusic = false;
      return false;
    }
    
    // Wait for audio context to be running
    if (audioCtx.state === 'suspended') {
      console.log('Audio context suspended, attempting to resume...');
      isCreatingMusic = false;
      audioCtx.resume().then(() => {
        console.log('Audio context resumed, starting music...');
        playMusic(trackName, fadeInTime); // Retry after resume
      }).catch(err => {
        console.warn('Failed to resume audio context for music:', err);
      });
      return false;
    }
    
    if (audioCtx.state !== 'running') {
      console.log(`Audio context state: ${audioCtx.state}, cannot start music`);
      isCreatingMusic = false;
      return false;
    }
    
    console.log(`Starting music track: ${trackName}`);
    initMusic();
    
    if (!activeMusicNodes.mainGain) {
      console.error('Main gain node not created');
      isCreatingMusic = false;
      return false;
    }
    
    // Check if we're already playing music and prevent duplicate starts
    if (activeMusicNodes.oscillators.length > 0) {
      console.log('Music is already playing, stopping existing music first');
      stopMusic(0); // Immediate stop
      
      // Wait a brief moment for cleanup before starting new music
      setTimeout(() => {
        console.log('Retrying playMusic after cleanup...');
        isCreatingMusic = false; // Reset flag before retry
        playMusic(trackName, fadeInTime);
      }, 150);
      isCreatingMusic = false;
      return false;
    }
    
    console.log('No existing oscillators, proceeding with music creation...');
    
    // DEFENSIVE: Clear all arrays before creating new oscillators
    // This ensures we start with a completely clean slate
    activeMusicNodes.oscillators = [];
    activeMusicNodes.gains = [];
    activeMusicNodes.filters = [];
    if (activeMusicNodes.arpeggiatorInterval) {
      clearInterval(activeMusicNodes.arpeggiatorInterval);
      activeMusicNodes.arpeggiatorInterval = null;
    }
    console.log('Cleared all music node arrays before creating new oscillators');
    
    const track = musicTracks[trackName];
    const currentTime = audioCtx.currentTime;
    
    console.log(`Track config:`, track);
    console.log(`Audio context time: ${currentTime}`);
  
  // Create bass oscillator (sustained low drone)
  const bassOsc = audioCtx.createOscillator();
  const bassGain = audioCtx.createGain();
  const bassFilter = audioCtx.createBiquadFilter();
  
  bassOsc.type = 'sawtooth';
  bassOsc.frequency.value = track.bassFreq;
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 150; // Keep bass frequencies
  bassGain.gain.value = track.bassVolume;
  
  bassOsc.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(activeMusicNodes.mainGain);
  
  activeMusicNodes.oscillators.push(bassOsc);
  activeMusicNodes.gains.push(bassGain);
  activeMusicNodes.filters.push(bassFilter);
  
  // Create ambient pad layers
  track.padFreqs.forEach((freq, index) => {
    const padOsc = audioCtx.createOscillator();
    const padGain = audioCtx.createGain();
    const padFilter = audioCtx.createBiquadFilter();
    
    padOsc.type = 'triangle';
    padOsc.frequency.value = freq;
    padFilter.type = 'lowpass';
    padFilter.frequency.value = track.filterFreq;
    
    // Slight detuning for richer sound
    padOsc.detune.value = (Math.random() - 0.5) * 10;
    
    // Phase each pad layer for ambient movement
    padGain.gain.value = track.padVolume * (0.8 + Math.random() * 0.4);
    
    padOsc.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(activeMusicNodes.mainGain);
    
    activeMusicNodes.oscillators.push(padOsc);
    activeMusicNodes.gains.push(padGain);
    activeMusicNodes.filters.push(padFilter);
    
    // Add subtle LFO modulation to pads
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1 + index * 0.05; // Very slow modulation
    lfoGain.gain.value = 20; // Subtle pitch modulation
    
    lfo.connect(lfoGain);
    lfoGain.connect(padOsc.detune);
    
    // NOTE: LFO oscillators are started immediately and don't need to be in the main array
    // since they're not started with the main forEach loop
    // activeMusicNodes.oscillators.push(lfo);  // REMOVED - this was causing the bug
    activeMusicNodes.gains.push(lfoGain);  // Keep gain for cleanup
    
    lfo.start(currentTime);  // Start immediately
  });
  
  // Create arpeggiator pattern
  let arpIndex = 0;
  const startArpeggiator = () => {
    activeMusicNodes.arpeggiatorInterval = setInterval(() => {
      if (!audioCtx || activeMusicNodes.oscillators.length === 0) return;
      
      const freq = track.arpFreqs[arpIndex % track.arpFreqs.length];
      arpIndex++;
      
      // Create arp note
      const arpOsc = audioCtx.createOscillator();
      const arpGain = audioCtx.createGain();
      const arpFilter = audioCtx.createBiquadFilter();
      
      arpOsc.type = 'sine';
      arpOsc.frequency.value = freq;
      arpFilter.type = 'highpass';
      arpFilter.frequency.value = 200;
      
      const noteDuration = track.arpSpeed * 0.8; // 80% of interval for natural decay
      arpGain.gain.value = 0;
      arpGain.gain.setValueAtTime(0, audioCtx.currentTime);
      arpGain.gain.linearRampToValueAtTime(track.arpVolume, audioCtx.currentTime + 0.01);
      arpGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + noteDuration / 1000);
      
      arpOsc.connect(arpFilter);
      arpFilter.connect(arpGain);
      arpGain.connect(activeMusicNodes.mainGain);
      
      arpOsc.start(audioCtx.currentTime);
      arpOsc.stop(audioCtx.currentTime + noteDuration / 1000);
    }, track.arpSpeed);
  };
  
  // Start all oscillators
  console.log(`Starting ${activeMusicNodes.oscillators.length} oscillators`);
  activeMusicNodes.oscillators.forEach((osc, i) => {
    console.log(`Starting oscillator ${i}`);
    osc.start(currentTime);
  });
  
  // Start arpeggiator after a delay
  setTimeout(startArpeggiator, 1000);
  console.log('Arpeggiator scheduled to start in 1 second');
  
  // Fade in the main volume to user's volume setting
  console.log(`Setting up fade in from 0 to user volume over ${fadeInTime}ms`);
  activeMusicNodes.mainGain.gain.value = 0;
  activeMusicNodes.mainGain.gain.setValueAtTime(0, currentTime);
  // Note: Volume will be applied by setMusicVolume() call from input handler
  console.log('Music should be playing now');
  isCreatingMusic = false; // Reset flag on successful completion
  return true;
  
  } catch (error) {
    console.error('playMusic: Error playing music:', error);
    console.error('playMusic: Error stack:', error.stack);
    console.error('playMusic: Track name:', trackName);
    console.error('playMusic: Audio context state:', audioCtx ? audioCtx.state : 'null');
    console.error('playMusic: Main gain node exists:', !!activeMusicNodes.mainGain);
    
    // Clean up any partially created nodes immediately
    console.log(`playMusic ERROR: Cleaning up ${activeMusicNodes.oscillators.length} partially created oscillators`);
    activeMusicNodes.oscillators.forEach((osc, i) => {
      try { 
        console.log(`playMusic ERROR: Stopping oscillator ${i}`);
        osc.stop(); 
      } catch (e) {
        console.log(`playMusic ERROR: Oscillator ${i} couldn't be stopped:`, e.message);
      }
    });
    
    // Clear arpeggiator if running
    if (activeMusicNodes.arpeggiatorInterval) {
      clearInterval(activeMusicNodes.arpeggiatorInterval);
      activeMusicNodes.arpeggiatorInterval = null;
    }
    
    // Reset all arrays immediately
    activeMusicNodes.oscillators = [];
    activeMusicNodes.gains = [];
    activeMusicNodes.filters = [];
    console.log('playMusic ERROR: All arrays cleared');
    
    // Don't disable the music system immediately - let user try again
    console.warn('playMusic: Music playback failed, but system remains enabled for retry');
    isCreatingMusic = false; // Reset flag on error
    return false;
  }
}

// Stop background music
export function stopMusic(fadeOutTime = 1000) {
  if (!activeMusicNodes.mainGain) {
    console.log('stopMusic: No main gain node to stop');
    return;
  }
  
  console.log(`stopMusic: Stopping music with ${fadeOutTime}ms fade out`);
  
  const currentTime = audioCtx ? audioCtx.currentTime : 0;
  
  // Fade out
  if (fadeOutTime > 0 && audioCtx) {
    try {
      activeMusicNodes.mainGain.gain.linearRampToValueAtTime(0, currentTime + fadeOutTime / 1000);
    } catch (error) {
      console.warn('stopMusic: Error during fade out:', error);
      activeMusicNodes.mainGain.gain.value = 0;
    }
  } else {
    activeMusicNodes.mainGain.gain.value = 0;
  }
  
  // Clean up nodes - immediate cleanup if no fade out
  const cleanupDelay = fadeOutTime > 0 ? Math.max(fadeOutTime, 50) : 0;
  
  const cleanup = () => {
    console.log(`stopMusic: Cleaning up ${activeMusicNodes.oscillators.length} oscillators`);
    
    // Stop oscillators
    activeMusicNodes.oscillators.forEach((osc, i) => {
      try {
        console.log(`stopMusic: Stopping oscillator ${i}`);
        osc.stop();
      } catch (e) {
        console.log(`stopMusic: Oscillator ${i} already stopped`);
      }
    });
    
    // Clear arpeggiator
    if (activeMusicNodes.arpeggiatorInterval) {
      console.log('stopMusic: Clearing arpeggiator interval');
      clearInterval(activeMusicNodes.arpeggiatorInterval);
      activeMusicNodes.arpeggiatorInterval = null;
    }
    
    // Reset arrays
    activeMusicNodes.oscillators = [];
    activeMusicNodes.gains = [];
    activeMusicNodes.filters = [];
    
    // Reset creation flag
    isCreatingMusic = false;
    
    console.log('stopMusic: Cleanup completed');
  };
  
  if (cleanupDelay === 0) {
    cleanup(); // Immediate cleanup
  } else {
    setTimeout(cleanup, cleanupDelay); // Delayed cleanup
  }
}

// Set music volume (0-1)
export function setMusicVolume(volume, fadeTime = 0) {
  try {
    if (activeMusicNodes.mainGain && audioCtx) {
      const targetVolume = Math.max(0, Math.min(1, volume));
      console.log(`Setting music volume to ${(targetVolume * 100).toFixed(0)}% ${fadeTime > 0 ? `over ${fadeTime}ms` : 'immediately'}`);
      
      if (fadeTime > 0) {
        // Fade to new volume
        activeMusicNodes.mainGain.gain.linearRampToValueAtTime(
          targetVolume, 
          audioCtx.currentTime + fadeTime / 1000
        );
      } else {
        // Set immediately
        activeMusicNodes.mainGain.gain.value = targetVolume;
      }
    }
  } catch (error) {
    console.warn('Error setting music volume:', error);
  }
}

// Debug function to check audio context state
export function checkAudioContextState() {
  try {
    console.log('=== AUDIO CONTEXT STATE CHECK ===');
    console.log('audioCtx exists:', !!audioCtx);
    
    if (audioCtx) {
      console.log('Audio context state:', audioCtx.state);
      console.log('Audio context sampleRate:', audioCtx.sampleRate);
      console.log('Audio context currentTime:', audioCtx.currentTime);
      console.log('Audio context destination:', audioCtx.destination);
    } else {
      console.log('Audio context not created yet');
    }
    
    console.log('activeMusicNodes.mainGain exists:', !!activeMusicNodes.mainGain);
    if (activeMusicNodes.mainGain) {
      console.log('Main gain value:', activeMusicNodes.mainGain.gain.value);
    }
    
    console.log('Active oscillators:', activeMusicNodes.oscillators.length);
    console.log('Active gains:', activeMusicNodes.gains.length);
    console.log('Active filters:', activeMusicNodes.filters.length);
    console.log('Arpeggiator running:', !!activeMusicNodes.arpeggiatorInterval);
    
    // Check browser support
    console.log('AudioContext supported:', !!(window.AudioContext || window.webkitAudioContext));
    console.log('User agent:', navigator.userAgent);
    
    console.log('=== END AUDIO CONTEXT STATE CHECK ===');
  } catch (error) {
    console.error('Error checking audio context state:', error);
  }
}

// Debug function to test audio system
export function testMusicSystem() {
  try {
    ensureAudio();
    if (!audioCtx) {
      console.log('No audio context for test');
      return;
    }
    
    console.log(`Audio context state: ${audioCtx.state}`);
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        console.log('Audio context resumed for test');
        testMusicSystem(); // Retry after resume
      });
      return;
    }
    
    // Create a simple test tone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.frequency.value = 440; // A4 note
    osc.type = 'sine';
    gain.gain.value = 0.1;
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5); // 0.5 second beep
    
    console.log('Test tone played');
  } catch (error) {
    console.error('Test music system error:', error);
  }
}

// Debug function to test music system with main gain
export function testMusicSystemWithMainGain() {
  try {
    console.log('Testing music system with main gain...');
    ensureAudio();
    initMusic();
    
    if (!activeMusicNodes.mainGain) {
      console.error('Main gain node not available');
      return;
    }
    
    // Create a simple test tone through the music system
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.frequency.value = 660; // E5 note (different from test tone)
    osc.type = 'sine';
    gain.gain.value = 0.2;
    
    // Connect through the music system
    osc.connect(gain);
    gain.connect(activeMusicNodes.mainGain);
    
    // Set main gain volume
    activeMusicNodes.mainGain.gain.value = 0.8;
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1.0); // 1 second beep
    
    console.log('Music system test tone played through main gain');
  } catch (error) {
    console.error('Test music system with main gain error:', error);
  }
}

// Simple test to verify Web Audio API is working
export function testBasicAudio() {
  try {
    console.log('=== BASIC AUDIO TEST ===');
    console.log('Testing Web Audio API support...');
    
    // Test 1: Check if AudioContext is available
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.error('TEST FAILED: Web Audio API not supported');
      return false;
    }
    console.log('✓ Web Audio API is supported');
    
    // Test 2: Create AudioContext
    let testAudioCtx;
    try {
      testAudioCtx = new AudioContextClass();
      console.log('✓ AudioContext created successfully');
      console.log('  - State:', testAudioCtx.state);
      console.log('  - Sample rate:', testAudioCtx.sampleRate);
    } catch (error) {
      console.error('TEST FAILED: Cannot create AudioContext:', error);
      return false;
    }
    
    // Test 3: Create and connect nodes
    try {
      const osc = testAudioCtx.createOscillator();
      const gain = testAudioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(testAudioCtx.destination);
      
      console.log('✓ Audio nodes created and connected');
    } catch (error) {
      console.error('TEST FAILED: Cannot create audio nodes:', error);
      testAudioCtx.close();
      return false;
    }
    
    // Test 4: Play a very short beep
    try {
      if (testAudioCtx.state === 'suspended') {
        console.log('Resuming audio context for test...');
        testAudioCtx.resume();
      }
      
      const osc = testAudioCtx.createOscillator();
      const gain = testAudioCtx.createGain();
      
      osc.frequency.value = 880; // A5 note
      osc.type = 'sine';
      gain.gain.value = 0.05; // Very quiet
      
      osc.connect(gain);
      gain.connect(testAudioCtx.destination);
      
      osc.start();
      osc.stop(testAudioCtx.currentTime + 0.1); // 100ms beep
      
      console.log('✓ Test beep played (100ms)');
    } catch (error) {
      console.error('TEST FAILED: Cannot play test sound:', error);
      testAudioCtx.close();
      return false;
    }
    
    // Clean up
    setTimeout(() => {
      testAudioCtx.close();
      console.log('✓ Test audio context closed');
    }, 200);
    
    console.log('✓ ALL TESTS PASSED - Web Audio API is working!');
    console.log('=== END BASIC AUDIO TEST ===');
    return true;
  } catch (error) {
    console.error('TEST FAILED: Unexpected error in basic audio test:', error);
    return false;
  }
}

// Simplified music player for debugging
export function playSimpleMusic() {
  try {
    console.log('Playing simple music...');
    ensureAudio();
    initMusic();
    
    if (!activeMusicNodes.mainGain) {
      console.error('Main gain node not available for simple music');
      return;
    }
    
    // Clean up existing music
    stopMusic(0);
    
    // Create a simple bass drone
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.value = 55; // Low A
    bassGain.gain.value = 0.2;
    
    bassOsc.connect(bassGain);
    bassGain.connect(activeMusicNodes.mainGain);
    
    activeMusicNodes.oscillators.push(bassOsc);
    activeMusicNodes.gains.push(bassGain);
    
    // Set main gain and start
    activeMusicNodes.mainGain.gain.value = 0;
    activeMusicNodes.mainGain.gain.setValueAtTime(0, audioCtx.currentTime);
    activeMusicNodes.mainGain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 2);
    
    bassOsc.start();
    
    console.log('Simple music (bass drone) should be playing');
  } catch (error) {
    console.error('Simple music error:', error);
  }
}

// Update music based on game state (for dynamic intensity)
export function updateMusicIntensity(intensity) {
  try {
    if (!activeMusicNodes.mainGain || !audioCtx) return;
    
    // Modulate filter frequencies based on intensity
    activeMusicNodes.filters.forEach(filter => {
      try {
        if (filter.type === 'lowpass') {
          const baseFreq = 800;
          const targetFreq = baseFreq + (intensity * 1200);
          filter.frequency.exponentialRampToValueAtTime(
            Math.max(100, targetFreq), 
            audioCtx.currentTime + 0.5
          );
        }
      } catch (e) {
        // Skip this filter if it has an error
      }
    });
    
    // Slightly increase volume during intense moments
    const volumeBoost = 1 + (intensity * 0.3);
    activeMusicNodes.gains.forEach(gain => {
      try {
        if (gain !== activeMusicNodes.mainGain) {
          gain.gain.exponentialRampToValueAtTime(
            Math.max(0.001, gain.gain.value * volumeBoost),
            audioCtx.currentTime + 0.5
          );
        }
      } catch (e) {
        // Skip this gain if it has an error
      }
    });
  } catch (error) {
    console.warn('Error updating music intensity:', error);
  }
}

