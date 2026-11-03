import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GamePlayer } from "@/components/game-player/game-player";
import { buttonClasses } from "@/components/ui/button";
import { parseSettings } from "@/lib/validations/game";
import { publicImageUrl } from "@/lib/storage";
import type { PlayGame, PlayQuestion } from "@/types/db";

export const metadata = { title: "Game dibagikan", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Shared = {
  permission: "read_only" | "duplicate";
  game: { id: string; title: string; description: string | null; grade_level: string | null; topic: string | null; settings: unknown; subject_name: string | null };
  questions: { id: string; question_text: string; correct_answer: boolean; explanation: string | null; image_path: string | null; points: number; time_limit_seconds: number | null; is_required: boolean }[];
};

export default async function SharePage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  const supabase = await createClient();
  // Satu-satunya jalur akses publik: fungsi SECURITY DEFINER yang memvalidasi token (hash), masa berlaku, dan pencabutan.
  const { data } = await supabase.rpc("get_shared_game", { p_token: shareToken });
  const shared = data as Shared | null;

  if (!shared || shared.questions.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Tautan tidak berlaku</h1>
        <p className="max-w-md text-ink-soft">Tautan ini salah, sudah dicabut, kedaluwarsa, atau game-nya sudah tidak diterbitkan. Minta tautan baru kepada pemilik game.</p>
        <Link href="/" className={buttonClasses("primary", "lg")}>Ke beranda</Link>
      </div>
    );
  }

  const game: PlayGame = {
    id: shared.game.id, title: shared.game.title, description: shared.game.description, subject_name: shared.game.subject_name,
    grade_level: shared.game.grade_level, topic: shared.game.topic, settings: parseSettings(shared.game.settings),
  };
  const questions: PlayQuestion[] = shared.questions.map((q) => ({
    id: q.id, question_text: q.question_text, correct_answer: q.correct_answer === true, explanation: q.explanation,
    image_url: publicImageUrl(q.image_path), points: q.points, time_limit_seconds: q.time_limit_seconds, is_required: q.is_required,
  }));

  return (
    <div className="h-dvh w-full">
      <GamePlayer mode="shared" game={game} questions={questions} exitHref="/" shareToken={shareToken} canDuplicate={shared.permission === "duplicate"} />
    </div>
  );
}
