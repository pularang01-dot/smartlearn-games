import { createClient } from "@/lib/supabase/server";
import { GAMES_PAGE_SIZE } from "@/lib/constants";
import { isUuid } from "@/lib/utils/misc";
import type { GameRow, GameStatus, QuestionRow, SubjectRow, ShareRow } from "@/types/db";
import { one } from "./mappers";

export async function listSubjects(): Promise<SubjectRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("subjects").select("*").order("name");
  return (data as SubjectRow[] | null) ?? [];
}

export type GameListItem = {
  id: string;
  title: string;
  status: GameStatus;
  grade_level: string | null;
  topic: string | null;
  cover_image_path: string | null;
  updated_at: string;
  last_played_at: string | null;
  subject_name: string | null;
  question_count: number;
};

export type GameListParams = {
  q?: string;
  subjectId?: string;
  status?: string;
  sort?: string;
  page?: number;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function listGames(userId: string, params: GameListParams) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  let query = supabase
    .from("games")
    .select("id,title,status,grade_level,topic,cover_image_path,updated_at,last_played_at,subject:subjects(name),questions(count)", { count: "exact" })
    .eq("owner_id", userId);

  const status = params.status ?? "";
  if (status === "draft" || status === "published" || status === "archived") query = query.eq("status", status);
  else if (status !== "all") query = query.neq("status", "archived");

  if (params.subjectId && isUuid(params.subjectId)) query = query.eq("subject_id", params.subjectId);
  const q = params.q?.trim();
  if (q) query = query.ilike("title", `%${escapeLike(q.slice(0, 100))}%`);

  if (params.sort === "alpha") query = query.order("title", { ascending: true });
  else if (params.sort === "played") query = query.order("last_played_at", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false });
  else query = query.order("updated_at", { ascending: false });

  const from = (page - 1) * GAMES_PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + GAMES_PAGE_SIZE - 1);
  if (error) console.error("[listGames]", error.code, error.message);

  type Raw = Omit<GameListItem, "subject_name" | "question_count"> & { subject: { name: string } | { name: string }[] | null; questions: { count: number }[] | null };
  const rows: GameListItem[] = ((data as unknown as Raw[]) ?? []).map((r) => ({
    id: r.id, title: r.title, status: r.status, grade_level: r.grade_level, topic: r.topic,
    cover_image_path: r.cover_image_path, updated_at: r.updated_at, last_played_at: r.last_played_at,
    subject_name: one(r.subject)?.name ?? null,
    question_count: r.questions?.[0]?.count ?? 0,
  }));
  return { rows, total: count ?? 0, page, pageSize: GAMES_PAGE_SIZE };
}

export async function getGameWithQuestions(userId: string, gameId: string) {
  if (!isUuid(gameId)) return null;
  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("*, subject:subjects(name)")
    .eq("id", gameId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!game) return null;
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("game_id", gameId)
    .eq("owner_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  const { subject, ...rest } = game as GameRow & { subject: { name: string } | { name: string }[] | null };
  return {
    game: rest as GameRow,
    subjectName: one(subject)?.name ?? null,
    questions: (questions as QuestionRow[] | null) ?? [],
  };
}

export async function listActiveShares(userId: string, gameId: string): Promise<ShareRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("game_shares")
    .select("id,game_id,permission,expires_at,revoked_at,created_at")
    .eq("owner_id", userId)
    .eq("game_id", gameId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return (data as ShareRow[] | null) ?? [];
}

export async function listPublishedGameOptions(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("id,title")
    .eq("owner_id", userId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(200);
  return (data as { id: string; title: string }[] | null) ?? [];
}

export async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [games, questions, sessions, recentGames, recentSessions, achievements] = await Promise.all([
    supabase.from("games").select("id", head).eq("owner_id", userId).neq("status", "archived"),
    supabase.from("questions").select("id", head).eq("owner_id", userId),
    supabase.from("game_sessions").select("id", head).eq("owner_id", userId),
    supabase.from("games").select("id,title,status,updated_at").eq("owner_id", userId).neq("status", "archived").order("updated_at", { ascending: false }).limit(4),
    supabase
      .from("game_sessions")
      .select("id,session_label,started_at,total_score,accuracy,correct_count,total_questions,game:games(title)")
      .eq("owner_id", userId).order("started_at", { ascending: false }).limit(5),
    supabase.from("achievements").select("achievement_key,earned_at").eq("owner_id", userId).order("earned_at", { ascending: false }).limit(20),
  ]);
  type RS = { id: string; session_label: string | null; started_at: string; total_score: number; accuracy: number; correct_count: number; total_questions: number; game: { title: string } | { title: string }[] | null };
  return {
    gameCount: games.count ?? 0,
    questionCount: questions.count ?? 0,
    sessionCount: sessions.count ?? 0,
    recentGames: (recentGames.data as { id: string; title: string; status: GameStatus; updated_at: string }[] | null) ?? [],
    recentSessions: ((recentSessions.data as unknown as RS[]) ?? []).map((s) => ({ ...s, game_title: one(s.game)?.title ?? "(game dihapus)" })),
    achievements: Array.from(new Set(((achievements.data as { achievement_key: string }[] | null) ?? []).map((a) => a.achievement_key))),
  };
}
