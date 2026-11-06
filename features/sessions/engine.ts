import { scoreAnswer, timeLimitFor, type ScoringSettings } from "./scoring";
import { battleStatus, eventsFromRecords } from "./battle";
import type { PlayQuestion } from "@/types/db";

export type PlayPhase = "intro" | "question" | "feedback" | "result";

export type AnswerRecord = {
  questionId: string;
  position: number;
  kind: "answered" | "timeout" | "skipped";
  given: boolean | null;
  isCorrect: boolean;
  points: number;
  responseMs: number;
  streakAfter: number;
};

export type PlayState = {
  phase: PlayPhase;
  index: number;
  records: (AnswerRecord | undefined)[];
  paused: boolean;
  startedAt: number | null;
  endedAt: number | null;
  endedEarly: boolean;
};

export type PlayAction =
  | { type: "START"; now: number }
  | { type: "ANSWER"; given: boolean; responseMs: number }
  | { type: "TIMEOUT"; responseMs: number }
  | { type: "SKIP"; now: number }
  | { type: "NEXT"; now: number }
  | { type: "PREV" }
  | { type: "END"; now: number }
  | { type: "PAUSE" }
  | { type: "RESUME" };

export type EngineConfig = {
  questions: PlayQuestion[];
  settings: ScoringSettings & { allowGoBack: boolean; playStyle?: "classic" | "battle"; battleLives?: number };
};

export function initialState(): PlayState {
  return { phase: "intro", index: 0, records: [], paused: false, startedAt: null, endedAt: null, endedEarly: false };
}

function streakBefore(records: (AnswerRecord | undefined)[], index: number): number {
  const prev = records[index - 1];
  return prev ? prev.streakAfter : 0;
}

export function totalScore(records: (AnswerRecord | undefined)[]): number {
  return records.reduce((sum, r) => sum + (r?.points ?? 0), 0);
}

export function currentStreak(state: PlayState): number {
  for (let i = state.records.length - 1; i >= 0; i--) {
    const r = state.records[i];
    if (r) return r.streakAfter;
  }
  return 0;
}

function advance(state: PlayState, cfg: EngineConfig, now: number): PlayState {
  const next = state.index + 1;
  if (next >= cfg.questions.length) {
    return { ...state, phase: "result", endedAt: now, paused: false };
  }
  return { ...state, index: next, phase: state.records[next] ? "feedback" : "question" };
}

/** Reducer murni: semua aturan permainan ada di sini sehingga mudah diuji. */
export function playReducer(state: PlayState, action: PlayAction, cfg: EngineConfig): PlayState {
  const q = cfg.questions[state.index];
  switch (action.type) {
    case "START":
      if (state.phase !== "intro" || cfg.questions.length === 0) return state;
      return { ...initialState(), phase: "question", startedAt: action.now };

    case "ANSWER": {
      // Input dikunci: hanya diterima pada fase soal, tidak dijeda, dan soal belum dijawab.
      if (state.phase !== "question" || state.paused || !q || state.records[state.index]) return state;
      const correct = action.given === q.correct_answer;
      const out = scoreAnswer({
        correct,
        responseMs: action.responseMs,
        limitSeconds: timeLimitFor(q, cfg.settings),
        basePoints: q.points,
        streakBefore: streakBefore(state.records, state.index),
        settings: cfg.settings,
      });
      const records = [...state.records];
      records[state.index] = {
        questionId: q.id, position: state.index, kind: "answered", given: action.given,
        isCorrect: correct, points: out.points, responseMs: action.responseMs, streakAfter: out.streakAfter,
      };
      return { ...state, records, phase: "feedback" };
    }

    case "TIMEOUT": {
      if (state.phase !== "question" || state.paused || !q || state.records[state.index]) return state;
      const records = [...state.records];
      records[state.index] = {
        questionId: q.id, position: state.index, kind: "timeout", given: null,
        isCorrect: false, points: 0, responseMs: action.responseMs, streakAfter: 0,
      };
      return { ...state, records, phase: "feedback" };
    }

    case "SKIP": {
      if (state.phase !== "question" || !q || state.records[state.index]) return state;
      const records = [...state.records];
      records[state.index] = {
        questionId: q.id, position: state.index, kind: "skipped", given: null,
        isCorrect: false, points: 0, responseMs: 0, streakAfter: 0,
      };
      return advance({ ...state, records }, cfg, action.now);
    }

    case "NEXT": {
      if (state.phase !== "feedback") return state;
      // Lawan Monster: permainan berakhir begitu monster kalah atau nyawa kelas habis.
      if (cfg.settings.playStyle === "battle") {
        const st = battleStatus(eventsFromRecords(state.records), cfg.questions.length, cfg.settings.battleLives ?? 3);
        if (st.over) return { ...state, phase: "result", endedAt: action.now, paused: false };
      }
      return advance(state, cfg, action.now);
    }

    case "PREV": {
      if (!cfg.settings.allowGoBack || state.index === 0) return state;
      if (state.phase !== "question" && state.phase !== "feedback") return state;
      const index = state.index - 1;
      return { ...state, index, phase: "feedback", paused: false };
    }

    case "END":
      if (state.phase === "intro" || state.phase === "result") return state;
      return { ...state, phase: "result", endedAt: action.now, endedEarly: state.records.filter(Boolean).length < cfg.questions.length, paused: false };

    case "PAUSE":
      return state.phase === "question" || state.phase === "feedback" ? { ...state, paused: true } : state;
    case "RESUME":
      return { ...state, paused: false };
  }
}