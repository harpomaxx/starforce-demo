let audioCtx = null;

// Browser detection for audio optimizations
const isFirefoxMobile = navigator.userAgent.includes('Firefox') && 
                       (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android'));
const isChromeMobile = navigator.userAgent.includes('Chrome') && 
                      (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android'));

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Firefox mobile specific: Enhanced audio context stability
    if (isFirefoxMobile) {
      audioCtx.onstatechange = () => {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      };
    }
  }
  
  // Resume if suspended
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
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
  
  // Firefox mobile: Reduce audio nodes for fire sound to prevent context instability
  if (isFirefoxMobile && type === 'fire') {
    // Simplified fire sound for Firefox mobile
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 480;
    g.gain.value = 0.12; // Reduced volume to prevent distortion
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.05); // Shorter duration
    g.gain.setValueAtTime(0.12, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
    return;
  }
  
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

