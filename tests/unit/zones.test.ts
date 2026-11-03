import { describe, expect, it } from "vitest";
import { averageFrames, decideZone, measureZones, rgbaToLuma, ZoneTracker } from "@/lib/camera/zones";

const W = 20, H = 10;
const flat = (v: number) => new Uint8Array(W * H).fill(v);
/** Gambar blok "orang" bernilai 200 pada kolom x0..x1 di latar 50. */
function withPerson(x0: number, x1: number, fill = 200) {
  const f = flat(50);
  for (let y = 0; y < H; y++) for (let x = x0; x <= x1; x++) f[y * W + x] = fill;
  return f;
}

describe("measureZones", () => {
  it("frame sama dengan baseline = tidak ada orang", () => {
    expect(measureZones(flat(50), flat(50), W, H, 28)).toEqual({ left: 0, right: 0 });
  });
  it("orang di kiri hanya mengisi zona kiri", () => {
    const r = measureZones(withPerson(0, 8), flat(50), W, H, 28);
    expect(r.left).toBe(1);
    expect(r.right).toBe(0);
  });
  it("orang di kanan hanya mengisi zona kanan", () => {
    const r = measureZones(withPerson(11, 19), flat(50), W, H, 28);
    expect(r.right).toBe(1);
    expect(r.left).toBe(0);
  });
  it("perubahan kecil di bawah ambang diabaikan (noise)", () => {
    expect(measureZones(flat(60), flat(50), W, H, 28)).toEqual({ left: 0, right: 0 });
  });
});

describe("decideZone", () => {
  it("kiri = BENAR (true), kanan = SALAH (false)", () => {
    expect(decideZone({ left: 0.4, right: 0.05 })).toBe(true);
    expect(decideZone({ left: 0.05, right: 0.4 })).toBe(false);
  });
  it("kosong atau seri tidak menghasilkan jawaban", () => {
    expect(decideZone({ left: 0.01, right: 0.02 })).toBeNull();
    expect(decideZone({ left: 0.3, right: 0.28 })).toBeNull();
  });
  it("hanya satu sisi terisi cukup untuk menang", () => {
    expect(decideZone({ left: 0.2, right: 0 })).toBe(true);
  });
});

describe("ZoneTracker", () => {
  it("tanpa baseline tidak memberi keputusan", () => {
    const t = new ZoneTracker(W, H);
    t.update(withPerson(0, 7));
    expect(t.decision()).toBeNull();
  });
  it("mendeteksi sisi setelah beberapa frame (smoothing)", () => {
    const t = new ZoneTracker(W, H);
    t.setBaseline(flat(50));
    for (let i = 0; i < 12; i++) t.update(withPerson(12, 19));
    expect(t.decision()).toBe(false);
    for (let i = 0; i < 30; i++) t.update(withPerson(0, 7));
    expect(t.decision()).toBe(true);
  });
  it("kembali kosong bila orang pergi", () => {
    const t = new ZoneTracker(W, H);
    t.setBaseline(flat(50));
    for (let i = 0; i < 10; i++) t.update(withPerson(0, 7));
    for (let i = 0; i < 40; i++) t.update(flat(50));
    expect(t.decision()).toBeNull();
  });
  it("baseline menyesuaikan perubahan cahaya global pelan-pelan", () => {
    const t = new ZoneTracker(W, H);
    t.setBaseline(flat(50));
    for (let i = 0; i < 200; i++) t.update(flat(60)); // lebih terang, di bawah ambang
    for (let i = 0; i < 5; i++) t.update(flat(80)); // loncatan sedang: tetap bukan orang jika baseline sudah menyesuaikan
    expect(t.decision()).toBeNull();
  });
});

describe("util frame", () => {
  it("rgbaToLuma dan averageFrames", () => {
    expect(Array.from(rgbaToLuma([255, 255, 255, 255, 0, 0, 0, 255]))).toEqual([255, 0]);
    expect(Array.from(averageFrames([Uint8Array.from([10, 20]), Uint8Array.from([30, 40])]))).toEqual([20, 30]);
  });
});