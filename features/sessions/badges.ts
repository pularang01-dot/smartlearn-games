import type { SessionSummary } from "./scoring";

/** Pencapaian dasar yang dapat dihitung dari ringkasan sesi (tanpa data siswa). */
export function computeBadges(summary: SessionSummary, isFirstSession: boolean, battleOutcome?: "win" | "lose" | "draw"): string[] {
  const keys: string[] = [];
  if (isFirstSession) keys.push("first_session");
  if (summary.totalQuestions >= 3 && summary.correct === summary.totalQuestions && summary.timeouts === 0) keys.push("perfect_score");
  if (summary.maxStreak >= 5) keys.push("combo_5");
  if (battleOutcome === "win") keys.push("monster_slayer");
  return keys;
}