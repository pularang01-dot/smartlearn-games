import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { getGameWithQuestions, listActiveShares, listSubjects } from "@/features/games/queries";
import { GameEditor } from "@/components/game-editor/game-editor";
import { Breadcrumb } from "@/components/ui/misc";

export const metadata = { title: "Editor game" };

export default async function GameEditorPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const user = await requireUser(`/dashboard/games/${gameId}`);
  const data = await getGameWithQuestions(user.id, gameId);
  if (!data) notFound(); // bukan milik user / tidak ada: respons sama
  const [subjects, shares] = await Promise.all([listSubjects(), listActiveShares(user.id, gameId)]);
  return (
    <>
      <Breadcrumb items={[{ label: "Game saya", href: "/dashboard/games" }, { label: data.game.title }]} />
      <GameEditor game={data.game} questions={data.questions} subjects={subjects} shares={shares} userId={user.id} />
    </>
  );
}
