"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { addFromBank, searchBank } from "@/features/questions/actions";
import type { QuestionRow } from "@/types/db";

type Item = { id: string; question_text: string; correct_answer: boolean };

export function BankPicker({ open, onClose, gameId, onAdded }: { open: boolean; onClose: () => void; gameId: string; onAdded: (rows: QuestionRow[]) => void }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const rows = await searchBank(q);
      if (!cancelled) { setItems(rows); setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const add = async () => {
    setAdding(true);
    const r = await addFromBank(gameId, selected);
    setAdding(false);
    if (!r.ok) return toast({ title: "Gagal menambahkan", description: r.error, tone: "error" });
    toast({ title: `${r.data.length} soal ditambahkan`, description: "Soal disalin ke game; mengubahnya tidak memengaruhi bank soal.", tone: "success" });
    onAdded(r.data);
    setSelected([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Ambil dari bank soal" description="Pilih soal untuk disalin ke game ini."
      footer={<><Button variant="secondary" onClick={onClose}>Batal</Button><Button onClick={add} loading={adding} disabled={selected.length === 0}>Tambahkan {selected.length || ""} soal</Button></>}>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari soal…" aria-label="Cari soal di bank" className="mb-3 h-11 w-full rounded-xl border border-line px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
      {loading ? <p className="py-8 text-center text-sm text-ink-mute">Memuat…</p> : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">{q ? "Tidak ada soal yang cocok." : "Bank soal masih kosong. Simpan soal dari editor atau impor dari CSV di menu Bank soal."}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((it) => (
            <li key={it.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-3 hover:bg-paper">
                <input type="checkbox" checked={selected.includes(it.id)} onChange={() => toggle(it.id)} className="mt-1 h-4 w-4 accent-brand-600" />
                <span className="min-w-0 flex-1 text-sm">{it.question_text}</span>
                <Badge tone={it.correct_answer ? "success" : "danger"}>{it.correct_answer ? "Benar" : "Salah"}</Badge>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
