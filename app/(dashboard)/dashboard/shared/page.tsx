import Link from "next/link";
import { Share2 } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { listAllShares } from "@/features/sharing/queries";
import { OpenShareForm } from "@/components/dashboard/open-share-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Berbagi" };

export default async function SharedPage() {
  const user = await requireUser("/dashboard/shared");
  const shares = await listAllShares(user.id);
  const now = Date.now();
  const stateOf = (s: (typeof shares)[number]) => (s.revoked_at ? "revoked" : s.expires_at && new Date(s.expires_at).getTime() < now ? "expired" : "active");

  return (
    <>
      <PageHeader title="Berbagi" description="Buka game dari rekan guru dan kelola tautan yang Anda bagikan." />
      <Card className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Buka game yang dibagikan kepada Anda</h2>
        <OpenShareForm />
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Tautan yang saya bagikan</h2>
      {shares.length === 0 ? (
        <EmptyState icon={<Share2 className="h-7 w-7" />} title="Belum ada tautan" description="Terbitkan game, lalu buka tab Bagikan di editor untuk membuat tautan." action={<Link href="/dashboard/games" className={buttonClasses("primary")}>Lihat game saya</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-paper text-xs text-ink-soft"><tr><th className="p-3">Game</th><th className="p-3">Izin</th><th className="p-3">Dibuat</th><th className="p-3">Berlaku sampai</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {shares.map((s) => {
                const st = stateOf(s);
                return (
                  <tr key={s.id} className="border-t border-line">
                    <td className="p-3 font-semibold"><Link href={`/dashboard/games/${s.game_id}`} className="hover:underline">{s.game_title}</Link></td>
                    <td className="p-3">{s.permission === "duplicate" ? "Boleh disalin" : "Hanya main"}</td>
                    <td className="p-3 text-ink-soft">{formatDate(s.created_at)}</td>
                    <td className="p-3 text-ink-soft">{s.expires_at ? formatDate(s.expires_at) : "Tanpa batas"}</td>
                    <td className="p-3">{st === "active" ? <Badge tone="success">Aktif</Badge> : st === "expired" ? <Badge tone="warning">Kedaluwarsa</Badge> : <Badge>Dicabut</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-mute">Untuk mencabut tautan aktif, buka game terkait lalu tab Bagikan. Tautan lengkap hanya ditampilkan sekali saat dibuat.</p>
    </>
  );
}
