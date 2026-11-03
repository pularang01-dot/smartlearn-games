"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Play, Plus, Rocket, Undo2 } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { SelectField, Switch, TextArea, TextField } from "@/components/ui/form";
import { StatusBadge, Tooltip } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { createSubject } from "@/features/games/actions";
import { setGameStatus, updateGame } from "@/features/games/actions";
import { GRADE_SUGGESTIONS } from "@/lib/constants";
import { parseSettings, type GameSettings } from "@/lib/validations/game";
import { cn } from "@/lib/utils/cn";
import { ImageUpload } from "./image-upload";
import { QuestionSection } from "./question-section";
import { SaveIndicator } from "./save-indicator";
import { SharePanel } from "./share-panel";
import { combineStatus, useAutosave, type SaveStatus } from "./use-autosave";
import type { GameRow, GameStatus, QuestionRow, ShareRow, SubjectRow } from "@/types/db";

type Tab = "questions" | "info" | "settings" | "share";
const TABS: { id: Tab; label: string }[] = [
  { id: "questions", label: "Pertanyaan" },
  { id: "info", label: "Informasi game" },
  { id: "settings", label: "Pengaturan permainan" },
  { id: "share", label: "Bagikan" },
];

type InfoForm = {
  title: string; description: string; subjectId: string; gradeLevel: string; topic: string; tagsText: string; coverImagePath: string | null; settings: GameSettings;
};

function toPayload(f: InfoForm) {
  return {
    title: f.title, description: f.description, subjectId: f.subjectId || null, gradeLevel: f.gradeLevel, topic: f.topic,
    tags: f.tagsText.split(",").map((t) => t.trim()).filter(Boolean), coverImagePath: f.coverImagePath, settings: f.settings,
  };
}

function NumberField({ label, value, min, max, onChange, hint }: { label: string; value: number | null; min: number; max: number; onChange: (n: number | null) => void; hint?: string }) {
  return (
    <TextField label={label} type="number" inputMode="numeric" min={min} max={max} hint={hint} value={value ?? ""}
      onChange={(e) => { const v = e.target.value; if (v === "") return onChange(null); const n = Math.round(Number(v)); if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n))); }} />
  );
}

export function GameEditor({ game, questions, subjects: initialSubjects, shares, userId }: { game: GameRow; questions: QuestionRow[]; subjects: SubjectRow[]; shares: ShareRow[]; userId: string }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("questions");
  const [subjects, setSubjects] = useState(initialSubjects);
  const [status, setStatus] = useState<GameStatus>(game.status);
  const [form, setForm] = useState<InfoForm>({
    title: game.title, description: game.description ?? "", subjectId: game.subject_id ?? "", gradeLevel: game.grade_level ?? "",
    topic: game.topic ?? "", tagsText: game.tags.join(", "), coverImagePath: game.cover_image_path, settings: parseSettings(game.settings),
  });
  const [titleError, setTitleError] = useState<string | null>(null);
  const [persistedCount, setPersistedCount] = useState(questions.length);
  const [questionSave, setQuestionSave] = useState<SaveStatus>("idle");
  const [newSubject, setNewSubject] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const versionRef = useRef(game.updated_at);

  const info = useAutosave<ReturnType<typeof toPayload>>(async (payload, force) => {
    const r = await updateGame({ gameId: game.id, expectedUpdatedAt: versionRef.current, force, data: payload });
    if (!r.ok) return r;
    versionRef.current = r.data.updatedAt;
    return { ok: true };
  });

  const overall = combineStatus([info.status, questionSave]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (overall === "pending" || overall === "saving" || overall === "error" || overall === "conflict") { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [overall]);

  const update = (patch: Partial<InfoForm>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (!next.title.trim()) { setTitleError("Judul game wajib diisi"); info.cancel(); return; }
    setTitleError(null);
    info.schedule(toPayload(next));
  };
  const updateSettings = (patch: Partial<GameSettings>) => update({ settings: { ...form.settings, ...patch } });

  const onPersistedCount = useCallback((n: number) => setPersistedCount(n), []);
  const onSaveState = useCallback((s: SaveStatus) => setQuestionSave(s), []);

  const togglePublish = async () => {
    setPublishing(true);
    const next: GameStatus = status === "published" ? "draft" : "published";
    const r = await setGameStatus(game.id, next);
    setPublishing(false);
    if (!r.ok) return toast({ title: "Tidak bisa mengubah status", description: r.error, tone: "error" });
    versionRef.current = r.data.updatedAt;
    setStatus(r.data.status);
    toast({ title: next === "published" ? "Game diterbitkan" : "Game dikembalikan ke draf", tone: "success" });
  };

  const addSubject = async () => {
    if (!newSubject?.trim()) return;
    const r = await createSubject(newSubject);
    if (!r.ok) return toast({ title: "Gagal menambah mata pelajaran", description: r.error, tone: "error" });
    setSubjects((s) => [...s, r.data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewSubject(null);
    update({ subjectId: r.data.id });
  };

  const s = form.settings;
  const canPlay = persistedCount > 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="max-w-full truncate text-2xl font-semibold sm:text-3xl">{form.title || "Tanpa judul"}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="mt-2"><SaveIndicator status={overall} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPlay ? (
            <>
              <Link href={`/dashboard/games/${game.id}/preview`} className={buttonClasses("secondary", "md")}><Eye className="h-4 w-4" aria-hidden />Preview</Link>
              <Link href={`/play/${game.id}`} className={buttonClasses("accent", "md")}><Play className="h-4 w-4" aria-hidden />Mainkan</Link>
            </>
          ) : (
            <Tooltip label="Tambahkan minimal 1 pertanyaan yang valid"><span className="flex gap-2"><span aria-disabled className={buttonClasses("secondary", "md")}><Eye className="h-4 w-4" aria-hidden />Preview</span><span aria-disabled className={buttonClasses("accent", "md")}><Play className="h-4 w-4" aria-hidden />Mainkan</span></span></Tooltip>
          )}
          <Button variant={status === "published" ? "secondary" : "primary"} onClick={togglePublish} loading={publishing} disabled={status !== "published" && !canPlay}>
            {status === "published" ? <><Undo2 className="h-4 w-4" aria-hidden />Jadikan draf</> : <><Rocket className="h-4 w-4" aria-hidden />Terbitkan</>}
          </Button>
        </div>
      </div>

      {(info.status === "error" || info.status === "conflict") && (
        <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-wrong/30 bg-wrong-light px-4 py-3 text-sm text-wrong-dark">
          <span className="min-w-0 flex-1">{info.message} Data Anda masih ada di layar dan belum hilang.</span>
          <Button size="sm" variant="secondary" onClick={() => info.retry(false)}>Coba lagi</Button>
          {info.status === "conflict" && (<>
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Muat ulang versi terbaru</Button>
            <Button size="sm" variant="destructive" onClick={() => info.retry(true)}>Timpa dengan versi saya</Button>
          </>)}
        </div>
      )}

      <div role="tablist" aria-label="Bagian editor" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} type="button" onClick={() => setTab(t.id)}
            className={cn("h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition-colors", tab === t.id ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-paper")}>{t.label}</button>
        ))}
      </div>

      <div role="tabpanel" id="panel-questions" aria-labelledby="tab-questions" hidden={tab !== "questions"}>
        <QuestionSection gameId={game.id} userId={userId} initial={questions} timerEnabled={s.timerEnabled} onPersistedCount={onPersistedCount} onSaveState={onSaveState} />
      </div>

      <div role="tabpanel" id="panel-info" aria-labelledby="tab-info" hidden={tab !== "info"}>
        <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
          <TextField label="Judul game" required maxLength={120} value={form.title} onChange={(e) => update({ title: e.target.value })} error={titleError ?? undefined} />
          <TextArea label="Deskripsi" maxLength={1000} value={form.description} onChange={(e) => update({ description: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <SelectField label="Mata pelajaran" value={form.subjectId} onChange={(e) => update({ subjectId: e.target.value })}>
                <option value="">Belum dipilih</option>
                {subjects.map((x) => <option key={x.id} value={x.id}>{x.name}{x.owner_id ? " (milik saya)" : ""}</option>)}
              </SelectField>
              {newSubject === null ? (
                <button type="button" onClick={() => setNewSubject("")} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><Plus className="h-4 w-4" aria-hidden />Tambah mata pelajaran baru</button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input aria-label="Nama mata pelajaran baru" value={newSubject} maxLength={60} onChange={(e) => setNewSubject(e.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-line px-3 text-sm" autoFocus />
                  <Button size="sm" onClick={addSubject}>Simpan</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNewSubject(null)}>Batal</Button>
                </div>
              )}
            </div>
            <div>
              <TextField label="Kelas/jenjang" list="grade-list" maxLength={40} value={form.gradeLevel} onChange={(e) => update({ gradeLevel: e.target.value })} />
              <datalist id="grade-list">{GRADE_SUGGESTIONS.map((g) => <option key={g} value={g} />)}</datalist>
            </div>
          </div>
          <TextField label="Topik" maxLength={120} value={form.topic} onChange={(e) => update({ topic: e.target.value })} />
          <TextField label="Tag" value={form.tagsText} onChange={(e) => update({ tagsText: e.target.value })} hint="Pisahkan dengan koma, maksimal 10 tag. Contoh: tata surya, astronomi" />
          <ImageUpload value={form.coverImagePath} userId={userId} onChange={(p) => update({ coverImagePath: p })} label="Gambar sampul (opsional)" />
        </div>
      </div>

      <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" hidden={tab !== "settings"}>
        <div className="space-y-2 rounded-2xl border border-line bg-white p-6">
          <p className="pb-2 text-sm text-ink-soft">Pengaturan ini berlaku saat game dimainkan di Smartboard.</p>
          <Switch checked={s.timerEnabled} onChange={(v) => updateSettings({ timerEnabled: v })} label="Aktifkan timer per soal" description="Hitung mundur untuk setiap pertanyaan. Waktu habis dicatat sebagai timeout." />
          {s.timerEnabled && (
            <div className="grid gap-4 rounded-xl bg-paper p-4 sm:grid-cols-2">
              <NumberField label="Batas waktu bawaan (detik)" min={5} max={300} value={s.defaultTimeLimit} onChange={(n) => n !== null && updateSettings({ defaultTimeLimit: n })} hint="Dipakai bila soal tidak punya batas waktu sendiri." />
              <div className="sm:pt-1">
                <Switch checked={s.timeoutCountsAsWrong} onChange={(v) => updateSettings({ timeoutCountsAsWrong: v })} label="Timeout dianggap salah" description="Jika mati, soal timeout tidak ikut dihitung pada akurasi." />
                <Switch checked={s.timeBonusEnabled} onChange={(v) => updateSettings({ timeBonusEnabled: v })} label="Bonus kecepatan" description="Hingga +50% poin untuk jawaban benar yang cepat." />
              </div>
            </div>
          )}
          <hr className="border-line" />
          <Switch checked={s.comboBonusEnabled} onChange={(v) => updateSettings({ comboBonusEnabled: v })} label="Bonus combo" description="+10% poin untuk tiap jawaban benar beruntun (maksimum +50%)." />
          <Switch checked={s.shuffleQuestions} onChange={(v) => updateSettings({ shuffleQuestions: v })} label="Acak urutan soal" description="Urutan berbeda di setiap permainan." />
          <Switch checked={s.allowGoBack} onChange={(v) => updateSettings({ allowGoBack: v })} label="Izinkan guru kembali ke soal sebelumnya" description="Hanya untuk meninjau; jawaban yang sudah dicatat tidak berubah." />
          <Switch checked={s.showExplanation} onChange={(v) => updateSettings({ showExplanation: v })} label="Tampilkan penjelasan setelah menjawab" />
          <Switch checked={s.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} label="Efek suara aktif secara bawaan" />
          <hr className="border-line" />
          <Switch checked={s.cameraMode} onChange={(v) => updateSettings({ cameraMode: v })} label="Mode kamera (anak berdiri di sisi Benar/Salah)" description="Kamera Smartboard membaca sisi mana yang lebih banyak terisi: kiri = BENAR, kanan = SALAH. Kamera dinyalakan guru saat sesi dimulai; guru tetap bisa beralih ke sentuhan kapan saja." />
          {s.cameraMode && (
            <div className="max-w-xs rounded-xl bg-paper p-4">
              <NumberField label="Waktu berdiri per soal (detik)" min={3} max={60} value={s.cameraCountdown} onChange={(n) => n !== null && updateSettings({ cameraCountdown: n })} hint={s.timerEnabled ? "Timer per soal sedang aktif, jadi batas waktu soal dipakai sebagai gantinya." : "Hitung mundur sebelum jawaban dikunci otomatis. Guru juga bisa menekan Kunci jawaban lebih cepat."} />
            </div>
          )}
          <hr className="border-line" />
          <div className="max-w-xs pt-2">
            <NumberField label="Batasi jumlah soal (Tantangan Acak)" min={1} max={200} value={s.questionLimit} onChange={(n) => updateSettings({ questionLimit: n })} hint="Kosongkan untuk memakai semua soal. Soal wajib selalu ikut; sisanya diambil acak dari soal opsional." />
          </div>
        </div>
      </div>

      <div role="tabpanel" id="panel-share" aria-labelledby="tab-share" hidden={tab !== "share"}>
        <SharePanel gameId={game.id} status={status} initial={shares} />
      </div>
    </>
  );
}