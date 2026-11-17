// All sound is synthesized with WebAudio oscillators and noise buffers:
// no audio files, no network. Created lazily on the first user gesture so
// the browser allows it; shot (screenshot) mode never creates audio.
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    musicTimer: null,
    musicStep: 0,
  };

  audio.ensure = () => {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return true;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      audio.ctx = new Ctx();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = audio.muted ? 0 : 0.35;
      audio.master.connect(audio.ctx.destination);
      return true;
    } catch {
      return false;
    }
  };

  audio.setMuted = (muted) => {
    audio.muted = muted;
    if (audio.master) audio.master.gain.value = muted ? 0 : 0.35;
  };

  function tone(freq, duration, type, volume, slideTo) {
    if (!audio.ctx || audio.muted) return;
    const t0 = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function noise(duration, volume, filterFreq) {
    if (!audio.ctx || audio.muted) return;
    const t0 = audio.ctx.currentTime;
    const length = Math.max(1, Math.floor(audio.ctx.sampleRate * duration));
    const buffer = audio.ctx.createBuffer(1, length, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audio.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = audio.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    source.start(t0);
  }

  audio.shoot = () => tone(880, 0.08, 'square', 0.12, 220);
  audio.enemyShoot = () => tone(220, 0.12, 'sawtooth', 0.06, 110);
  audio.explosion = (big) => {
    noise(big ? 0.5 : 0.25, big ? 0.5 : 0.3, big ? 900 : 1400);
    tone(big ? 160 : 220, big ? 0.4 : 0.2, 'sawtooth', 0.2, 40);
  };
  audio.playerHit = () => {
    noise(0.4, 0.45, 800);
    tone(320, 0.5, 'sawtooth', 0.25, 50);
  };
  audio.powerup = () => {
    tone(523, 0.09, 'sine', 0.2);
    setTimeout(() => tone(659, 0.09, 'sine', 0.2), 70);
    setTimeout(() => tone(784, 0.14, 'sine', 0.2), 140);
  };
  audio.bossHit = () => tone(140, 0.15, 'sawtooth', 0.18, 70);
  audio.waveClear = () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'triangle', 0.2), i * 90));
  };
  audio.victory = () => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.22), i * 130));
  };
  audio.gameOver = () => {
    [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.22), i * 180));
  };

  // A quiet synthwave bass pulse. One bar = 8 eighth notes at 132 BPM.
  const bassLine = [55, 0, 55, 65.4, 0, 55, 49, 58.3];
  audio.startMusic = () => {
    if (!audio.ctx || audio.musicTimer) return;
    audio.musicTimer = setInterval(() => {
      if (audio.muted || !audio.ctx) return;
      const freq = bassLine[audio.musicStep % bassLine.length];
      audio.musicStep += 1;
      if (freq) tone(freq, 0.22, 'triangle', 0.1);
      if (audio.musicStep % 2 === 0) tone(220, 0.05, 'square', 0.03);
    }, 227);
  };
  audio.stopMusic = () => {
    if (audio.musicTimer) {
      clearInterval(audio.musicTimer);
      audio.musicTimer = null;
    }
  };

  return audio;
}
