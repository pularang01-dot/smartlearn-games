import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/permissions/auth";
import { fetchReportRows, sanitizeFilters } from "@/features/reports/queries";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const filters = sanitizeFilters({ from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined, gameId: sp.get("gameId") ?? undefined });
  const { rows } = await fetchReportRows(user.id, filters);

  const csv = toCsv([
    ["id_sesi", "game", "label_sesi", "mulai", "selesai", "status", "jumlah_soal", "benar", "salah", "timeout", "skor", "akurasi_persen", "durasi_detik"],
    ...rows.map((r) => [
      r.id, r.game_title, r.session_label ?? "", r.started_at, r.completed_at ?? "", r.status,
      r.total_questions, r.correct_count, r.incorrect_count, r.timeout_count, r.total_score, r.accuracy, r.duration_seconds,
    ]),
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-smartlearn-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
