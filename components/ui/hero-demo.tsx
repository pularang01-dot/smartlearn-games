"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STATEMENTS = [
  { text: "Bulan merupakan satelit alami Bumi.", answer: true, why: "Benar! Bulan mengorbit Bumi." },
  { text: "Jupiter adalah planet terkecil di tata surya.", answer: false, why: "Salah. Jupiter justru planet terbesar." },
  { text: "Mars dikenal sebagai Planet Merah.", answer: true, why: "Benar! Permukaannya kaya besi oksida." },
];

/** Demo interaktif di landing page: sentuh panel hijau atau merah, persis seperti di Smartboard. */
export function HeroDemo() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const s = STATEMENTS[i % STATEMENTS.length];
  const correct = picked !== null && picked === s.answer;

  return (
    <div className="rounded-[2rem] border-4 border-ink bg-ink p-3 shadow-2xl">
      <div className="rounded-3xl bg-paper p-5 sm:p-7">
        <p className="mb-1 text-xs font-semibold text-ink-mute">Coba sekarang — sentuh jawabannya</p>
        <p className="min-h-[5.5rem] font-display text-2xl font-medium leading-snug sm:text-3xl">{s.text}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
          {([true, false] as const).map((v) => {
            const chosen = picked === v;
            return (
              <button
                key={String(v)}
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(v)}
                className={cn(
                  "touch-safe flex h-32 flex-col items-center justify-center gap-1 rounded-2xl text-white transition-transform active:scale-[0.97] sm:h-40",
                  v ? "bg-correct" : "bg-wrong",
                  picked !== null && !chosen && "opacity-40",
                  chosen && "animate-pop ring-4 ring-pencil-400",
                )}
              >
                {v ? <Check className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={3.5} aria-hidden /> : <X className="h-10 w-10 sm:h-14 sm:w-14" strokeWidth={3.5} aria-hidden />}
                <span className="font-display text-2xl font-semibold sm:text-3xl">{v ? "BENAR" : "SALAH"}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex min-h-12 items-center justify-between gap-3" aria-live="polite">
          {picked !== null ? (
            <>
              <p className={cn("text-sm font-semibold", correct ? "text-correct" : "text-wrong")}>{correct ? "Tepat sekali! " : "Belum tepat. "}{s.why}</p>
              <button type="button" onClick={() => { setPicked(null); setI(i + 1); }} className="touch-safe shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Soal lain</button>
            </>
          ) : (
            <p className="text-sm text-ink-mute">Tersedia juga lewat keyboard: ← Benar, → Salah.</p>
          )}
        </div>
      </div>
    </div>
  );
}
