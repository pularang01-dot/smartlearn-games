/**
 * Efek suara sederhana yang dibangkitkan WebAudio (tanpa file audio berhak cipta).
 * AudioContext dibuat setelah interaksi pengguna; semua pemanggilan aman bila audio diblokir.
 */
let ctx: AudioContext | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = c.currentTime + start;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {
    /* audio tidak tersedia: abaikan */
  }
}

export const sfx = {
  unlock: () => void getCtx(),
  tap: () => tone(520, 0, 0.06, "triangle", 0.08),
  correct: () => {
    tone(523.25, 0, 0.14, "triangle");
    tone(659.25, 0.1, 0.14, "triangle");
    tone(783.99, 0.2, 0.28, "triangle");
  },
  wrong: () => {
    tone(220, 0, 0.18, "sawtooth", 0.1);
    tone(164.81, 0.14, 0.3, "sawtooth", 0.1);
  },
  timeout: () => {
    tone(300, 0, 0.12, "square", 0.08);
    tone(300, 0.2, 0.12, "square", 0.08);
  },
  lose: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.28, "sawtooth", 0.09));
  },
  finish: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.25, "triangle"));
  },
};

const MELODY = [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23];

export function startMusic() {
  stopMusic();
  let i = 0;
  const step = () => tone(MELODY[i++ % MELODY.length], 0, 0.35, "sine", 0.04);
  step();
  musicTimer = setInterval(step, 420);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}