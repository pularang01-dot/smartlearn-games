import { createClient } from "@/lib/supabase/server";
import { REPORT_MAX_ROWS } from "@/lib/constants";
import { isUuid } from "@/lib/utils/misc";
import { one } from "@/features/games/mappers";
import type { SessionRow } from "@/types/db";

export type ReportFilters = { from?: string; to?: string; gameId?: string };
export type ReportRow = SessionRow & { game_title: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeFilters(raw: { from?: string; to?: string; gameId?: string }): ReportFilters {
  return {
    from: raw.from && DATE_RE.test(raw.from) ? raw.from : undefined,
    to: raw.to && DATE_RE.test(raw.to) ? raw.to : undefined,
    gameId: raw.gameId && isUuid(raw.gameId) ? raw.gameId : undefined,
  };
}

/** Rentang tanggal ditafsirkan dalam WIB (UTC+7). */
export async function fetchReportRows(userId: string, filters: ReportFilters): Promise<{ rows: ReportRow[]; truncated: boolean }> {
  const supabase = await createClient();
  let query = supabase.from("game_sessions").select("*, game:games(title)").eq("owner_id", userId);
  if (filters.gameId) query = query.eq("game_id", filters.gameId);
  if (filters.from) query = query.gte("started_at", `${filters.from}T00:00:00+07:00`);
  if (filters.to) query = query.lte("started_at", `${filters.to}T23:59:59.999+07:00`);
  const { data, error } = await query.order("started_at", { ascending: false }).limit(REPORT_MAX_ROWS + 1);
  if (error) console.error("[fetchReportRows]", error.code, error.message);
  const all = ((data as unknown as (SessionRow & { game: { title: string } | { title: string }[] | null })[]) ?? []).map(({ game, ...s }) => ({
    ...(s as SessionRow),
    game_title: one(game)?.title ?? "(game dihapus)",
  }));
  return { rows: all.slice(0, REPORT_MAX_ROWS), truncated: all.length > REPORT_MAX_ROWS };
}

export function aggregate(rows: ReportRow[]) {
  const total = rows.length;
  const avgScore = total ? rows.reduce((s, r) => s + r.total_score, 0) / total : 0;
  const avgAccuracy = total ? rows.reduce((s, r) => s + Number(r.accuracy), 0) / total : 0;
  const perGame = new Map<string, { title: string; sessions: number; accuracy: number; score: number }>();
  for (const r of rows) {
    const g = perGame.get(r.game_id) ?? { title: r.game_title, sessions: 0, accuracy: 0, score: 0 };
    g.sessions++;
    g.accuracy += Number(r.accuracy);
    g.score += r.total_score;
    perGame.set(r.game_id, g);
  }
  return {
    total,
    avgScore,
    avgAccuracy,
    perGame: Array.from(perGame.entries())
      .map(([id, g]) => ({ id, title: g.title, sessions: g.sessions, avgAccuracy: g.accuracy / g.sessions, avgScore: g.score / g.sessions }))
      .sort((a, b) => b.sessions - a.sessions),
  };
}
