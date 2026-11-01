/**
 * Jigpic Solitaire — Procedural Web Audio Synthesizer
 * Zero external audio dependencies. Generates soothing, organic soundscapes
 * using Web Audio API oscillators, envelopes, and filters.
 */
(function() {
  'use strict';

  let audioCtx = null;
  let isMuted = false;

  try {
    const saved = localStorage.getItem('arcade_audio_muted');
    if (saved !== null) isMuted = (saved === 'true');
  } catch (_) {}

  function getContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (isMuted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  function playCardDraw() {
    if (isMuted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      // Soft card flutter
      playTone(320, 0.08, 'triangle', 0.1);
      setTimeout(() => playTone(440, 0.09, 'sine', 0.08), 35);
    } catch (_) {}
  }

  function playCardSelect() {
    // Mellow marimba note
    playTone(523.25, 0.12, 'sine', 0.15); // C5
  }

  function playSnap() {
    if (isMuted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      // Harmonious ascending chord: C5 -> E5 -> G5 -> C6
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.35);
      });
    } catch (_) {}
  }

  function playError() {
    if (isMuted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      playTone(180, 0.15, 'triangle', 0.08);
    } catch (_) {}
  }

  function playPeek() {
    if (isMuted) return;
    playTone(880, 0.25, 'sine', 0.1);
  }

  function playWin() {
    if (isMuted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51]; // C5 to E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.16, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.6);
      });
    } catch (_) {}
  }

  function toggleMute() {
    isMuted = !isMuted;
    try {
      localStorage.setItem('arcade_audio_muted', isMuted);
    } catch (_) {}
    return isMuted;
  }

  const Audio = {
    playCardDraw,
    playCardSelect,
    playSnap,
    playError,
    playPeek,
    playWin,
    toggleMute,
    getIsMuted: () => isMuted
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Audio;
  }
  if (typeof window !== 'undefined') {
    window.JigpicAudio = Audio;
  }
})();
