/**
 * Deteksi "zona berdiri" tanpa model AI: membandingkan frame kamera dengan latar kosong (baseline)
 * dan mengukur berapa banyak piksel berubah (ada orang) di sisi kiri vs kanan layar.
 * Frame sudah dicerminkan (seperti cermin): sisi kiri layar = BENAR, sisi kanan layar = SALAH.
 * Murni dan deterministik, sehingga mudah diuji. Tidak ada frame yang disimpan atau dikirim.
 */
export const FRAME_W = 64;
export const FRAME_H = 48;

export type Sensitivity = "low" | "medium" | "high";
/** Selisih luminans minimum agar piksel dianggap "ada orang". Sensitivitas tinggi = ambang kecil. */
export const THRESHOLDS: Record<Sensitivity, number> = { low: 40, medium: 28, high: 18 };

export function rgbaToLuma(data: ArrayLike<number>): Uint8Array {
  const n = Math.floor(data.length / 4);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (data[i * 4] * 299 + data[i * 4 + 1] * 587 + data[i * 4 + 2] * 114) / 1000;
  return out;
}

export function averageFrames(frames: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(frames[0]?.length ?? 0);
  for (let i = 0; i < out.length; i++) {
    let sum = 0;
    for (const f of frames) sum += f[i];
    out[i] = Math.round(sum / frames.length);
  }
  return out;
}

export type ZoneReading = { left: number; right: number };

/** Persentase (0..1) piksel berubah pada separuh kiri dan kanan. Pita tengah diabaikan agar tidak ambigu. */
export function measureZones(frame: ArrayLike<number>, baseline: ArrayLike<number>, w: number, h: number, threshold: number, deadBand = 0.08): ZoneReading {
  const leftMax = Math.floor(w * (0.5 - deadBand / 2));
  const rightMin = Math.ceil(w * (0.5 + deadBand / 2));
  let l = 0, r = 0, lc = 0, rc = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const fg = Math.abs(frame[i] - baseline[i]) > threshold ? 1 : 0;
      if (x < leftMax) { lc++; l += fg; }
      else if (x >= rightMin) { rc++; r += fg; }
    }
  }
  return { left: lc ? l / lc : 0, right: rc ? r / rc : 0 };
}

export type DecideOptions = { minPresence?: number; ratio?: number };

/** true = BENAR (kiri), false = SALAH (kanan), null = belum ada pemenang jelas (kosong atau seri). */
export function decideZone(r: ZoneReading, { minPresence = 0.04, ratio = 1.4 }: DecideOptions = {}): boolean | null {
  const hi = Math.max(r.left, r.right);
  const lo = Math.min(r.left, r.right);
  if (hi < minPresence) return null;
  if (lo > 0 && hi / lo < ratio) return null;
  return r.left > r.right;
}

/** Pelacak dengan perataan eksponensial (menahan kedipan) dan baseline yang pelan-pelan menyesuaikan perubahan cahaya. */
export class ZoneTracker {
  private baseline: Float32Array | null = null;
  private smoothed: ZoneReading = { left: 0, right: 0 };
  constructor(private w = FRAME_W, private h = FRAME_H, private threshold = THRESHOLDS.medium, private smoothing = 0.35, private adapt = 0.02) {}

  setThreshold(t: number) { this.threshold = t; }
  hasBaseline() { return this.baseline !== null; }
  setBaseline(b: ArrayLike<number>) { this.baseline = Float32Array.from(b); this.reset(); }
  reset() { this.smoothed = { left: 0, right: 0 }; }

  update(frame: ArrayLike<number>): ZoneReading {
    const base = this.baseline;
    if (!base) return this.smoothed;
    const raw = measureZones(frame, base, this.w, this.h, this.threshold);
    const a = this.smoothing;
    this.smoothed = { left: this.smoothed.left * (1 - a) + raw.left * a, right: this.smoothed.right * (1 - a) + raw.right * a };
    // Latar (bukan orang) ikut menyesuaikan cahaya; piksel yang sedang ditempati orang tidak diubah.
    for (let i = 0; i < base.length; i++) {
      const d = frame[i] - base[i];
      if (Math.abs(d) <= this.threshold / 2) base[i] += d * this.adapt;
    }
    return this.smoothed;
  }

  reading(): ZoneReading { return this.smoothed; }
  decision(opts?: DecideOptions): boolean | null { return decideZone(this.smoothed, opts); }
}