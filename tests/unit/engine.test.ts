import { describe, expect, it } from "vitest";
import { initialState, playReducer, totalScore, type EngineConfig, type PlayAction, type PlayState } from "@/features/sessions/engine";
import type { PlayQuestion } from "@/types/db";

const q = (id: string, answer: boolean, points = 10): PlayQuestion => ({ id, question_text: id, correct_answer: answer, explanation: null, image_url: null, points, time_limit_seconds: null, is_required: true });
const cfg = (over: Partial<EngineConfig["settings"]> = {}): EngineConfig => ({
  questions: [q("a", true), q("b", false), q("c", true)],
  settings: { timerEnabled: false, defaultTimeLimit: 20, timeoutCountsAsWrong: true, timeBonusEnabled: false, comboBonusEnabled: false, allowGoBack: false, ...over },
});
const run = (c: EngineConfig, actions: PlayAction[], from: PlayState = initialState()) => actions.reduce((s, a) => playReducer(s, a, c), from);
const started = (c: EngineConfig) => run(c, [{ type: "START", now: 1000 }]);

describe("playReducer", () => {
  it("START membuka soal pertama", () => {
    const s = started(cfg());
    expect(s.phase).toBe("question");
    expect(s.index).toBe(0);
  });
  it("jawaban benar terdeteksi benar dan menambah skor", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 100 }]);
    expect(s.phase).toBe("feedback");
    expect(s.records[0]).toMatchObject({ isCorrect: true, points: 10 });
    expect(totalScore(s.records)).toBe(10);
  });
  it("jawaban salah terdeteksi salah dan tidak menambah skor", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "ANSWER", given: false, responseMs: 100 }]);
    expect(s.records[0]).toMatchObject({ isCorrect: false, points: 0 });
  });
  it("input ganda tidak dihitung dua kali (input dikunci)", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 1 }, { type: "ANSWER", given: true, responseMs: 2 }, { type: "ANSWER", given: false, responseMs: 3 }]);
    expect(s.records.filter(Boolean)).toHaveLength(1);
    expect(totalScore(s.records)).toBe(10);
  });
  it("tidak bisa menjawab saat dijeda", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "PAUSE" }, { type: "ANSWER", given: true, responseMs: 1 }]);
    expect(s.records.filter(Boolean)).toHaveLength(0);
    const resumed = run(cfg(), [{ type: "RESUME" }, { type: "ANSWER", given: true, responseMs: 1 }], s);
    expect(resumed.records[0]?.isCorrect).toBe(true);
  });
  it("soal tidak berpindah sebelum NEXT (feedback dapat dibaca)", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 1 }]);
    expect(s.index).toBe(0);
    expect(s.phase).toBe("feedback");
  });
  it("TIMEOUT dicatat sebagai timeout tanpa poin dan memutus combo", () => {
    const s = run(cfg({ timerEnabled: true }), [{ type: "START", now: 0 }, { type: "TIMEOUT", responseMs: 20000 }]);
    expect(s.records[0]).toMatchObject({ kind: "timeout", points: 0, isCorrect: false, streakAfter: 0 });
  });
  it("TIMEOUT sesudah jawaban diabaikan", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 1 }, { type: "TIMEOUT", responseMs: 9 }]);
    expect(s.records[0]?.kind).toBe("answered");
  });
  it("sampai soal terakhir menampilkan hasil", () => {
    const s = run(cfg(), [
      { type: "START", now: 0 },
      { type: "ANSWER", given: true, responseMs: 1 }, { type: "NEXT", now: 1 },
      { type: "ANSWER", given: false, responseMs: 1 }, { type: "NEXT", now: 2 },
      { type: "ANSWER", given: true, responseMs: 1 }, { type: "NEXT", now: 3 },
    ]);
    expect(s.phase).toBe("result");
    expect(s.endedEarly).toBe(false);
    expect(totalScore(s.records)).toBe(30);
  });
  it("combo menaikkan poin pada jawaban beruntun", () => {
    const s = run(cfg({ comboBonusEnabled: true }), [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 1 }, { type: "NEXT", now: 1 }, { type: "ANSWER", given: false, responseMs: 1 }]);
    expect(s.records[1]?.points).toBe(11);
  });
  it("END lebih awal menandai endedEarly", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 1 }, { type: "END", now: 5 }]);
    expect(s.phase).toBe("result");
    expect(s.endedEarly).toBe(true);
  });
  it("PREV hanya jika diizinkan guru", () => {
    const actions: PlayAction[] = [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 1 }, { type: "NEXT", now: 1 }, { type: "PREV" }];
    expect(run(cfg({ allowGoBack: false }), actions).index).toBe(1);
    const back = run(cfg({ allowGoBack: true }), actions);
    expect(back.index).toBe(0);
    expect(back.phase).toBe("feedback");
  });
  it("SKIP melewati soal tanpa skor", () => {
    const s = run(cfg(), [{ type: "START", now: 0 }, { type: "SKIP", now: 1 }]);
    expect(s.index).toBe(1);
    expect(s.records[0]?.kind).toBe("skipped");
  });
  it("main ulang = state baru (sesi baru)", () => {
    const first = run(cfg(), [{ type: "START", now: 0 }, { type: "ANSWER", given: true, responseMs: 1 }]);
    const again = started(cfg());
    expect(again.records).toHaveLength(0);
    expect(first.records).toHaveLength(1);
  });
});
