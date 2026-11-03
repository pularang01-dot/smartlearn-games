"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Camera, Check, CheckCircle2, Clock, Copy, Flame, Maximize, Music, Play, RotateCcw, Timer, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { duplicateSharedGame } from "@/features/sharing/actions";
import { BADGES } from "@/lib/constants";
import { formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AnswerRecord } from "@/features/sessions/engine";
import type { SessionSummary } from "@/features/sessions/scoring";
import type { PlayGame, PlayQuestion } from "@/types/db";
import { AnswerPanel, type PanelState } from "./answer-panel";
import type { ReactNode } from "react";
import { Confetti } from "./confetti";

// ------------------------------------------------------------------ intro

export function IntroScreen({ game, total, label, onLabel, showLabel, soundOn, onSound, musicOn, onMusic, onFullscreen, onStart, cameraMode, onCameraMode, cameraSlot, canStart }: {
  game: PlayGame; total: number; label: string; onLabel: (v: string) => void; showLabel: boolean; soundOn: boolean; onSound: () => void; musicOn: boolean; onMusic: () => void; onFullscreen: () => void; onStart: () => void;
  cameraMode: boolean; onCameraMode: (v: boolean) => void; cameraSlot: ReactNode; canStart: boolean;
}) {
  const s = game.settings;
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-4 sm:p-8">
      <div className={cn("w-full animate-slide-in rounded-[2rem] bg-white p-6 text-center shadow-xl sm:p-10", cameraMode ? "max-w-6xl" : "max-w-3xl")}>
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {game.subject_name && <Badge tone="brand" className="px-3 py-1 text-sm">{game.subject_name}</Badge>}
          {game.grade_level && <Badge className="px-3 py-1 text-sm">{game.grade_level}</Badge>}
          {game.topic && <Badge className="px-3 py-1 text-sm">{game.topic}</Badge>}
        </div>
        <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">{game.title}</h1>
        {game.description && <p className="mx-auto mt-3 max-w-xl text-ink-soft">{game.description}</p>}
        <p className="mt-4 text-lg font-semibold text-brand-700">{total} pertanyaan{s.timerEnabled ? ` · timer ${s.defaultTimeLimit} dtk/soal (bawaan)` : ""}</p>

        <ul className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
          <li className="flex items-center gap-3 rounded-2xl bg-correct-light p-3 text-correct-dark"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-correct text-white"><Check className="h-6 w-6" strokeWidth={3} aria-hidden /></span><span className="font-semibold">Sentuh panel hijau jika pernyataan benar.</span></li>
          <li className="flex items-center gap-3 rounded-2xl bg-wrong-light p-3 text-wrong-dark"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wrong text-white"><X className="h-6 w-6" strokeWidth={3} aria-hidden /></span><span className="font-semibold">Sentuh panel merah jika pernyataan salah.</span></li>
          <li className="rounded-2xl bg-paper p-3 text-sm font-medium text-ink-soft">Tunggu umpan balik muncul setelah memilih.</li>
          <li className="rounded-2xl bg-paper p-3 text-sm font-medium text-ink-soft">Tekan <strong>Lanjut</strong> untuk soal berikutnya.</li>
        </ul>

        {showLabel && (
          <div className="mx-auto mt-6 max-w-sm text-left">
            <label htmlFor="session-label" className="mb-1 block text-sm font-semibold">Label sesi (opsional)</label>
            <input id="session-label" value={label} maxLength={80} onChange={(e) => onLabel(e.target.value)} placeholder="Contoh: Kelas 5A - Senin" className="h-11 w-full rounded-xl border border-line px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <p className="mt-1 text-xs text-ink-mute">Jangan isi nama atau data pribadi siswa.</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={onSound} aria-pressed={soundOn}>{soundOn ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}Suara {soundOn ? "aktif" : "mati"}</Button>
          <Button variant="secondary" onClick={onMusic} aria-pressed={musicOn} disabled={!soundOn}><Music className="h-4 w-4" aria-hidden />Musik latar {musicOn ? "aktif" : "mati"}</Button>
          <Button variant="secondary" onClick={onFullscreen}><Maximize className="h-4 w-4" aria-hidden />Layar penuh</Button>
          <Button variant={cameraMode ? "primary" : "secondary"} onClick={() => onCameraMode(!cameraMode)} aria-pressed={cameraMode}><Camera className="h-4 w-4" aria-hidden />Mode kamera {cameraMode ? "aktif" : "mati"}</Button>
        </div>
        {cameraMode && cameraSlot}
        <Button size="xl" className="mt-7 w-full max-w-md bg-pencil-400 text-ink hover:bg-pencil-500" onClick={onStart} disabled={!canStart} data-autofocus autoFocus><Play className="h-7 w-7" aria-hidden />Mulai</Button>
        {!canStart && <p role="status" className="mt-2 text-sm font-semibold text-wrong">Nyalakan kamera dan lakukan kalibrasi dulu, atau matikan mode kamera.</p>}
        <p className="mt-3 text-xs text-ink-mute">Pintasan: ← Benar · → Salah · Enter/Spasi lanjut · P jeda · M suara · F layar penuh · H sembunyikan toolbar</p>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- question

function questionSize(len: number) {
  if (len <= 60) return "text-3xl sm:text-5xl lg:text-6xl";
  if (len <= 140) return "text-2xl sm:text-4xl lg:text-5xl";
  return "text-xl sm:text-3xl lg:text-4xl";
}

export function QuestionScreen({ question, index, total, score, streak, comboOn, remainingMs, limitMs, phase, record, paused, showExplanation, isLast, onAnswer, onNext, renderCamera }: {
  question: PlayQuestion; index: number; total: number; score: number; streak: number; comboOn: boolean; remainingMs: number | null; limitMs: number | null;
  phase: "question" | "feedback"; record: AnswerRecord | undefined; paused: boolean; showExplanation: boolean; isLast: boolean; onAnswer: (v: boolean) => void; onNext: () => void;
  /** Mode kamera: kamera memenuhi seluruh area soal; teks soal menjadi banner ringkas di atasnya. */
  renderCamera?: (ctx: { panelState: (value: boolean) => PanelState }) => ReactNode;
}) {
  const feedback = phase === "feedback" && record;
  const camera = Boolean(renderCamera);
  const secs = remainingMs !== null ? Math.ceil(remainingMs / 1000) : null;
  const low = secs !== null && secs <= 5;

  const panelState = (value: boolean): PanelState => {
    if (!feedback) return "idle";
    if (record!.kind === "answered") {
      if (record!.given === value) return record!.isCorrect ? "chosen-right" : "chosen-wrong";
      return value === question.correct_answer ? "reveal" : "dimmed";
    }
    return value === question.correct_answer ? "reveal" : "dimmed";
  };

  const good = feedback && record!.kind === "answered" && record!.isCorrect;
  const feedbackEl = feedback ? (
    <div role="status" aria-live="polite" className={cn("animate-slide-in rounded-3xl p-4 sm:p-5", camera ? "absolute inset-x-3 bottom-3 z-20 max-h-[48%] overflow-y-auto shadow-xl" : "shrink-0", good ? "bg-correct-light" : record!.kind === "skipped" ? "bg-white" : "bg-wrong-light")}>
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <div className="min-w-0 flex-1">
          <p className={cn("flex items-center gap-2 font-display font-semibold", camera ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl", good ? "text-correct-dark" : record!.kind === "skipped" ? "text-ink" : "text-wrong-dark")}>
            {good ? <CheckCircle2 className="h-7 w-7" aria-hidden /> : record!.kind === "timeout" ? <Clock className="h-7 w-7" aria-hidden /> : record!.kind === "skipped" ? <ArrowRight className="h-7 w-7" aria-hidden /> : <AlertTriangle className="h-7 w-7" aria-hidden />}
            {record!.kind === "answered" ? (record!.isCorrect ? `Benar! +${record!.points} poin` : "Kurang tepat") : record!.kind === "timeout" ? "Waktu habis!" : "Soal dilewati"}
          </p>
          <p className="mt-1 text-base font-semibold text-ink-soft sm:text-lg">Jawaban yang benar: <span className={question.correct_answer ? "text-correct" : "text-wrong"}>{question.correct_answer ? "BENAR" : "SALAH"}</span></p>
          {showExplanation && question.explanation && <p className={cn("mt-2 leading-snug text-ink", camera ? "text-base" : "text-base sm:text-lg")}>{question.explanation}</p>}
        </div>
        <Button size="xl" onClick={onNext} disabled={paused} className="w-full shrink-0 sm:w-auto" data-autofocus>{isLast ? "Lihat hasil" : "Lanjut"}<ArrowRight className="h-6 w-6" aria-hidden /></Button>
      </div>
    </div>
  ) : null;

  const header = (
    <header className="shrink-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-bold sm:text-xl">Pertanyaan {index + 1} dari {total}</p>
        <div className="flex items-center gap-2 sm:gap-3">
          {comboOn && streak >= 2 && <span className="flex items-center gap-1 rounded-full bg-pencil-400 px-3 py-1 text-sm font-bold sm:text-base"><Flame className="h-4 w-4" aria-hidden />Combo ×{streak}</span>}
          {secs !== null && phase === "question" && (
            <span role="timer" aria-label={`Sisa waktu ${secs} detik`} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-bold tabular-nums sm:text-xl", low ? "animate-pop bg-wrong text-white" : "bg-white text-ink")}><Timer className="h-5 w-5" aria-hidden />{secs}</span>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-base font-bold tabular-nums sm:text-xl" aria-label={`Skor ${score}`}><Trophy className="h-5 w-5 text-pencil-500" aria-hidden />{score}</span>
        </div>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/80" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (feedback ? 1 : 0)} aria-label="Kemajuan permainan">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${((index + (feedback ? 1 : 0)) / total) * 100}%` }} />
      </div>
      {limitMs !== null && phase === "question" && remainingMs !== null && (
        <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/80"><div className={cn("h-full transition-[width] duration-200 ease-linear", low ? "bg-wrong" : "bg-pencil-500")} style={{ width: `${(remainingMs / limitMs) * 100}%` }} /></div>
      )}
    </header>
  );

  // ---- Mode kamera: kamera sebesar mungkin; soal = banner ringkas semi-transparan di bagian atas
  if (renderCamera) {
    const len = question.question_text.length;
    return (
      <div className="flex h-full flex-col gap-2 p-2 sm:p-3">
        {header}
        <div className="relative min-h-0 flex-1">
          {renderCamera({ panelState })}
          <section key={question.id} className="absolute inset-x-3 top-3 z-20 flex max-h-[32%] animate-slide-in items-center gap-3 overflow-y-auto rounded-2xl bg-white/90 p-3 shadow-xl backdrop-blur-sm sm:px-5">
            {question.image_url && <img src={question.image_url} alt="" className="h-16 w-auto max-w-[22%] shrink-0 rounded-xl object-contain sm:h-20" />}
            <p className={cn("min-w-0 flex-1 text-center font-display font-medium leading-snug text-ink", len <= 60 ? "text-2xl sm:text-4xl" : len <= 140 ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl")}>{question.question_text}</p>
          </section>
          {feedbackEl}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:gap-4 sm:p-5">
      {header}
      <section key={question.id} className="flex min-h-0 flex-1 animate-slide-in flex-col items-center justify-center gap-4 overflow-y-auto rounded-[2rem] bg-white p-5 text-center shadow-lg sm:p-8">
        {question.image_url && <img src={question.image_url} alt="" className="max-h-[38%] min-h-[80px] w-auto max-w-full rounded-2xl object-contain" />}
        <p className={cn("max-w-5xl font-display font-medium leading-snug text-ink", questionSize(question.question_text.length))}>{question.question_text}</p>
      </section>
      {feedbackEl}
      <div className="grid h-[34%] min-h-[150px] shrink-0 grid-cols-2 gap-3 portrait:h-[44%] portrait:grid-cols-1 portrait:grid-rows-2 sm:gap-5">
        <AnswerPanel value state={panelState(true)} disabled={phase !== "question" || paused} onPick={() => onAnswer(true)} />
        <AnswerPanel value={false} state={panelState(false)} disabled={phase !== "question" || paused} onPick={() => onAnswer(false)} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- result

export type SaveState = "idle" | "saving" | "saved" | "error" | "unsaved";

export function ResultScreen({ summary, questions, records, durationSeconds, badges, saveState, saveError, onRetrySave, onRestart, mode, sessionId, exitHref, shareToken, canDuplicate }: {
  summary: SessionSummary; questions: PlayQuestion[]; records: (AnswerRecord | undefined)[]; durationSeconds: number; badges: string[]; saveState: SaveState; saveError?: string;
  onRetrySave: () => void; onRestart: () => void; mode: "owner" | "preview" | "shared"; sessionId: string; exitHref: string; shareToken?: string; canDuplicate?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [dup, setDup] = useState(false);

  const duplicate = async () => {
    if (!shareToken) return;
    setDup(true);
    const r = await duplicateSharedGame(shareToken);
    setDup(false);
    if (r.ok) return router.push(`/dashboard/games/${r.data.id}`);
    if (r.code === "auth") return router.push(`/login?next=${encodeURIComponent(`/share/${shareToken}`)}`);
    toast({ title: "Tidak bisa menyalin", description: r.error, tone: "error" });
  };

  const stat = (label: string, value: string | number, tone: string) => (
    <div className={cn("rounded-2xl p-4 text-center", tone)}><p className="font-display text-3xl font-semibold sm:text-4xl">{value}</p><p className="text-sm font-semibold">{label}</p></div>
  );

  return (
    <div className="relative h-full overflow-y-auto p-4 sm:p-8">
      {summary.correct > 0 && <Confetti />}
      <div className="relative z-30 mx-auto max-w-4xl animate-slide-in rounded-[2rem] bg-white p-6 text-center shadow-xl sm:p-10">
        <Trophy className="mx-auto h-14 w-14 text-pencil-500" aria-hidden />
        <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">Permainan selesai!</h1>
        <p className="mt-3 font-display text-6xl font-semibold text-brand-600 sm:text-8xl" aria-label={`Skor akhir ${summary.score}`}>{summary.score}</p>
        <p className="text-sm font-semibold text-ink-soft">skor akhir</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stat("Benar", summary.correct, "bg-correct-light text-correct-dark")}
          {stat("Salah", summary.incorrect, "bg-wrong-light text-wrong-dark")}
          {stat("Timeout", summary.timeouts, "bg-pencil-100 text-[#7A5600]")}
          {stat("Akurasi", `${Math.round(summary.accuracy)}%`, "bg-brand-50 text-brand-700")}
          {stat("Durasi", formatDuration(durationSeconds), "bg-paper text-ink")}
        </div>

        {badges.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Pencapaian">
            {badges.map((b) => <Badge key={b} tone="warning" className="px-3 py-1 text-sm"><Trophy className="h-3.5 w-3.5" aria-hidden />{BADGES[b]?.label ?? b}</Badge>)}
          </div>
        )}

        <div className="mt-5 text-sm" aria-live="polite">
          {saveState === "saving" && <span className="text-ink-soft">Menyimpan hasil…</span>}
          {saveState === "saved" && <span className="font-semibold text-correct">Hasil tersimpan di riwayat sesi.</span>}
          {saveState === "unsaved" && <span className="text-ink-mute">{mode === "preview" ? "Mode pratinjau: hasil tidak disimpan." : mode === "shared" ? "Hasil permainan lewat tautan berbagi tidak disimpan." : "Tidak ada jawaban untuk disimpan."}</span>}
          {saveState === "error" && (
            <span role="alert" className="inline-flex flex-wrap items-center justify-center gap-2 text-wrong"><span className="font-semibold">{saveError ?? "Hasil belum tersimpan."}</span><Button size="sm" variant="secondary" onClick={onRetrySave}>Coba simpan lagi</Button></span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onRestart}><RotateCcw className="h-5 w-5" aria-hidden />Main lagi</Button>
          {mode !== "shared" && <Link href={exitHref} className={buttonClasses("secondary", "lg")}>Kembali ke dashboard</Link>}
          {mode === "owner" && saveState === "saved" && <Link href={`/dashboard/sessions/${sessionId}`} className={buttonClasses("secondary", "lg")}>Lihat laporan</Link>}
          {mode === "shared" && canDuplicate && <Button size="lg" variant="accent" onClick={duplicate} loading={dup}><Copy className="h-5 w-5" aria-hidden />Salin ke workspace saya</Button>}
          {mode === "shared" && <Link href="/" className={buttonClasses("secondary", "lg")}>Tutup</Link>}
        </div>

        <details className="mt-8 rounded-2xl border border-line text-left">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold">Ringkasan pertanyaan</summary>
          <ol className="divide-y divide-line">
            {questions.map((q, i) => {
              const r = records[i];
              return (
                <li key={q.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white", !r || r.kind === "skipped" ? "bg-ink-mute" : r.kind === "timeout" ? "bg-pencil-500" : r.isCorrect ? "bg-correct" : "bg-wrong")}>
                    {!r || r.kind === "skipped" ? <span className="text-xs">–</span> : r.kind === "timeout" ? <Clock className="h-3.5 w-3.5" aria-label="Timeout" /> : r.isCorrect ? <Check className="h-4 w-4" aria-label="Benar" /> : <X className="h-4 w-4" aria-label="Salah" />}
                  </span>
                  <span className="min-w-0 flex-1"><span className="block">{i + 1}. {q.question_text}</span><span className="text-xs text-ink-mute">Kunci: {q.correct_answer ? "Benar" : "Salah"}{r ? ` · +${r.points} poin` : " · tidak dijawab"}</span></span>
                </li>
              );
            })}
          </ol>
        </details>
      </div>
    </div>
  );
}