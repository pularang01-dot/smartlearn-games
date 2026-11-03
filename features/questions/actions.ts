"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions/auth";
import { dbFail, fail, ok, zodFail, type ActionResult } from "@/lib/errors";
import { bankQuestionSchema, importRowsSchema, questionSchema, type QuestionInput } from "@/lib/validations/game";
import { isUuid } from "@/lib/utils/misc";
import { cleanupUnusedImages } from "@/features/media/cleanup";
import { searchBankForPicker } from "./queries";
import type { BankQuestionRow, QuestionRow, SubjectRow } from "@/types/db";

const AUTH_MSG = "Sesi login berakhir. Silakan login kembali.";

type Ctx = { userId: string; supabase: Awaited<ReturnType<typeof createClient>> };
async function context(): Promise<Ctx | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return { userId: user.id, supabase: await createClient() };
}

async function ownsGame(c: Ctx, gameId: string): Promise<boolean> {
  const { data } = await c.supabase.from("games").select("id").eq("id", gameId).eq("owner_id", c.userId).maybeSingle();
  return Boolean(data);
}

async function nextPosition(c: Ctx, gameId: string): Promise<number> {
  const { data } = await c.supabase.from("questions").select("position").eq("game_id", gameId).eq("owner_id", c.userId).order("position", { ascending: false }).limit(1);
  return data && data.length ? (data[0].position as number) + 1 : 0;
}

function imageOk(path: string | null, userId: string) {
  return !path || path.startsWith(`${userId}/`);
}

// ---------------------------------------------------------------- soal dalam game

export async function createQuestion(gameId: string, input: QuestionInput): Promise<ActionResult<QuestionRow>> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(gameId)) return fail("Game tidak ditemukan.", "not_found");
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (!imageOk(d.imagePath, c.userId)) return fail("Gambar tidak valid.", "validation");
  if (!(await ownsGame(c, gameId))) return fail("Game tidak ditemukan.", "not_found");

  const { data, error } = await c.supabase
    .from("questions")
    .insert({
      owner_id: c.userId, game_id: gameId, question_text: d.questionText, correct_answer: d.correctAnswer,
      explanation: d.explanation, image_path: d.imagePath, points: d.points,
      time_limit_seconds: d.timeLimitSeconds, is_required: d.isRequired, position: await nextPosition(c, gameId),
    })
    .select("*")
    .single();
  if (error || !data) return dbFail(error, "createQuestion");
  return ok(data as QuestionRow);
}

export async function updateQuestion(input: {
  id: string;
  expectedUpdatedAt: string | null;
  force?: boolean;
  data: QuestionInput;
}): Promise<ActionResult<{ updatedAt: string }>> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(input.id)) return fail("Soal tidak ditemukan.", "not_found");
  const parsed = questionSchema.safeParse(input.data);
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (!imageOk(d.imagePath, c.userId)) return fail("Gambar tidak valid.", "validation");

  const { data: before } = await c.supabase.from("questions").select("image_path").eq("id", input.id).eq("owner_id", c.userId).maybeSingle();
  if (!before) return fail("Soal tidak ditemukan.", "not_found");

  let query = c.supabase
    .from("questions")
    .update({
      question_text: d.questionText, correct_answer: d.correctAnswer, explanation: d.explanation,
      image_path: d.imagePath, points: d.points, time_limit_seconds: d.timeLimitSeconds, is_required: d.isRequired,
    })
    .eq("id", input.id)
    .eq("owner_id", c.userId);
  if (!input.force && input.expectedUpdatedAt) query = query.eq("updated_at", input.expectedUpdatedAt);
  const { data, error } = await query.select("updated_at");
  if (error) return dbFail(error, "updateQuestion");
  if (!data?.length) return fail("Soal ini sudah diubah dari tab atau perangkat lain.", "conflict");

  if (before.image_path !== d.imagePath) await cleanupUnusedImages(c.supabase, c.userId, [before.image_path]);
  return ok({ updatedAt: data[0].updated_at as string });
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(id)) return fail("Soal tidak ditemukan.", "not_found");
  const { data: q } = await c.supabase.from("questions").select("image_path").eq("id", id).eq("owner_id", c.userId).maybeSingle();
  if (!q) return fail("Soal tidak ditemukan.", "not_found");
  const { error } = await c.supabase.from("questions").delete().eq("id", id).eq("owner_id", c.userId);
  if (error) return dbFail(error, "deleteQuestion");
  await cleanupUnusedImages(c.supabase, c.userId, [q.image_path]);
  return ok();
}

export async function duplicateQuestion(id: string): Promise<ActionResult<{ question: QuestionRow; order: string[] }>> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(id)) return fail("Soal tidak ditemukan.", "not_found");
  const { data: src } = await c.supabase.from("questions").select("*").eq("id", id).eq("owner_id", c.userId).maybeSingle();
  if (!src) return fail("Soal tidak ditemukan.", "not_found");
  const s = src as QuestionRow;

  const { data: copy, error } = await c.supabase
    .from("questions")
    .insert({
      owner_id: c.userId, game_id: s.game_id, question_text: s.question_text, correct_answer: s.correct_answer,
      explanation: s.explanation, image_path: s.image_path, points: s.points,
      time_limit_seconds: s.time_limit_seconds, is_required: s.is_required, position: await nextPosition(c, s.game_id),
    })
    .select("*")
    .single();
  if (error || !copy) return dbFail(error, "duplicateQuestion");

  // Letakkan salinan tepat setelah soal asal.
  const { data: all } = await c.supabase.from("questions").select("id").eq("game_id", s.game_id).eq("owner_id", c.userId).order("position").order("created_at");
  const ids = ((all as { id: string }[] | null) ?? []).map((r) => r.id).filter((x) => x !== copy.id);
  const at = ids.indexOf(id);
  ids.splice(at + 1, 0, copy.id as string);
  await c.supabase.rpc("reorder_questions", { p_game_id: s.game_id, p_ids: ids });
  return ok({ question: copy as QuestionRow, order: ids });
}

export async function reorderQuestions(gameId: string, ids: string[]): Promise<ActionResult> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(gameId) || !Array.isArray(ids) || ids.length > 500 || !ids.every(isUuid)) return fail("Permintaan tidak valid.", "validation");
  if (new Set(ids).size !== ids.length) return fail("Daftar soal tidak valid.", "validation");
  const { error } = await c.supabase.rpc("reorder_questions", { p_game_id: gameId, p_ids: ids });
  if (error) return dbFail(error, "reorderQuestions");
  return ok();
}

export async function addFromBank(gameId: string, bankIds: string[]): Promise<ActionResult<QuestionRow[]>> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(gameId) || !Array.isArray(bankIds) || bankIds.length === 0 || bankIds.length > 100 || !bankIds.every(isUuid)) {
    return fail("Pilih minimal satu soal dari bank soal.", "validation");
  }
  if (!(await ownsGame(c, gameId))) return fail("Game tidak ditemukan.", "not_found");
  const { data: bank } = await c.supabase.from("question_bank").select("*").eq("owner_id", c.userId).in("id", bankIds);
  const rows = (bank as BankQuestionRow[] | null) ?? [];
  if (rows.length === 0) return fail("Soal tidak ditemukan di bank soal.", "not_found");

  // Disalin (bukan ditautkan) agar mengubah soal di game tidak mengubah sumber bank.
  const start = await nextPosition(c, gameId);
  const ordered = bankIds.map((id) => rows.find((r) => r.id === id)).filter((r): r is BankQuestionRow => Boolean(r));
  const { data, error } = await c.supabase
    .from("questions")
    .insert(ordered.map((r, i) => ({
      owner_id: c.userId, game_id: gameId, question_text: r.question_text, correct_answer: r.correct_answer,
      explanation: r.explanation, image_path: r.image_path, points: r.points,
      time_limit_seconds: r.time_limit_seconds, is_required: true, position: start + i,
    })))
    .select("*");
  if (error) return dbFail(error, "addFromBank");
  return ok((data as QuestionRow[]) ?? []);
}

export async function saveQuestionToBank(questionId: string): Promise<ActionResult> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(questionId)) return fail("Soal tidak ditemukan.", "not_found");
  const { data: q } = await c.supabase.from("questions").select("*, game:games(subject_id)").eq("id", questionId).eq("owner_id", c.userId).maybeSingle();
  if (!q) return fail("Soal tidak ditemukan.", "not_found");
  const row = q as QuestionRow & { game: { subject_id: string | null } | { subject_id: string | null }[] | null };
  const game = Array.isArray(row.game) ? row.game[0] : row.game;
  const { error } = await c.supabase.from("question_bank").insert({
    owner_id: c.userId, question_text: row.question_text, correct_answer: row.correct_answer, explanation: row.explanation,
    subject_id: game?.subject_id ?? null, image_path: row.image_path, points: row.points, time_limit_seconds: row.time_limit_seconds,
  });
  if (error) return dbFail(error, "saveQuestionToBank");
  revalidatePath("/dashboard/questions");
  return ok();
}

export async function searchBank(q: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  return searchBankForPicker(user.id, String(q ?? ""));
}

// ---------------------------------------------------------------- bank soal

export type BankInput = {
  questionText: string;
  correctAnswer: boolean;
  explanation?: string | null;
  points: number;
  timeLimitSeconds: number | null;
  subjectId?: string | null;
  imagePath?: string | null;
};

export async function saveBankQuestion(id: string | null, input: BankInput): Promise<ActionResult<BankQuestionRow>> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  const parsed = bankQuestionSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (!imageOk(d.imagePath, c.userId)) return fail("Gambar tidak valid.", "validation");
  const payload = {
    question_text: d.questionText, correct_answer: d.correctAnswer, explanation: d.explanation, subject_id: d.subjectId,
    image_path: d.imagePath, points: d.points, time_limit_seconds: d.timeLimitSeconds,
  };
  if (id) {
    if (!isUuid(id)) return fail("Soal tidak ditemukan.", "not_found");
    const { data, error } = await c.supabase.from("question_bank").update(payload).eq("id", id).eq("owner_id", c.userId).select("*");
    if (error) return dbFail(error, "saveBankQuestion.update");
    if (!data?.length) return fail("Soal tidak ditemukan.", "not_found");
    revalidatePath("/dashboard/questions");
    return ok(data[0] as BankQuestionRow);
  }
  const { data, error } = await c.supabase.from("question_bank").insert({ owner_id: c.userId, ...payload }).select("*").single();
  if (error || !data) return dbFail(error, "saveBankQuestion.insert");
  revalidatePath("/dashboard/questions");
  return ok(data as BankQuestionRow);
}

export async function deleteBankQuestion(id: string): Promise<ActionResult> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  if (!isUuid(id)) return fail("Soal tidak ditemukan.", "not_found");
  const { data: q } = await c.supabase.from("question_bank").select("image_path").eq("id", id).eq("owner_id", c.userId).maybeSingle();
  const { error } = await c.supabase.from("question_bank").delete().eq("id", id).eq("owner_id", c.userId);
  if (error) return dbFail(error, "deleteBankQuestion");
  if (q) await cleanupUnusedImages(c.supabase, c.userId, [q.image_path]);
  revalidatePath("/dashboard/questions");
  return ok();
}

// ---------------------------------------------------------------- impor CSV

export async function importQuestions(input: {
  target: "game" | "bank";
  gameId?: string;
  rows: unknown;
}): Promise<ActionResult<{ imported: number; unknownSubjects: string[]; questions: QuestionRow[] }>> {
  const c = await context();
  if (!c) return fail(AUTH_MSG, "auth");
  // Validasi ulang di server: data dari browser tidak dipercaya.
  const parsed = importRowsSchema.safeParse(input.rows);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data impor tidak valid.", "validation");
  const rows = parsed.data;

  if (input.target === "game") {
    if (!input.gameId || !isUuid(input.gameId) || !(await ownsGame(c, input.gameId))) return fail("Game tidak ditemukan.", "not_found");
    const start = await nextPosition(c, input.gameId);
    const { data, error } = await c.supabase
      .from("questions")
      .insert(rows.map((r, i) => ({
        owner_id: c.userId, game_id: input.gameId, question_text: r.questionText, correct_answer: r.correctAnswer,
        explanation: r.explanation, points: r.points, time_limit_seconds: r.timeLimitSeconds, is_required: true, position: start + i,
      })))
      .select("*");
    if (error) return dbFail(error, "importQuestions.game");
    return ok({ imported: data?.length ?? 0, unknownSubjects: [], questions: (data as QuestionRow[]) ?? [] });
  }

  const { data: subjects } = await c.supabase.from("subjects").select("id,name");
  const map = new Map(((subjects as Pick<SubjectRow, "id" | "name">[] | null) ?? []).map((s) => [s.name.toLowerCase(), s.id]));
  const unknown = new Set<string>();
  const { data, error } = await c.supabase
    .from("question_bank")
    .insert(rows.map((r) => {
      let subjectId: string | null = null;
      if (r.subject) {
        subjectId = map.get(r.subject.toLowerCase()) ?? null;
        if (!subjectId) unknown.add(r.subject);
      }
      return {
        owner_id: c.userId, question_text: r.questionText, correct_answer: r.correctAnswer, explanation: r.explanation,
        points: r.points, time_limit_seconds: r.timeLimitSeconds, subject_id: subjectId,
      };
    }))
    .select("id");
  if (error) return dbFail(error, "importQuestions.bank");
  revalidatePath("/dashboard/questions");
  return ok({ imported: data?.length ?? 0, unknownSubjects: Array.from(unknown), questions: [] });
}
