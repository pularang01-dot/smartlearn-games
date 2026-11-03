"use client";

import { useRef, useState } from "react";
import { Download, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { importQuestions } from "@/features/questions/actions";
import { IMPORT_TEMPLATE, parseCsv } from "@/lib/csv";
import { MAX_CSV_BYTES, MAX_IMPORT_ROWS } from "@/lib/constants";
import { buildImportPreview, type ImportPreview } from "@/lib/validations/import";
import type { QuestionRow } from "@/types/db";

export function downloadTemplate() {
  const blob = new Blob([IMPORT_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-soal-smartlearn.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvImportDialog({ open, onClose, target, gameId, onImported }: {
  open: boolean; onClose: () => void; target: "game" | "bank"; gameId?: string; onImported: (questions: QuestionRow[], count: number) => void;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setFileName(null); setPreview(null); setError(null); if (input.current) input.current.value = ""; };
  const close = () => { reset(); onClose(); };

  const onFile = async (file: File | undefined) => {
    reset();
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && !["text/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type)) return setError("Hanya file .csv yang didukung. Di Excel: Simpan Sebagai > CSV.");
    if (file.size > MAX_CSV_BYTES) return setError(`Ukuran file maksimal ${MAX_CSV_BYTES / 1024} KB.`);
    if (file.size === 0) return setError("File kosong.");
    const text = await file.text();
    const table = parseCsv(text);
    if (table.length - 1 > MAX_IMPORT_ROWS) return setError(`Maksimal ${MAX_IMPORT_ROWS} baris per impor.`);
    setFileName(file.name);
    setPreview(buildImportPreview(table));
  };

  const valid = preview?.rows.filter((r) => r.errors.length === 0) ?? [];
  const invalid = preview?.rows.filter((r) => r.errors.length > 0) ?? [];

  const submit = async () => {
    if (submitting.current || valid.length === 0) return; // cegah klik ganda
    submitting.current = true;
    setLoading(true);
    const res = await importQuestions({
      target, gameId,
      rows: valid.map((r) => ({ questionText: r.questionText, correctAnswer: r.correctAnswer, explanation: r.explanation, points: r.points, timeLimitSeconds: r.timeLimitSeconds, subject: r.subject })),
    });
    setLoading(false);
    submitting.current = false;
    if (!res.ok) return setError(res.error);
    const extra = res.data.unknownSubjects.length ? ` Mata pelajaran tidak dikenali (dikosongkan): ${res.data.unknownSubjects.join(", ")}.` : "";
    toast({ title: `${res.data.imported} soal berhasil diimpor`, description: extra || undefined, tone: "success" });
    onImported(res.data.questions, res.data.imported);
    close();
  };

  return (
    <Modal open={open} onClose={close} size="xl" title="Impor soal dari CSV" description="Unggah file CSV, periksa pratinjau, lalu impor baris yang valid."
      footer={<>
        <Button variant="secondary" onClick={close}>Batal</Button>
        <Button onClick={submit} loading={loading} disabled={valid.length === 0}>Impor {valid.length > 0 ? `${valid.length} baris valid` : ""}</Button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-xl bg-paper p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Format file</p>
          <p className="mt-1">Kolom: <code>question_text, correct_answer, explanation, points, time_limit_seconds, subject</code>. Hanya dua kolom pertama wajib. Jawaban dapat ditulis <code>benar/salah</code>, <code>true/false</code>, atau <code>B/S</code>. Pemisah koma atau titik koma sama-sama didukung.</p>
          {target === "game" && <p className="mt-1">Kolom <code>subject</code> diabaikan saat impor ke game (hanya dipakai pada Bank soal).</p>}
          <Button size="sm" variant="secondary" className="mt-3" onClick={downloadTemplate}><Download className="h-4 w-4" aria-hidden />Unduh template</Button>
        </div>

        <div>
          <input ref={input} id="csv-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          <Button variant="secondary" onClick={() => input.current?.click()}><FileUp className="h-4 w-4" aria-hidden />{fileName ?? "Pilih file CSV"}</Button>
        </div>

        {error && <p role="alert" className="rounded-xl bg-wrong-light px-4 py-3 text-sm font-medium text-wrong-dark">{error}</p>}
        {preview?.fileErrors.map((e) => <p key={e} role="alert" className="rounded-xl bg-wrong-light px-4 py-3 text-sm font-medium text-wrong-dark">{e}</p>)}

        {preview && preview.rows.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2"><Badge tone="success">{valid.length} valid</Badge><Badge tone={invalid.length ? "danger" : "neutral"}>{invalid.length} bermasalah</Badge></div>
            {invalid.length > 0 && <p className="text-sm text-ink-soft">Baris bermasalah akan dilewati. Perbaiki file lalu unggah ulang, atau lanjutkan dengan baris yang valid.</p>}
            <div className="max-h-72 overflow-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-paper text-xs text-ink-soft"><tr><th className="p-2">Baris</th><th className="p-2">Pertanyaan</th><th className="p-2">Jawaban</th><th className="p-2">Poin</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line} className="border-t border-line align-top">
                      <td className="p-2 text-ink-mute">{r.line}</td>
                      <td className="max-w-[320px] p-2"><span className="line-clamp-2">{r.questionText || "—"}</span></td>
                      <td className="p-2">{r.correctAnswer === null ? "—" : r.correctAnswer ? "Benar" : "Salah"}</td>
                      <td className="p-2">{r.points}</td>
                      <td className="p-2">{r.errors.length === 0 ? <Badge tone="success">OK</Badge> : <span className="text-xs font-medium text-wrong">{r.errors.join("; ")}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
