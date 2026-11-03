"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "conflict";
export type SaveResult = { ok: true } | { ok: false; error: string; code?: string };

/**
 * Autosave dengan debounce.
 * - Hanya satu permintaan berjalan; perubahan baru selama penyimpanan akan disimpan setelahnya.
 * - Jika gagal (koneksi/konflik), payload terakhir DISIMPAN untuk dicoba ulang dan tidak pernah dibuang.
 */
export function useAutosave<P>(save: (payload: P, force: boolean) => Promise<SaveResult>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const latest = useRef<P | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });

  const run = useCallback(async (force = false): Promise<void> => {
    if (inflight.current || latest.current === null) return;
    inflight.current = true;
    const payload = latest.current;
    latest.current = null;
    setStatus("saving");
    let result: SaveResult;
    try {
      result = await saveRef.current(payload, force);
    } catch {
      result = { ok: false, error: "Koneksi terputus. Perubahan Anda masih ada di layar dan akan dicoba lagi.", code: "network" };
    }
    inflight.current = false;
    if (result.ok) {
      setMessage(undefined);
      if (latest.current !== null) {
        setStatus("pending");
        void run();
      } else setStatus("saved");
    } else {
      setMessage(result.error);
      setStatus(result.code === "conflict" ? "conflict" : "error");
      if (latest.current === null) latest.current = payload; // simpan untuk retry
    }
  }, []);

  const schedule = useCallback(
    (payload: P) => {
      latest.current = payload;
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void run(), delay);
    },
    [delay, run],
  );

  const retry = useCallback(
    (force = false) => {
      if (timer.current) clearTimeout(timer.current);
      void run(force);
    },
    [run],
  );

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    latest.current = null;
    setStatus("idle");
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (latest.current !== null && !inflight.current) void run(); // jangan kehilangan perubahan saat pindah halaman
    },
    [run],
  );

  return { status, message, schedule, retry, cancel };
}

export function combineStatus(list: SaveStatus[]): SaveStatus {
  if (list.includes("conflict")) return "conflict";
  if (list.includes("error")) return "error";
  if (list.includes("saving")) return "saving";
  if (list.includes("pending")) return "pending";
  if (list.includes("saved")) return "saved";
  return "idle";
}
