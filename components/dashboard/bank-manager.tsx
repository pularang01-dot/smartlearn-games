"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FileUp, Pencil, Plus, Search, SquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextField } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CsvImportDialog } from "@/components/game-editor/csv-import";
import { addFromBank, deleteBankQuestion, saveBankQuestion } from "@/features/questions/actions";
import type { BankQuestionRow, SubjectRow } from "@/types/db";

type Draft = { id: string | null; questionText: string; correctAnswer: boolean | null; explanation: string; points: string; timeLimit: string; subjectId: string };
const blank: Draft = { id: null, questionText: "", correctAnswer: null, explanation: "", points: "10", timeLimit: "", subjectId: "" };

export function BankManager({ rows, subjects, games }: { rows: BankQuestionRow[]; subjects: SubjectRow[]; games: { id: string; title: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();
  const [, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [csv, setCsv] = useState(false);
  const [del, setDel] = useState<BankQuestionRow | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [addTo, setAddTo] = useState<BankQuestionRow | null>(null);
  const [gameId, setGameId] = useState("");
  const [adding, setAdding] = useState(false);
  const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  };
  useEffect(() => {
    const t = setTimeout(() => { if ((sp.get("q") ?? "") !== q.trim()) update({ q: q.trim() || null }); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const save = async () => {
    if (!draft) return;
    const errs: Record<string, string> = {};
    if (!draft.questionText.trim()) errs.questionText = "Pertanyaan tidak boleh kosong";
    if (draft.correctAnswer === null) errs.correctAnswer = "Pilih jawaban Benar atau Salah";
    const points = Number(draft.points);
    if (!Number.isInteger(points) || points < 1 || points > 1000) errs.points = "Poin 1 sampai 1000";
    const tl = draft.timeLimit.trim() === "" ? null : Number(draft.timeLimit);
    if (tl !== null && (!Number.isInteger(tl) || tl < 5 || tl > 300)) errs.timeLimit = "Batas waktu 5 sampai 300 detik";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const r = await saveBankQuestion(draft.id, { questionText: draft.questionText, correctAnswer: draft.correctAnswer as boolean, explanation: draft.explanation, points, timeLimitSeconds: tl, subjectId: draft.subjectId || null });
    setSaving(false);
    if (!r.ok) return toast({ title: "Gagal menyimpan", description: r.error, tone: "error" });
    toast({ title: draft.id ? "Soal diperbarui" : "Soal ditambahkan ke bank", tone: "success" });
    setDraft(null);
    router.refresh();
  };

  const remove = async () => {
    if (!del) return;
    setDelBusy(true);
    const r = await deleteBankQuestion(del.id);
    setDelBusy(false);
    if (!r.ok) return toast({ title: "Gagal menghapus", description: r.error, tone: "error" });
    toast({ title: "Soal dihapus", tone: "success" });
    setDel(null);
    router.refresh();
  };

  const addToGame = async () => {
    if (!addTo || !gameId) return;
    setAdding(true);
    const r = await addFromBank(gameId, [addTo.id]);
    setAdding(false);
    if (!r.ok) return toast({ title: "Gagal menambahkan", description: r.error, tone: "error" });
    toast({ title: "Soal disalin ke game", tone: "success" });
    setAddTo(null);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari soal…" aria-label="Cari soal" className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
        </div>
        <SelectField aria-label="Filter mata pelajaran" className="w-auto min-w-[160px]" value={sp.get("subject") ?? ""} onChange={(e) => update({ subject: e.target.value || null })}>
          <option value="">Semua mapel</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </SelectField>
        <Button variant="secondary" onClick={() => setCsv(true)}><FileUp className="h-4 w-4" aria-hidden />Impor CSV</Button>
        <Button onClick={() => { setErrors({}); setDraft({ ...blank }); }}><Plus className="h-4 w-4" aria-hidden />Tambah soal</Button>
      </div>

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{r.question_text}</p>
              {r.explanation && <p className="mt-1 text-sm text-ink-soft">{r.explanation}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={r.correct_answer ? "success" : "danger"}>{r.correct_answer ? "Benar" : "Salah"}</Badge>
                {subjectName(r.subject_id) && <Badge tone="brand">{subjectName(r.subject_id)}</Badge>}
                <Badge>{r.points} poin</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" disabled={games.length === 0} onClick={() => { setAddTo(r); setGameId(games[0]?.id ?? ""); }}><SquarePlus className="h-4 w-4" aria-hidden />Ke game</Button>
              <Button size="sm" variant="ghost" aria-label="Edit soal" onClick={() => { setErrors({}); setDraft({ id: r.id, questionText: r.question_text, correctAnswer: r.correct_answer, explanation: r.explanation ?? "", points: String(r.points), timeLimit: r.time_limit_seconds ? String(r.time_limit_seconds) : "", subjectId: r.subject_id ?? "" }); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" aria-label="Hapus soal" className="text-wrong hover:bg-wrong-light" onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit soal" : "Tambah soal ke bank"} size="lg" footer={<><Button variant="secondary" onClick={() => setDraft(null)}>Batal</Button><Button onClick={save} loading={saving}>Simpan</Button></>}>
        {draft && (
          <div className="space-y-4">
            <TextArea label="Pernyataan / pertanyaan" value={draft.questionText} maxLength={500} onChange={(e) => setDraft({ ...draft, questionText: e.target.value })} error={errors.questionText} />
            <div>
              <p className="mb-1.5 text-sm font-semibold">Jawaban yang benar</p>
              <div className="grid max-w-md grid-cols-2 gap-3" role="radiogroup" aria-label="Jawaban yang benar">
                {([true, false] as const).map((v) => (
                  <button key={String(v)} type="button" role="radio" aria-checked={draft.correctAnswer === v} onClick={() => setDraft({ ...draft, correctAnswer: v })} className={`touch-safe h-12 rounded-xl border-2 font-bold ${draft.correctAnswer === v ? (v ? "border-correct bg-correct text-white" : "border-wrong bg-wrong text-white") : "border-line text-ink-soft hover:bg-paper"}`}>{v ? "BENAR" : "SALAH"}</button>
                ))}
              </div>
              {errors.correctAnswer && <p role="alert" className="mt-1 text-xs font-medium text-wrong">{errors.correctAnswer}</p>}
            </div>
            <TextArea label="Penjelasan (opsional)" value={draft.explanation} maxLength={1000} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} className="min-h-[72px]" />
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Mata pelajaran" value={draft.subjectId} onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })}>
                <option value="">Belum dipilih</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectField>
              <TextField label="Poin" type="number" min={1} max={1000} value={draft.points} onChange={(e) => setDraft({ ...draft, points: e.target.value })} error={errors.points} />
              <TextField label="Batas waktu (dtk)" type="number" min={5} max={300} value={draft.timeLimit} onChange={(e) => setDraft({ ...draft, timeLimit: e.target.value })} error={errors.timeLimit} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={delBusy} title="Hapus soal dari bank?" description="Soal yang sudah disalin ke game tidak ikut terhapus." confirmLabel="Hapus" />

      <Modal open={!!addTo} onClose={() => setAddTo(null)} title="Tambahkan ke game" description="Soal akan disalin ke game yang Anda pilih." size="sm" footer={<><Button variant="secondary" onClick={() => setAddTo(null)}>Batal</Button><Button onClick={addToGame} loading={adding} disabled={!gameId}>Tambahkan</Button></>}>
        <SelectField label="Game tujuan" value={gameId} onChange={(e) => setGameId(e.target.value)}>
          {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </SelectField>
      </Modal>

      <CsvImportDialog open={csv} onClose={() => setCsv(false)} target="bank" onImported={() => router.refresh()} />
    </>
  );
}
