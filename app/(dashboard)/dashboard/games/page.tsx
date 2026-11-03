import Link from "next/link";
import { Gamepad2, Plus } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { listGames, listSubjects } from "@/features/games/queries";
import { GamesToolbar } from "@/components/dashboard/games-toolbar";
import { GameCard } from "@/components/dashboard/game-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState, PageHeader, Pagination } from "@/components/ui/misc";

export const metadata = { title: "Game saya" };

type SP = { q?: string; subject?: string; status?: string; sort?: string; view?: string; page?: string };

export default async function GamesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await requireUser("/dashboard/games");
  const [subjects, list] = await Promise.all([
    listSubjects(),
    listGames(user.id, { q: sp.q, subjectId: sp.subject, status: sp.status, sort: sp.sort, page: Number(sp.page) || 1 }),
  ]);
  const view = sp.view === "list" ? "list" : "grid";
  const filtering = Boolean(sp.q || sp.subject || sp.status);

  return (
    <>
      <PageHeader title="Game saya" description="Semua game pembelajaran milik Anda." actions={<Link href="/dashboard/games/new" className={buttonClasses("primary", "lg")}><Plus className="h-5 w-5" aria-hidden />Buat game baru</Link>} />
      <GamesToolbar subjects={subjects} />
      {list.rows.length === 0 ? (
        filtering ? (
          <EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Tidak ada game yang cocok" description="Ubah kata kunci atau filter Anda." action={<Link href="/dashboard/games" className={buttonClasses("secondary")}>Hapus filter</Link>} />
        ) : (
          <EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Belum ada game" description="Belum ada game. Buat game pertama Anda." action={<Link href="/dashboard/games/new" className={buttonClasses("primary")}>Buat game pertama</Link>} />
        )
      ) : (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {list.rows.map((g) => <GameCard key={g.id} game={g} view={view} />)}
        </div>
      )}
      <Pagination page={list.page} total={list.total} pageSize={list.pageSize} basePath="/dashboard/games" params={{ q: sp.q, subject: sp.subject, status: sp.status, sort: sp.sort, view: sp.view }} />
    </>
  );
}
