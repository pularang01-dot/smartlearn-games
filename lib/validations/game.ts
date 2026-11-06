import { z } from "zod";

export const gameSettingsSchema = z.object({
  timerEnabled: z.boolean().default(false),
  defaultTimeLimit: z.number().int().min(5).max(300).default(20),
  timeoutCountsAsWrong: z.boolean().default(true),
  timeBonusEnabled: z.boolean().default(false),
  comboBonusEnabled: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  questionLimit: z.number().int().min(1).max(200).nullable().default(null),
  allowGoBack: z.boolean().default(false),
  soundEnabled: z.boolean().default(true),
  playStyle: z.enum(["classic", "battle"]).default("classic"),
  battleLives: z.number().int().min(1).max(10).default(3),
  cameraMode: z.boolean().default(false),
  cameraCountdown: z.number().int().min(3).max(60).default(10),
  showExplanation: z.boolean().default(true),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

export const defaultGameSettings: GameSettings = gameSettingsSchema.parse({});

export function parseSettings(raw: unknown): GameSettings {
  const result = gameSettingsSchema.safeParse(raw ?? {});
  return result.success ? result.data : defaultGameSettings;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .nullish()
    .transform((v) => (v ? v : null));

export const gameInfoSchema = z.object({
  title: z.string().trim().min(1, "Judul game wajib diisi").max(120, "Judul maksimal 120 karakter"),
  description: optionalText(1000),
  subjectId: z.string().uuid().nullish().transform((v) => v ?? null),
  gradeLevel: optionalText(40),
  topic: optionalText(120),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10, "Maksimal 10 tag")
    .transform((t) => Array.from(new Set(t.map((x) => x.toLowerCase())))),
  coverImagePath: z.string().max(300).nullish().transform((v) => v ?? null),
  settings: gameSettingsSchema,
});

export type GameInfoInput = z.input<typeof gameInfoSchema>;

export const newGameSchema = z.object({
  title: z.string().trim().min(1, "Judul game wajib diisi").max(120, "Judul maksimal 120 karakter"),
  subjectId: z.string().uuid().nullish().transform((v) => v ?? null),
  gradeLevel: optionalText(40),
  topic: optionalText(120),
  description: optionalText(1000),
});

export const questionSchema = z.object({
  questionText: z.string().trim().min(1, "Pertanyaan tidak boleh kosong").max(500, "Pertanyaan maksimal 500 karakter"),
  correctAnswer: z.boolean({ required_error: "Pilih jawaban Benar atau Salah", invalid_type_error: "Pilih jawaban Benar atau Salah" }),
  explanation: optionalText(1000),
  imagePath: z.string().max(300).nullish().transform((v) => v ?? null),
  points: z.number({ invalid_type_error: "Poin harus berupa angka" }).int("Poin harus bilangan bulat").min(1, "Poin minimal 1").max(1000, "Poin maksimal 1000"),
  timeLimitSeconds: z
    .number({ invalid_type_error: "Batas waktu harus angka" })
    .int()
    .min(5, "Batas waktu minimal 5 detik")
    .max(300, "Batas waktu maksimal 300 detik")
    .nullable(),
  isRequired: z.boolean(),
});

export type QuestionInput = z.input<typeof questionSchema>;

export const bankQuestionSchema = questionSchema.omit({ isRequired: true }).extend({
  subjectId: z.string().uuid().nullish().transform((v) => v ?? null),
});

export const importRowSchema = z.object({
  questionText: z.string().trim().min(1).max(500),
  correctAnswer: z.boolean(),
  explanation: optionalText(1000),
  points: z.number().int().min(1).max(1000),
  timeLimitSeconds: z.number().int().min(5).max(300).nullable(),
  subject: z.string().trim().max(60).nullish().transform((v) => v || null),
});
export const importRowsSchema = z.array(importRowSchema).min(1, "Tidak ada baris untuk diimpor").max(500, "Maksimal 500 baris per impor");
export type ImportRow = z.infer<typeof importRowSchema>;