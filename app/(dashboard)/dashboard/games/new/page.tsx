import { requireUser } from "@/lib/permissions/auth";
import { listSubjects } from "@/features/games/queries";
import { NewGameForm } from "@/components/dashboard/new-game-form";
import { Breadcrumb, PageHeader } from "@/components/ui/misc";

export const metadata = { title: "Buat game baru" };

export default async function NewGamePage() {
  await requireUser("/dashboard/games/new");
  const subjects = await listSubjects();
  return (
    <>
      <Breadcrumb items={[{ label: "Game saya", href: "/dashboard/games" }, { label: "Buat game baru" }]} />
      <PageHeader title="Buat game baru" description="Isi informasi dasar. Pertanyaan ditambahkan di langkah berikutnya." />
      <NewGameForm subjects={subjects} />
    </>
  );
}
