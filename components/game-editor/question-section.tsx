"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Library, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { reorderQuestions } from "@/features/questions/actions";
import { QuestionCard } from "./question-card";
import { BankPicker } from "./bank-picker";
import { CsvImportDialog } from "./csv-import";
import { combineStatus, type SaveStatus } from "./use-autosave";
import { emptyForm, itemFromRow, type QuestionItem } from "./question-form";
import type { QuestionRow } from "@/types/db";

export function QuestionSection({ gameId, userId, initial, timerEnabled, onPersistedCount, onSaveState }: {
  gameId: string; userId: string; initial: QuestionRow[]; timerEnabled: boolean; onPersistedCount: (n: number) => void; onSaveState: (s: SaveStatus) => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<QuestionItem[]>(() => initial.map((q) => itemFromRow(q)));
  const itemsRef = useRef(items);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({});
  const [bankOpen, setBankOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  useEffect(() => { itemsRef.current = items; }, [items]);
  const persisted = items.filter((i) => i.id).length;
  useEffect(() => onPersistedCount(persisted), [persisted, onPersistedCount]);
  useEffect(() => onSaveState(combineStatus(Object.values(statuses))), [statuses, onSaveState]);

  const persistOrder = useCallback(async (list: QuestionItem[], revertTo?: QuestionItem[]) => {
    const ids = list.filter((i) => i.id).map((i) => i.id as string);
    if (ids.length < 2) return;
    const r = await reorderQuestions(gameId, ids);
    if (!r.ok) {
      toast({ title: "Gagal menyimpan urutan", description: r.error, tone: "error" });
      if (revertTo) setItems(revertTo);
    }
  }, [gameId, toast]);

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const before = items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    void persistOrder(next, before);
  };

  const onMove = (key: string, dir: -1 | 1) => {
    const i = items.findIndex((x) => x.key === key);
    reorder(i, i + dir);
  };

  const onPersisted = useCallback((key: string, row: QuestionRow) => {
    const next = itemsRef.current.map((it) => (it.key === key ? { ...it, id: row.id, updatedAt: row.updated_at } : it));
    setItems(next);
    // Soal baru selalu masuk di akhir pada server; selaraskan bila posisi lokalnya berbeda.
    if (next.findIndex((it) => it.key === key) !== next.length - 1) void persistOrder(next);
  }, [persistOrder]);

  const onStatus = useCallback((key: string, s: SaveStatus) => setStatuses((m) => (m[key] === s ? m : { ...m, [key]: s })), []);

  const onRemoved = useCallback((key: string) => {
    setItems((l) => l.filter((i) => i.key !== key));
    setStatuses((m) => { const { [key]: _removed, ...rest } = m; void _removed; return rest; });
  }, []);

  const onDuplicated = useCallback((afterKey: string, row: QuestionRow) => {
    setItems((l) => {
      const at = l.findIndex((i) => i.key === afterKey);
      const copy = itemFromRow(row, true);
      const next = [...l];
      next.splice(at + 1, 0, copy);
      return next;
    });
  }, []);

  const addDraft = () => setItems((l) => [...l, { key: `draft-${crypto.randomUUID()}`, id: null, updatedAt: null, form: emptyForm(), startOpen: true }]);
  const addRows = (rows: QuestionRow[]) => setItems((l) => [...l, ...rows.map((r) => itemFromRow(r))]);

  return (
    <section aria-labelledby="q-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="q-heading" className="text-lg font-semibold">Pertanyaan</h2>
          <Badge tone="brand">{persisted} tersimpan</Badge>
          {items.length > persisted && <Badge tone="warning">{items.length - persisted} belum lengkap</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBankOpen(true)}><Library className="h-4 w-4" aria-hidden />Dari bank soal</Button>
          <Button variant="secondary" size="sm" onClick={() => setCsvOpen(true)}><FileUp className="h-4 w-4" aria-hidden />Impor CSV</Button>
          <Button size="sm" onClick={addDraft}><Plus className="h-4 w-4" aria-hidden />Tambah pertanyaan</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <h3 className="text-lg font-semibold">Belum ada pertanyaan</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">Tambahkan pernyataan pertama Anda, ambil dari bank soal, atau impor banyak soal sekaligus dari CSV.</p>
          <Button className="mt-5" onClick={addDraft}><Plus className="h-4 w-4" aria-hidden />Tambah pertanyaan pertama</Button>
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item.key} onDragOver={(e) => dragKey && e.preventDefault()} onDrop={() => { if (dragKey) reorder(items.findIndex((i) => i.key === dragKey), index); setDragKey(null); }} className={dragKey === item.key ? "opacity-50" : undefined}>
              <QuestionCard
                item={item} index={index} total={items.length} gameId={gameId} userId={userId} timerEnabled={timerEnabled}
                handleProps={{ draggable: true, onDragStart: () => setDragKey(item.key), onDragEnd: () => setDragKey(null) }}
                onPersisted={onPersisted} onStatus={onStatus} onMove={onMove} onRemoved={onRemoved} onDuplicated={onDuplicated}
              />
            </li>
          ))}
        </ol>
      )}

      <BankPicker open={bankOpen} onClose={() => setBankOpen(false)} gameId={gameId} onAdded={addRows} />
      <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} target="game" gameId={gameId} onImported={(rows) => addRows(rows)} />
    </section>
  );
}
