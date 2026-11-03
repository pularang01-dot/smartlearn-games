"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Copy, Eye, MoreVertical, Pencil, Play, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteGame, duplicateGame, setGameStatus } from "@/features/games/actions";
import { publicImageUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { GameListItem } from "@/features/games/queries";

function Menu({ game }: { game: GameListItem }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const r = await fn();
      setOpen(false);
      if (r.ok) {
        toast({ title: success, tone: "success" });
        setConfirm(false);
        router.refresh();
      } else toast({ title: "Gagal", description: r.error, tone: "error" });
    });

  const item = "flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium hover:bg-paper";
  return (
    <div className="relative">
      <button type="button" aria-label={`Menu untuk ${game.title}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-ink-mute hover:bg-paper"><MoreVertical className="h-5 w-5" /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 z-30 mt-1 w-52 rounded-2xl border border-line bg-white p-1.5 shadow-xl">
            <Link role="menuitem" href={`/dashboard/games/${game.id}`} className={item}><Pencil className="h-4 w-4" aria-hidden />Edit</Link>
            <Link role="menuitem" href={`/dashboard/games/${game.id}/preview`} className={item}><Eye className="h-4 w-4" aria-hidden />Preview</Link>
            <button role="menuitem" type="button" disabled={pending} className={item} onClick={() => run(async () => { const r = await duplicateGame(game.id); return r.ok ? { ok: true } : { ok: false, error: r.error }; }, "Game diduplikasi")}><Copy className="h-4 w-4" aria-hidden />Duplikat</button>
            {game.status === "archived" ? (
              <button role="menuitem" type="button" disabled={pending} className={item} onClick={() => run(async () => { const r = await setGameStatus(game.id, "draft"); return r.ok ? { ok: true } : { ok: false, error: r.error }; }, "Game dipulihkan sebagai draf")}><ArchiveRestore className="h-4 w-4" aria-hidden />Pulihkan</button>
            ) : (
              <button role="menuitem" type="button" disabled={pending} className={item} onClick={() => run(async () => { const r = await setGameStatus(game.id, "archived"); return r.ok ? { ok: true } : { ok: false, error: r.error }; }, "Game diarsipkan")}><Archive className="h-4 w-4" aria-hidden />Arsipkan</button>
            )}
            <button role="menuitem" type="button" className={cn(item, "text-wrong hover:bg-wrong-light")} onClick={() => { setOpen(false); setConfirm(true); }}><Trash2 className="h-4 w-4" aria-hidden />Hapus</button>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        loading={pending}
        title={`Hapus “${game.title}”?`}
        description="Game beserta seluruh pertanyaan dan riwayat sesinya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan. Pertimbangkan Arsipkan bila Anda ingin menyimpannya."
        confirmLabel="Hapus permanen"
        onConfirm={() => run(async () => deleteGame(game.id).then((r) => (r.ok ? { ok: true } : { ok: false, error: r.error })), "Game dihapus")}
      />
    </div>
  );
}

function Cover({ game, className }: { game: GameListItem; className?: string }) {
  const url = publicImageUrl(game.cover_image_path);
  return url ? (
    <img src={url} alt="" loading="lazy" className={cn("object-cover", className)} />
  ) : (
    <div aria-hidden className={cn("flex items-center justify-center bg-gradient-to-br from-brand-100 to-pencil-100 font-display text-3xl font-semibold text-brand-700", className)}>{game.title.slice(0, 1).toUpperCase()}</div>
  );
}

export function GameCard({ game, view }: { game: GameListItem; view: "grid" | "list" }) {
  const meta = [game.subject_name, game.grade_level].filter(Boolean).join(" · ");
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
        <Cover game={game} className="h-16 w-16 shrink-0 rounded-xl" />
        <Link href={`/dashboard/games/${game.id}`} className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{game.title}</span>
          <span className="block truncate text-xs text-ink-mute">{meta || "Tanpa mata pelajaran"} · {game.question_count} soal · diubah {formatDate(game.updated_at)}</span>
        </Link>
        <StatusBadge status={game.status} />
        {game.question_count > 0 && <Link href={`/play/${game.id}`} aria-label={`Mainkan ${game.title}`} className="rounded-lg p-2 text-correct hover:bg-correct-light"><Play className="h-5 w-5" /></Link>}
        <Menu game={game} />
      </div>
    );
  }
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <Link href={`/dashboard/games/${game.id}`} tabIndex={-1} aria-hidden><Cover game={game} className="h-36 w-full" /></Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/games/${game.id}`} className="min-w-0 font-display text-lg font-semibold leading-snug hover:text-brand-600"><span className="line-clamp-2">{game.title}</span></Link>
          <Menu game={game} />
        </div>
        <p className="truncate text-sm text-ink-soft">{meta || "Tanpa mata pelajaran"}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-mute">
          <span>{game.question_count} soal · {formatDate(game.updated_at)}</span>
          <StatusBadge status={game.status} />
        </div>
        {game.question_count > 0 && <Link href={`/play/${game.id}`} className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-correct text-sm font-semibold text-white hover:bg-correct-hover"><Play className="h-4 w-4" aria-hidden />Mainkan</Link>}
      </div>
    </div>
  );
}
