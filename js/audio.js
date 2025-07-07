let audioCtx = null;
let musicNodes = null; // Will store active music generation nodes

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if suspended
  if (audioCtx.state === 'suspended') {
    console.log('Resuming suspended audio context...');
    audioCtx.resume().then(() => {
      console.log('Audio context resumed successfully');
    }).catch(err => {
      console.warn('Failed to resume audio context:', err);
    });
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
    bassVolume: 0.15, // Increased volume
    padFreqs: [110, 165, 220], // Harmonious pad frequencies
    padVolume: 0.12, // Increased volume
    arpFreqs: [440, 523, 659], // A4, C5, E5 - Major triad
    arpSpeed: 2000, // ms between arp notes
    arpVolume: 0.08, // Increased volume
    filterFreq: 800,
    reverb: 0.3
  },
  
  gameplay: {
    name: "Deep Space Exploration",
    tempo: 0.7,
    bassFreq: 60, // Slightly higher bass
    bassVolume: 0.18, // Increased volume
    padFreqs: [120, 180, 240, 320],
    padVolume: 0.15, // Increased volume
    arpFreqs: [330, 415, 523, 659], // More complex arpeggio
    arpSpeed: 1500,
    arpVolume: 0.08, // Increased volume
    filterFreq: 1200,
    reverb: 0.4
  },
  
  boss: {
    name: "Battle Stations",
    tempo: 1.2, // Faster, more intense
    bassFreq: 80, // Higher, more aggressive bass
    bassVolume: 0.25, // Increased volume
    padFreqs: [160, 200, 240, 320, 400], // Dense harmonic layers
    padVolume: 0.18, // Increased volume
    arpFreqs: [220, 277, 330, 415, 523], // Minor scale for tension
    arpSpeed: 800, // Rapid arpeggiation
    arpVolume: 0.12, // Increased volume
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

// Initialize background music system
export function initMusic() {
  try {
    ensureAudio();
    if (!audioCtx) {
      console.log('No audio context in initMusic');
      return;
    }
    
    // Create main music gain node for volume control
    if (!activeMusicNodes.mainGain) {
      console.log('Creating main music gain node');
      activeMusicNodes.mainGain = audioCtx.createGain();
      activeMusicNodes.mainGain.connect(audioCtx.destination);
      activeMusicNodes.mainGain.gain.value = 0;
      console.log('Main gain node created and connected');
    } else {
      console.log('Main gain node already exists');
    }
  } catch (error) {
    console.warn('Error initializing music system:', error);
  }
}

// Start playing a specific music track
export function playMusic(trackName, fadeInTime = 2000) {
  if (!trackName || !musicTracks[trackName]) return;
  
  try {
    ensureAudio();
    if (!audioCtx) {
      console.log('No audio context available');
      return;
    }
    
    // Wait for audio context to be running
    if (audioCtx.state === 'suspended') {
      console.log('Audio context suspended, attempting to resume...');
      audioCtx.resume().then(() => {
        console.log('Audio context resumed, starting music...');
        playMusic(trackName, fadeInTime); // Retry after resume
      }).catch(err => {
        console.warn('Failed to resume audio context for music:', err);
      });
      return;
    }
    
    if (audioCtx.state !== 'running') {
      console.log(`Audio context state: ${audioCtx.state}, cannot start music`);
      return;
    }
    
    console.log(`Starting music track: ${trackName}`);
    initMusic();
    
    if (!activeMusicNodes.mainGain) {
      console.error('Main gain node not created');
      return;
    }
    
    const track = musicTracks[trackName];
    const currentTime = audioCtx.currentTime;
    
    console.log(`Track config:`, track);
    console.log(`Audio context time: ${currentTime}`);
    
    // Clean up any existing music
    stopMusic(0); // Immediate stop for crossfade
  
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
    
    activeMusicNodes.oscillators.push(lfo);
    activeMusicNodes.gains.push(lfoGain);
    
    lfo.start(currentTime);
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
  
  // Fade in the main volume
  console.log(`Setting up fade in from 0 to 1 over ${fadeInTime}ms`);
  activeMusicNodes.mainGain.gain.value = 0;
  activeMusicNodes.mainGain.gain.setValueAtTime(0, currentTime);
  activeMusicNodes.mainGain.gain.linearRampToValueAtTime(1, currentTime + fadeInTime / 1000);
  console.log('Music should be playing now');
  
  } catch (error) {
    console.warn('Error playing music:', error);
    // Disable music system if there are consistent errors
    if (typeof window !== 'undefined') {
      console.log('Disabling music system due to error');
    }
  }
}

// Stop background music
export function stopMusic(fadeOutTime = 1000) {
  if (!activeMusicNodes.mainGain) return;
  
  const currentTime = audioCtx.currentTime;
  
  // Fade out
  if (fadeOutTime > 0) {
    activeMusicNodes.mainGain.gain.linearRampToValueAtTime(0, currentTime + fadeOutTime / 1000);
  } else {
    activeMusicNodes.mainGain.gain.value = 0;
  }
  
  // Clean up nodes after fade out
  setTimeout(() => {
    // Stop oscillators
    activeMusicNodes.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    
    // Clear arpeggiator
    if (activeMusicNodes.arpeggiatorInterval) {
      clearInterval(activeMusicNodes.arpeggiatorInterval);
      activeMusicNodes.arpeggiatorInterval = null;
    }
    
    // Reset arrays
    activeMusicNodes.oscillators = [];
    activeMusicNodes.gains = [];
    activeMusicNodes.filters = [];
  }, fadeOutTime + 100);
}

// Set music volume (0-1)
export function setMusicVolume(volume) {
  try {
    if (activeMusicNodes.mainGain) {
      activeMusicNodes.mainGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  } catch (error) {
    console.warn('Error setting music volume:', error);
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

