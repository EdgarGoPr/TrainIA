/**
 * Solo Leveling System - Procedural Web Audio Synthesizer
 * Generates futuristic sci-fi sound effects using Web Audio API without external files.
 */

class SystemAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.hapticEnabled = true;
    this.volume = 0.6;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.initialized = true;
      }
    } catch (e) {
      console.warn("AudioContext initialization error:", e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
  }

  setHaptic(enabled) {
    this.hapticEnabled = !!enabled;
  }

  vibrate(pattern = [30]) {
    if (!this.hapticEnabled) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  /**
   * UI Click / Tap
   */
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate(15);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Stat increment (+)
   */
  playStatUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate([20, 30, 20]);

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now); // E5
    osc2.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12); // E6

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.14);
    osc2.stop(now + 0.14);
  }

  /**
   * System Notification Popup [NOTIFICACIÓN: ...]
   */
  playNotification() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate([40, 60, 40]);

    const now = this.ctx.currentTime;
    const notes = [880, 1174.66, 1760]; // A5, D6, A6

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  /**
   * Quest Completed / Claim Reward
   */
  playQuestComplete() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate([60, 50, 80, 50, 120]);

    const now = this.ctx.currentTime;
    const notes = [
      { f: 440, t: 0 },    // A4
      { f: 554.37, t: 0.1 }, // C#5
      { f: 659.25, t: 0.2 }, // E5
      { f: 880, t: 0.32 },   // A5
      { f: 1108.73, t: 0.45 } // C#6
    ];

    notes.forEach(n => {
      const start = now + n.t;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, start);

      gain.gain.setValueAtTime(0.35 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  /**
   * Level Up Epic Fanfare
   */
  playLevelUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate([100, 50, 100, 50, 200, 100, 300]);

    const now = this.ctx.currentTime;
    const chords = [
      { notes: [523.25, 659.25, 783.99], t: 0, d: 0.25 },     // C Major
      { notes: [587.33, 739.99, 880.00], t: 0.22, d: 0.25 },   // D Major
      { notes: [659.25, 830.61, 987.77], t: 0.44, d: 0.3 },    // E Major
      { notes: [1046.50, 1318.51, 1567.98], t: 0.72, d: 0.8 } // High C Major
    ];

    chords.forEach(c => {
      c.notes.forEach(f => {
        const start = now + c.t;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.2 * this.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + c.d);

        // Filter to make it warm
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, start);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + c.d);
      });
    });
  }

  /**
   * Full Status Recovery Aura Wash
   */
  playStatusRecovery() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate([80, 80, 80, 80, 160]);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.8);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 1.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 1.2);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4 * this.volume, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  /**
   * Loot Box Opening Shimmer & Reveal
   */
  playLootBox() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate([40, 30, 40, 30, 60, 50, 150]);

    const now = this.ctx.currentTime;

    // Rumble
    const noiseOsc = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();
    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.setValueAtTime(90, now);
    noiseOsc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    noiseGain.gain.setValueAtTime(0.3 * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noiseOsc.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseOsc.start(now);
    noiseOsc.stop(now + 0.5);

    // Chimes
    const sparkles = [1200, 1500, 1800, 2200, 2600, 3200];
    sparkles.forEach((freq, idx) => {
      const start = now + 0.4 + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  /**
   * Penalty Alarm (Red Zone Siren)
   */
  playPenaltyAlarm() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.vibrate([150, 100, 150, 100, 300]);

    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const cycleStart = now + i * 0.45;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, cycleStart);
      osc.frequency.linearRampToValueAtTime(750, cycleStart + 0.22);
      osc.frequency.linearRampToValueAtTime(320, cycleStart + 0.42);

      gain.gain.setValueAtTime(0.28 * this.volume, cycleStart);
      gain.gain.exponentialRampToValueAtTime(0.01, cycleStart + 0.44);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(cycleStart);
      osc.stop(cycleStart + 0.44);
    }
  }
}

// Global instance
window.systemAudio = new SystemAudioEngine();
