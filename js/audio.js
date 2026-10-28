/**
 * AudioEngine - Synthesizes 100% pure Web Audio procedural sound effects.
 * Requires no external audio files, works offline, and supports instant muting.
 */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('citrusBlitz_muted') === 'true';
    this.masterGain = null;
    this.fuseNode = null;
    this.fuseGain = null;
    this.isFuseActive = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('citrusBlitz_muted', this.muted);
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : 0.8, now + 0.05);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  ensureReady() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Swoosh / blade slash sound based on swipe velocity
   */
  playWhoosh(velocity = 1) {
    if (this.muted) return;
    this.ensureReady();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.14;
      const speed = Math.min(Math.max(velocity / 15, 0.7), 2.2);

      // White noise buffer
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Filter: sweeping bandpass
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 3.0;
      filter.frequency.setValueAtTime(350 * speed, now);
      filter.frequency.exponentialRampToValueAtTime(1600 * speed, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(280, now + duration);

      // Gain envelope
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25 * speed, now + duration * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    } catch (e) {
      // Audio fallback safeguard
    }
  }

  /**
   * Crisp, juicy fruit slice / squish sound
   */
  playSlice(fruitType = 'watermelon') {
    if (this.muted) return;
    this.ensureReady();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Frequency tuning based on fruit character
      let startFreq = 720;
      let endFreq = 160;
      if (fruitType === 'lemon' || fruitType === 'strawberry') {
        startFreq = 950;
        endFreq = 220;
      } else if (fruitType === 'watermelon' || fruitType === 'coconut') {
        startFreq = 540;
        endFreq = 110;
      } else if (fruitType === 'starfruit') {
        startFreq = 1200;
        endFreq = 380;
      }

      // Sine wave with pitch drop
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.14);

      // Juicy noise squish component
      const noiseDuration = 0.09;
      const bufferSize = Math.floor(this.ctx.sampleRate * noiseDuration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      noiseFilter.frequency.linearRampToValueAtTime(400, now + noiseDuration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + noiseDuration);
    } catch (e) {}
  }

  /**
   * Bomb explosion: low frequency punch + distorted noise roar
   */
  playExplosion() {
    if (this.muted) return;
    this.ensureReady();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.7;

      // Deep sub-bass punch
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(180, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + duration * 0.6);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.65, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(now);
      subOsc.stop(now + duration * 0.65);

      // Boom noise blast
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {}
  }

  /**
   * Combo fanfare: ascending musical chords
   */
  playCombo(level = 3) {
    if (this.muted) return;
    this.ensureReady();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Musical pentatonic scale notes (Hz)
      const scale = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
      const count = Math.min(Math.max(level, 2), 6);

      for (let i = 0; i < count; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + i * 0.07;
        const noteDuration = 0.22;

        osc.type = i === count - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(scale[i % scale.length], startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      }
    } catch (e) {}
  }

  /**
   * UI Click / button tap
   */
  playClick() {
    if (this.muted) return;
    this.ensureReady();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  /**
   * Game Over / Time Up sound
   */
  playGameOver() {
    if (this.muted) return;
    this.ensureReady();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.15;
        const dur = 0.35;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (e) {}
  }
}

// Global instance
window.gameAudio = new AudioEngine();

