import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { getGameWithQuestions } from "@/features/games/queries";
import { toPlayGame, toPlayQuestion } from "@/features/games/mappers";
import { GamePlayer } from "@/components/game-player/game-player";
import { Breadcrumb } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";

export const metadata = { title: "Preview game" };

export default async function PreviewPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireUser(`/dashboard/games/${gameId}/preview`);
  const data = await getGameWithQuestions(user.id, gameId);
  if (!data) notFound();
  const { game, questions } = data;

  return (
    <>
      <Breadcrumb items={[{ label: "Game saya", href: "/dashboard/games" }, { label: game.title, href: `/dashboard/games/${game.id}` }, { label: "Preview" }]} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pencil-300 bg-pencil-100 px-4 py-3 text-sm text-[#7A5600]">
        <span><strong>Mode pratinjau.</strong> Hasil permainan tidak disimpan ke riwayat sesi.</span>
        <Link href={`/play/${game.id}`} className={buttonClasses("accent", "sm")}>Mulai sesi sungguhan</Link>
      </div>
      {questions.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <p className="font-semibold">Game ini belum punya pertanyaan.</p>
          <Link href={`/dashboard/games/${game.id}`} className={buttonClasses("primary", "md", "mt-4")}>Tambah pertanyaan</Link>
        </div>
      ) : (
        <div className="h-[78dvh] min-h-[560px] overflow-hidden rounded-3xl border border-line">
          <GamePlayer mode="preview" game={toPlayGame(game, data.subjectName)} questions={questions.map(toPlayQuestion)} exitHref={`/dashboard/games/${game.id}`} />
        </div>
      )}
    </>
  );
}
