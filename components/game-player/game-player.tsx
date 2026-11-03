"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraOff, ChevronsUp, LogOut, Maximize, Minimize, Music, Pause, Play, RotateCcw, SkipBack, SkipForward, Square, Volume2, VolumeX } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/misc";
import { buildPlayOrder } from "@/features/sessions/order";
import { currentStreak, initialState, playReducer, totalScore, type EngineConfig, type PlayAction, type PlayState } from "@/features/sessions/engine";
import { saveSession } from "@/features/sessions/actions";
import { computeBadges } from "@/features/sessions/badges";
import { summarize, timeLimitFor, type ScoredAnswer, type SessionSummary } from "@/features/sessions/scoring";
import { sfx, startMusic, stopMusic } from "@/lib/sound";
import { newId } from "@/lib/utils/misc";
import { cn } from "@/lib/utils/cn";
import type { PlayGame, PlayQuestion } from "@/types/db";
import { IntroScreen, QuestionScreen, ResultScreen, type SaveState } from "./screens";
import { useQuestionClock } from "./use-question-clock";
import { useCameraStream, useZoneTracker } from "./use-camera";
import { CameraSetup, CameraZones } from "./camera-ui";
import type { Sensitivity } from "@/lib/camera/zones";

export type PlayerMode = "owner" | "preview" | "shared";
export type GamePlayerProps = { mode: PlayerMode; game: PlayGame; questions: PlayQuestion[]; exitHref: string; shareToken?: string; canDuplicate?: boolean };

const SOUND_KEY = "slg:sound";

/** Pembungkus: mengelola "run" (main lagi = sesi baru dengan ID baru dan urutan baru). */
export function GamePlayer(props: GamePlayerProps) {
  const [runId, setRunId] = useState(0);
  const [label, setLabel] = useState("");
  const sessionId = useMemo(() => newId(), [runId]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-b from-brand-50 via-white to-pencil-100">
      <PlayRun key={runId} {...props} label={label} onLabel={setLabel} sessionId={sessionId} onRestart={() => setRunId((r) => r + 1)} />
    </div>
  );
}

type RunProps = GamePlayerProps & { label: string; onLabel: (v: string) => void; sessionId: string; onRestart: () => void };

function ToolButton({ label, onClick, children, disabled, active }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; active?: boolean }) {
  return (
    <Tooltip label={label} side="bottom">
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={active} className={cn("touch-safe flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors disabled:opacity-35", active ? "bg-brand-600 text-white" : "bg-white text-ink hover:bg-brand-50")}>{children}</button>
    </Tooltip>
  );
}

function PlayRun({ mode, game, questions, exitHref, shareToken, canDuplicate, label, onLabel, sessionId, onRestart }: RunProps) {
  const router = useRouter();
  const settings = game.settings;
  const [ordered] = useState(() => buildPlayOrder(questions, settings));
  const cfg = useMemo<EngineConfig>(() => ({ questions: ordered, settings }), [ordered, settings]);
  const [state, dispatch] = useReducer((s: PlayState, a: PlayAction) => playReducer(s, a, cfg), null, () => initialState());

  const [soundOn, setSoundOn] = useState(settings.soundEnabled);
  const [musicOn, setMusicOn] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirm, setConfirm] = useState<null | "end" | "reset" | "exit">(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [serverSummary, setServerSummary] = useState<SessionSummary | null>(null);
  const [serverBadges, setServerBadges] = useState<string[]>([]);
  const [cameraMode, setCameraMode] = useState(settings.cameraMode);
  const [sensitivity, setSensitivity] = useState<Sensitivity>("medium");
  const cam = useCameraStream();
  const zones = useZoneTracker(cam.stream, sensitivity);
  const lockRef = useRef<(() => void) | null>(null);
  const registerLock = useCallback((fn: (() => void) | null) => { lockRef.current = fn; }, []);
  const played = useRef(new Set<string>());
  const savedOnce = useRef(false);

  const q = ordered[state.index];
  const record = state.records[state.index];
  const inQuestion = state.phase === "question";
  const limitSec = q && inQuestion ? timeLimitFor(q, settings) : null;

  // ---- suara (preferensi UI disimpan di perangkat)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SOUND_KEY);
      if (stored !== null) setSoundOn(stored === "1");
    } catch { /* abaikan */ }
  }, []);
  useEffect(() => {
    try {
      const s = localStorage.getItem("slg:cam-sens");
      if (s === "low" || s === "medium" || s === "high") setSensitivity(s);
    } catch { /* abaikan */ }
  }, []);
  const changeSensitivity = (s: Sensitivity) => {
    setSensitivity(s);
    try { localStorage.setItem("slg:cam-sens", s); } catch { /* abaikan */ }
  };
  const play = useCallback((fn: () => void) => { if (soundOn) { try { fn(); } catch { /* audio diblokir */ } } }, [soundOn]);
  const toggleSound = () => {
    setSoundOn((v) => {
      try { localStorage.setItem(SOUND_KEY, v ? "0" : "1"); } catch { /* abaikan */ }
      if (v) { stopMusic(); setMusicOn(false); } else sfx.unlock();
      return !v;
    });
  };
  const toggleMusic = () => { sfx.unlock(); setMusicOn((m) => !m); };
  useEffect(() => {
    const active = musicOn && soundOn && (state.phase === "question" || state.phase === "feedback") && !state.paused;
    if (active) startMusic(); else stopMusic();
    return () => stopMusic();
  }, [musicOn, soundOn, state.phase, state.paused]);

  // ---- jam soal
  const onExpire = useCallback((ms: number) => {
    dispatch({ type: "TIMEOUT", responseMs: ms });
  }, []);
  const clock = useQuestionClock({ resetKey: state.index, limitMs: limitSec !== null && !cameraMode ? limitSec * 1000 : null, running: inQuestion && !state.paused, onExpire });

  const answer = useCallback((given: boolean) => {
    if (state.phase !== "question" || state.paused) return;
    sfx.unlock();
    dispatch({ type: "ANSWER", given, responseMs: Math.round(clock.elapsed()) });
  }, [state.phase, state.paused, clock]);

  // ---- mode kamera: kunci jawaban (dari zona terdeteksi) atau timeout bila tidak ada yang berdiri
  const lockCamera = useCallback((value: boolean | null, elapsedMs: number) => {
    if (value === null) dispatch({ type: "TIMEOUT", responseMs: Math.round(elapsedMs) });
    else dispatch({ type: "ANSWER", given: value, responseMs: Math.round(elapsedMs) });
  }, []);
  const cameraDurationMs = q ? (settings.timerEnabled ? (q.time_limit_seconds ?? settings.defaultTimeLimit) : settings.cameraCountdown) * 1000 : 0;
  const disableCamera = () => { cam.stop(); setCameraMode(false); };
  useEffect(() => { if (state.phase === "result") cam.stop(); }, [state.phase, cam.stop]); // privasi: kamera mati saat selesai

  // ---- efek suara saat umpan balik pertama kali muncul
  useEffect(() => {
    if (state.phase !== "feedback") return;
    const key = `fb-${state.index}`;
    if (played.current.has(key)) return;
    played.current.add(key);
    const r = state.records[state.index];
    if (!r) return;
    if (r.kind === "timeout") play(sfx.timeout);
    else if (r.kind === "answered") play(r.isCorrect ? sfx.correct : sfx.wrong);
  }, [state.phase, state.index, state.records, play]);

  // ---- ringkasan lokal
  const scored = useMemo<ScoredAnswer[]>(() =>
    state.records.flatMap((r) => (r && r.kind !== "skipped" ? [{
      questionId: r.questionId, position: r.position, questionText: ordered[r.position]?.question_text ?? "",
      correctAnswer: ordered[r.position]?.correct_answer ?? false, given: r.given, isCorrect: r.isCorrect,
      isTimeout: r.kind === "timeout", points: r.points, responseTimeMs: r.responseMs,
    }] : [])), [state.records, ordered]);
  const localSummary = useMemo(() => summarize(scored, ordered.length, settings), [scored, ordered.length, settings]);
  const summary = serverSummary ?? localSummary;
  const durationSeconds = state.startedAt && state.endedAt ? Math.round((state.endedAt - state.startedAt) / 1000) : 0;
  const badges = useMemo(() => Array.from(new Set([...computeBadges(summary, false), ...serverBadges])), [summary, serverBadges]);

  // ---- simpan sesi (hanya mode owner). Skor dihitung ulang server-side.
  const doSave = useCallback(async () => {
    if (mode !== "owner") return setSaveState("unsaved");
    if (scored.length === 0 || !state.startedAt) return setSaveState("unsaved");
    setSaveState("saving");
    setSaveError(undefined);
    const res = await saveSession({
      sessionId, gameId: game.id, label: label.trim() || null,
      startedAt: new Date(state.startedAt).toISOString(), endedAt: new Date(state.endedAt ?? Date.now()).toISOString(),
      endedEarly: state.endedEarly, order: ordered.map((x) => x.id),
      answers: scored.map((a) => ({ questionId: a.questionId, position: a.position, given: a.given, timedOut: a.isTimeout, responseTimeMs: Math.round(a.responseTimeMs) })),
    });
    if (res.ok) {
      setServerSummary(res.data.summary);
      setServerBadges(res.data.badges);
      setSaveState("saved");
    } else {
      setSaveError(res.error);
      setSaveState("error");
    }
  }, [mode, scored, state.startedAt, state.endedAt, state.endedEarly, sessionId, game.id, label, ordered]);

  useEffect(() => {
    if (state.phase !== "result" || savedOnce.current) return;
    savedOnce.current = true;
    play(sfx.finish);
    void doSave();
  }, [state.phase, doSave, play]);

  // ---- layar penuh
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* browser menolak: abaikan */ }
  }, []);

  // ---- aksi
  const start = () => { if (cameraMode && !zones.calibrated) return; sfx.unlock(); dispatch({ type: "START", now: Date.now() }); };
  const next = useCallback(() => dispatch({ type: "NEXT", now: Date.now() }), []);
  const inProgress = state.phase === "question" || state.phase === "feedback";
  const exit = () => (inProgress && state.records.some(Boolean) && mode !== "preview" ? setConfirm("exit") : router.push(exitHref));

  // ---- keyboard (tidak mengganggu input teks; tombol fokus memakai perilaku bawaan)
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || confirm) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      const onControl = tag === "BUTTON" || tag === "A" || tag === "SUMMARY";
      switch (e.key) {
        case "ArrowLeft": if (state.phase === "question") { e.preventDefault(); answer(true); } break;
        case "ArrowRight": if (state.phase === "question") { e.preventDefault(); answer(false); } break;
        case "Enter": case " ":
          if (onControl) return;
          if (state.phase === "intro") { e.preventDefault(); start(); }
          else if (state.phase === "feedback" && !state.paused) { e.preventDefault(); next(); }
          else if (state.phase === "question" && cameraMode) { e.preventDefault(); lockRef.current?.(); }
          break;
        case "p": case "P": if (inProgress) dispatch({ type: state.paused ? "RESUME" : "PAUSE" }); break;
        case "m": case "M": toggleSound(); break;
        case "f": case "F": void toggleFullscreen(); break;
        case "h": case "H": setToolbarOpen((o) => !o); break;
      }
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => () => stopMusic(), []);

  if (ordered.length === 0) {
    return <div className="flex h-full items-center justify-center p-6 text-center"><p className="text-lg font-semibold">Game ini belum memiliki pertanyaan.</p></div>;
  }

  const toolbar = toolbarOpen ? (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/60 bg-brand-100/70 px-3 py-2 backdrop-blur">
      <ToolButton label="Keluar" onClick={exit}><LogOut className="h-5 w-5" aria-hidden /><span className="hidden lg:inline">Keluar</span></ToolButton>
      <p className="mx-2 hidden min-w-0 flex-1 truncate text-sm font-bold text-brand-700 md:block">{game.title}{mode === "preview" ? " · Pratinjau" : ""}</p>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {inProgress && <ToolButton label={state.paused ? "Lanjutkan (P)" : "Jeda (P)"} onClick={() => dispatch({ type: state.paused ? "RESUME" : "PAUSE" })} active={state.paused}>{state.paused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}</ToolButton>}
        {inProgress && settings.allowGoBack && <ToolButton label="Soal sebelumnya" onClick={() => dispatch({ type: "PREV" })} disabled={state.index === 0}><SkipBack className="h-5 w-5" aria-hidden /></ToolButton>}
        {inProgress && <ToolButton label={state.phase === "feedback" ? "Soal berikutnya" : "Lewati soal ini"} onClick={() => (state.phase === "feedback" ? next() : dispatch({ type: "SKIP", now: Date.now() }))} disabled={state.paused}><SkipForward className="h-5 w-5" aria-hidden /></ToolButton>}
        {inProgress && cameraMode && <ToolButton label="Matikan kamera, pakai sentuhan" onClick={disableCamera}><CameraOff className="h-5 w-5" aria-hidden /></ToolButton>}
        {inProgress && <ToolButton label="Akhiri permainan" onClick={() => setConfirm("end")}><Square className="h-5 w-5" aria-hidden /></ToolButton>}
        {inProgress && <ToolButton label="Reset sesi" onClick={() => setConfirm("reset")}><RotateCcw className="h-5 w-5" aria-hidden /></ToolButton>}
        <ToolButton label={soundOn ? "Matikan suara (M)" : "Nyalakan suara (M)"} onClick={toggleSound} active={!soundOn}>{soundOn ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}</ToolButton>
        {inProgress && soundOn && <ToolButton label={musicOn ? "Matikan musik latar" : "Nyalakan musik latar"} onClick={toggleMusic} active={musicOn}><Music className="h-5 w-5" aria-hidden /></ToolButton>}
        <ToolButton label={fullscreen ? "Keluar layar penuh (F)" : "Layar penuh (F)"} onClick={() => void toggleFullscreen()}>{fullscreen ? <Minimize className="h-5 w-5" aria-hidden /> : <Maximize className="h-5 w-5" aria-hidden />}</ToolButton>
        <ToolButton label="Sembunyikan toolbar (H)" onClick={() => setToolbarOpen(false)}><ChevronsUp className="h-5 w-5" aria-hidden /></ToolButton>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative flex h-full flex-col">
      {toolbar}
      {!toolbarOpen && (
        <button type="button" onClick={() => setToolbarOpen(true)} aria-label="Tampilkan toolbar guru (H)" className="touch-safe absolute right-3 top-3 z-30 flex h-9 items-center gap-1 rounded-full bg-white/70 px-3 text-xs font-semibold text-ink-soft opacity-40 shadow hover:opacity-100 focus-visible:opacity-100">Toolbar guru</button>
      )}

      <div className="relative min-h-0 flex-1">
        {state.phase === "intro" && (
          <IntroScreen game={game} total={ordered.length} label={label} onLabel={onLabel} showLabel={mode === "owner"} soundOn={soundOn} onSound={toggleSound} musicOn={musicOn} onMusic={toggleMusic} onFullscreen={() => void toggleFullscreen()} onStart={start}
            cameraMode={cameraMode} onCameraMode={(v) => { setCameraMode(v); if (!v) cam.stop(); }} canStart={!cameraMode || zones.calibrated}
            cameraSlot={<CameraSetup camera={cam} zones={zones} sensitivity={sensitivity} onSensitivity={changeSensitivity} />} />
        )}
        {(state.phase === "question" || state.phase === "feedback") && q && (
          <QuestionScreen
            question={q} index={state.index} total={ordered.length} score={totalScore(state.records)} streak={currentStreak(state)} comboOn={settings.comboBonusEnabled}
            remainingMs={cameraMode ? null : clock.remainingMs} limitMs={limitSec !== null && !cameraMode ? limitSec * 1000 : null} phase={state.phase} record={record} paused={state.paused}
            showExplanation={settings.showExplanation} isLast={state.index === ordered.length - 1} onAnswer={answer} onNext={next}
            renderCamera={cameraMode ? ({ panelState }) => (
              <CameraZones stream={cam.stream} reading={zones.reading} decide={zones.decide} resetKey={state.index} durationMs={cameraDurationMs}
                active={state.phase === "question"} paused={state.paused} panelState={panelState} onLock={lockCamera} registerLock={registerLock} onFallback={disableCamera} />
            ) : undefined}
          />
        )}
        {state.phase === "result" && (
          <ResultScreen
            summary={summary} questions={ordered} records={state.records} durationSeconds={durationSeconds} badges={badges} saveState={saveState} saveError={saveError}
            onRetrySave={() => void doSave()} onRestart={onRestart} mode={mode} sessionId={sessionId} exitHref={exitHref} shareToken={shareToken} canDuplicate={canDuplicate}
          />
        )}

        {state.paused && state.phase !== "result" && (
          <div role="dialog" aria-modal="true" aria-label="Permainan dijeda" className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-ink/70 p-6 text-center text-white backdrop-blur-sm">
            <Pause className="h-16 w-16" aria-hidden />
            <p className="font-display text-4xl font-semibold">Permainan dijeda</p>
            <button type="button" autoFocus onClick={() => dispatch({ type: "RESUME" })} className="touch-safe inline-flex h-16 items-center gap-3 rounded-2xl bg-pencil-400 px-8 text-xl font-bold text-ink hover:bg-pencil-500"><Play className="h-7 w-7" aria-hidden />Lanjutkan</button>
          </div>
        )}
      </div>

      <ConfirmDialog open={confirm === "end"} onClose={() => setConfirm(null)} title="Akhiri permainan sekarang?" description="Soal yang belum dijawab tidak dihitung. Hasil sampai saat ini akan ditampilkan dan disimpan." confirmLabel="Akhiri" onConfirm={() => { setConfirm(null); dispatch({ type: "END", now: Date.now() }); }} />
      <ConfirmDialog open={confirm === "reset"} onClose={() => setConfirm(null)} title="Reset sesi?" description="Permainan diulang dari awal dan jawaban sesi ini dibuang (tidak disimpan)." confirmLabel="Reset" onConfirm={() => { setConfirm(null); stopMusic(); onRestart(); }} />
      <ConfirmDialog open={confirm === "exit"} onClose={() => setConfirm(null)} title="Keluar dari permainan?" description="Sesi yang sedang berjalan tidak akan disimpan. Gunakan Akhiri permainan bila Anda ingin menyimpan hasil sampai saat ini." confirmLabel="Keluar tanpa menyimpan" onConfirm={() => router.push(exitHref)} />
    </div>
  );
}