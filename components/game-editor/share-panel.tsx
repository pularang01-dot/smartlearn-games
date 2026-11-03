"use client";

import { useState } from "react";
import { Copy, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createShare, revokeShare } from "@/features/sharing/actions";
import { formatDate } from "@/lib/utils/format";
import type { GameStatus, ShareRow } from "@/types/db";

export function SharePanel({ gameId, status, initial }: { gameId: string; status: GameStatus; initial: ShareRow[] }) {
  const toast = useToast();
  const [shares, setShares] = useState(initial);
  const [permission, setPermission] = useState<"read_only" | "duplicate">("read_only");
  const [days, setDays] = useState("30");
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ShareRow | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setCreating(true);
    const r = await createShare({ gameId, permission, expiresInDays: days === "0" ? null : Number(days) });
    setCreating(false);
    if (!r.ok) return toast({ title: "Gagal membuat tautan", description: r.error, tone: "error" });
    setNewUrl(r.data.url);
    setShares((s) => [{ id: r.data.id, game_id: gameId, permission, expires_at: r.data.expiresAt, revoked_at: null, created_at: new Date().toISOString() }, ...s]);
  };

  const copy = async () => {
    if (!newUrl) return;
    try { await navigator.clipboard.writeText(newUrl); toast({ title: "Tautan disalin", tone: "success" }); }
    catch { toast({ title: "Tidak bisa menyalin otomatis", description: "Pilih teks tautan lalu salin manual.", tone: "error" }); }
  };

  const revoke = async () => {
    if (!revoking) return;
    setBusy(true);
    const r = await revokeShare(revoking.id);
    setBusy(false);
    if (r.ok) { setShares((s) => s.filter((x) => x.id !== revoking.id)); setRevoking(null); toast({ title: "Tautan dicabut", tone: "success" }); }
    else toast({ title: "Gagal mencabut", description: r.error, tone: "error" });
  };

  if (status !== "published") {
    return <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-soft">Terbitkan game terlebih dahulu (tombol <strong>Terbitkan</strong> di atas) untuk membuat tautan berbagi.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold">Buat tautan berbagi</h2>
        <p className="mt-1 text-sm text-ink-soft">Penerima tidak melihat email atau data sesi Anda dan tidak bisa mengedit game. Hasil permainan lewat tautan tidak disimpan.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField label="Izin akses" value={permission} onChange={(e) => setPermission(e.target.value as "read_only" | "duplicate")}>
            <option value="read_only">Hanya memainkan (read-only)</option>
            <option value="duplicate">Memainkan dan menyalin ke workspace penerima</option>
          </SelectField>
          <SelectField label="Masa berlaku" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">7 hari</option><option value="30">30 hari</option><option value="90">90 hari</option><option value="0">Tanpa batas waktu</option>
          </SelectField>
        </div>
        <Button className="mt-4" onClick={create} loading={creating}><Link2 className="h-4 w-4" aria-hidden />Buat tautan</Button>

        {newUrl && (
          <div className="mt-5 rounded-xl border border-correct/30 bg-correct-light p-4">
            <p className="text-sm font-semibold text-correct-dark">Tautan siap dibagikan. Salin sekarang: tautan lengkap hanya ditampilkan sekali.</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={newUrl} aria-label="Tautan berbagi" onFocus={(e) => e.currentTarget.select()} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-sm" />
              <Button variant="secondary" onClick={copy}><Copy className="h-4 w-4" aria-hidden />Salin</Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-semibold">Tautan aktif</h2>
        {shares.length === 0 ? <p className="mt-2 text-sm text-ink-soft">Belum ada tautan aktif.</p> : (
          <ul className="mt-3 divide-y divide-line">
            {shares.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="text-sm">
                  <Badge tone={s.permission === "duplicate" ? "brand" : "neutral"}>{s.permission === "duplicate" ? "Boleh disalin" : "Hanya main"}</Badge>
                  <span className="ml-2 text-ink-soft">Dibuat {formatDate(s.created_at)} · {s.expires_at ? `berlaku sampai ${formatDate(s.expires_at)}` : "tanpa batas waktu"}</span>
                </div>
                <Button size="sm" variant="ghost" className="text-wrong hover:bg-wrong-light" onClick={() => setRevoking(s)}><Trash2 className="h-4 w-4" aria-hidden />Cabut</Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog open={!!revoking} onClose={() => setRevoking(null)} onConfirm={revoke} loading={busy} title="Cabut tautan ini?" description="Siapa pun yang memiliki tautan ini tidak akan bisa membukanya lagi. Anda bisa membuat tautan baru kapan saja." confirmLabel="Cabut tautan" />
    </div>
  );
}
