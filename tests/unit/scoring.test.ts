import { describe, expect, it } from "vitest";
import { evaluateSession, scoreAnswer, summarize, timeLimitFor, type ScoringSettings } from "@/features/sessions/scoring";

const base: ScoringSettings = { timerEnabled: false, defaultTimeLimit: 20, timeoutCountsAsWrong: true, timeBonusEnabled: false, comboBonusEnabled: false };
const qs = [
  { id: "a", correct_answer: true, points: 10, time_limit_seconds: null, question_text: "A" },
  { id: "b", correct_answer: false, points: 20, time_limit_seconds: null, question_text: "B" },
  { id: "c", correct_answer: true, points: 10, time_limit_seconds: null, question_text: "C" },
];

describe("scoreAnswer", () => {
  it("memberi poin dasar untuk jawaban benar", () => {
    expect(scoreAnswer({ correct: true, responseMs: 1000, limitSeconds: null, basePoints: 10, streakBefore: 0, settings: base }).points).toBe(10);
  });
  it("tidak pernah memberi skor negatif untuk jawaban salah", () => {
    const r = scoreAnswer({ correct: false, responseMs: 1000, limitSeconds: null, basePoints: 10, streakBefore: 3, settings: base });
    expect(r.points).toBe(0);
    expect(r.streakAfter).toBe(0);
  });
  it("bonus waktu hanya bila diaktifkan dan timer aktif", () => {
    const s = { ...base, timerEnabled: true, timeBonusEnabled: true };
    expect(scoreAnswer({ correct: true, responseMs: 0, limitSeconds: 20, basePoints: 10, streakBefore: 0, settings: s }).points).toBe(15);
    expect(scoreAnswer({ correct: true, responseMs: 20000, limitSeconds: 20, basePoints: 10, streakBefore: 0, settings: s }).points).toBe(10);
    expect(scoreAnswer({ correct: true, responseMs: 0, limitSeconds: null, basePoints: 10, streakBefore: 0, settings: s }).points).toBe(10);
  });
  it("bonus combo naik 10% per jawaban beruntun, maksimum 50%", () => {
    const s = { ...base, comboBonusEnabled: true };
    expect(scoreAnswer({ correct: true, responseMs: 0, limitSeconds: null, basePoints: 100, streakBefore: 0, settings: s }).points).toBe(100);
    expect(scoreAnswer({ correct: true, responseMs: 0, limitSeconds: null, basePoints: 100, streakBefore: 1, settings: s }).points).toBe(110);
    expect(scoreAnswer({ correct: true, responseMs: 0, limitSeconds: null, basePoints: 100, streakBefore: 20, settings: s }).points).toBe(150);
  });
});

describe("timeLimitFor", () => {
  it("null bila timer nonaktif, memakai batas soal lalu bawaan bila aktif", () => {
    expect(timeLimitFor({ time_limit_seconds: 30 }, base)).toBeNull();
    expect(timeLimitFor({ time_limit_seconds: 30 }, { ...base, timerEnabled: true })).toBe(30);
    expect(timeLimitFor({ time_limit_seconds: null }, { ...base, timerEnabled: true })).toBe(20);
  });
});

describe("evaluateSession (dipakai server)", () => {
  it("menghitung ulang benar/salah dari kunci, bukan dari klien", () => {
    const r = evaluateSession(qs, [
      { questionId: "a", position: 0, given: true, timedOut: false, responseTimeMs: 500 },
      { questionId: "b", position: 1, given: true, timedOut: false, responseTimeMs: 500 },
      { questionId: "c", position: 2, given: true, timedOut: false, responseTimeMs: 500 },
    ], 3, base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.summary).toMatchObject({ correct: 2, incorrect: 1, timeouts: 0, score: 20 });
    expect(r.summary.accuracy).toBeCloseTo(66.67, 1);
  });
  it("menolak soal yang bukan bagian dari game", () => {
    expect(evaluateSession(qs, [{ questionId: "zzz", position: 0, given: true, timedOut: false, responseTimeMs: 1 }], 3, base).ok).toBe(false);
  });
  it("menolak jawaban ganda untuk satu soal (anti skor ganda)", () => {
    const r = evaluateSession(qs, [
      { questionId: "a", position: 0, given: true, timedOut: false, responseTimeMs: 1 },
      { questionId: "a", position: 1, given: true, timedOut: false, responseTimeMs: 1 },
    ], 3, base);
    expect(r.ok).toBe(false);
  });
  it("timeout tidak memberi poin dan dihitung terpisah", () => {
    const r = evaluateSession(qs, [{ questionId: "a", position: 0, given: null, timedOut: true, responseTimeMs: 20000 }], 3, { ...base, timerEnabled: true });
    expect(r.ok && r.summary).toMatchObject({ timeouts: 1, correct: 0, incorrect: 0, score: 0 });
  });
  it("timeoutCountsAsWrong menentukan penyebut akurasi", () => {
    const answers = [
      { questionId: "a", position: 0, given: true, timedOut: false, responseTimeMs: 1 },
      { questionId: "b", position: 1, given: null, timedOut: true, responseTimeMs: 1 },
    ];
    const wrong = evaluateSession(qs, answers, 3, { ...base, timerEnabled: true, timeoutCountsAsWrong: true });
    const neutral = evaluateSession(qs, answers, 3, { ...base, timerEnabled: true, timeoutCountsAsWrong: false });
    expect(wrong.ok && wrong.summary.accuracy).toBe(50);
    expect(neutral.ok && neutral.summary.accuracy).toBe(100);
  });
  it("membatasi waktu respons agar tidak bisa dimanipulasi untuk bonus", () => {
    const s = { ...base, timerEnabled: true, timeBonusEnabled: true };
    const r = evaluateSession(qs, [{ questionId: "a", position: 0, given: true, timedOut: false, responseTimeMs: -5000 }], 3, s);
    expect(r.ok && r.summary.score).toBe(15);
  });
});

describe("summarize", () => {
  it("akurasi 0 bila belum ada jawaban", () => {
    expect(summarize([], 5, base).accuracy).toBe(0);
  });
});
