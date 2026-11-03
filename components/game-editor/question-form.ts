import { questionSchema, type QuestionInput } from "@/lib/validations/game";
import type { QuestionRow } from "@/types/db";

export type QuestionForm = {
  questionText: string;
  correctAnswer: boolean | null;
  explanation: string;
  imagePath: string | null;
  points: string;
  timeLimit: string;
  isRequired: boolean;
};

export type QuestionItem = { key: string; id: string | null; updatedAt: string | null; form: QuestionForm; startOpen: boolean };

export const emptyForm = (): QuestionForm => ({ questionText: "", correctAnswer: null, explanation: "", imagePath: null, points: "10", timeLimit: "", isRequired: true });

export function formFromRow(q: QuestionRow): QuestionForm {
  return {
    questionText: q.question_text,
    correctAnswer: q.correct_answer,
    explanation: q.explanation ?? "",
    imagePath: q.image_path,
    points: String(q.points),
    timeLimit: q.time_limit_seconds ? String(q.time_limit_seconds) : "",
    isRequired: q.is_required,
  };
}

export function itemFromRow(q: QuestionRow, startOpen = false): QuestionItem {
  return { key: q.id, id: q.id, updatedAt: q.updated_at, form: formFromRow(q), startOpen };
}

export type FormValidation = { ok: true; data: QuestionInput } | { ok: false; errors: Record<string, string> };

export function validateForm(f: QuestionForm): FormValidation {
  const raw = {
    questionText: f.questionText,
    correctAnswer: f.correctAnswer ?? undefined,
    explanation: f.explanation,
    imagePath: f.imagePath,
    points: f.points.trim() === "" ? Number.NaN : Number(f.points),
    timeLimitSeconds: f.timeLimit.trim() === "" ? null : Number(f.timeLimit),
    isRequired: f.isRequired,
  };
  const r = questionSchema.safeParse(raw);
  if (r.success) return { ok: true, data: raw as QuestionInput };
  const errors: Record<string, string> = {};
  for (const [k, v] of Object.entries(r.error.flatten().fieldErrors)) if (v?.[0]) errors[k] = v[0];
  return { ok: false, errors };
}
