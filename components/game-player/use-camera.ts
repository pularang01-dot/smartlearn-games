"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { averageFrames, FRAME_H, FRAME_W, rgbaToLuma, THRESHOLDS, ZoneTracker, type Sensitivity, type ZoneReading } from "@/lib/camera/zones";

export type CameraStatus = "idle" | "starting" | "ready" | "error";

function explain(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Izin kamera ditolak. Klik ikon gembok di address bar, izinkan Kamera, lalu coba lagi.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Kamera tidak ditemukan. Pastikan kamera Smartboard/perangkat terhubung.";
  if (name === "NotReadableError" || name === "AbortError") return "Kamera sedang dipakai aplikasi lain atau tidak bisa dibuka. Tutup aplikasi tersebut lalu coba lagi.";
  return "Kamera tidak dapat dinyalakan. Gunakan mode sentuhan, atau coba browser lain.";
}

/** Mengelola MediaStream kamera. Tidak ada video yang direkam/dikirim; stream hanya dipakai di perangkat ini. */
export function useCameraStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    ref.current?.getTracks().forEach((t) => t.stop());
    ref.current = null;
    setStream(null);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (ref.current) return;
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(window.isSecureContext ? "Browser ini tidak mendukung kamera." : "Kamera hanya dapat dipakai lewat HTTPS (atau localhost).");
      setStatus("error");
      return;
    }
    setStatus("starting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      ref.current = s;
      s.getVideoTracks()[0]?.addEventListener("ended", () => {
        ref.current = null;
        setStream(null);
        setStatus("error");
        setError("Koneksi kamera terputus. Nyalakan kembali atau gunakan mode sentuhan.");
      });
      setStream(s);
      setStatus("ready");
    } catch (e) {
      setError(explain(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => () => { ref.current?.getTracks().forEach((t) => t.stop()); ref.current = null; }, []);

  return { stream, status, error, start, stop };
}

/** Membaca frame kecil (64x48, dicerminkan) ~8x/detik dan menghitung zona kiri/kanan. */
export function useZoneTracker(stream: MediaStream | null, sensitivity: Sensitivity) {
  const tracker = useRef<ZoneTracker>(new ZoneTracker(FRAME_W, FRAME_H, THRESHOLDS[sensitivity]));
  const calibFrames = useRef<Uint8Array[] | null>(null);
  const [reading, setReading] = useState<ZoneReading>({ left: 0, right: 0 });
  const [calibrated, setCalibrated] = useState(false);
  const [step, setStep] = useState<number | null>(null); // 3,2,1 = hitung mundur; 0 = merekam latar; null = diam

  useEffect(() => { tracker.current.setThreshold(THRESHOLDS[sensitivity]); }, [sensitivity]);
  useEffect(() => { if (!stream) { setCalibrated(false); setReading({ left: 0, right: 0 }); } }, [stream]);

  useEffect(() => {
    if (!stream) return;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = stream;
    video.setAttribute("aria-hidden", "true");
    video.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
    document.body.appendChild(video);
    void video.play().catch(() => {});
    const canvas = document.createElement("canvas");
    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let lastUi = 0;

    const id = setInterval(() => {
      if (!ctx || video.readyState < 2) return;
      ctx.save();
      ctx.translate(FRAME_W, 0);
      ctx.scale(-1, 1); // cermin: kiri layar = kiri anak
      ctx.drawImage(video, 0, 0, FRAME_W, FRAME_H);
      ctx.restore();
      const frame = rgbaToLuma(ctx.getImageData(0, 0, FRAME_W, FRAME_H).data);
      if (calibFrames.current) { calibFrames.current.push(frame); return; }
      if (tracker.current.hasBaseline()) {
        tracker.current.update(frame);
        const now = performance.now();
        if (now - lastUi > 250) { lastUi = now; setReading({ ...tracker.current.reading() }); }
      }
    }, 120);
    return () => { clearInterval(id); video.srcObject = null; video.remove(); };
  }, [stream]);

  /** Hitung mundur 3 detik (anak keluar dari area kamera), lalu rekam latar kosong ~1,5 detik. */
  const calibrate = useCallback(async (): Promise<boolean> => {
    if (!stream) return false;
    setCalibrated(false);
    for (const n of [3, 2, 1]) { setStep(n); await new Promise((r) => setTimeout(r, 1000)); }
    setStep(0);
    calibFrames.current = [];
    await new Promise((r) => setTimeout(r, 1500));
    const frames = calibFrames.current ?? [];
    calibFrames.current = null;
    setStep(null);
    if (frames.length < 5) return false;
    tracker.current.setBaseline(averageFrames(frames));
    setReading({ left: 0, right: 0 });
    setCalibrated(true);
    return true;
  }, [stream]);

  const decide = useCallback(() => tracker.current.decision(), []);
  return { reading, calibrated, step, calibrate, decide };
}