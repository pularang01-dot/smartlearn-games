/**
 * Aturan "Lawan Monster" (murni, tanpa efek samping; dipakai klien untuk tampilan dan server untuk pencatatan).
 * - HP monster = setengah jumlah soal (dibulatkan ke atas, minimal 1).
 * - Jawaban benar melukai monster 1 HP; 3 jawaban benar beruntun atau lebih = serangan kritis (2 HP).
 * - Jawaban salah atau timeout mengurangi 1 nyawa kelas dan memutus beruntun. Soal dilewati hanya memutus beruntun.
 * - Menang bila HP monster 0; kalah bila nyawa kelas 0; selain itu (soal habis/diakhiri guru) = seri.
 */
export type BattleOutcome = "win" | "lose" | "draw";
export type BattleEvent = { correct: boolean; skipped?: boolean };

export type BattleStatus = {
  maxHp: number; hp: number; maxLives: number; lives: number; streak: number;
  /** null selama pertarungan masih berjalan */
  over: "win" | "lose" | null;
  lastDamage: number;
};

export const CRITICAL_STREAK = 3;
export const monsterMaxHp = (totalQuestions: number) => Math.max(1, Math.ceil(totalQuestions / 2));

export function battleStatus(events: BattleEvent[], totalQuestions: number, lives: number): BattleStatus {
  const maxHp = monsterMaxHp(totalQuestions);
  let hp = maxHp;
  let left = lives;
  let streak = 0;
  let lastDamage = 0;
  let over: "win" | "lose" | null = null;
  for (const e of events) {
    if (over) break;
    if (e.skipped) { streak = 0; lastDamage = 0; continue; }
    if (e.correct) {
      streak++;
      lastDamage = streak >= CRITICAL_STREAK ? 2 : 1;
      hp = Math.max(0, hp - lastDamage);
    } else {
      streak = 0;
      lastDamage = 0;
      left = Math.max(0, left - 1);
    }
    if (hp <= 0) over = "win";
    else if (left <= 0) over = "lose";
  }
  return { maxHp, hp, maxLives: lives, lives: left, streak, over, lastDamage };
}

export const outcomeOf = (s: BattleStatus): BattleOutcome => s.over ?? "draw";

type RecordLike = { kind: "answered" | "timeout" | "skipped"; isCorrect: boolean } | undefined;
export function eventsFromRecords(records: RecordLike[]): BattleEvent[] {
  return records.flatMap((r) => (r ? [{ correct: r.kind === "answered" && r.isCorrect, skipped: r.kind === "skipped" }] : []));
}