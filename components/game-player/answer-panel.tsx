"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type PanelState = "idle" | "chosen-right" | "chosen-wrong" | "reveal" | "dimmed";

/** Panel jawaban raksasa. Warna + ikon + teks (tidak bergantung pada warna saja). */
export function AnswerPanel({ value, state, disabled, onPick }: { value: boolean; state: PanelState; disabled: boolean; onPick: () => void }) {
  const Icon = value ? Check : X;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-pressed={state === "chosen-right" || state === "chosen-wrong"}
      aria-label={value ? "Jawab BENAR" : "Jawab SALAH"}
      className={cn(
        "touch-safe relative flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-1 rounded-3xl text-white shadow-lg transition-all duration-150 enabled:active:scale-[0.97] enabled:hover:brightness-110 focus-visible:outline-offset-4 sm:gap-2",
        value ? "bg-correct" : "bg-wrong",
        state === "dimmed" && "opacity-35 saturate-50",
        state === "chosen-right" && "animate-pop ring-8 ring-pencil-400",
        state === "chosen-wrong" && "animate-shake ring-8 ring-white/70",
        state === "reveal" && "animate-pop ring-8 ring-pencil-400",
        disabled && state === "idle" && "opacity-60",
      )}
    >
      <Icon className="h-[28%] max-h-28 min-h-10 w-auto" strokeWidth={3.5} aria-hidden />
      <span className="font-display text-3xl font-semibold tracking-wide sm:text-5xl">{value ? "BENAR" : "SALAH"}</span>
      {state === "reveal" && <span className="rounded-full bg-pencil-400 px-3 py-0.5 text-sm font-bold text-ink">Jawaban yang tepat</span>}
      <kbd aria-hidden className="absolute bottom-3 hidden rounded-md bg-black/25 px-2 py-0.5 text-xs font-semibold md:block">{value ? "←" : "→"}</kbd>
    </button>
  );
}
