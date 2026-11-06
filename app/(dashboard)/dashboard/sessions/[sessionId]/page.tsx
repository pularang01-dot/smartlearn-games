import { notFound } from "next/navigation";
import { Check, Clock, X } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { getSessionDetail } from "@/features/sessions/queries";
import { Badge, Breadcrumb, Card, PageHeader } from "@/components/ui/misc";
import { formatDateTime, formatDuration, formatPercent } from "@/lib/utils/format";

export const metadata = { title: "Detail sesi" };

export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const user = await requireUser(`/dashboard/sessions/${sessionId}`);
  const data = await getSessionDetail(user.id, sessionId);
  if (!data) notFound();
  const { session: s, game, answers } = data;

  const battleOutcome = (s.session_config?.battle as { outcome?: "win" | "lose" | "draw" } | undefined)?.outcome;
  const stats: [string, string | number][] = [
    ["Skor", s.total_score], ["Benar", s.correct_count], ["Salah", s.incorrect_count], ["Timeout", s.timeout_count],
    ["Akurasi", formatPercent(Number(s.accuracy))], ["Durasi", formatDuration(s.duration_seconds)],
  ];
  return (
    <>
      <Breadcrumb items={[{ label: "Riwayat sesi", href: "/dashboard/sessions" }, { label: game?.title ?? "Sesi" }]} />
      <PageHeader title={game?.title ?? "(game dihapus)"} description={`${s.session_label ? `${s.session_label} · ` : ""}${formatDateTime(s.started_at)}`} actions={<>
        {s.status === "ended_early" && <Badge tone="warning">Diakhiri lebih awal</Badge>}
        {battleOutcome && <Badge tone={battleOutcome === "win" ? "success" : battleOutcome === "lose" ? "danger" : "neutral"}>Lawan Monster: {battleOutcome === "win" ? "menang" : battleOutcome === "lose" ? "kalah" : "seri"}</Badge>}
      </>} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <Card key={label} className="text-center"><p className="font-display text-2xl font-semibold">{value}</p><p className="text-xs text-ink-soft">{label}</p></Card>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Jawaban per pertanyaan</h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper text-xs text-ink-soft"><tr><th className="p-3">#</th><th className="p-3">Pertanyaan</th><th className="p-3">Kunci</th><th className="p-3">Jawaban siswa</th><th className="p-3">Hasil</th><th className="p-3">Poin</th><th className="p-3">Waktu</th></tr></thead>
          <tbody>
            {answers.map((a, i) => (
              <tr key={a.id} className="border-t border-line align-top">
                <td className="p-3 text-ink-mute">{i + 1}</td>
                <td className="max-w-md p-3">{a.question_text}</td>
                <td className="p-3">{a.correct_answer === null ? "—" : a.correct_answer ? "Benar" : "Salah"}</td>
                <td className="p-3">{a.is_timeout ? "Tidak menjawab" : a.given_answer === null ? "—" : a.given_answer ? "Benar" : "Salah"}</td>
                <td className="p-3">{a.is_timeout ? <Badge tone="warning"><Clock className="h-3 w-3" aria-hidden />Timeout</Badge> : a.is_correct ? <Badge tone="success"><Check className="h-3 w-3" aria-hidden />Benar</Badge> : <Badge tone="danger"><X className="h-3 w-3" aria-hidden />Salah</Badge>}</td>
                <td className="p-3 font-semibold">{a.points_earned}</td>
                <td className="p-3 text-ink-soft">{(a.response_time_ms / 1000).toFixed(1)} dtk</td>
              </tr>
            ))}
            {answers.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink-soft">Tidak ada detail jawaban.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}