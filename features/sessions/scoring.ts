import { clamp } from "@/lib/utils/misc";
import type { GameSettings } from "@/lib/validations/game";

export type ScoringSettings = Pick<
  GameSettings,
  "timerEnabled" | "defaultTimeLimit" | "timeoutCountsAsWrong" | "timeBonusEnabled" | "comboBonusEnabled"
>;

export type ScoringQuestion = {
  id: string;
  correct_answer: boolean;
  points: number;
  time_limit_seconds: number | null;
  question_text?: string;
};

/** Batas waktu (detik) untuk satu soal, atau null jika timer tidak aktif. */
export function timeLimitFor(q: Pick<ScoringQuestion, "time_limit_seconds">, s: Pick<ScoringSettings, "timerEnabled" | "defaultTimeLimit">): number | null {
  if (!s.timerEnabled) return null;
  return q.time_limit_seconds ?? s.defaultTimeLimit;
}

export type ScoreInput = {
  correct: boolean;
  responseMs: number;
  limitSeconds: number | null;
  basePoints: number;
  streakBefore: number;
  settings: ScoringSettings;
};

export type ScoreOutput = { points: number; timeBonus: number; comboBonus: number; streakAfter: number };

/**
 * Skor deterministik:
 * - benar => poin dasar; salah/timeout => 0 (tidak pernah negatif)
 * - bonus waktu (opsional, hanya bila timer aktif): hingga 50% poin dasar sebanding sisa waktu
 * - bonus combo (opsional): +10% poin dasar per jawaban benar beruntun ke-2 dst, maksimum +50%
 */
export function scoreAnswer(input: ScoreInput): ScoreOutput {
  const { correct, responseMs, limitSeconds, basePoints, streakBefore, settings } = input;
  if (!correct) return { points: 0, timeBonus: 0, comboBonus: 0, streakAfter: 0 };

  const streakAfter = streakBefore + 1;
  let timeBonus = 0;
  if (settings.timeBonusEnabled && limitSeconds !== null) {
    const limitMs = limitSeconds * 1000;
    const remainingFraction = 1 - clamp(responseMs, 0, limitMs) / limitMs;
    timeBonus = Math.round(basePoints * 0.5 * remainingFraction);
  }
  let comboBonus = 0;
  if (settings.comboBonusEnabled && streakAfter >= 2) {
    comboBonus = Math.round(basePoints * 0.1 * Math.min(streakAfter - 1, 5));
  }
  return { points: basePoints + timeBonus + comboBonus, timeBonus, comboBonus, streakAfter };
}

export type RawAnswer = {
  questionId: string;
  position: number;
  /** true/false = pilihan siswa; null = tidak memilih (timeout) */
  given: boolean | null;
  timedOut: boolean;
  responseTimeMs: number;
};

export type ScoredAnswer = {
  questionId: string;
  position: number;
  questionText: string;
  correctAnswer: boolean;
  given: boolean | null;
  isCorrect: boolean;
  isTimeout: boolean;
  points: number;
  responseTimeMs: number;
};

export type SessionSummary = {
  totalQuestions: number;
  answeredCount: number;
  correct: number;
  incorrect: number;
  timeouts: number;
  score: number;
  accuracy: number; // 0..100
  maxStreak: number;
};

export function summarize(scored: ScoredAnswer[], totalQuestions: number, settings: Pick<ScoringSettings, "timeoutCountsAsWrong">): SessionSummary {
  let correct = 0;
  let incorrect = 0;
  let timeouts = 0;
  let score = 0;
  let streak = 0;
  let maxStreak = 0;
  for (const a of scored) {
    score += a.points;
    if (a.isTimeout) {
      timeouts++;
      streak = 0;
    } else if (a.isCorrect) {
      correct++;
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      incorrect++;
      streak = 0;
    }
  }
  // Timeout dihitung sebagai salah pada akurasi hanya jika guru memilih demikian.
  const denominator = correct + incorrect + (settings.timeoutCountsAsWrong ? timeouts : 0);
  const accuracy = denominator === 0 ? 0 : Math.round((correct / denominator) * 10000) / 100;
  return { totalQuestions, answeredCount: scored.length, correct, incorrect, timeouts, score, accuracy, maxStreak };
}

export type EvaluateResult =
  | { ok: true; scored: ScoredAnswer[]; summary: SessionSummary }
  | { ok: false; error: string };

/**
 * Hitung ulang seluruh sesi dari jawaban mentah. Dipakai SERVER saat menyimpan hasil
 * (klien tidak dipercaya untuk skor). Mengabaikan skor/benar-salah yang dikirim klien.
 */
export function evaluateSession(
  questions: ScoringQuestion[],
  rawAnswers: RawAnswer[],
  totalQuestions: number,
  settings: ScoringSettings,
): EvaluateResult {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const seen = new Set<string>();
  const ordered = [...rawAnswers].sort((a, b) => a.position - b.position);
  const scored: ScoredAnswer[] = [];
  let streak = 0;

  for (const raw of ordered) {
    const q = byId.get(raw.questionId);
    if (!q) return { ok: false, error: "Jawaban merujuk soal yang bukan bagian dari game ini." };
    if (seen.has(raw.questionId)) return { ok: false, error: "Terdapat jawaban ganda untuk satu soal." };
    seen.add(raw.questionId);

    const limit = timeLimitFor(q, settings);
    const isTimeout = raw.timedOut || raw.given === null;
    const responseMs = clamp(Math.round(raw.responseTimeMs), 0, limit !== null ? limit * 1000 : 3_600_000);
    const isCorrect = !isTimeout && raw.given === q.correct_answer;
    const out = scoreAnswer({ correct: isCorrect, responseMs, limitSeconds: limit, basePoints: q.points, streakBefore: streak, settings });
    streak = out.streakAfter;

    scored.push({
      questionId: q.id,
      position: raw.position,
      questionText: q.question_text ?? "",
      correctAnswer: q.correct_answer,
      given: isTimeout ? null : raw.given,
      isCorrect,
      isTimeout,
      points: out.points,
      responseTimeMs: responseMs,
    });
  }
  return { ok: true, scored, summary: summarize(scored, totalQuestions, settings) };
}
