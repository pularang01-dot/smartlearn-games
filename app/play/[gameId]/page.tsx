import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { getGameWithQuestions } from "@/features/games/queries";
import { toPlayGame, toPlayQuestion } from "@/features/games/mappers";
import { GamePlayer } from "@/components/game-player/game-player";
import { buttonClasses } from "@/components/ui/button";

export const metadata = { title: "Mainkan game" };

export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireUser(`/play/${gameId}`);
  const data = await getGameWithQuestions(user.id, gameId); // hanya milik user yang login
  if (!data) notFound();
  const { game, questions } = data;

  if (questions.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Game ini belum punya pertanyaan</h1>
        <Link href={`/dashboard/games/${game.id}`} className={buttonClasses("primary", "lg")}>Tambah pertanyaan</Link>
      </div>
    );
  }
  return (
    <div className="h-dvh w-full">
      <GamePlayer mode="owner" game={toPlayGame(game, data.subjectName)} questions={questions.map(toPlayQuestion)} exitHref={`/dashboard/games/${game.id}`} />
    </div>
  );
}
