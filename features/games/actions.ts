"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions/auth";
import { dbFail, fail, formFromZod, ok, zodFail, type ActionResult, type FormState } from "@/lib/errors";
import { gameInfoSchema, newGameSchema, defaultGameSettings, type GameInfoInput } from "@/lib/validations/game";
import { isUuid } from "@/lib/utils/misc";
import { DEMO_GAME } from "@/lib/demo";
import { cleanupUnusedImages } from "@/features/media/cleanup";
import type { GameRow, GameStatus, SubjectRow } from "@/types/db";

const AUTH_MSG = "Sesi login berakhir. Silakan login kembali.";
const refresh = () => revalidatePath("/dashboard", "layout");

export async function createGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: AUTH_MSG };
  const parsed = newGameSchema.safeParse({
    title: formData.get("title"),
    subjectId: formData.get("subjectId") || null,
    gradeLevel: formData.get("gradeLevel"),
    topic: formData.get("topic"),
    description: formData.get("description"),
  });
  if (!parsed.success) return formFromZod(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      subject_id: parsed.data.subjectId,
      grade_level: parsed.data.gradeLevel,
      topic: parsed.data.topic,
      description: parsed.data.description,
      settings: defaultGameSettings,
    })
    .select("id")
    .single();
  if (error || !data) {
    const r = dbFail(error, "createGame");
    return { error: r.ok ? "Gagal membuat game." : r.error };
  }
  refresh();
  redirect(`/dashboard/games/${data.id}`);
}

/** Dipanggil hanya atas klik eksplisit guru ("Buat game contoh"). */
export async function createDemoGame(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: AUTH_MSG };
  const supabase = await createClient();

  const { data: subject } = await supabase.from("subjects").select("id").is("owner_id", null).eq("name", DEMO_GAME.subjectName).maybeSingle();
  const { data: game, error } = await supabase
    .from("games")
    .insert({
      owner_id: user.id,
      title: DEMO_GAME.title,
      description: DEMO_GAME.description,
      subject_id: subject?.id ?? null,
      grade_level: DEMO_GAME.gradeLevel,
      topic: DEMO_GAME.topic,
      tags: DEMO_GAME.tags,
      status: "published",
      published_at: new Date().toISOString(),
      settings: { ...defaultGameSettings, comboBonusEnabled: true },
    })
    .select("id")
    .single();
  if (error || !game) {
    const r = dbFail(error, "createDemoGame");
    return { error: r.ok ? "Gagal membuat game contoh." : r.error };
  }
  const { error: qErr } = await supabase.from("questions").insert(
    DEMO_GAME.questions.map((q, i) => ({
      owner_id: user.id, game_id: game.id, question_text: q.text, correct_answer: q.answer,
      explanation: q.explanation, points: 10, position: i,
    })),
  );
  if (qErr) {
    await supabase.from("games").delete().eq("id", game.id).eq("owner_id", user.id);
    const r = dbFail(qErr, "createDemoGame.questions");
    return { error: r.ok ? "Gagal membuat game contoh." : r.error };
  }
  refresh();
  redirect(`/dashboard/games/${game.id}`);
}

export async function updateGame(input: {
  gameId: string;
  expectedUpdatedAt: string | null;
  force?: boolean;
  data: GameInfoInput;
}): Promise<ActionResult<{ updatedAt: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail(AUTH_MSG, "auth");
  if (!isUuid(input.gameId)) return fail("Game tidak ditemukan.", "not_found");

  const parsed = gameInfoSchema.safeParse(input.data);
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  if (d.coverImagePath && !d.coverImagePath.startsWith(`${user.id}/`)) return fail("Gambar sampul tidak valid.", "validation");

  const supabase = await createClient();
  const { data: before } = await supabase.from("games").select("cover_image_path").eq("id", input.gameId).eq("owner_id", user.id).maybeSingle();
  if (!before) return fail("Game tidak ditemukan.", "not_found");

  let query = supabase
    .from("games")
    .update({
      title: d.title, description: d.description, subject_id: d.subjectId, grade_level: d.gradeLevel,
      topic: d.topic, tags: d.tags, cover_image_path: d.coverImagePath, settings: d.settings,
    })
    .eq("id", input.gameId)
    .eq("owner_id", user.id);
  if (!input.force && input.expectedUpdatedAt) query = query.eq("updated_at", input.expectedUpdatedAt);

  const { data, error } = await query.select("updated_at");
  if (error) return dbFail(error, "updateGame");
  if (!data || data.length === 0) {
    return fail("Game ini sudah diubah dari tab atau perangkat lain.", "conflict");
  }
  if (before.cover_image_path !== d.coverImagePath) await cleanupUnusedImages(supabase, user.id, [before.cover_image_path]);
  return ok({ updatedAt: data[0].updated_at as string });
}

export async function setGameStatus(gameId: string, status: GameStatus): Promise<ActionResult<{ updatedAt: string; status: GameStatus }>> {
  const user = await getCurrentUser();
  if (!user) return fail(AUTH_MSG, "auth");
  if (!isUuid(gameId) || !["draft", "published", "archived"].includes(status)) return fail("Permintaan tidak valid.", "validation");
  const supabase = await createClient();

  const patch: Record<string, unknown> = { status };
  if (status === "published") {
    const { count, error } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("game_id", gameId).eq("owner_id", user.id);
    if (error) return dbFail(error, "setGameStatus.count");
    if (!count) return fail("Tambahkan minimal 1 pertanyaan yang valid sebelum menerbitkan game.", "validation");
    patch.published_at = new Date().toISOString();
  }
  const { data, error } = await supabase.from("games").update(patch).eq("id", gameId).eq("owner_id", user.id).select("updated_at,status");
  if (error) return dbFail(error, "setGameStatus");
  if (!data?.length) return fail("Game tidak ditemukan.", "not_found");
  refresh();
  return ok({ updatedAt: data[0].updated_at as string, status: data[0].status as GameStatus });
}

export async function duplicateGame(gameId: string): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail(AUTH_MSG, "auth");
  if (!isUuid(gameId)) return fail("Game tidak ditemukan.", "not_found");
  const supabase = await createClient();

  const { data: g } = await supabase.from("games").select("*").eq("id", gameId).eq("owner_id", user.id).maybeSingle();
  if (!g) return fail("Game tidak ditemukan.", "not_found");
  const src = g as GameRow;

  const { data: copy, error } = await supabase
    .from("games")
    .insert({
      owner_id: user.id, title: `${src.title} (salinan)`.slice(0, 120), description: src.description,
      subject_id: src.subject_id, grade_level: src.grade_level, topic: src.topic, tags: src.tags,
      cover_image_path: src.cover_image_path, settings: src.settings, status: "draft",
    })
    .select("id")
    .single();
  if (error || !copy) return dbFail(error, "duplicateGame");

  const { data: qs } = await supabase.from("questions").select("*").eq("game_id", gameId).eq("owner_id", user.id).order("position");
  if (qs && qs.length) {
    const { error: qErr } = await supabase.from("questions").insert(
      (qs as { question_text: string; correct_answer: boolean; explanation: string | null; image_path: string | null; points: number; time_limit_seconds: number | null; is_required: boolean; position: number }[]).map((q) => ({
        owner_id: user.id, game_id: copy.id, question_text: q.question_text, correct_answer: q.correct_answer,
        explanation: q.explanation, image_path: q.image_path, points: q.points,
        time_limit_seconds: q.time_limit_seconds, is_required: q.is_required, position: q.position,
      })),
    );
    if (qErr) {
      await supabase.from("games").delete().eq("id", copy.id).eq("owner_id", user.id);
      return dbFail(qErr, "duplicateGame.questions");
    }
  }
  refresh();
  return ok({ id: copy.id as string });
}

export async function deleteGame(gameId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(AUTH_MSG, "auth");
  if (!isUuid(gameId)) return fail("Game tidak ditemukan.", "not_found");
  const supabase = await createClient();

  const { data: g } = await supabase.from("games").select("cover_image_path").eq("id", gameId).eq("owner_id", user.id).maybeSingle();
  if (!g) return fail("Game tidak ditemukan.", "not_found");
  const { data: imgs } = await supabase.from("questions").select("image_path").eq("game_id", gameId).eq("owner_id", user.id);

  const { error } = await supabase.from("games").delete().eq("id", gameId).eq("owner_id", user.id);
  if (error) return dbFail(error, "deleteGame");

  await cleanupUnusedImages(supabase, user.id, [g.cover_image_path, ...((imgs as { image_path: string | null }[] | null) ?? []).map((r) => r.image_path)]);
  refresh();
  return ok();
}

export async function createSubject(name: string): Promise<ActionResult<SubjectRow>> {
  const user = await getCurrentUser();
  if (!user) return fail(AUTH_MSG, "auth");
  const clean = String(name ?? "").trim();
  if (clean.length < 1 || clean.length > 60) return fail("Nama mata pelajaran 1-60 karakter.", "validation");
  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects").insert({ owner_id: user.id, name: clean }).select("*").single();
  if (error?.code === "23505") return fail("Mata pelajaran tersebut sudah ada.", "validation");
  if (error || !data) return dbFail(error, "createSubject");
  return ok(data as SubjectRow);
}
