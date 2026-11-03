import { describe, expect, it } from "vitest";
import { defaultGameSettings, gameInfoSchema, importRowsSchema, parseSettings, questionSchema } from "@/lib/validations/game";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { isUuid, safeNext } from "@/lib/utils/misc";
import { validateForm, emptyForm } from "@/components/game-editor/question-form";

describe("settings", () => {
  it("memakai nilai bawaan bila kosong atau rusak", () => {
    expect(parseSettings({})).toEqual(defaultGameSettings);
    expect(parseSettings({ defaultTimeLimit: 99999 })).toEqual(defaultGameSettings);
    expect(parseSettings(null)).toEqual(defaultGameSettings);
  });
});

describe("questionSchema", () => {
  const ok = { questionText: "Matahari adalah bintang.", correctAnswer: true, points: 10, timeLimitSeconds: null, isRequired: true };
  it("menerima soal valid", () => expect(questionSchema.safeParse(ok).success).toBe(true));
  it("menolak pertanyaan kosong", () => expect(questionSchema.safeParse({ ...ok, questionText: "   " }).success).toBe(false));
  it("menolak jawaban yang belum dipilih", () => expect(questionSchema.safeParse({ ...ok, correctAnswer: undefined }).success).toBe(false));
  it("menolak poin dan timer di luar rentang", () => {
    expect(questionSchema.safeParse({ ...ok, points: 0 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...ok, points: 1001 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...ok, timeLimitSeconds: 4 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...ok, timeLimitSeconds: 301 }).success).toBe(false);
  });
});

describe("validateForm (editor)", () => {
  it("form kosong tidak valid dan memberi pesan di field terkait", () => {
    const r = validateForm(emptyForm());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toEqual(expect.arrayContaining(["questionText", "correctAnswer"]));
  });
  it("form lengkap valid", () => {
    expect(validateForm({ ...emptyForm(), questionText: "Soal", correctAnswer: false }).ok).toBe(true);
  });
});

describe("gameInfoSchema", () => {
  const ok = { title: "Game", tags: [], settings: defaultGameSettings };
  it("judul wajib", () => expect(gameInfoSchema.safeParse({ ...ok, title: " " }).success).toBe(false));
  it("maksimal 10 tag dan tag dinormalisasi", () => {
    expect(gameInfoSchema.safeParse({ ...ok, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success).toBe(false);
    const r = gameInfoSchema.parse({ ...ok, tags: ["IPA", "ipa"] });
    expect(r.tags).toEqual(["ipa"]);
  });
});

describe("importRowsSchema", () => {
  it("membatasi 500 baris", () => {
    const row = { questionText: "x", correctAnswer: true, points: 10, timeLimitSeconds: null };
    expect(importRowsSchema.safeParse(Array.from({ length: 501 }, () => row)).success).toBe(false);
    expect(importRowsSchema.safeParse([]).success).toBe(false);
  });
});

describe("auth schema", () => {
  it("password harus ada huruf dan angka", () => {
    const base = { displayName: "Bu Ani", email: "ani@sekolah.id", confirmPassword: "abcdefgh", agree: "on" as const };
    expect(registerSchema.safeParse({ ...base, password: "abcdefgh" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "abcdefg1", confirmPassword: "abcdefg1" }).success).toBe(true);
  });
  it("konfirmasi password harus sama", () => {
    expect(registerSchema.safeParse({ displayName: "Ani", email: "a@b.co", password: "abcdefg1", confirmPassword: "abcdefg2", agree: "on" }).success).toBe(false);
  });
  it("login menolak email tidak valid", () => expect(loginSchema.safeParse({ email: "x", password: "y" }).success).toBe(false));
});

describe("util keamanan", () => {
  it("safeNext hanya mengizinkan path internal", () => {
    expect(safeNext("/dashboard/games")).toBe("/dashboard/games");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
  it("isUuid", () => {
    expect(isUuid("3f2b8c1e-5d4a-4b7e-9a1c-0e6f7a8b9c10")).toBe(true);
    expect(isUuid("../../etc/passwd")).toBe(false);
  });
});
