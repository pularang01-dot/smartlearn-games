import Link from "next/link";
import { History } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { listSessions } from "@/features/sessions/queries";
import { buttonClasses } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, Pagination } from "@/components/ui/misc";
import { formatDateTime, formatDuration, formatPercent } from "@/lib/utils/format";

export const metadata = { title: "Riwayat sesi" };

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ page?: string; gameId?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/dashboard/sessions");
  const list = await listSessions(user.id, { page: Number(sp.page) || 1, gameId: sp.gameId });

  return (
    <>
      <PageHeader title="Riwayat sesi" description="Setiap kali game dimainkan dalam mode sesungguhnya, hasilnya tercatat di sini." actions={<Link href="/dashboard/reports" className={buttonClasses("secondary")}>Buka laporan</Link>} />
      {list.rows.length === 0 ? (
        <EmptyState icon={<History className="h-7 w-7" />} title="Belum ada sesi" description="Jalankan game dengan tombol Mainkan. Hasil sesi akan tersimpan otomatis." action={<Link href="/dashboard/games" className={buttonClasses("primary")}>Lihat game saya</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-paper text-xs text-ink-soft">
              <tr><th className="p-3">Game</th><th className="p-3">Label</th><th className="p-3">Waktu mulai</th><th className="p-3">Skor</th><th className="p-3">Benar/Salah/Timeout</th><th className="p-3">Akurasi</th><th className="p-3">Durasi</th><th className="p-3"><span className="sr-only">Detail</span></th></tr>
            </thead>
            <tbody>
              {list.rows.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="p-3 font-semibold">{s.game_title}{s.status === "ended_early" && <Badge tone="warning" className="ml-2">Diakhiri</Badge>}</td>
                  <td className="p-3 text-ink-soft">{s.session_label ?? "—"}</td>
                  <td className="p-3 text-ink-soft">{formatDateTime(s.started_at)}</td>
                  <td className="p-3 font-semibold">{s.total_score}</td>
                  <td className="p-3">{s.correct_count} / {s.incorrect_count} / {s.timeout_count}</td>
                  <td className="p-3">{formatPercent(Number(s.accuracy))}</td>
                  <td className="p-3">{formatDuration(s.duration_seconds)}</td>
                  <td className="p-3 text-right"><Link href={`/dashboard/sessions/${s.id}`} className="font-semibold text-brand-600 hover:underline">Detail</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={list.page} total={list.total} pageSize={list.pageSize} basePath="/dashboard/sessions" params={{ gameId: sp.gameId }} />
    </>
  );
}
