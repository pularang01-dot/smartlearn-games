"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import { SelectField } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import type { SubjectRow } from "@/types/db";

export function GamesToolbar({ subjects }: { subjects: SubjectRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const view = sp.get("view") === "list" ? "list" : "grid";

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q.trim()) update({ q: q.trim() || null });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul game…" aria-label="Cari judul game" className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
      </div>
      <SelectField aria-label="Filter mata pelajaran" className="w-auto min-w-[150px]" value={sp.get("subject") ?? ""} onChange={(e) => update({ subject: e.target.value || null })}>
        <option value="">Semua mapel</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </SelectField>
      <SelectField aria-label="Filter status" className="w-auto min-w-[130px]" value={sp.get("status") ?? ""} onChange={(e) => update({ status: e.target.value || null })}>
        <option value="">Aktif (tanpa arsip)</option>
        <option value="draft">Draf</option>
        <option value="published">Terbit</option>
        <option value="archived">Arsip</option>
        <option value="all">Semua</option>
      </SelectField>
      <SelectField aria-label="Urutkan" className="w-auto min-w-[150px]" value={sp.get("sort") ?? "recent"} onChange={(e) => update({ sort: e.target.value === "recent" ? null : e.target.value })}>
        <option value="recent">Terbaru diubah</option>
        <option value="alpha">Alfabetis (A-Z)</option>
        <option value="played">Terakhir dimainkan</option>
      </SelectField>
      <div role="group" aria-label="Tampilan" className="flex overflow-hidden rounded-xl border border-line bg-white">
        {([["grid", LayoutGrid, "Tampilan grid"], ["list", List, "Tampilan daftar"]] as const).map(([v, Icon, label]) => (
          <button key={v} type="button" aria-label={label} aria-pressed={view === v} onClick={() => update({ view: v === "grid" ? null : v })} className={cn("flex h-11 w-11 items-center justify-center", view === v ? "bg-brand-50 text-brand-700" : "text-ink-mute hover:bg-paper")}>
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
