import { publicImageUrl } from "@/lib/storage";
import { parseSettings } from "@/lib/validations/game";
import type { GameRow, PlayGame, PlayQuestion, QuestionRow } from "@/types/db";

export function toPlayQuestion(q: Pick<QuestionRow, "id" | "question_text" | "correct_answer" | "explanation" | "image_path" | "points" | "time_limit_seconds" | "is_required">): PlayQuestion {
  return {
    id: q.id,
    question_text: q.question_text,
    correct_answer: q.correct_answer === true,
    explanation: q.explanation,
    image_url: publicImageUrl(q.image_path),
    points: q.points,
    time_limit_seconds: q.time_limit_seconds,
    is_required: q.is_required,
  };
}

export function toPlayGame(g: Pick<GameRow, "id" | "title" | "description" | "grade_level" | "topic" | "settings">, subjectName: string | null): PlayGame {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    subject_name: subjectName,
    grade_level: g.grade_level,
    topic: g.topic,
    settings: parseSettings(g.settings),
  };
}

export function one<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}
