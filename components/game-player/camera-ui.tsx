"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, Lock, ShieldCheck, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import type { Sensitivity, ZoneReading } from "@/lib/camera/zones";
import type { PanelState } from "./answer-panel";
import type { CameraStatus } from "./use-camera";
import { useQuestionClock } from "./use-question-clock";

/** Menampilkan stream kamera (dicerminkan seperti cermin). */
export function CameraVideo({ stream, className }: { stream: MediaStream | null; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) void v.play().catch(() => {});
  }, [stream]);
  return <video ref={ref} muted playsInline autoPlay aria-hidden className={cn("-scale-x-100 object-cover", className)} />;
}

const bar = (v: number) => `${Math.min(100, Math.round(v * 400))}%`;

// ---------------------------------------------------------------- setup (layar awal)

export function CameraSetup({ camera, zones, sensitivity, onSensitivity }: {
  camera: { stream: MediaStream | null; status: CameraStatus; error: string | null; start: () => void; stop: () => void };
  zones: { reading: ZoneReading; calibrated: boolean; step: number | null; calibrate: () => Promise<boolean> };
  sensitivity: Sensitivity; onSensitivity: (s: Sensitivity) => void;
}) {
  const [failed, setFailed] = useState(false);
  const ready = camera.status === "ready" && camera.stream;
  const calibrating = zones.step !== null;

  return (
    <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-brand-200 bg-brand-50/60 p-4 text-left">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Camera className="h-5 w-5 text-brand-600" aria-hidden />Mode kamera: berdiri di sisi jawaban</h2>
      <p className="mt-1 text-sm text-ink-soft">Anak-anak berdiri di <strong className="text-correct">sisi kiri (BENAR)</strong> atau <strong className="text-wrong">sisi kanan (SALAH)</strong> area kamera. Sisi yang lebih banyak terisi menjadi jawaban kelas.</p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="relative aspect-video max-h-[60dvh] w-full overflow-hidden rounded-xl bg-ink">
          {ready ? (
            <>
              <CameraVideo stream={camera.stream} className="absolute inset-0 h-full w-full" />
              <div aria-hidden className="absolute inset-y-0 left-0 w-1/2 bg-correct/25" />
              <div aria-hidden className="absolute inset-y-0 right-0 w-1/2 bg-wrong/25" />
              <span aria-hidden className="absolute left-3 top-2 font-display text-xl font-semibold text-white drop-shadow">BENAR</span>
              <span aria-hidden className="absolute right-3 top-2 font-display text-xl font-semibold text-white drop-shadow">SALAH</span>
              {zones.calibrated && !calibrating && (
                <>
                  <div aria-hidden className="absolute bottom-2 left-2 h-2.5 rounded-full bg-white/90" style={{ width: `calc(${bar(zones.reading.left)} * 0.46)` }} />
                  <div aria-hidden className="absolute bottom-2 right-2 h-2.5 rounded-full bg-white/90" style={{ width: `calc(${bar(zones.reading.right)} * 0.46)` }} />
                </>
              )}
              {calibrating && (
                <div role="status" aria-live="assertive" className="absolute inset-0 flex flex-col items-center justify-center bg-ink/70 text-center text-white">
                  {zones.step! > 0 ? (<><p className="font-display text-7xl font-semibold">{zones.step}</p><p className="mt-1 px-4 text-lg font-semibold">Semua keluar dari area kamera!</p></>) : <p className="px-4 text-lg font-semibold">Merekam latar kosong…</p>}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-white/90">
              <CameraOff className="h-10 w-10" aria-hidden />
              <p className="text-sm">{camera.status === "starting" ? "Menyalakan kamera…" : "Kamera belum menyala"}</p>
            </div>
          )}
        </div>

        <ol className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white", ready ? "bg-correct" : "bg-ink-mute")}>{ready ? <Check className="h-4 w-4" aria-hidden /> : "1"}</span>Nyalakan kamera</li>
          <li className="flex items-center gap-2"><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white", zones.calibrated ? "bg-correct" : "bg-ink-mute")}>{zones.calibrated ? <Check className="h-4 w-4" aria-hidden /> : "2"}</span>Kalibrasi latar kosong</li>
          <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-mute text-xs font-bold text-white">3</span>Tekan Mulai</li>
          <li>
            <SelectField aria-label="Sensitivitas kamera" value={sensitivity} onChange={(e) => onSensitivity(e.target.value as Sensitivity)} className="h-10">
              <option value="low">Sensitivitas rendah (ruang terang/berisik)</option>
              <option value="medium">Sensitivitas sedang</option>
              <option value="high">Sensitivitas tinggi (ruang redup)</option>
            </SelectField>
          </li>
        </ol>
      </div>

      {camera.error && <p role="alert" className="mt-3 rounded-xl bg-wrong-light px-3 py-2 text-sm font-medium text-wrong-dark">{camera.error}</p>}
      {failed && <p role="alert" className="mt-3 rounded-xl bg-wrong-light px-3 py-2 text-sm font-medium text-wrong-dark">Kalibrasi gagal: kamera belum mengirim gambar. Coba lagi.</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {!ready ? (
          <Button onClick={camera.start} loading={camera.status === "starting"}><Camera className="h-4 w-4" aria-hidden />Nyalakan kamera</Button>
        ) : (
          <>
            <Button onClick={async () => setFailed(!(await zones.calibrate()))} disabled={calibrating}>{zones.calibrated ? "Kalibrasi ulang" : "Kalibrasi sekarang"}</Button>
            <Button variant="secondary" onClick={camera.stop} disabled={calibrating}><CameraOff className="h-4 w-4" aria-hidden />Matikan kamera</Button>
          </>
        )}
      </div>
      <p className="mt-3 flex gap-2 text-xs text-ink-soft"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-correct" aria-hidden />Gambar kamera hanya diproses di perangkat ini. Tidak direkam, tidak disimpan, dan tidak dikirim ke server. Kamera mati otomatis saat permainan selesai. Letakkan kamera diam, dengan latar yang tidak bergerak, lalu kalibrasi ulang bila cahaya ruangan berubah banyak.</p>
    </div>
  );
}

// ---------------------------------------------------------------- zona saat soal

export function CameraZones({ stream, reading, decide, resetKey, durationMs, active, paused, panelState, onLock, registerLock, onFallback }: {
  stream: MediaStream | null; reading: ZoneReading; decide: () => boolean | null; resetKey: number; durationMs: number; active: boolean; paused: boolean;
  panelState: (value: boolean) => PanelState; onLock: (answer: boolean | null, elapsedMs: number) => void; registerLock: (fn: (() => void) | null) => void; onFallback: () => void;
}) {
  const [hint, setHint] = useState(false);
  const live = active ? decide() : null;
  const onLockRef = useRef(onLock);
  const decideRef = useRef(decide);
  useEffect(() => { onLockRef.current = onLock; decideRef.current = decide; });

  const clock = useQuestionClock({
    resetKey, limitMs: durationMs, running: active && !paused,
    onExpire: (ms) => onLockRef.current(decideRef.current(), ms), // waktu habis: pakai pembacaan terakhir; kosong = timeout
  });

  useEffect(() => {
    registerLock(() => {
      const d = decideRef.current();
      if (d === null) return setHint(true);
      setHint(false);
      onLockRef.current(d, clock.elapsed());
    });
    return () => registerLock(null);
  }, [registerLock, clock.elapsed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setHint(false), [resetKey]);

  const secs = clock.remainingMs !== null ? Math.ceil(clock.remainingMs / 1000) : null;
  const zone = (value: boolean) => {
    const st = panelState(value);
    const isLeader = live === value;
    return (
      <div className={cn("relative flex h-full flex-col items-center justify-end pb-16 text-white transition-all sm:pb-20", value ? "bg-correct/25" : "bg-wrong/25",
        isLeader && "ring-8 ring-inset ring-pencil-400", st === "dimmed" && "opacity-40", st === "chosen-right" && "ring-8 ring-inset ring-pencil-400 animate-pop",
        st === "chosen-wrong" && "ring-8 ring-inset ring-white/80 animate-shake", st === "reveal" && "ring-8 ring-inset ring-pencil-400 animate-pop")}>
        <div className={cn("flex items-center gap-3 rounded-2xl px-5 py-2 shadow-lg", value ? "bg-correct" : "bg-wrong")}>
          {value ? <Check className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={3.5} aria-hidden /> : <X className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={3.5} aria-hidden />}
          <span className="font-display text-3xl font-semibold sm:text-5xl">{value ? "BENAR" : "SALAH"}</span>
        </div>
        {isLeader && st === "idle" && <span className="mt-1.5 rounded-full bg-pencil-400 px-3 py-0.5 text-sm font-bold text-ink">Terdeteksi</span>}
        {st === "reveal" && <span className="mt-1.5 rounded-full bg-pencil-400 px-3 py-0.5 text-sm font-bold text-ink">Jawaban yang tepat</span>}
        <div aria-hidden className="absolute inset-x-6 bottom-3 h-3 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-white transition-[width] duration-200" style={{ width: bar(value ? reading.left : reading.right) }} /></div>
      </div>
    );
  };

  if (!stream) {
    return (
      <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-4 text-center shadow-lg">
        <CameraOff className="h-10 w-10 text-wrong" aria-hidden />
        <p className="font-semibold">Kamera tidak aktif</p>
        <Button onClick={onFallback}>Gunakan sentuhan</Button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl bg-ink shadow-lg">
      <CameraVideo stream={stream} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 grid grid-cols-2">{zone(true)}{zone(false)}</div>
      <div aria-hidden className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white/80" />
      {secs !== null && active && (
        <span role="timer" aria-label={`Sisa waktu ${secs} detik`} className={cn("absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-4 py-1 text-xl font-bold tabular-nums shadow-lg", secs <= 3 ? "animate-pop bg-wrong text-white" : "bg-white text-ink")}><Timer className="h-5 w-5" aria-hidden />{secs}</span>
      )}
      {active && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
          {hint && <span role="status" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-wrong">Belum ada sisi yang jelas. Minta anak berdiri di satu sisi.</span>}
          <Button size="lg" variant="accent" disabled={paused} onClick={() => { const d = decide(); if (d === null) return setHint(true); setHint(false); onLock(d, clock.elapsed()); }}><Lock className="h-5 w-5" aria-hidden />Kunci jawaban</Button>
        </div>
      )}
    </div>
  );
}