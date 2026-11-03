import Link from "next/link";
import { BarChart3, Download, History, Target, Trophy } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { aggregate, fetchReportRows, sanitizeFilters } from "@/features/reports/queries";
import { listPublishedGameOptions } from "@/features/games/queries";
import { ReportFilters } from "@/components/reports/report-filters";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { formatDateTime, formatPercent } from "@/lib/utils/format";

export const metadata = { title: "Laporan" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; gameId?: string }> }) {
  const raw = await searchParams;
  const user = await requireUser("/dashboard/reports");
  const filters = sanitizeFilters(raw);
  const [{ rows, truncated }, games] = await Promise.all([fetchReportRows(user.id, filters), listPublishedGameOptions(user.id)]);
  const agg = aggregate(rows);
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHeader title="Laporan" description="Ringkasan hasil permainan. Rentang tanggal memakai zona waktu WIB." actions={<a href={`/api/reports/export${qs ? `?${qs}` : ""}`} className={buttonClasses("secondary", "md")}><Download className="h-4 w-4" aria-hidden />Ekspor CSV</a>} />
      <ReportFilters games={games} from={filters.from} to={filters.to} gameId={filters.gameId} />

      {rows.length === 0 ? (
        <EmptyState icon={<BarChart3 className="h-7 w-7" />} title="Belum ada data untuk filter ini" description="Ubah rentang tanggal atau pilih game lain, atau jalankan sesi permainan terlebih dahulu." action={<Link href="/dashboard/games" className={buttonClasses("primary")}>Lihat game saya</Link>} />
      ) : (
        <>
          {truncated && <p role="status" className="mb-4 rounded-xl bg-pencil-100 px-4 py-3 text-sm text-[#7A5600]">Menampilkan 2.000 sesi terbaru. Persempit rentang tanggal untuk hasil yang lengkap.</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={<History className="h-6 w-6" />} label="Total sesi" value={agg.total} />
            <StatCard icon={<Trophy className="h-6 w-6" />} label="Rata-rata skor" value={Math.round(agg.avgScore)} />
            <StatCard icon={<Target className="h-6 w-6" />} label="Rata-rata akurasi" value={formatPercent(agg.avgAccuracy)} />
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold">Per game</h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-paper text-xs text-ink-soft"><tr><th className="p-3">Game</th><th className="p-3">Sesi</th><th className="p-3">Rata-rata skor</th><th className="p-3">Rata-rata akurasi</th></tr></thead>
              <tbody>{agg.perGame.map((g) => (<tr key={g.id} className="border-t border-line"><td className="p-3 font-semibold">{g.title}</td><td className="p-3">{g.sessions}</td><td className="p-3">{Math.round(g.avgScore)}</td><td className="p-3">{formatPercent(g.avgAccuracy)}</td></tr>))}</tbody>
            </table>
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold">Aktivitas terbaru</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {rows.slice(0, 15).map((s) => (
              <li key={s.id}>
                <Link href={`/dashboard/sessions/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-paper">
                  <span><span className="font-semibold">{s.game_title}</span><span className="block text-xs text-ink-mute">{s.session_label ? `${s.session_label} · ` : ""}{formatDateTime(s.started_at)}</span></span>
                  <span className="text-sm"><strong>{s.total_score}</strong> poin · {formatPercent(Number(s.accuracy))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
