"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Jam per soal berbasis performance.now() (bukan penghitung per-frame/animasi).
 * - elapsed() selalu akurat, tidak terpengaruh render lambat.
 * - Berhenti saat `running` false (jeda) dan melanjutkan dari sisa waktu.
 * - Tab di latar belakang tetap berjalan menurut waktu nyata (adil bagi semua siswa).
 */
export function useQuestionClock({ resetKey, limitMs, running, onExpire }: { resetKey: string | number; limitMs: number | null; running: boolean; onExpire: (elapsedMs: number) => void }) {
  const accum = useRef(0);
  const lastTick = useRef<number | null>(null);
  const expired = useRef(false);
  const expireRef = useRef(onExpire);
  const [remainingMs, setRemainingMs] = useState<number | null>(limitMs);
  useEffect(() => { expireRef.current = onExpire; });

  const elapsed = useCallback(() => accum.current + (lastTick.current !== null ? performance.now() - lastTick.current : 0), []);

  useEffect(() => {
    accum.current = 0;
    lastTick.current = null;
    expired.current = false;
    setRemainingMs(limitMs);
  }, [resetKey, limitMs]);

  useEffect(() => {
    if (!running) return;
    lastTick.current = performance.now();
    const id = setInterval(() => {
      if (limitMs === null) return;
      const left = Math.max(0, limitMs - elapsed());
      setRemainingMs(left);
      if (left <= 0 && !expired.current) {
        expired.current = true;
        clearInterval(id);
        expireRef.current(limitMs);
      }
    }, 200);
    return () => {
      clearInterval(id);
      if (lastTick.current !== null) {
        accum.current += performance.now() - lastTick.current;
        lastTick.current = null;
      }
    };
  }, [running, limitMs, resetKey, elapsed]);

  return { remainingMs, elapsed };
}
