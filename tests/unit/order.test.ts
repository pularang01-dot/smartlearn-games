import { describe, expect, it } from "vitest";
import { buildPlayOrder } from "@/features/sessions/order";

const items = (n: number, requiredEvery = 0) => Array.from({ length: n }, (_, i) => ({ id: `q${i}`, is_required: requiredEvery ? i % requiredEvery === 0 : true }));
const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

describe("buildPlayOrder", () => {
  it("mempertahankan urutan editor bila tidak diacak", () => {
    expect(buildPlayOrder(items(4), { shuffleQuestions: false, questionLimit: null }).map((q) => q.id)).toEqual(["q0", "q1", "q2", "q3"]);
  });
  it("mengacak tanpa menghilangkan atau menggandakan soal", () => {
    const out = buildPlayOrder(items(20), { shuffleQuestions: true, questionLimit: null }, seeded(7));
    expect(out).toHaveLength(20);
    expect(new Set(out.map((q) => q.id)).size).toBe(20);
  });
  it("membatasi jumlah soal dan selalu menyertakan soal wajib", () => {
    const list = items(10, 5); // q0 dan q5 wajib
    const out = buildPlayOrder(list, { shuffleQuestions: true, questionLimit: 4 }, seeded(3));
    expect(out).toHaveLength(4);
    const ids = out.map((q) => q.id);
    expect(ids).toContain("q0");
    expect(ids).toContain("q5");
  });
  it("bila soal wajib melebihi batas, memakai sebanyak batas", () => {
    expect(buildPlayOrder(items(10), { shuffleQuestions: false, questionLimit: 3 }, seeded(2))).toHaveLength(3);
  });
});
