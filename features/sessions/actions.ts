"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions/auth";
import { dbFail, fail, ok, zodFail, type ActionResult } from "@/lib/errors";
import { parseSettings } from "@/lib/validations/game";
import { evaluateSession, type SessionSummary } from "./scoring";
import { computeBadges } from "./badges";

const payloadSchema = z.object({
  sessionId: z.string().uuid(),
  gameId: z.string().uuid(),
  label: z.string().trim().max(80).nullish(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  endedEarly: z.boolean(),
  order: z.array(z.string().uuid()).min(1).max(500),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        position: z.number().int().min(0).max(500),
        given: z.boolean().nullable(),
        timedOut: z.boolean(),
        responseTimeMs: z.number().min(0).max(3_600_000),
      }),
    )
    .min(1, "Belum ada jawaban untuk disimpan.")
    .max(500),
});

export type SaveSessionResult = { summary: SessionSummary; badges: string[]; duplicate: boolean };

/**
 * Simpan hasil sesi. Skor, benar/salah, dan akurasi DIHITUNG ULANG di server dari jawaban mentah
 * dan soal di database; nilai skor dari klien tidak pernah dipakai.
 */
export async function saveSession(input: unknown): Promise<ActionResult<SaveSessionResult>> {
  const user = await getCurrentUser();
  if (!user) return fail("Sesi login berakhir. Silakan login kembali.", "auth");

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const p = parsed.data;

  const supabase = await createClient();
  const { data: game } = await supabase.from("games").select("id,settings,game_mode").eq("id", p.gameId).eq("owner_id", user.id).maybeSingle();
  if (!game) return fail("Game tidak ditemukan.", "not_found");

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id,question_text,correct_answer,points,time_limit_seconds")
    .eq("game_id", p.gameId)
    .eq("owner_id", user.id);
  if (qErr) return dbFail(qErr, "saveSession.questions");

  const settings = parseSettings(game.settings);
  const qs = (questions as { id: string; question_text: string; correct_answer: boolean; points: number; time_limit_seconds: number | null }[]) ?? [];
  const known = new Set(qs.map((q) => q.id));
  if (!p.order.every((id) => known.has(id))) return fail("Urutan soal tidak sesuai dengan game.", "validation");

  const evaluated = evaluateSession(qs, p.answers, p.order.length, settings);
  if (!evaluated.ok) return fail(evaluated.error, "validation");
  const { scored, summary } = evaluated;

  const now = Date.now();
  const ended = Math.min(new Date(p.endedAt).getTime(), now + 60_000);
  const started = Math.min(new Date(p.startedAt).getTime(), ended);
  const duration = Math.min(86_400, Math.max(0, Math.round((ended - started) / 1000)));

  const { count: previous } = await supabase.from("game_sessions").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
  const badges = computeBadges(summary, (previous ?? 0) === 0);

  const { data, error } = await supabase.rpc("save_game_session", {
    p_session: {
      id: p.sessionId, game_id: p.gameId, session_label: p.label ?? null,
      status: p.endedEarly ? "ended_early" : "completed",
      started_at: new Date(started).toISOString(), completed_at: new Date(ended).toISOString(),
      total_questions: summary.totalQuestions, total_score: summary.score, correct_count: summary.correct,
      incorrect_count: summary.incorrect, timeout_count: summary.timeouts, accuracy: summary.accuracy,
      duration_seconds: duration, game_mode: game.game_mode,
      session_config: { settings, order: p.order },
    },
    p_answers: scored.map((a) => ({
      question_id: a.questionId, position: a.position, question_text: a.questionText, correct_answer: a.correctAnswer,
      given_answer: a.given, is_correct: a.isCorrect, is_timeout: a.isTimeout, points_earned: a.points,
      response_time_ms: a.responseTimeMs, answered_at: new Date(ended).toISOString(),
    })),
    p_achievements: badges.map((key) => ({ key, metadata: { game_id: p.gameId } })),
  });
  if (error) return dbFail(error, "saveSession.rpc");

  return ok({ summary, badges, duplicate: Boolean((data as { duplicate?: boolean } | null)?.duplicate) });
}
