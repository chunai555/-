type ToneStep = [frequency: number, durationMs: number, gain?: number];

export class SoundDirector {
  private music = new Audio("media/houhuiwuci.mp3");
  private audioContext: AudioContext | null = null;

  constructor() {
    this.music.loop = true;
    this.music.volume = 0.72;
    this.music.preload = "auto";
  }

  async startMusic() {
    try {
      await this.music.play();
    } catch {
      // Browsers may still reject if the click was not considered user intent.
    }
  }

  fadeMusicTo(volume: number, durationMs = 1200) {
    const from = this.music.volume;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      this.music.volume = from + (volume - from) * t;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stopMusic() {
    this.fadeMusicTo(0, 1600);
    window.setTimeout(() => this.music.pause(), 1700);
  }

  playOnlineCue() {
    this.playSequence([
      [880, 86, 0.1],
      [1174, 90, 0.12],
      [988, 86, 0.1],
      [1320, 160, 0.12],
    ]);
  }

  playFailCue() {
    this.playSequence([
      [246, 140, 0.12],
      [196, 180, 0.1],
    ]);
  }

  playBoostCue() {
    this.playSweep(120, 620, 520, 0.08, "sawtooth");
  }

  playPerfectCue() {
    this.playSequence([
      [523, 70, 0.08],
      [784, 90, 0.1],
      [1046, 180, 0.12],
    ]);
  }

  playOfflineCue() {
    this.playSequence([
      [392, 150, 0.11],
      [330, 190, 0.09],
      [247, 260, 0.08],
    ]);
  }

  private getContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  private playSequence(steps: ToneStep[]) {
    const ctx = this.getContext();
    let offset = 0;
    steps.forEach(([frequency, durationMs, gain = 0.08]) => {
      const osc = ctx.createOscillator();
      const envelope = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.001, ctx.currentTime + offset);
      envelope.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + offset + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + durationMs / 1000);
      osc.connect(envelope);
      envelope.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + durationMs / 1000 + 0.04);
      offset += durationMs / 1000 + 0.045;
    });
  }

  private playSweep(
    from: number,
    to: number,
    durationMs: number,
    gain: number,
    type: OscillatorType,
  ) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + durationMs / 1000);
    envelope.gain.setValueAtTime(gain, ctx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(envelope);
    envelope.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
  }
}
