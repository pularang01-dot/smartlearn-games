"use client";

import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Copy, GripVertical, Library, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/modal";
import { TextArea, TextField, Switch } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { createQuestion, deleteQuestion, duplicateQuestion, saveQuestionToBank, updateQuestion } from "@/features/questions/actions";
import { ImageUpload } from "./image-upload";
import { SaveIndicator } from "./save-indicator";
import { useAutosave, type SaveStatus } from "./use-autosave";
import { validateForm, type QuestionForm, type QuestionItem } from "./question-form";
import type { QuestionRow } from "@/types/db";
import type { QuestionInput } from "@/lib/validations/game";
import { cn } from "@/lib/utils/cn";

type Props = {
  item: QuestionItem;
  index: number;
  total: number;
  gameId: string;
  userId: string;
  timerEnabled: boolean;
  handleProps: HTMLAttributes<HTMLDivElement>;
  onPersisted: (key: string, row: QuestionRow) => void;
  onStatus: (key: string, status: SaveStatus) => void;
  onMove: (key: string, dir: -1 | 1) => void;
  onRemoved: (key: string) => void;
  onDuplicated: (afterKey: string, row: QuestionRow, order: string[]) => void;
};

export function QuestionCard({ item, index, total, gameId, userId, timerEnabled, handleProps, onPersisted, onStatus, onMove, onRemoved, onDuplicated }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<QuestionForm>(item.form);
  const [open, setOpen] = useState(item.startOpen);
  const [touched, setTouched] = useState(item.id !== null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const idRef = useRef<string | null>(item.id);
  const versionRef = useRef<string | null>(item.updatedAt);

  const autosave = useAutosave<QuestionInput>(async (payload, force) => {
    if (!idRef.current) {
      const r = await createQuestion(gameId, payload);
      if (!r.ok) return r;
      idRef.current = r.data.id;
      versionRef.current = r.data.updated_at;
      onPersisted(item.key, r.data);
      return { ok: true };
    }
    const r = await updateQuestion({ id: idRef.current, expectedUpdatedAt: versionRef.current, force, data: payload });
    if (!r.ok) return r;
    versionRef.current = r.data.updatedAt;
    return { ok: true };
  });

  useEffect(() => { onStatus(item.key, autosave.status); }, [autosave.status, item.key, onStatus]);

  const validation = useMemo(() => validateForm(form), [form]);
  const errors = touched && !validation.ok ? validation.errors : {};

  const change = (patch: Partial<QuestionForm>) => {
    const next = { ...form, ...patch };
    setForm(next);
    setTouched(true);
    const v = validateForm(next);
    if (v.ok) autosave.schedule(v.data);
    else autosave.cancel();
  };

  const remove = async () => {
    autosave.cancel();
    if (!idRef.current) return onRemoved(item.key);
    setBusy(true);
    const r = await deleteQuestion(idRef.current);
    setBusy(false);
    if (r.ok) { setConfirmDelete(false); toast({ title: "Pertanyaan dihapus", tone: "success" }); onRemoved(item.key); }
    else toast({ title: "Gagal menghapus", description: r.error, tone: "error" });
  };

  const duplicate = async () => {
    if (!idRef.current) return;
    setBusy(true);
    const r = await duplicateQuestion(idRef.current);
    setBusy(false);
    if (r.ok) { toast({ title: "Pertanyaan diduplikasi", tone: "success" }); onDuplicated(item.key, r.data.question, r.data.order); }
    else toast({ title: "Gagal menduplikasi", description: r.error, tone: "error" });
  };

  const toBank = async () => {
    if (!idRef.current) return;
    setBusy(true);
    const r = await saveQuestionToBank(idRef.current);
    setBusy(false);
    toast(r.ok ? { title: "Disimpan ke bank soal", tone: "success" } : { title: "Gagal menyimpan ke bank", description: r.error, tone: "error" });
  };

  const preview = form.questionText.trim() || "Pertanyaan baru (belum diisi)";
  return (
    <div className={cn("rounded-2xl border bg-white", open ? "border-brand-200 shadow-sm" : "border-line")}>
      <div className="flex items-center gap-2 p-3">
        <div {...handleProps} role="button" tabIndex={-1} aria-label="Seret untuk mengubah urutan" title="Seret untuk mengubah urutan" className="hidden cursor-grab touch-none rounded-lg p-1.5 text-ink-mute hover:bg-paper active:cursor-grabbing sm:block"><GripVertical className="h-5 w-5" aria-hidden /></div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">{index + 1}</span>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-w-0 flex-1 rounded-lg px-1 text-left">
          <span className={cn("block truncate text-sm font-semibold", !form.questionText.trim() && "text-ink-mute")}>{preview}</span>
        </button>
        {form.correctAnswer !== null && <Badge tone={form.correctAnswer ? "success" : "danger"}>{form.correctAnswer ? "Benar" : "Salah"}</Badge>}
        <div className="hidden md:block"><SaveIndicator status={autosave.status} /></div>
        <div className="flex">
          <button type="button" aria-label="Naikkan urutan" disabled={index === 0} onClick={() => onMove(item.key, -1)} className="rounded-lg p-1.5 text-ink-mute hover:bg-paper disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" aria-label="Turunkan urutan" disabled={index === total - 1} onClick={() => onMove(item.key, 1)} className="rounded-lg p-1.5 text-ink-mute hover:bg-paper disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          <button type="button" aria-label={open ? "Ciutkan" : "Buka"} onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-ink-mute hover:bg-paper">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-line p-4">
          <TextArea label="Pernyataan / pertanyaan" value={form.questionText} maxLength={500} onChange={(e) => change({ questionText: e.target.value })} error={errors.questionText} hint={`${form.questionText.length}/500 karakter`} placeholder="Contoh: Matahari merupakan pusat tata surya." />

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Jawaban yang benar</legend>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md" role="radiogroup" aria-label="Jawaban yang benar">
              {([true, false] as const).map((v) => (
                <button key={String(v)} type="button" role="radio" aria-checked={form.correctAnswer === v} onClick={() => change({ correctAnswer: v })}
                  className={cn("touch-safe flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-base font-bold transition-colors",
                    form.correctAnswer === v ? (v ? "border-correct bg-correct text-white" : "border-wrong bg-wrong text-white") : "border-line bg-white text-ink-soft hover:bg-paper")}>
                  {v ? <Check className="h-5 w-5" strokeWidth={3} aria-hidden /> : <X className="h-5 w-5" strokeWidth={3} aria-hidden />}{v ? "BENAR" : "SALAH"}
                </button>
              ))}
            </div>
            {errors.correctAnswer && <p role="alert" className="mt-1.5 text-xs font-medium text-wrong">{errors.correctAnswer}</p>}
          </fieldset>

          <TextArea label="Penjelasan / umpan balik (opsional)" value={form.explanation} maxLength={1000} onChange={(e) => change({ explanation: e.target.value })} error={errors.explanation} hint="Ditampilkan setelah siswa menjawab." className="min-h-[72px]" />
          <ImageUpload value={form.imagePath} userId={userId} onChange={(p) => change({ imagePath: p })} label="Gambar soal (opsional)" />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Poin" type="number" inputMode="numeric" min={1} max={1000} value={form.points} onChange={(e) => change({ points: e.target.value })} error={errors.points} hint="1 sampai 1000." />
            <TextField label="Batas waktu (detik, opsional)" type="number" inputMode="numeric" min={5} max={300} value={form.timeLimit} onChange={(e) => change({ timeLimit: e.target.value })} error={errors.timeLimitSeconds} hint={timerEnabled ? "Kosong = pakai batas waktu bawaan game." : "Aktif hanya jika Timer dinyalakan di Pengaturan permainan."} />
          </div>
          <Switch checked={form.isRequired} onChange={(v) => change({ isRequired: v })} label="Soal wajib" description="Pada Tantangan Acak (batas jumlah soal), soal wajib selalu ikut; soal opsional diambil acak." />

          {touched && !validation.ok && <p role="status" className="rounded-xl bg-pencil-100 px-3 py-2 text-sm text-[#7A5600]">Belum tersimpan: lengkapi isian yang ditandai merah.</p>}
          {(autosave.status === "error" || autosave.status === "conflict") && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-wrong/30 bg-wrong-light px-3 py-2 text-sm text-wrong-dark">
              <span className="flex-1">{autosave.message}</span>
              <Button size="sm" variant="secondary" onClick={() => autosave.retry(false)}>Coba lagi</Button>
              {autosave.status === "conflict" && <Button size="sm" variant="destructive" onClick={() => autosave.retry(true)}>Timpa dengan versi saya</Button>}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            <Button size="sm" variant="secondary" onClick={duplicate} disabled={busy || !idRef.current}><Copy className="h-4 w-4" aria-hidden />Duplikat</Button>
            <Button size="sm" variant="secondary" onClick={toBank} disabled={busy || !idRef.current}><Library className="h-4 w-4" aria-hidden />Simpan ke bank soal</Button>
            <Button size="sm" variant="ghost" className="ml-auto text-wrong hover:bg-wrong-light" onClick={() => (idRef.current ? setConfirmDelete(true) : onRemoved(item.key))}><Trash2 className="h-4 w-4" aria-hidden />Hapus</Button>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={remove} loading={busy} title="Hapus pertanyaan ini?" description="Pertanyaan akan dihapus dari game. Riwayat sesi lama tetap menyimpan salinan teksnya." confirmLabel="Hapus" />
    </div>
  );
}
