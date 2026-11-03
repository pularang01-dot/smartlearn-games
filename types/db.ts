import type { GameSettings } from "@/lib/validations/game";

export type GameStatus = "draft" | "published" | "archived";

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "teacher" | "platform_admin";
  preferences: { onboardingDone?: boolean; soundDefault?: boolean; reduceMotion?: boolean } & Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SubjectRow = { id: string; owner_id: string | null; name: string; created_at: string };

export type GameRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  grade_level: string | null;
  topic: string | null;
  tags: string[];
  cover_image_path: string | null;
  game_mode: "true_false";
  status: GameStatus;
  settings: Partial<GameSettings>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  last_played_at: string | null;
};

export type QuestionRow = {
  id: string;
  owner_id: string;
  game_id: string;
  question_text: string;
  answer_type: "true_false";
  correct_answer: boolean;
  options: unknown[] | null;
  explanation: string | null;
  image_path: string | null;
  audio_path: string | null;
  points: number;
  time_limit_seconds: number | null;
  is_required: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type BankQuestionRow = {
  id: string;
  owner_id: string;
  question_text: string;
  game_mode: "true_false";
  correct_answer: boolean;
  explanation: string | null;
  subject_id: string | null;
  image_path: string | null;
  points: number;
  time_limit_seconds: number | null;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  owner_id: string;
  game_id: string;
  session_label: string | null;
  status: "completed" | "ended_early";
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  total_score: number;
  correct_count: number;
  incorrect_count: number;
  timeout_count: number;
  accuracy: number;
  duration_seconds: number;
  game_mode: string;
  session_config: Record<string, unknown>;
  created_at: string;
};

export type SessionAnswerRow = {
  id: string;
  session_id: string;
  question_id: string | null;
  position: number;
  question_text: string;
  correct_answer: boolean | null;
  given_answer: boolean | null;
  is_correct: boolean;
  is_timeout: boolean;
  points_earned: number;
  response_time_ms: number;
  answered_at: string;
};

export type ShareRow = {
  id: string;
  game_id: string;
  permission: "read_only" | "duplicate";
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

/** Data soal untuk pemutar (tanpa field privat). */
export type PlayQuestion = {
  id: string;
  question_text: string;
  correct_answer: boolean;
  explanation: string | null;
  image_url: string | null;
  points: number;
  time_limit_seconds: number | null;
  is_required: boolean;
};

export type PlayGame = {
  id: string;
  title: string;
  description: string | null;
  subject_name: string | null;
  grade_level: string | null;
  topic: string | null;
  settings: GameSettings;
};
