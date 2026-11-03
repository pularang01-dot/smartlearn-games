import Link from "next/link";
import { BookOpen, Gamepad2, HelpCircle, History, Plus, Play, Trophy } from "lucide-react";
import { requireUser, getProfile } from "@/lib/permissions/auth";
import { getDashboardData } from "@/features/games/queries";
import { buttonClasses } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui/misc";
import { BADGES } from "@/lib/constants";
import { formatDateTime, formatPercent, greeting } from "@/lib/utils/format";

export const metadata = { title: "Ringkasan" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const profile = await getProfile();
  const d = await getDashboardData(user.id);
  const name = profile?.display_name?.split(" ")[0] || "Bapak/Ibu Guru";

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        description="Ringkasan ruang kerja Anda."
        actions={
          <>
            <Link href="/dashboard/games?status=published" className={buttonClasses("secondary", "lg")}><Play className="h-5 w-5" aria-hidden />Mulai game</Link>
            <Link href="/dashboard/games/new" className={buttonClasses("primary", "lg")}><Plus className="h-5 w-5" aria-hidden />Buat game baru</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Gamepad2 className="h-6 w-6" />} label="Total game" value={d.gameCount} />
        <StatCard icon={<BookOpen className="h-6 w-6" />} label="Total pertanyaan" value={d.questionCount} />
        <StatCard icon={<History className="h-6 w-6" />} label="Sesi dimainkan" value={d.sessionCount} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Terakhir diedit</h2>
            <Link href="/dashboard/games" className="text-sm font-semibold text-brand-600 hover:underline">Lihat semua</Link>
          </div>
          {d.recentGames.length === 0 ? (
            <EmptyState title="Belum ada game" description="Buat game pertama Anda, atau coba game contoh untuk melihat hasil jadinya." action={<Link href="/dashboard/games/new" className={buttonClasses("primary")}>Buat game pertama</Link>} />
          ) : (
            <ul className="divide-y divide-line">
              {d.recentGames.map((g) => (
                <li key={g.id}>
                  <Link href={`/dashboard/games/${g.id}`} className="flex items-center justify-between gap-3 rounded-lg py-3 hover:bg-paper">
                    <span className="min-w-0"><span className="block truncate font-semibold">{g.title}</span><span className="text-xs text-ink-mute">Diubah {formatDateTime(g.updated_at)}</span></span>
                    <StatusBadge status={g.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aktivitas terbaru</h2>
            <Link href="/dashboard/sessions" className="text-sm font-semibold text-brand-600 hover:underline">Riwayat sesi</Link>
          </div>
          {d.recentSessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">Belum ada sesi. Jalankan game di kelas dan hasilnya akan muncul di sini.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.recentSessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/dashboard/sessions/${s.id}`} className="flex items-center justify-between gap-3 rounded-lg py-3 hover:bg-paper">
                    <span className="min-w-0"><span className="block truncate font-semibold">{s.game_title}</span><span className="text-xs text-ink-mute">{s.session_label ? `${s.session_label} · ` : ""}{formatDateTime(s.started_at)}</span></span>
                    <span className="shrink-0 text-right text-sm"><span className="block font-semibold">{s.total_score} poin</span><span className="text-xs text-ink-mute">{formatPercent(Number(s.accuracy))}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Trophy className="h-5 w-5 text-pencil-500" aria-hidden />Pencapaian</h2>
          {d.achievements.length === 0 ? <p className="text-sm text-ink-soft">Selesaikan sesi permainan untuk mendapatkan lencana.</p> : (
            <div className="flex flex-wrap gap-2">{d.achievements.map((k) => <Badge key={k} tone="warning" className="px-3 py-1 text-sm">{BADGES[k]?.label ?? k}</Badge>)}</div>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Pintasan</h2>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard/questions" className={buttonClasses("secondary")}><BookOpen className="h-4 w-4" aria-hidden />Bank soal</Link>
            <Link href="/dashboard/help" className={buttonClasses("secondary")}><HelpCircle className="h-4 w-4" aria-hidden />Panduan penggunaan</Link>
          </div>
        </Card>
      </div>
    </>
  );
}
