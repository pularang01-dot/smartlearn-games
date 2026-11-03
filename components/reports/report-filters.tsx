"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/form";

export function ReportFilters({ games, from, to, gameId }: { games: { id: string; title: string }[]; from?: string; to?: string; gameId?: string }) {
  const router = useRouter();
  return (
    <form
      className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const sp = new URLSearchParams();
        for (const k of ["from", "to", "gameId"]) { const v = String(fd.get(k) ?? ""); if (v) sp.set(k, v); }
        router.push(`/dashboard/reports?${sp.toString()}`);
      }}
    >
      <TextField label="Dari tanggal" name="from" type="date" defaultValue={from} wrapperClassName="min-w-[150px]" />
      <TextField label="Sampai tanggal" name="to" type="date" defaultValue={to} wrapperClassName="min-w-[150px]" />
      <SelectField label="Game" name="gameId" defaultValue={gameId ?? ""} wrapperClassName="min-w-[220px] flex-1">
        <option value="">Semua game</option>
        {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
      </SelectField>
      <Button type="submit" size="md">Terapkan</Button>
      <Button type="button" variant="ghost" onClick={() => router.push("/dashboard/reports")}>Reset</Button>
    </form>
  );
}
