import { createClient } from "@/lib/supabase/server";
import { SESSIONS_PAGE_SIZE } from "@/lib/constants";
import { isUuid } from "@/lib/utils/misc";
import type { SessionAnswerRow, SessionRow } from "@/types/db";
import { one } from "@/features/games/mappers";

export type SessionListItem = SessionRow & { game_title: string };

export async function listSessions(userId: string, params: { page?: number; gameId?: string }) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  let query = supabase.from("game_sessions").select("*, game:games(title)", { count: "exact" }).eq("owner_id", userId);
  if (params.gameId && isUuid(params.gameId)) query = query.eq("game_id", params.gameId);
  const from = (page - 1) * SESSIONS_PAGE_SIZE;
  const { data, count, error } = await query.order("started_at", { ascending: false }).range(from, from + SESSIONS_PAGE_SIZE - 1);
  if (error) console.error("[listSessions]", error.code, error.message);
  const rows = ((data as unknown as (SessionRow & { game: { title: string } | { title: string }[] | null })[]) ?? []).map(({ game, ...s }) => ({
    ...(s as SessionRow),
    game_title: one(game)?.title ?? "(game dihapus)",
  }));
  return { rows: rows as SessionListItem[], total: count ?? 0, page, pageSize: SESSIONS_PAGE_SIZE };
}

export async function getSessionDetail(userId: string, sessionId: string) {
  if (!isUuid(sessionId)) return null;
  const supabase = await createClient();
  const { data: s } = await supabase.from("game_sessions").select("*, game:games(id,title)").eq("id", sessionId).eq("owner_id", userId).maybeSingle();
  if (!s) return null;
  const { data: answers } = await supabase.from("session_answers").select("*").eq("session_id", sessionId).eq("owner_id", userId).order("position");
  const { game, ...session } = s as unknown as SessionRow & { game: { id: string; title: string } | { id: string; title: string }[] | null };
  return { session: session as SessionRow, game: one(game), answers: (answers as SessionAnswerRow[] | null) ?? [] };
}
