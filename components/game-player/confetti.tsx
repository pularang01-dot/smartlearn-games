"use client";

import { useEffect, useState } from "react";

const COLORS = ["#FFC93C", "#4056E0", "#15803D", "#B91C1C", "#F472B6", "#38BDF8"];

type Piece = { left: number; color: string; dx: number; rot: number; dur: number; delay: number };

/** Confetti CSS murni; disembunyikan otomatis oleh prefers-reduced-motion / pengaturan Kurangi animasi. */
export function Confetti({ count = 70 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    setPieces(Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100, color: COLORS[i % COLORS.length], dx: (Math.random() - 0.5) * 240,
      rot: 360 + Math.random() * 720, dur: 2.6 + Math.random() * 2.2, delay: Math.random() * 0.9,
    })));
  }, [count]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, ["--dx" as string]: `${p.dx}px`, ["--rot" as string]: `${p.rot}deg`, ["--dur" as string]: `${p.dur}s`, ["--delay" as string]: `${p.delay}s` }} />
      ))}
    </div>
  );
}
