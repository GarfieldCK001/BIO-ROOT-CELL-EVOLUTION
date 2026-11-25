/**
 * Procedural Web Audio API synthesizer for BIO-ROOT: CELL EVOLUTION.
 * Produces microscopic SFX (bloop eat, dash whoosh, acid sizzle, electric zap,
 * hit thud, evolution chime, boss alert, victory/defeat stings) and a gentle
 * bioluminescent ambient BGM loop with independent SFX and BGM toggles.
 */
export class BioAudioEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private bgmEnabled = true;
  private bgmInterval: number | null = null;
  private bgmStep = 0;
  private bgmPlaying = false;

  public setSettings(sfx: boolean, bgm: boolean): void {
    this.sfxEnabled = sfx;
    this.bgmEnabled = bgm;
    if (!bgm) {
      this.stopBgmLoop();
    } else if (this.bgmPlaying) {
      this.startBgmLoop();
    }
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.bgmPlaying && this.bgmEnabled && this.bgmInterval === null) {
      this.startBgmLoop();
    }
  }

  public startBgm(): void {
    this.bgmPlaying = true;
    if (this.bgmEnabled && this.ctx) {
      this.startBgmLoop();
    }
  }

  public pauseBgm(): void {
    this.bgmPlaying = false;
    this.stopBgmLoop();
  }

  private startBgmLoop(): void {
    if (this.bgmInterval !== null || typeof window === 'undefined' || !this.ctx) return;
    const scale = [174.61, 220.0, 261.63, 329.63, 392.0, 329.63, 293.66, 220.0];
    this.bgmInterval = window.setInterval(() => {
      if (!this.bgmEnabled || !this.bgmPlaying || !this.ctx || this.ctx.state !== 'running') {
        return;
      }
      const now = this.ctx.currentTime;
      const freq = scale[this.bgmStep % scale.length];
      this.bgmStep++;

      // Warm sub-aquatic sine pad note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.006, now + 1.1);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.032, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.4);

      // Occasional soft bioluminescent harmonic chime
      if (this.bgmStep % 2 === 0) {
        const chime = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        chime.type = 'triangle';
        chime.frequency.setValueAtTime(freq * 2, now + 0.15);
        cGain.gain.setValueAtTime(0.0001, now + 0.15);
        cGain.gain.linearRampToValueAtTime(0.012, now + 0.25);
        cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        chime.connect(cGain);
        cGain.connect(this.ctx.destination);
        chime.start(now + 0.15);
        chime.stop(now + 0.9);
      }
    }, 920);
  }

  private stopBgmLoop(): void {
    if (this.bgmInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  private readySfx(): AudioContext | null {
    if (!this.sfxEnabled) return null;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  /** Bloop sound when absorbing food or DNA */
  public playEat(pitchScale = 1): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const jitter = 0.94 + Math.random() * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280 * pitchScale * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(640 * pitchScale * jitter, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Liquid whoosh on Dash / Juggernaut */
  public playDash(): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  /** Acid sizzle burst */
  public playAcid(): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.17);
    filter.Q.value = 2.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /** Electric zap crackle */
  public playZap(): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(860, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.17);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  /** Impact / hit thud */
  public playHit(heavy = false): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = heavy ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(heavy ? 150 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + (heavy ? 0.16 : 0.1));

    gain.gain.setValueAtTime(heavy ? 0.18 : 0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.17 : 0.11));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (heavy ? 0.18 : 0.12));
  }

  /** Harmonic arpeggio when evolving a skill organ */
  public playEvolve(): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [329.63, 440.0, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  /** Deep warning pulse for Zone Boss arrival */
  public playBossWarning(): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.28;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(84, t + 0.22);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  /** Victory fanfare */
  public playVictory(): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((f, idx) => {
      const t = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.46);
    });
  }

  /** Defeat descending tone */
  public playDefeat(): void {
    const ctx = this.readySfx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.65);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  public dispose(): void {
    this.stopBgmLoop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
